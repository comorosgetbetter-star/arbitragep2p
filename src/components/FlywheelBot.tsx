import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowDownUp, Wallet, Clock, TrendingUp, Zap, X, AlertTriangle, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const fmt = (n: number, decimals = 2) => n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

interface FlywheelBotProps {
  onBack: () => void;
}

interface FlywheelSession {
  id: string;
  plan_name: string;
  staked_amount: number;
  daily_return_pct: number;
  lock_days: number;
  started_at: string;
  ends_at: string;
  status: string;
}

interface TradeRound {
  id: number;
  isWin: boolean;
  amount: number;
  timestamp: number;
}

const DURATION_OPTIONS = [
  { label: '1 min', minutes: 1 },
  { label: '2 min', minutes: 2 },
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
];

const FLYWHEEL_PACKAGE_MINUTE_DIVISOR = 10;

const FLYWHEEL_PLANS = [
  { id: 'turbo-sprint', name: 'Turbo Sprint', dailyReturnPct: 120, minAmount: 100, badge: 'Fast', profitMultiplier: 1 },
  { id: 'turbo-rush', name: 'Turbo Rush', dailyReturnPct: 80, minAmount: 250, badge: 'Popular', profitMultiplier: 1.5 },
  { id: 'turbo-wave', name: 'Turbo Wave', dailyReturnPct: 60, minAmount: 500, badge: 'Steady', profitMultiplier: 2.2 },
  { id: 'turbo-titan', name: 'Turbo Titan', dailyReturnPct: 40, minAmount: 1000, badge: 'Safe', profitMultiplier: 3 },
];

const isFlywheelPlan = (planName: string) => planName.toLowerCase().startsWith('turbo');

const getFlywheelPlanByName = (planName: string) =>
  FLYWHEEL_PLANS.find((plan) => plan.name === planName);

const calculateSessionAccruedProfit = (session: FlywheelSession, nowMs: number) => {
  const startedAtMs = new Date(session.started_at).getTime();
  const endsAtMs = new Date(session.ends_at).getTime();
  const elapsedSeconds = Math.max(0, (Math.min(nowMs, endsAtMs) - startedAtMs) / 1000);

  if (isFlywheelPlan(session.plan_name)) {
    const elapsedMinutes = elapsedSeconds / 60;
    return Math.max(
      0,
      session.staked_amount * (session.daily_return_pct / 100) * (elapsedMinutes / FLYWHEEL_PACKAGE_MINUTE_DIVISOR),
    );
  }

  const elapsedDays = elapsedSeconds / 86400;
  return Math.max(0, session.staked_amount * (session.daily_return_pct / 100) * elapsedDays);
};

const calculateSessionEstimatedProfit = (session: FlywheelSession) => {
  const startedAtMs = new Date(session.started_at).getTime();
  const endsAtMs = new Date(session.ends_at).getTime();
  const elapsedSeconds = Math.max(0, (endsAtMs - startedAtMs) / 1000);

  if (isFlywheelPlan(session.plan_name)) {
    const elapsedMinutes = elapsedSeconds / 60;
    return Math.max(
      0,
      session.staked_amount * (session.daily_return_pct / 100) * (elapsedMinutes / FLYWHEEL_PACKAGE_MINUTE_DIVISOR),
    );
  }

  const elapsedDays = elapsedSeconds / 86400;
  return Math.max(0, session.staked_amount * (session.daily_return_pct / 100) * elapsedDays);
};

// Full-page Deriv-style active bot view
const ActiveBotView = ({ session, onCancelled, onBack }: { session: FlywheelSession; onCancelled: () => void; onBack: () => void }) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [collected, setCollected] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [trades, setTrades] = useState<TradeRound[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const [tradingCountdown, setTradingCountdown] = useState(0);
  const [lastResult, setLastResult] = useState<TradeRound | null>(null);
  const roundIdRef = useRef(0);
  const cumulativeNetRef = useRef(0);
  const tradesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const startedAt = new Date(session.started_at).getTime();
  const endsAt = new Date(session.ends_at).getTime();
  const totalDurationMs = endsAt - startedAt;
  const elapsedMs = Math.max(0, Math.min(now - startedAt, totalDurationMs));
  const progressPct = totalDurationMs > 0 ? (elapsedMs / totalDurationMs) * 100 : 0;
  const isCompleted = now >= endsAt;

  const remainingMs = Math.max(0, endsAt - now);
  const remainingMinutes = Math.floor(remainingMs / (1000 * 60));
  const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const tradeNet = trades.reduce((sum, t) => sum + (t.isWin ? t.amount : -t.amount), 0);
  const accruedProfit = tradeNet;
  const totalReturnToBalance = session.staked_amount + tradeNet;
  const winsCount = trades.filter((trade) => trade.isWin).length;
  const lossesCount = trades.length - winsCount;

  const planConfig = getFlywheelPlanByName(session.plan_name);
  const displayRate = planConfig?.dailyReturnPct ?? session.daily_return_pct;

  // Variance scales with the expected profit for this session (based on staked amount & rate)
  const expectedFullProfit = calculateSessionEstimatedProfit(session);
  const targetVarianceRef = useRef(
    (Math.random() < 0.5 ? -1 : 1) * expectedFullProfit * (0.1 + Math.random() * 0.05)
  );
  // Base trade size scales with staked amount (~0.3-0.5% per trade)
  const baseTradeSize = session.staked_amount * 0.004;

  useEffect(() => {
    if (isCompleted || session.status !== 'active') return;

    const runTradeRound = () => {
      setIsTrading(true);
      setLastResult(null);
      const tradeDuration = 2000 + Math.random() * 2000;
      setTradingCountdown(Math.ceil(tradeDuration / 1000));

      const countdownInterval = setInterval(() => {
        setTradingCountdown(prev => {
          if (prev <= 1) { clearInterval(countdownInterval); return 0; }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setIsTrading(false);

        const currentAccrued = calculateSessionAccruedProfit(session, Date.now());
        const progressRatio = Math.min(1, (Date.now() - new Date(session.started_at).getTime()) / (new Date(session.ends_at).getTime() - new Date(session.started_at).getTime()));
        const targetNow = currentAccrued + targetVarianceRef.current * progressRatio;
        const delta = targetNow - cumulativeNetRef.current;

        // ~38% loss rate, adjusted by drift
        const forceLoss = delta < 0 || (delta > 0 && Math.random() < 0.38);

        let isWin: boolean;
        let amount: number;

        if (forceLoss && cumulativeNetRef.current > 0.02) {
          isWin = false;
          const lossBase = Math.abs(delta) > baseTradeSize ? Math.abs(delta) * (0.2 + Math.random() * 0.4) : baseTradeSize * (0.3 + Math.random() * 0.7);
          amount = Math.round(lossBase * 100) / 100;
          amount = Math.max(0.01, amount);
          cumulativeNetRef.current -= amount;
        } else {
          isWin = true;
          const winBase = Math.abs(delta) > baseTradeSize * 0.5 ? Math.abs(delta) * (0.3 + Math.random() * 0.5) : baseTradeSize * (0.4 + Math.random() * 0.8);
          amount = Math.max(0.01, Math.round(winBase * 100) / 100);
          cumulativeNetRef.current += amount;
        }

        roundIdRef.current += 1;
        const newTrade: TradeRound = { id: roundIdRef.current, isWin, amount, timestamp: Date.now() };
        setTrades(prev => [...prev, newTrade]);
        setLastResult(newTrade);

        setTimeout(() => setLastResult(null), 2500);
      }, tradeDuration);
    };

    const initialTimeout = setTimeout(runTradeRound, 1000);
    const interval = setInterval(runTradeRound, 4000 + Math.random() * 3000);
    return () => { clearTimeout(initialTimeout); clearInterval(interval); };
  }, [isCompleted, session.status, session.staked_amount, session.started_at, session.ends_at, session.daily_return_pct, session.plan_name]);

  useEffect(() => {
    tradesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trades.length]);

  const handleConfirmCancel = useCallback(async () => {
    setCancelling(true);
    setShowCancelConfirm(false);
    try {
      const { error } = await supabase.rpc('cancel_staking', { _session_id: session.id });
      if (error) throw error;
      toast({ title: 'Profits collected ✅', description: `$${fmt(accruedProfit)} profit returned to your balance.` });
      setCollected(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to collect', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  }, [accruedProfit, session.id, toast]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 bg-card/90 backdrop-blur-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/15 flex items-center justify-center">
            <ArrowDownUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground tracking-tight">{session.plan_name}</p>
            <p className="text-xs text-muted-foreground font-mono">{displayRate}% • ${fmt(session.staked_amount)}</p>
          </div>
        </div>
        <Badge className={`text-xs font-mono tracking-wider ${isCompleted ? 'bg-success/10 text-success border-0' : 'bg-primary/10 text-primary border-0 animate-pulse'}`}>
          {isCompleted ? 'DONE' : 'LIVE'}
        </Badge>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Result flash / Trading indicator */}
        <div className="h-[80px] relative">
          {lastResult ? (
            <div className={`absolute inset-0 rounded-lg p-3 text-center border ${
              lastResult.isWin ? 'bg-success/8 border-success/20' : 'bg-destructive/8 border-destructive/20'
            }`}>
              <div className="flex items-center justify-center gap-1.5 mb-0.5">
                {lastResult.isWin ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <span className={`text-sm font-bold font-mono uppercase tracking-wider ${lastResult.isWin ? 'text-success' : 'text-destructive'}`}>
                  {lastResult.isWin ? 'WIN' : 'LOSS'}
                </span>
              </div>
              <p className={`text-2xl font-bold font-mono ${lastResult.isWin ? 'text-success' : 'text-destructive'}`}>
                {lastResult.isWin ? '+' : '-'}${fmt(lastResult.amount)}
              </p>
            </div>
          ) : isTrading && !isCompleted ? (
            <div className="absolute inset-0 bg-card border border-border/30 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground tracking-tight">Executing trade…</p>
                <p className="text-xs text-muted-foreground font-mono">{tradingCountdown}s remaining</p>
              </div>
              <div className="flex gap-0.5 items-end">
                <div className="w-1 h-3 bg-primary/30 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <div className="w-1 h-5 bg-primary/50 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.1s]" />
                <div className="w-1 h-2.5 bg-primary/25 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.2s]" />
                <div className="w-1 h-4 bg-primary/40 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.3s]" />
              </div>
            </div>
          ) : isCompleted ? (
            <div className="absolute inset-0 bg-success/5 border border-success/20 rounded-lg p-3 flex items-center justify-center gap-2">
              <Trophy className="h-5 w-5 text-success" />
              <span className="text-base font-bold text-success tracking-tight">Session Complete</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-card border border-border/20 rounded-lg p-3 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Waiting for first trade…</p>
            </div>
          )}
        </div>

        {/* Profit card */}
        <div className="bg-card border border-border/30 rounded-lg p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-gold" />
              <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Net Profit</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-success">{winsCount}W</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-destructive">{lossesCount}L</span>
            </div>
          </div>
          <p className={`text-3xl font-bold font-mono tracking-tight ${accruedProfit >= 0 ? 'text-success' : 'text-destructive'}`}>
            {accruedProfit >= 0 ? '+' : '-'}${fmt(Math.abs(accruedProfit))}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Invested</p>
            <p className="text-base font-mono font-bold text-foreground">${fmt(session.staked_amount)}</p>
          </div>
          <div className="bg-secondary/40 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Value</p>
            <p className="text-base font-mono font-bold text-success">${fmt(totalReturnToBalance)}</p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground font-mono">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {remainingMinutes}:{remainingSeconds.toString().padStart(2, '0')}</span>
            <span>{progressPct.toFixed(0)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Trade history */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Trades</p>
          <ScrollArea className="h-[200px] rounded-lg border border-border/20 bg-card/50">
            <div className="p-2 space-y-1">
              {trades.length === 0 && !isTrading && (
                <p className="text-sm text-muted-foreground text-center py-8">Waiting…</p>
              )}
              {trades.map((trade, idx) => (
                <div
                  key={trade.id}
                  className={`flex items-center justify-between px-3 py-2 rounded text-sm animate-fade-in ${
                    trade.isWin ? 'bg-success/5' : 'bg-destructive/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {trade.isWin ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-muted-foreground font-mono text-xs">#{idx + 1}</span>
                  </div>
                  <span className={`font-bold font-mono text-sm ${trade.isWin ? 'text-success' : 'text-destructive'}`}>
                    {trade.isWin ? '+' : '-'}${fmt(trade.amount)}
                  </span>
                </div>
              ))}
              <div ref={tradesEndRef} />
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] mb-16 md:mb-0 border-t border-border/30 bg-card/80 backdrop-blur-sm space-y-2">
        {collected ? (
          <Button
            className="w-full h-12 font-semibold text-base"
            onClick={onCancelled}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Packages
          </Button>
        ) : !isCompleted && session.status === 'active' ? (
          <Button
            variant="outline"
            className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold text-base"
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelling}
          >
            <X className="h-4 w-4 mr-1.5" />
            {cancelling ? 'Stopping…' : 'Cancel Bot'}
          </Button>
        ) : (
          <Button
            className="w-full h-12 bg-success hover:bg-success/90 text-success-foreground font-semibold text-base"
            onClick={() => setShowCancelConfirm(true)}
          >
            <Trophy className="h-4 w-4 mr-1.5" />
            Collect Profits
          </Button>
        )}
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              {isCompleted ? (
                <><Trophy className="h-5 w-5 text-gold" /> Collect Profits</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-warning" /> Cancel Bot?</>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {isCompleted
                ? 'Your trading session is complete. Review your results.'
                : 'Are you sure you want to stop the bot early? You can still collect any profits earned so far.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Invested</p>
                <p className="text-base font-bold text-foreground">${fmt(session.staked_amount)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Trades</p>
                <p className="text-base font-bold text-foreground">{trades.length}</p>
              </div>
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Wins</p>
                <p className="text-base font-bold text-success">{winsCount}</p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-xs text-muted-foreground">Losses</p>
                <p className="text-base font-bold text-destructive">{lossesCount}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Settlement profit is the net result of all winning and losing trades.
            </p>
            <div className="bg-card border border-border/50 rounded-xl p-4 text-center space-y-1">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Return to Balance</p>
              <p className="text-2xl font-bold font-display text-success">
                ${fmt(totalReturnToBalance)}
              </p>
              <p className="text-xs text-muted-foreground">
                ${fmt(session.staked_amount)} invested + ${fmt(accruedProfit)} profit
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} className="flex-1 text-sm">
              {isCompleted ? 'Back' : 'Keep Trading'}
            </Button>
            <Button
              className={`flex-1 text-sm ${isCompleted ? 'bg-success hover:bg-success/90 text-success-foreground' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}`}
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Processing…' : isCompleted ? 'Collect Profits' : 'Stop & Collect'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const FlywheelBot = ({ onBack }: FlywheelBotProps) => {
  const { user } = useAuth();
  const { balance, refetchBalance } = useUserData();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedDuration, setSelectedDuration] = useState(DURATION_OPTIONS[0]);
  const [isStarting, setIsStarting] = useState(false);
  const [activeSessions, setActiveSessions] = useState<FlywheelSession[]>([]);
  const [confirmPlan, setConfirmPlan] = useState<typeof FLYWHEEL_PLANS[0] | null>(null);
  const [viewingSession, setViewingSession] = useState<FlywheelSession | null>(null);

  const [recentRuns, setRecentRuns] = useState<FlywheelSession[]>([]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('staking_sessions')
      .select('id, plan_name, staked_amount, daily_return_pct, lock_days, started_at, ends_at, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .like('plan_name', 'Turbo%')
      .order('started_at', { ascending: false });
    if (data) setActiveSessions(data as FlywheelSession[]);

    const { data: completed } = await supabase
      .from('staking_sessions')
      .select('id, plan_name, staked_amount, daily_return_pct, lock_days, started_at, ends_at, status')
      .eq('user_id', user.id)
      .eq('status', 'cancelled')
      .like('plan_name', 'Turbo%')
      .order('started_at', { ascending: false })
      .limit(5);
    if (completed) setRecentRuns(completed as FlywheelSession[]);
  }, [user]);

  useEffect(() => {
    fetchSessions();
    if (!user) return;
    const channel = supabase
      .channel('flywheel-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staking_sessions', filter: `user_id=eq.${user.id}` }, () => {
        fetchSessions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSessions]);

  const handleStart = async (plan: typeof FLYWHEEL_PLANS[0]) => {
    if (!user) return;
    if (balance < plan.minAmount) {
      toast({ title: 'Minimum not met', description: `Minimum is $${fmt(plan.minAmount)}`, variant: 'destructive' });
      return;
    }
    if (balance <= 0) {
      toast({ title: 'Insufficient balance', description: `Your balance is $${fmt(balance)}`, variant: 'destructive' });
      return;
    }
    setConfirmPlan(plan);
  };

  const handleConfirmStart = async () => {
    if (!confirmPlan || !user) return;

    const tradeAmount = confirmPlan.minAmount;
    if (balance < tradeAmount) {
      toast({ title: 'Insufficient balance', description: `You need $${fmt(tradeAmount)} for ${confirmPlan.name}`, variant: 'destructive' });
      return;
    }

    setIsStarting(true);
    setConfirmPlan(null);
    try {
      const { error } = await supabase.rpc('start_flywheel', {
        _plan_name: confirmPlan.name,
        _amount: tradeAmount,
        _daily_return_pct: confirmPlan.dailyReturnPct,
        _lock_minutes: selectedDuration.minutes,
      });
      if (error) throw error;
      toast({ title: 'Flywheel started! 🚀', description: `$${fmt(tradeAmount)} deployed on ${confirmPlan.name}` });
      setSelectedPlan(null);
      setSelectedDuration(DURATION_OPTIONS[0]);
      refetchBalance();
      fetchSessions();
    } catch (err: any) {
      toast({ title: 'Failed to start', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsStarting(false);
    }
  };

  const handleSessionDone = () => {
    setViewingSession(null);
    refetchBalance();
    fetchSessions();
  };

  useEffect(() => {
    if (activeSessions.length > 0 && !viewingSession) {
      setViewingSession(activeSessions[0]);
    }
  }, [activeSessions]);

  if (viewingSession) {
    return <ActiveBotView session={viewingSession} onCancelled={handleSessionDone} onBack={() => setViewingSession(null)} />;
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-sm text-muted-foreground font-medium">Flywheel Bot</span>
      </div>

      {/* Hero */}
      <div className="bg-card border border-border/30 rounded-xl p-4">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-md bg-primary/10 flex items-center justify-center">
            <ArrowDownUp className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-display font-bold text-foreground tracking-tight">Flywheel</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          Automated cycle trading. Watch trades execute in real-time.
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /><span>Live trades</span></div>
          <div className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-success" /><span>~70% win rate</span></div>
          <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-muted-foreground" /><span>1-10 min</span></div>
        </div>
      </div>

      {/* Balance */}
      <div className="flex items-center justify-between bg-card border border-border/30 rounded-xl px-4 py-3">
        <span className="text-sm text-muted-foreground tracking-wide">Balance</span>
        <span className="text-lg font-mono font-semibold text-foreground">
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-sm text-muted-foreground ml-1 font-sans font-normal">USDT</span>
        </span>
      </div>

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Active</h3>
          {activeSessions.map((session) => (
            <div key={session.id} className="bg-card border border-primary/20 rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:border-primary/40 transition-all" onClick={() => setViewingSession(session)}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                  <ArrowDownUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground tracking-tight">{session.plan_name}</p>
                  <p className="text-xs text-muted-foreground font-mono">${fmt(session.staked_amount)}</p>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-0 text-xs font-mono tracking-wider animate-pulse">LIVE</Badge>
            </div>
          ))}
        </div>
      )}

      {/* Plans */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Packages</h3>
        {FLYWHEEL_PLANS.map((plan) => {
          const estProfit = plan.minAmount * (plan.dailyReturnPct / 100);

          return (
            <div
              key={plan.id}
              className="bg-card border border-border/30 rounded-xl p-4 transition-all hover:border-gold/30 cursor-pointer"
              onClick={() => { setSelectedPlan(plan.id); setSelectedDuration(DURATION_OPTIONS[0]); }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-md bg-gold/10 flex items-center justify-center">
                    <ArrowDownUp className="h-4 w-4 text-gold" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground text-base tracking-tight">{plan.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{plan.dailyReturnPct}% • Min ${fmt(plan.minAmount, 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-success">+${fmt(estProfit, 0)}</span>
                  <Badge className="bg-gold/10 text-gold border-0 text-xs font-mono tracking-wider">{plan.badge}</Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Package Deploy Dialog */}
      <Dialog open={!!selectedPlan} onOpenChange={(open) => { if (!open) setSelectedPlan(null); }}>
        <DialogContent className="sm:max-w-md">
          {(() => {
            const plan = FLYWHEEL_PLANS.find(p => p.id === selectedPlan);
            if (!plan) return null;
            const estProfit = plan.minAmount * (plan.dailyReturnPct / 100);

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-lg">
                    <div className="w-9 h-9 rounded-md bg-gold/10 flex items-center justify-center">
                      <ArrowDownUp className="h-4 w-4 text-gold" />
                    </div>
                    {plan.name}
                    <Badge className="bg-gold/10 text-gold border-0 text-xs font-mono tracking-wider ml-auto">{plan.badge}</Badge>
                  </DialogTitle>
                  <DialogDescription className="text-sm">
                    Configure and deploy this trading package.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase">Min</p>
                      <p className="text-base font-mono font-bold text-foreground">${fmt(plan.minAmount, 0)}</p>
                    </div>
                    <div className="bg-secondary/30 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase">Rate</p>
                      <p className="text-base font-mono font-bold text-primary">{plan.dailyReturnPct}%</p>
                    </div>
                    <div className="bg-success/10 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground uppercase">Est.</p>
                      <p className="text-base font-mono font-bold text-success">+${fmt(estProfit, 0)}</p>
                    </div>
                  </div>

                  {/* Duration selector */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Duration</label>
                    <div className="grid grid-cols-4 gap-2">
                      {DURATION_OPTIONS.map((opt) => (
                        <button
                          key={opt.minutes}
                          onClick={() => setSelectedDuration(opt)}
                          className={`py-3 px-1 rounded-lg text-sm font-semibold border transition-all ${
                            selectedDuration.minutes === opt.minutes
                              ? 'bg-gold/20 border-gold/50 text-gold'
                              : 'bg-secondary/50 border-border/30 text-muted-foreground hover:border-border'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Trading Amount (USDT)</label>
                    <div className="bg-secondary/50 border border-border/50 rounded-lg px-4 py-3 text-lg font-bold text-foreground font-mono">
                      ${fmt(plan.minAmount)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">Fixed amount for this package. Balance: ${fmt(balance)}</p>
                  </div>
                </div>

                <DialogFooter className="flex gap-2 sm:gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12 font-semibold text-sm"
                    onClick={() => setSelectedPlan(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-[2] h-12 font-semibold text-sm bg-gold hover:bg-gold/90 text-gold-foreground shadow-[0_0_16px_hsl(43_96%_56%/0.3)]"
                    onClick={() => handleStart(plan)}
                    disabled={isStarting || balance < plan.minAmount}
                  >
                    {isStarting ? 'Starting…' : `Deploy $${fmt(plan.minAmount)}`}
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest">History</h3>
          {recentRuns.map((run) => {
            const estProfit = calculateSessionEstimatedProfit(run);
            return (
              <div key={run.id} className="bg-card border border-border/20 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-md bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-foreground tracking-tight">{run.plan_name}</p>
                    <p className="text-xs text-muted-foreground font-mono">
                      ${fmt(run.staked_amount)} • {new Date(run.started_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span className="text-base font-mono font-bold text-success">+${fmt(estProfit)}</span>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground/60 text-center px-4 pb-4">
        Trading involves risk. Past performance does not guarantee future returns.
      </p>

      {/* Start Confirmation Dialog */}
      <Dialog open={!!confirmPlan} onOpenChange={(open) => { if (!open) setConfirmPlan(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Deployment
            </DialogTitle>
            <DialogDescription className="text-sm">
              Please review the details before proceeding.
            </DialogDescription>
          </DialogHeader>
          {confirmPlan && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="text-base font-bold text-foreground">{confirmPlan.name}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-base font-bold text-foreground">{selectedDuration.label}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="text-base font-bold text-foreground">${fmt(confirmPlan.minAmount)}</p>
                </div>
                <div className="bg-success/10 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="text-base font-bold text-success">{confirmPlan.dailyReturnPct}%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                ${fmt(confirmPlan.minAmount)} will be deducted from your balance. Profits are credited at end of session.
              </p>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmPlan(null)} className="flex-1 text-sm">
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground font-semibold text-sm"
              onClick={handleConfirmStart}
              disabled={isStarting}
            >
              {isStarting ? 'Deploying…' : 'Confirm & Start'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
