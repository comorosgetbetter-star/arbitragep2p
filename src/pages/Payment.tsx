import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Shield, Check, Copy, AlertCircle, Loader2, Lock, CheckCircle2, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { CircularLoader } from '@/components/CircularLoader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTradeSession } from '@/hooks/useTradeSession';
import { PAYMENT_STATE_PREFIX, TRADE_SESSION_KEY } from '@/lib/tradeSessionStorage';

interface PackageData {
  usd: number;
  usdt: number;
  isCustom?: boolean;
}

// Check if there's a P2P order payment with a specific address
const getP2POrderAddress = (): string | null => {
  try {
    const stored = localStorage.getItem('p2pOrderPayment');
    if (!stored) return null;
    const data = JSON.parse(stored);
    return typeof data?.paymentAddress === 'string' ? data.paymentAddress : null;
  } catch {
    return null;
  }
};

// Fetch next rotated trade address from DB
const getRotatedTradeAddress = async (): Promise<string> => {
  // Check P2P order address first
  const p2pAddr = getP2POrderAddress();
  if (p2pAddr) return p2pAddr;

  const { data: addresses } = await supabase
    .from('usdt_addresses')
    .select('address')
    .eq('address_type', 'trade')
    .eq('is_active', true)
    .order('display_order');

  if (!addresses || addresses.length === 0) return 'No address configured';

  const { data: rotation } = await supabase
    .from('address_rotation')
    .select('last_used_index')
    .eq('address_type', 'trade')
    .single();

  const lastIndex = rotation?.last_used_index ?? 0;
  const nextIndex = (lastIndex + 1) % addresses.length;

  await supabase
    .from('address_rotation')
    .update({ last_used_index: nextIndex, updated_at: new Date().toISOString() })
    .eq('address_type', 'trade');

  return addresses[nextIndex].address;
};

const FALLBACK_ADDRESS = 'No address configured';

type PaymentMethod = 'card' | 'crypto';

type TradePaymentState = {
  paymentMethod: PaymentMethod;
  depositAddress: string;
  isVerifying: boolean;
  verificationProgress: number;
  verificationFailed: boolean;
};

const readActiveTradeSessionId = (): string | null => {
  const stored = localStorage.getItem(TRADE_SESSION_KEY);
  if (!stored) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = JSON.parse(stored);
    if (typeof raw?.id === 'string' && raw.id.length > 0) return raw.id;
    if (typeof raw?.startedAt === 'number') return String(raw.startedAt);
    return null;
  } catch {
    return null;
  }
};

const paymentStateKey = (sessionId: string) => `${PAYMENT_STATE_PREFIX}${sessionId}`;

const readPaymentState = (sessionId: string): TradePaymentState | null => {
  const stored = localStorage.getItem(paymentStateKey(sessionId));
  if (!stored) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = JSON.parse(stored);
    const paymentMethod: PaymentMethod = raw?.paymentMethod === 'crypto' ? 'crypto' : 'card';
    const depositAddress = typeof raw?.depositAddress === 'string' && raw.depositAddress.length > 0
      ? raw.depositAddress
      : FALLBACK_ADDRESS;

    return {
      paymentMethod,
      depositAddress,
      isVerifying: !!raw?.isVerifying,
      verificationProgress: typeof raw?.verificationProgress === 'number' ? raw.verificationProgress : 0,
      verificationFailed: !!raw?.verificationFailed,
    };
  } catch {
    return null;
  }
};

// Check if this is a P2P order payment (forces crypto only)
const isP2POrder = (): boolean => {
  try {
    const stored = localStorage.getItem('p2pOrderPayment');
    return !!stored && !!JSON.parse(stored)?.paymentAddress;
  } catch {
    return false;
  }
};

const Payment = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [isP2P, setIsP2P] = useState(false);
  const { session: tradeSession, clearSession, getRemainingTime } = useTradeSession();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const sid = readActiveTradeSessionId();
    if (!sid) return 'crypto';
    return readPaymentState(sid)?.paymentMethod ?? 'crypto';
  });
  const [depositAddress, setDepositAddress] = useState<string>(() => {
    const sid = readActiveTradeSessionId();
    if (!sid) return FALLBACK_ADDRESS;
    return readPaymentState(sid)?.depositAddress ?? FALLBACK_ADDRESS;
  });
  
  // Crypto payment states - initialize from trade session storage directly
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const stored = localStorage.getItem(TRADE_SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const remaining = Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000));
        return remaining;
      } catch {
        return 0;
      }
    }
    return 0;
  });
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [isVerifying, setIsVerifying] = useState(() => {
    const sid = readActiveTradeSessionId();
    if (!sid) return false;
    return readPaymentState(sid)?.isVerifying ?? false;
  });
  const [verificationProgress, setVerificationProgress] = useState(() => {
    const sid = readActiveTradeSessionId();
    if (!sid) return 0;
    return readPaymentState(sid)?.verificationProgress ?? 0;
  });
  const [verificationFailed, setVerificationFailed] = useState(() => {
    const sid = readActiveTradeSessionId();
    if (!sid) return false;
    return readPaymentState(sid)?.verificationFailed ?? false;
  });
  
  // Card payment states
  const [isCardProcessing, setIsCardProcessing] = useState(false);
  const [cardPaymentFailed, setCardPaymentFailed] = useState(false);

  // VIP auto-complete + rating
  const [isVip, setIsVip] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('vip_auto_complete' as any)
        .eq('user_id', user.id)
        .maybeSingle();
      setIsVip(!!(data as any)?.vip_auto_complete);
    })();
  }, [user]);

  useEffect(() => {
    const checkAuth = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        clearSession();
        localStorage.removeItem('p2pOrderPayment');
        navigate('/login');
        return;
      }

      // Detect if this is a P2P order
      setIsP2P(isP2POrder());

      // Get selected package from trade session
      const storedPackage = localStorage.getItem('selectedPackage');
      if (storedPackage) {
        setPackageData(JSON.parse(storedPackage));
        
        // Check for existing payment state first (user may have already verified)
        const sid = readActiveTradeSessionId();
        if (sid) {
          const restored = readPaymentState(sid);
          if (restored) {
            setPaymentMethod(restored.paymentMethod);
            setIsVerifying(restored.isVerifying);
            setVerificationProgress(restored.verificationProgress);
            setVerificationFailed(restored.verificationFailed);
            
            // Always fetch a fresh address if the stored one is the fallback
            if (restored.depositAddress && restored.depositAddress !== FALLBACK_ADDRESS) {
              setDepositAddress(restored.depositAddress);
            } else {
              const addr = await getRotatedTradeAddress();
              setDepositAddress(addr);
            }
            
            // If verification already failed, don't redirect - let user decide
            if (restored.verificationFailed) {
              setTimeRemaining(0);
              setIsTimerActive(false);
              return;
            }
          } else {
            // No saved state - fetch a rotated trade address from DB
            const addr = await getRotatedTradeAddress();
            setDepositAddress(addr);
          }
        } else {
          const addr = await getRotatedTradeAddress();
          setDepositAddress(addr);
        }
        
        // If there's no active session anymore and not in failed state, redirect
        const remaining = getRemainingTime();
        if (remaining <= 0) {
          clearSession();
          navigate('/');
          return;
        }

        // Sync timer with remaining session time immediately
        setTimeRemaining(remaining);
        setIsTimerActive(true);
      } else {
        navigate('/');
      }
    };
    
    void checkAuth();
  }, [authLoading, user, navigate, clearSession, getRemainingTime]);

  // Persist payment step state (so Resume restores the exact view and address)
  useEffect(() => {
    const sid = tradeSession?.id ?? readActiveTradeSessionId();
    if (!sid) return;

    const snapshot: TradePaymentState = {
      paymentMethod,
      depositAddress,
      isVerifying,
      verificationProgress,
      verificationFailed,
    };

    localStorage.setItem(paymentStateKey(sid), JSON.stringify(snapshot));
  }, [tradeSession?.id, paymentMethod, depositAddress, isVerifying, verificationProgress, verificationFailed]);

  // Reset verification state when switching to crypto - DO NOT reset timer
  useEffect(() => {
    if (paymentMethod === 'crypto') {
      setVerificationFailed(false);
    }
  }, [paymentMethod]);

  // Countdown timer - synced with trade session
  useEffect(() => {
    if (!isTimerActive || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          clearSession(); // Clear session when timer expires
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining, clearSession]);

  // Verification progress - 2 minutes then either succeed (VIP) or fail
  useEffect(() => {
    if (!isVerifying) return;

    const duration = 120000; // 2 minutes
    const startTime = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setVerificationProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setIsVerifying(false);
        setTimeRemaining(0);
        setIsTimerActive(false);

        if (isVip && packageData) {
          // Auto-credit USDT and show success / rating
          (async () => {
            const { error } = await supabase.rpc('vip_complete_trade' as any, { _amount: packageData.usdt });
            if (error) {
              setVerificationFailed(true);
              clearSession();
              toast({ title: 'Verification failed', description: error.message, variant: 'destructive' });
              return;
            }
            setVerificationSuccess(true);
            try {
              const sid = readActiveTradeSessionId();
              if (sid) localStorage.removeItem(paymentStateKey(sid));
              localStorage.removeItem('p2pOrderPayment');
            } catch {}
            clearSession();
            toast({ title: 'Trade completed', description: `${packageData.usdt.toLocaleString()} USDT credited to your wallet.` });
          })();
        } else {
          setVerificationFailed(true);
          clearSession();
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isVerifying, clearSession, isVip, packageData]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handlePayment = async () => {
    setIsCardProcessing(true);
    setCardPaymentFailed(false);
    
    // Simulate payment processing for 10 seconds then show error
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    setIsCardProcessing(false);
    setCardPaymentFailed(true);
    
    toast({
      title: "Payment Failed",
      description: "Something went wrong. Please try again.",
      variant: "destructive",
    });
  };

  const handleMarkAsPaid = () => {
    // Stop the countdown timer when marked as paid
    setIsTimerActive(false);
    setIsVerifying(true);
    setVerificationProgress(0);
    setVerificationFailed(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Address copied to clipboard",
    });
  };

  if (!packageData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50 transition-colors">
        <div className="container mx-auto px-4 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          {isP2P && (
            <div className="ml-auto flex items-center gap-1.5 text-xs text-success font-medium">
              <Lock className="h-3.5 w-3.5" />
              Funds in Escrow
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-lg mx-auto animate-slide-up space-y-4">

          {/* Compact page title */}
          <div>
            <h1 className="text-xl font-display font-bold">Complete Payment</h1>
            {isP2P && (
              <p className="text-xs text-muted-foreground mt-0.5">P2P Trade · USDT TRC20 · Escrow Protected</p>
            )}
          </div>

          {/* Order Summary — compact single card */}
          <div className="glass-card rounded-xl p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-center flex-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">You Pay</p>
                <p className="font-display font-bold text-base">${packageData.usd.toLocaleString()}</p>
              </div>
              <div className="text-muted-foreground text-lg">→</div>
              <div className="text-center flex-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">You Receive</p>
                <p className="font-display font-bold text-base text-primary">{packageData.usdt.toLocaleString()} USDT</p>
              </div>
              <div className="text-muted-foreground text-lg">·</div>
              <div className="text-center flex-1">
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Profit</p>
                <p className="font-display font-bold text-base text-success">+{(packageData.usdt - packageData.usd).toLocaleString()} USDT</p>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="glass-card rounded-xl p-4">

            {/* P2P: crypto-only badge */}
            {isP2P ? (
              <div className="flex items-center gap-2 p-2.5 mb-4 rounded-lg border border-primary/30 bg-primary/5">
                <Wallet className="h-4 w-4 text-primary shrink-0" />
                <p className="text-xs font-semibold text-primary">Crypto · USDT TRC20 only</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <CreditCard className={`h-5 w-5 mx-auto mb-1 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-xs font-medium">Card</p>
                </button>
                <button
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    paymentMethod === 'crypto'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <Wallet className={`h-5 w-5 mx-auto mb-1 ${paymentMethod === 'crypto' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-xs font-medium">Crypto</p>
                </button>
              </div>
            )}

            {/* Card Payment Form */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                {isCardProcessing ? (
                  <div className="bg-secondary/50 rounded-xl p-8 text-center space-y-4">
                    <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                    <div>
                      <p className="text-lg font-medium">Processing your payment...</p>
                      <p className="text-sm text-muted-foreground mt-1">Please wait while we verify your transaction</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {cardPaymentFailed && (
                      <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20 mb-4">
                        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-destructive">Something went wrong</p>
                          <p className="text-xs text-destructive/80 mt-1">We couldn't process your payment. Please check your card details and try again.</p>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label>Card Number</Label>
                      <Input placeholder="1234 5678 9012 3456" disabled={isCardProcessing} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Expiry Date</Label>
                        <Input placeholder="MM/YY" disabled={isCardProcessing} />
                      </div>
                      <div className="space-y-2">
                        <Label>CVV</Label>
                        <Input placeholder="123" type="password" disabled={isCardProcessing} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cardholder Name</Label>
                      <Input placeholder="John Doe" disabled={isCardProcessing} />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Crypto Payment */}
            {paymentMethod === 'crypto' && (
              <div className="space-y-3">

                {/* Timer + instruction row */}
                <div className="flex items-center gap-3 p-3 rounded-xl border border-warning/20 bg-warning/5">
                  <div className="text-center shrink-0">
                    <p className="text-[10px] text-warning/70 uppercase tracking-wide">Time left</p>
                    <p className={`text-xl font-display font-bold leading-none mt-0.5 ${timeRemaining <= 60 ? 'text-destructive' : 'text-warning'}`}>
                      {formatTime(timeRemaining)}
                    </p>
                  </div>
                  <div className="w-px h-8 bg-warning/20 shrink-0" />
                  <p className="text-xs text-warning/90 leading-relaxed">
                    Send USDT to the address below, then tap <strong>Mark as Paid</strong>. Our system verifies the transaction and{isP2P ? ' automatically credits your wallet.' : ' confirms on the blockchain.'}
                  </p>
                </div>

                {timeRemaining <= 0 && (
                  <p className="text-xs text-destructive text-center">Time expired. Please go back and start a new trade.</p>
                )}

                {/* Escrow notice — compact, P2P only */}
                {isP2P && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg border border-success/20 bg-success/5">
                    <Lock className="h-3.5 w-3.5 text-success shrink-0" />
                    <p className="text-xs text-success font-medium">Seller's funds locked in escrow — released automatically upon on-chain confirmation</p>
                  </div>
                )}

                {/* Steps — minimal horizontal strip */}
                <div className="flex items-center gap-1 px-1">
                  {[
                    'Copy address',
                    'Send USDT',
                    'Mark as Paid',
                    isP2P ? 'Balance credited' : 'Blockchain confirmed',
                  ].map((label, i) => (
                    <div key={i} className="flex items-center gap-1 flex-1 min-w-0">
                      <div className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</div>
                      <p className="text-[10px] text-muted-foreground truncate">{label}</p>
                      {i < 3 && <div className="w-2 h-px bg-border shrink-0" />}
                    </div>
                  ))}
                </div>

                {/* USDT Address */}
                <div className="bg-secondary/50 rounded-xl p-3">
                  <p className="text-[11px] text-muted-foreground mb-2 uppercase tracking-wide">Send USDT (TRC20) to:</p>
                  <div className="flex items-center gap-2 bg-background/50 rounded-lg p-2.5">
                    <code className="text-xs font-mono flex-1 break-all leading-relaxed">{depositAddress}</code>
                    <button
                      onClick={() => copyToClipboard(depositAddress)}
                      className="p-1.5 hover:bg-secondary rounded-lg transition-colors shrink-0"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-2">
                    Amount: <span className="font-bold text-primary">${packageData.usd.toLocaleString()} USDT</span>
                  </p>
                </div>

                {/* Verification Status */}
                {isVerifying && (
                  <div className="bg-secondary/50 rounded-xl p-6 space-y-3">
                    <CircularLoader
                      size={80}
                      strokeWidth={4}
                      showPulse={true}
                      title="Searching on the blockchain..."
                      subtitle="Verifying your transaction"
                    />
                    {isP2P && (
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                        <p className="text-xs text-success font-medium">Balance will be credited automatically upon confirmation</p>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground text-center">This may take up to 2 minutes</p>
                  </div>
                )}

                {/* Verification Failed */}
                {verificationFailed && (
                  <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl border border-destructive/20">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-destructive">Payment not confirmed</p>
                      <p className="text-xs text-destructive/80 mt-0.5">We couldn't find your transaction. Verify you sent to the correct address and try again.</p>
                    </div>
                  </div>
                )}

                {/* Mark as Paid */}
                {!isVerifying && !verificationFailed && timeRemaining > 0 && (
                  <Button variant="glow" size="lg" className="w-full" onClick={handleMarkAsPaid}>
                    <Check className="h-4 w-4 mr-2" />
                    Mark as Paid
                  </Button>
                )}

                {/* After failure actions */}
                {verificationFailed && (
                  <div className="flex gap-3">
                    <Button variant="glow" size="sm" className="flex-1" onClick={() => navigate('/')}>Start New Trade</Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/')}>Go Home</Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Notice — compact */}
          <div className="flex items-center gap-2 px-1">
            <Shield className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">256-bit SSL encrypted · Payment info never stored</p>
          </div>

          {/* Submit Button — Card only */}
          {paymentMethod === 'card' && !isCardProcessing && (
            <Button variant="glow" size="xl" className="w-full" onClick={handlePayment} disabled={isCardProcessing}>
              {cardPaymentFailed
                ? 'Try Again'
                : `Pay $${packageData.usd.toLocaleString()} & Receive ${packageData.usdt.toLocaleString()} USDT`}
            </Button>
          )}

        </div>
      </main>
    </div>
  );
};

export default Payment;
