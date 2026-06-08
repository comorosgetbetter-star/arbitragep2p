import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  MessageSquare,
  Wallet,
  Send,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { CircularLoader } from '@/components/CircularLoader';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';

const SELL_SESSION_KEY = 'activeSellTradeSession';
const PROCESSING_DURATION_MS = 30 * 1000; // 30 seconds "Making payment…"

interface SellSession {
  orderId: string;
  sellerName: string;
  sellerAvatarUrl: string | null;
  amount: number;
  paymentMethod: string;
  paymentAddress: string;
  paymentWindowMinutes: number;
  startedAt: number;
  expiresAt: number;
  orderNumber: string;
}

const readSellSession = (): SellSession | null => {
  try {
    const raw = localStorage.getItem(SELL_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SellSession;
    if (!parsed?.orderId) return null;
    return parsed;
  } catch {
    return null;
  }
};

type Phase = 'idle' | 'submitted' | 'processing' | 'confirm' | 'releasing' | 'success';

const SellPayment = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { refetchBalance } = useUserData();

  const [session, setSession] = useState<SellSession | null>(() => readSellSession());
  const [timeRemaining, setTimeRemaining] = useState(() => {
    const s = readSellSession();
    if (!s) return 0;
    return Math.max(0, Math.floor((s.expiresAt - Date.now()) / 1000));
  });
  const [isTimerActive, setIsTimerActive] = useState(true);

  const [phase, setPhase] = useState<Phase>('idle');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [processProgress, setProcessProgress] = useState(0);
  const releaseInFlightRef = useRef(false);

  // Auth + session guard
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    if (!session) {
      navigate('/');
      return;
    }
  }, [authLoading, user, navigate, session]);

  // Countdown timer
  useEffect(() => {
    if (!isTimerActive || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimerActive(false);
          if (phase === 'idle') {
            localStorage.removeItem(SELL_SESSION_KEY);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining, phase]);

  // 30s "Making payment…" simulation after seller presses Release
  useEffect(() => {
    if (phase !== 'processing') return;
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / PROCESSING_DURATION_MS) * 100, 100);
      setProcessProgress(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setPhase('confirm');
      }
    }, 250);
    return () => clearInterval(interval);
  }, [phase]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }, []);

  const handleSubmitAddress = () => {
    const addr = buyerAddress.trim();
    if (addr.length < 20) {
      toast({
        title: 'Invalid address',
        description: 'Please paste a valid USDT (TRC20) address.',
        variant: 'destructive',
      });
      return;
    }
    setPhase('submitted');
    toast({
      title: 'Payment address submitted',
      description: 'Once the buyer sends payment to your account, press Release.',
    });
  };

  const handleReleaseStart = () => {
    setProcessProgress(0);
    setPhase('processing');
  };

  const handleConfirmPaid = async () => {
    if (releaseInFlightRef.current || !session) return;
    releaseInFlightRef.current = true;
    setPhase('releasing');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.rpc('p2p_sell_usdt' as any, {
      _order_id: session.orderId,
      _amount: session.amount,
    });

    if (error) {
      releaseInFlightRef.current = false;
      setPhase('confirm');
      const msg = (error as { message?: string }).message || '';
      if (msg.includes('MIN_BALANCE')) {
        toast({ title: 'Insufficient balance', description: 'Minimum required balance is $35.', variant: 'destructive' });
      } else if (msg.includes('INSUFFICIENT_BALANCE')) {
        toast({ title: 'Insufficient balance', description: 'Please add funds by making a deposit.', variant: 'destructive' });
      } else {
        toast({ title: 'Release failed', description: msg || 'Could not complete sell order', variant: 'destructive' });
      }
      return;
    }

    setPhase('success');
    setIsTimerActive(false);
    localStorage.removeItem(SELL_SESSION_KEY);
    await refetchBalance();
  };

  const handleBackHome = () => {
    localStorage.removeItem(SELL_SESSION_KEY);
    navigate('/');
  };

  if (!session) return null;

  const totalValueUSD = session.amount; // 1:1 USDT-USD display
  const buyerRating = 4.9;

  return (
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Success Modal */}
      <Dialog open={phase === 'success'} onOpenChange={() => {}}>
        <DialogContent className="max-w-[380px] rounded-xl border-success/30 bg-card p-0 overflow-hidden [&>button]:hidden">
          <div className="p-5 text-center space-y-4">
            <DialogHeader className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-success/20 flex items-center justify-center mx-auto border border-success/30">
                <CheckCircle2 className="w-7 h-7 text-success" />
              </div>
              <DialogTitle className="text-xl font-display text-success text-center">Trade completed</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground text-center">
                USDT released to buyer. Sale recorded in your trade history.
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl bg-secondary/50 border border-border/50 p-4 space-y-3">
              <p className="text-2xl font-display font-bold text-success tracking-normal">
                -{session.amount.toLocaleString('en-US')} USDT
              </p>
              <div className="grid grid-cols-2 gap-2 text-left text-xs">
                <div>
                  <p className="text-muted-foreground">Buyer</p>
                  <p className="font-semibold truncate">{session.sellerName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Rating</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-primary text-primary" />
                    {buyerRating.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Order #</p>
                  <p className="font-mono font-semibold truncate">{session.orderNumber}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total value</p>
                  <p className="font-semibold">${totalValueUSD.toLocaleString('en-US')}</p>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={handleBackHome}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackHome}
            className="shrink-0 -ml-2"
            disabled={phase === 'processing' || phase === 'releasing'}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">Sell USDT</p>
            <p className="text-[11px] text-muted-foreground truncate">Order #{session.orderNumber}</p>
          </div>
          <Badge variant="outline" className="border-warning/30 text-warning bg-warning/10 shrink-0">
            <Clock className="w-3 h-3 mr-1" />
            {formatTime(timeRemaining)}
          </Badge>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-24">
        {/* Counterparty */}
        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-11 w-11">
                {session.sellerAvatarUrl ? <AvatarImage src={session.sellerAvatarUrl} /> : null}
                <AvatarFallback className="bg-primary/10 text-primary">
                  {session.sellerName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{session.sellerName}</p>
                <Badge variant="outline" className="text-[10px] border-success/30 text-success bg-success/10">
                  <ShieldCheck className="w-3 h-3 mr-0.5" /> Verified buyer
                </Badge>
              </div>
              <p className="text-[11px] text-success mt-0.5">● Online now</p>
            </div>
          </div>
        </div>

        {/* Trade details */}
        <div className="glass-card rounded-xl border border-border p-4 space-y-3">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Trade details</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[11px] text-muted-foreground">You sell</p>
              <p className="font-display font-bold text-base tracking-normal">
                {session.amount.toLocaleString('en-US')} USDT
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Total value</p>
              <p className="font-display font-bold text-base tracking-normal">
                ${totalValueUSD.toLocaleString('en-US')}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Price</p>
              <p className="font-semibold">1.00 USD / USDT</p>
            </div>
            <div>
              <p className="text-[11px] text-muted-foreground">Network</p>
              <p className="font-semibold text-primary">USDT · TRC20</p>
            </div>
          </div>
        </div>

        {/* Seller's Payment Receiving Address */}
        <div className="glass-card rounded-xl border border-border p-4 space-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Your payment receiving address</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Submit your USDT (TRC20) address where the buyer should send the{' '}
              <strong>${totalValueUSD.toLocaleString('en-US')}</strong> payment for{' '}
              <strong>{session.amount.toLocaleString('en-US')} USDT</strong>.
            </p>
          </div>

          <Input
            value={buyerAddress}
            onChange={(e) => setBuyerAddress(e.target.value)}
            placeholder="Paste your USDT (TRC20) receiving address"
            className="font-mono text-xs"
            disabled={phase !== 'idle'}
          />

          {phase === 'idle' && (
            <Button
              className="w-full h-11"
              onClick={handleSubmitAddress}
              disabled={timeRemaining <= 0 || !buyerAddress.trim()}
            >
              <Send className="w-4 h-4 mr-2" />
              Submit payment address
            </Button>
          )}

          {phase === 'submitted' && (
            <div className="rounded-xl border border-success/30 bg-success/5 p-3 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Address submitted. Once the buyer sends the payment to your account, tap{' '}
                <strong>Release</strong> to begin verification.
              </p>
            </div>
          )}

          {phase === 'processing' && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center space-y-3">
              <CircularLoader />
              <p className="font-semibold text-sm">Making payment…</p>
              <p className="text-[11px] text-muted-foreground font-mono break-all">
                → {buyerAddress}
              </p>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${processProgress}%` }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Please do not close this window.
              </p>
            </div>
          )}

          {phase === 'confirm' && (
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Confirm the buyer's payment has arrived in your account, then tap{' '}
                <strong>Mark as paid & Release</strong> to deduct the USDT from your balance.
              </p>
            </div>
          )}
        </div>

        {/* Status */}
        <div className="glass-card rounded-xl border border-border p-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Status</span>
            {phase === 'success' ? (
              <span className="text-success font-semibold">Completed</span>
            ) : phase === 'releasing' ? (
              <span className="text-warning font-semibold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Releasing…
              </span>
            ) : phase === 'processing' ? (
              <span className="text-primary font-semibold flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Making payment…
              </span>
            ) : phase === 'confirm' ? (
              <span className="text-success font-semibold">Awaiting your confirmation</span>
            ) : phase === 'submitted' ? (
              <span className="text-primary font-semibold">Awaiting buyer payment</span>
            ) : timeRemaining > 0 ? (
              <span className="text-primary font-semibold">Awaiting address</span>
            ) : (
              <span className="text-destructive font-semibold">Window expired</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Time remaining</span>
            <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
          </div>
        </div>

        {/* Chat placeholder */}
        <div className="glass-card rounded-xl border border-border p-4">
          <div className="flex items-center gap-2 text-sm font-semibold mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            Chat with buyer
          </div>
          <p className="text-[11px] text-muted-foreground">
            For your safety, communicate only through the in-app support channel if you need assistance with this trade.
          </p>
        </div>

        {/* Release (start processing) */}
        {phase === 'submitted' && (
          <div className="space-y-2">
            <Button
              className="w-full h-12 text-base"
              onClick={handleReleaseStart}
              disabled={timeRemaining <= 0}
            >
              <Lock className="w-4 h-4 mr-2" />
              Release
            </Button>
            <Button variant="outline" className="w-full" onClick={handleBackHome}>
              Cancel & Back to P2P
            </Button>
          </div>
        )}

        {/* Confirm payment & release (deducts balance) */}
        {phase === 'confirm' && (
          <div className="space-y-2">
            <Button
              className="w-full h-12 text-base"
              onClick={handleConfirmPaid}
              disabled={timeRemaining <= 0}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as paid & Release {session.amount.toLocaleString('en-US')} USDT
            </Button>
            <Button variant="outline" className="w-full" onClick={handleBackHome}>
              Back
            </Button>
          </div>
        )}

        {phase === 'releasing' && (
          <div className="glass-card rounded-xl border border-primary/30 p-6 text-center space-y-3">
            <CircularLoader />
            <p className="font-semibold text-sm">Releasing USDT…</p>
            <p className="text-[11px] text-muted-foreground">
              Finalizing the trade. Please wait.
            </p>
          </div>
        )}

        <div className="flex items-start gap-2.5 rounded-lg border border-border bg-muted/20 p-3">
          <Wallet className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your USDT remains locked in escrow throughout this trade. It will only be deducted once you confirm the release.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SellPayment;
