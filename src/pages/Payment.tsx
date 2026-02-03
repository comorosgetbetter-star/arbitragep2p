import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard, Wallet, Shield, Check, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useTradeSession } from '@/hooks/useTradeSession';
import { PAYMENT_STATE_PREFIX, TRADE_SESSION_KEY } from '@/lib/tradeSessionStorage';

interface PackageData {
  usd: number;
  usdt: number;
  isCustom?: boolean;
}

// Pool of USDT addresses to randomize
const USDT_ADDRESSES = [
  'TNGgujx2JCg9tqxNceGCotzjX2p3Zc4S75',
  'TKPDALoYRtaD3zK5zDdjDSg6aWUQghFrNh',
  'TVyzob43oGTBV9AJSvHC2NQozK46eWF2jp',
];

const getRandomAddress = () => {
  const randomIndex = Math.floor(Math.random() * USDT_ADDRESSES.length);
  return USDT_ADDRESSES[randomIndex];
};

type PaymentMethod = 'card' | 'crypto';

type TradePaymentState = {
  paymentMethod: PaymentMethod;
  depositAddress: string;
  isVerifying: boolean;
  verificationProgress: number;
  verificationFailed: boolean;
};

const readActiveTradeSessionId = (): string | null => {
  const stored = sessionStorage.getItem(TRADE_SESSION_KEY);
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
  const stored = sessionStorage.getItem(paymentStateKey(sessionId));
  if (!stored) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = JSON.parse(stored);
    const paymentMethod: PaymentMethod = raw?.paymentMethod === 'crypto' ? 'crypto' : 'card';
    const depositAddress = typeof raw?.depositAddress === 'string' && raw.depositAddress.length > 0
      ? raw.depositAddress
      : getRandomAddress();

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

const Payment = () => {
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const { session: tradeSession, clearSession, getRemainingTime } = useTradeSession();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(() => {
    const sid = readActiveTradeSessionId();
    if (!sid) return 'crypto';
    return readPaymentState(sid)?.paymentMethod ?? 'crypto';
  });
  const [depositAddress, setDepositAddress] = useState<string>(() => {
    const sid = readActiveTradeSessionId();
    if (!sid) return getRandomAddress();
    return readPaymentState(sid)?.depositAddress ?? getRandomAddress();
  });
  
  // Crypto payment states - initialize from trade session storage directly
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const stored = sessionStorage.getItem(TRADE_SESSION_KEY);
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

  useEffect(() => {
    // Check if user is logged in via Supabase auth
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      // Get selected package from trade session
      const storedPackage = sessionStorage.getItem('selectedPackage');
      if (storedPackage) {
        setPackageData(JSON.parse(storedPackage));
        // If there's no active session anymore, don't show a fresh payment flow.
        const remaining = getRemainingTime();
        if (remaining <= 0) {
          clearSession();
          navigate('/');
          return;
        }

        // Sync timer with remaining session time immediately
        setTimeRemaining(remaining);
        setIsTimerActive(true);

        // Restore the exact payment step (method + address + verification flags)
        const sid = readActiveTradeSessionId();
        if (sid) {
          const restored = readPaymentState(sid);
          if (restored) {
            setPaymentMethod(restored.paymentMethod);
            setDepositAddress(restored.depositAddress);
            setIsVerifying(restored.isVerifying);
            setVerificationProgress(restored.verificationProgress);
            setVerificationFailed(restored.verificationFailed);
          }
        }
      } else {
        navigate('/');
      }
    };
    
    checkAuth();
  }, [navigate, getRemainingTime, clearSession]);

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

    sessionStorage.setItem(paymentStateKey(sid), JSON.stringify(snapshot));
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

  // Verification progress animation
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
        setVerificationFailed(true);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isVerifying]);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">Complete Payment</h1>
            <p className="text-muted-foreground">
              Choose your preferred payment method to complete the purchase
            </p>
          </div>

          <div className="grid gap-6">
            {/* Order Summary */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">Package</span>
                <span className="font-medium">
                  {packageData.isCustom ? 'Custom Package' : 'Express P2P Package'}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border/50">
                <span className="text-muted-foreground">You Pay</span>
                <span className="font-display font-bold text-lg">${packageData.usd.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-muted-foreground">You Receive</span>
                <span className="font-display font-bold text-lg text-primary">{packageData.usdt.toLocaleString()} USDT</span>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="glass-card rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'card' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <CreditCard className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">Card</p>
                </button>
                
                <button
                  onClick={() => setPaymentMethod('crypto')}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    paymentMethod === 'crypto' 
                      ? 'border-primary bg-primary/10' 
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <Wallet className={`h-6 w-6 mx-auto mb-2 ${paymentMethod === 'crypto' ? 'text-primary' : 'text-muted-foreground'}`} />
                  <p className="text-sm font-medium">Crypto</p>
                </button>
              </div>

              {/* Card Payment Form */}
              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  {isCardProcessing ? (
                    <div className="bg-secondary/50 rounded-xl p-8 text-center space-y-4">
                      <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                      <div>
                        <p className="text-lg font-medium">Processing your payment...</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Please wait while we verify your transaction
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {cardPaymentFailed && (
                        <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20 mb-4">
                          <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-destructive">Something went wrong</p>
                            <p className="text-xs text-destructive/80 mt-1">
                              We couldn't process your payment. Please check your card details and try again.
                            </p>
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
                <div className="space-y-4">
                  {/* Timer and Instructions */}
                  <div className="flex items-center gap-2 p-4 bg-warning/10 rounded-xl border border-warning/20">
                    <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-warning">
                        Copy the address below and complete the payment within 10 minutes
                      </p>
                      <p className="text-xs text-warning/80 mt-1">
                        Mark as paid only after you've completed the payment
                      </p>
                    </div>
                  </div>

                  {/* Countdown Timer */}
                  <div className="text-center p-4 bg-secondary/50 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">Time Remaining</p>
                    <p className={`text-3xl font-display font-bold ${timeRemaining <= 60 ? 'text-destructive' : 'text-primary'}`}>
                      {formatTime(timeRemaining)}
                    </p>
                    {timeRemaining <= 0 && (
                      <p className="text-xs text-destructive mt-2">Time expired. Please refresh to get a new address.</p>
                    )}
                  </div>

                  {/* USDT Address */}
                  <div className="bg-secondary/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-3">Send USDT (TRC20) to:</p>
                    <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                      <code className="text-sm font-mono flex-1 break-all">
                        {depositAddress}
                      </code>
                      <button 
                        onClick={() => copyToClipboard(depositAddress)}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                      Amount to send: <span className="font-bold text-primary">${packageData.usd.toLocaleString()} USDT</span>
                    </p>
                  </div>

                  {/* Verification Status */}
                  {isVerifying && (
                    <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">Searching on the blockchain...</p>
                          <p className="text-xs text-muted-foreground">Verifying your transaction</p>
                        </div>
                      </div>
                      <Progress value={verificationProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center">
                        {Math.round(verificationProgress)}% complete
                      </p>
                    </div>
                  )}

                  {/* Verification Failed */}
                  {verificationFailed && (
                    <div className="flex items-center gap-3 p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                      <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">Payment not confirmed</p>
                        <p className="text-xs text-destructive/80 mt-1">
                          We couldn't find your transaction on the blockchain. Please verify you sent to the correct address and try again.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Mark as Paid Button */}
                  {!isVerifying && timeRemaining > 0 && (
                    <Button 
                      variant="glow" 
                      size="lg" 
                      className="w-full"
                      onClick={handleMarkAsPaid}
                      disabled={verificationFailed}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {verificationFailed ? 'Try Again' : 'Mark as Paid'}
                    </Button>
                  )}

                  {verificationFailed && (
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                      onClick={() => {
                        setVerificationFailed(false);
                        setIsTimerActive(true);
                        // Keep the original trade timer; don't restart a fresh 10 minutes.
                        setTimeRemaining(getRemainingTime());
                      }}
                    >
                      Get New Address & Try Again
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Security Notice */}
            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
              <Shield className="h-5 w-5 text-primary shrink-0" />
              <p className="text-xs text-muted-foreground">
                All transactions are secured with 256-bit SSL encryption. Your payment information is never stored on our servers.
              </p>
            </div>

            {/* Submit Button - Only for Card */}
            {paymentMethod === 'card' && !isCardProcessing && (
              <Button 
                variant="glow" 
                size="xl" 
                className="w-full"
                onClick={handlePayment}
                disabled={isCardProcessing}
              >
                {cardPaymentFailed 
                  ? 'Try Again'
                  : `Pay $${packageData.usd.toLocaleString()} & Receive ${packageData.usdt.toLocaleString()} USDT`
                }
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
