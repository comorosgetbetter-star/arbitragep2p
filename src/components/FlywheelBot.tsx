import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowDownUp, Wallet, Clock, TrendingUp, Zap, X, AlertTriangle, CheckCircle2, XCircle, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const FLYWHEEL_PLANS = [
  { id: 'turbo-sprint', name: 'Turbo Sprint', dailyReturnPct: 120, minAmount: 100, badge: 'Fast', profitMultiplier: 1 },
  { id: 'turbo-rush', name: 'Turbo Rush', dailyReturnPct: 80, minAmount: 250, badge: 'Popular', profitMultiplier: 1.5 },
  { id: 'turbo-wave', name: 'Turbo Wave', dailyReturnPct: 60, minAmount: 500, badge: 'Steady', profitMultiplier: 2.2 },
  { id: 'turbo-titan', name: 'Turbo Titan', dailyReturnPct: 40, minAmount: 1000, badge: 'Safe', profitMultiplier: 3 },
];

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

  const totalWinnings = trades.reduce((sum, t) => sum + (t.isWin ? t.amount : -t.amount), 0);

  // Determine profit multiplier from plan name
  const planConfig = FLYWHEEL_PLANS.find(p => p.name === session.plan_name);
  const profitMultiplier = planConfig?.profitMultiplier ?? 1;

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
        const isWin = Math.random() < 0.7;
        const baseAmount = session.staked_amount * 0.005 * profitMultiplier;
        let amount: number;
        if (isWin) {
          amount = baseAmount * (0.8 + Math.random() * 2.5);
        } else {
          amount = baseAmount * (0.3 + Math.random() * 0.8);
        }
        amount = Math.round(amount * 100) / 100;

        roundIdRef.current += 1;
        const newTrade: TradeRound = { id: roundIdRef.current, isWin, amount, timestamp: Date.now() };
        setTrades(prev => [...prev, newTrade]);
        setLastResult(newTrade);

        // Clear result flash after 2s
        setTimeout(() => setLastResult(null), 2500);
      }, tradeDuration);
    };

    const initialTimeout = setTimeout(runTradeRound, 1000);
    const interval = setInterval(runTradeRound, 4000 + Math.random() * 3000);
    return () => { clearTimeout(initialTimeout); clearInterval(interval); };
  }, [isCompleted, session.status, session.staked_amount, profitMultiplier]);

  useEffect(() => {
    tradesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trades.length]);

  const handleConfirmCancel = useCallback(async () => {
    setCancelling(true);
    setShowCancelConfirm(false);
    try {
      const { error } = await supabase.rpc('cancel_staking', { _session_id: session.id });
      if (error) throw error;
      toast({ title: 'Profits collected ✅', description: `$${fmt(Math.max(0, totalWinnings))} profit returned to your balance.` });
      setCollected(true);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to collect', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  }, [session.id, toast, totalWinnings]);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <ArrowDownUp className="h-3.5 w-3.5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{session.plan_name}</p>
            <p className="text-[10px] text-muted-foreground">{session.daily_return_pct}% daily • ${fmt(session.staked_amount)} invested</p>
          </div>
        </div>
        <Badge className={isCompleted ? 'bg-success/15 text-success border-0' : 'bg-primary/15 text-primary border-0 animate-pulse'}>
          {isCompleted ? 'Complete' : 'Live'}
        </Badge>
      </div>

      {/* Main content - stable layout, no jumping */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Result flash / Trading indicator - fixed height container to prevent layout shift */}
        <div className="h-[76px] relative">
          {lastResult ? (
            <div className={`absolute inset-0 rounded-xl p-4 text-center ${
              lastResult.isWin ? 'bg-success/15 border border-success/30' : 'bg-destructive/15 border border-destructive/30'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-1">
                {lastResult.isWin ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <XCircle className="h-6 w-6 text-destructive" />
                )}
                <span className={`text-lg font-bold ${lastResult.isWin ? 'text-success' : 'text-destructive'}`}>
                  {lastResult.isWin ? 'WIN' : 'LOSS'}
                </span>
              </div>
              <p className={`text-2xl font-bold font-display tabular-nums ${lastResult.isWin ? 'text-success' : 'text-destructive'}`}>
                {lastResult.isWin ? '+' : '-'}${fmt(lastResult.amount)}
              </p>
            </div>
          ) : isTrading && !isCompleted ? (
            <div className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">Bot is trading...</p>
                <p className="text-xs text-muted-foreground">Analyzing market patterns • {tradingCountdown}s</p>
              </div>
              <div className="flex gap-0.5 items-end">
                <div className="w-1.5 h-4 bg-primary/40 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <div className="w-1.5 h-6 bg-primary/60 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.1s]" />
                <div className="w-1.5 h-3 bg-primary/30 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.2s]" />
                <div className="w-1.5 h-5 bg-primary/50 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.3s]" />
              </div>
            </div>
          ) : isCompleted ? (
            <div className="absolute inset-0 bg-success/10 border border-success/30 rounded-xl p-4 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-success" />
              <span className="text-lg font-bold text-success">Trading Complete!</span>
            </div>
          ) : (
            <div className="absolute inset-0 bg-secondary/30 border border-border/20 rounded-xl p-4 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Waiting for first trade...</p>
            </div>
          )}
        </div>

        {/* Total profit card */}
        <Card className="border-border/30">
          <CardContent className="p-4 space-y-1">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-4 w-4 text-gold" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Net Profit</p>
            </div>
            <p className={`text-3xl font-bold font-display tabular-nums ${totalWinnings >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalWinnings >= 0 ? '+' : '-'}${fmt(Math.abs(totalWinnings))}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="text-success">{trades.filter(t => t.isWin).length} wins</span>
              <span className="text-destructive">{trades.filter(t => !t.isWin).length} losses</span>
              <span>{trades.length} total trades</span>
            </div>
          </CardContent>
        </Card>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Invested</p>
            <p className="text-sm font-bold text-foreground">${fmt(session.staked_amount)}</p>
          </div>
          <div className="bg-secondary/50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground">Current Value</p>
            <p className={`text-sm font-bold ${totalWinnings >= 0 ? 'text-success' : 'text-destructive'}`}>
              ${fmt(session.staked_amount + totalWinnings)}
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {remainingMinutes}m {remainingSeconds}s left</span>
            <span>{progressPct.toFixed(1)}%</span>
          </div>
          <Progress value={progressPct} className="h-2.5" />
        </div>

        {/* Trade history */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Trade History</p>
          <ScrollArea className="h-[200px] rounded-xl border border-border/30 bg-card/50">
            <div className="p-2 space-y-1">
              {trades.length === 0 && !isTrading && (
                <p className="text-xs text-muted-foreground text-center py-8">Waiting for first trade...</p>
              )}
              {trades.map((trade, idx) => (
                <div
                  key={trade.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs animate-fade-in ${
                    trade.isWin ? 'bg-success/8' : 'bg-destructive/8'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {trade.isWin ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="text-muted-foreground font-medium">Trade #{idx + 1}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                      trade.isWin ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
                    }`}>
                      {trade.isWin ? 'WIN' : 'LOSS'}
                    </span>
                  </div>
                  <span className={`font-bold tabular-nums ${trade.isWin ? 'text-success' : 'text-destructive'}`}>
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
      <div className="p-4 border-t border-border/30 bg-card/80 backdrop-blur-sm space-y-2">
        {collected ? (
          /* Profits collected — show only Back button */
          <Button
            className="w-full h-12 font-semibold"
            onClick={onCancelled}
          >
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Packages
          </Button>
        ) : !isCompleted && session.status === 'active' ? (
          /* Bot is still running — show only Cancel button */
          <Button
            variant="outline"
            className="w-full h-12 border-destructive/30 text-destructive hover:bg-destructive/10 font-semibold"
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelling}
          >
            <X className="h-4 w-4 mr-1.5" />
            {cancelling ? 'Stopping…' : 'Cancel Bot'}
          </Button>
        ) : (
          /* Bot finished — show Collect Profits */
          <Button
            className="w-full h-12 bg-success hover:bg-success/90 text-success-foreground font-semibold"
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
            <DialogTitle className="flex items-center gap-2">
              {isCompleted ? (
                <><Trophy className="h-5 w-5 text-gold" /> Collect Profits</>
              ) : (
                <><AlertTriangle className="h-5 w-5 text-warning" /> Cancel Bot?</>
              )}
            </DialogTitle>
            <DialogDescription>
              {isCompleted
                ? 'Your trading session is complete. Review your results.'
                : 'Are you sure you want to stop the bot early? You can still collect any profits earned so far.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Invested</p>
                <p className="text-sm font-bold text-foreground">${fmt(session.staked_amount)}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Trades</p>
                <p className="text-sm font-bold text-foreground">{trades.length}</p>
              </div>
              <div className="bg-success/10 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Wins</p>
                <p className="text-sm font-bold text-success">
                  {trades.filter(t => t.isWin).length} (+${fmt(trades.filter(t => t.isWin).reduce((s, t) => s + t.amount, 0))})
                </p>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 text-center">
                <p className="text-[10px] text-muted-foreground">Losses</p>
                <p className="text-sm font-bold text-destructive">
                  {trades.filter(t => !t.isWin).length} (-${fmt(trades.filter(t => !t.isWin).reduce((s, t) => s + t.amount, 0))})
                </p>
              </div>
            </div>
            <div className="bg-card border border-border/50 rounded-xl p-4 text-center space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Return to Balance</p>
              <p className="text-2xl font-bold font-display text-success">
                ${fmt(session.staked_amount + Math.max(0, totalWinnings))}
              </p>
              <p className="text-[10px] text-muted-foreground">
                ${fmt(session.staked_amount)} invested + ${fmt(Math.max(0, totalWinnings))} profit
              </p>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)} className="flex-1">
              {isCompleted ? 'Back' : 'Keep Trading'}
            </Button>
            <Button
              className={`flex-1 ${isCompleted ? 'bg-success hover:bg-success/90 text-success-foreground' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}`}
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
  const [amount, setAmount] = useState('');
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

    // Fetch recent completed runs
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
    const amountNum = parseFloat(amount || String(confirmPlan.minAmount));

    setIsStarting(true);
    setConfirmPlan(null);
    try {
      const { error } = await supabase.rpc('start_flywheel', {
        _plan_name: confirmPlan.name,
        _amount: amountNum,
        _daily_return_pct: confirmPlan.dailyReturnPct,
        _lock_minutes: selectedDuration.minutes,
      });
      if (error) throw error;
      toast({ title: 'Flywheel started! 🚀', description: `$${fmt(amountNum)} deployed on ${confirmPlan.name}` });
      setSelectedPlan(null);
      setSelectedDuration(DURATION_OPTIONS[0]);
      setAmount('');
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

  // Auto-open first active session, or open newly created one
  useEffect(() => {
    if (activeSessions.length > 0 && !viewingSession) {
      setViewingSession(activeSessions[0]);
    }
  }, [activeSessions]);

  // If viewing a session, show full-page bot view
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
        <span className="text-xs text-muted-foreground font-medium">Flywheel Bot</span>
      </div>

      {/* Hero */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ArrowDownUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-display font-bold text-foreground">Flywheel</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Automated trading bot. Watch trades execute <span className="text-primary font-semibold">in real-time</span> with win/loss results.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /><span>Live trades</span></div>
            <div className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-success" /><span>70% win rate</span></div>
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-warning" /><span>Hour cycles</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Balance */}
      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">USDT Balance</p>
              <p className="text-xl font-bold font-display text-foreground">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions - shown as resumable cards */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Bots</h3>
          {activeSessions.map((session) => (
            <Card key={session.id} className="border-primary/30 cursor-pointer hover:border-primary/50 transition-all" onClick={() => setViewingSession(session)}>
              <CardContent className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <ArrowDownUp className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{session.plan_name}</p>
                    <p className="text-[10px] text-muted-foreground">${fmt(session.staked_amount)} invested</p>
                  </div>
                </div>
                <Badge className="bg-primary/15 text-primary border-0 animate-pulse">Running</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Plans */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Trading Cycles</h3>
        {FLYWHEEL_PLANS.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const estProfit = plan.minAmount * (plan.dailyReturnPct / 100);

          return (
            <Card
              key={plan.id}
              className={`border transition-all ${isSelected ? 'border-gold/50 bg-gold/5 ring-1 ring-gold/30' : 'border-border/50'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
                      <ArrowDownUp className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.dailyReturnPct}%/day</p>
                    </div>
                  </div>
                  <Badge className="bg-gold/15 text-gold border-0 text-[10px]">{plan.badge}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Min</p>
                    <p className="text-xs font-bold text-foreground">${fmt(plan.minAmount)}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Rate</p>
                    <p className="text-xs font-bold text-primary">{plan.dailyReturnPct}%/day</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Est. Profit</p>
                    <p className="text-xs font-bold text-success">+${fmt(estProfit)}</p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="space-y-3">
                    {/* Duration selector */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Duration</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {DURATION_OPTIONS.map((opt) => (
                          <button
                            key={opt.minutes}
                            onClick={() => setSelectedDuration(opt)}
                            className={`py-2 px-1 rounded-lg text-xs font-semibold border transition-all ${
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
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Trading Amount (USDT)</label>
                      <div className="bg-secondary/50 border border-border/50 rounded-md px-3 py-2 text-sm font-bold text-foreground">
                        ${fmt(balance)}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">Your full balance will be used for trading</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 h-11 font-semibold text-sm border-border/50"
                        onClick={() => { setSelectedPlan(null); setAmount(''); }}
                      >
                        Cancel
                      </Button>
                      <Button
                        className="flex-[2] h-11 font-semibold text-sm bg-gold hover:bg-gold/90 text-gold-foreground shadow-[0_0_16px_hsl(43_96%_56%/0.3)]"
                        onClick={() => handleStart(plan)}
                        disabled={isStarting}
                      >
                        {isStarting ? 'Starting…' : `Deploy $${fmt(parseFloat(amount) || plan.minAmount)}`}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="w-full h-11 font-semibold text-sm bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30"
                    onClick={() => { setSelectedPlan(plan.id); setAmount(String(plan.minAmount)); }}
                  >
                    Start Trading
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Runs */}
      {recentRuns.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Recent Runs</h3>
          {recentRuns.map((run) => {
            const startMs = new Date(run.started_at).getTime();
            const endMs = new Date(run.ends_at).getTime();
            const durationDays = (endMs - startMs) / (1000 * 60 * 60 * 24);
            const estProfit = run.staked_amount * (run.daily_return_pct / 100) * durationDays;
            return (
              <Card key={run.id} className="border-border/50">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-success/15 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{run.plan_name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        ${fmt(run.staked_amount)} invested • {new Date(run.started_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-success">+${fmt(estProfit)}</span>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-[10px] text-muted-foreground text-center px-4 pb-4">
        Bot trading involves risk. Returns are estimates based on market conditions. You can stop a bot at any time to collect accrued profits.
      </p>

      {/* Start Confirmation Dialog */}
      <Dialog open={!!confirmPlan} onOpenChange={(open) => { if (!open) setConfirmPlan(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Deployment
            </DialogTitle>
            <DialogDescription>
              Please review the details before proceeding.
            </DialogDescription>
          </DialogHeader>
          {confirmPlan && (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Plan</p>
                  <p className="text-sm font-bold text-foreground">{confirmPlan.name}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Duration</p>
                  <p className="text-sm font-bold text-foreground">{selectedDuration.label}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Amount</p>
                  <p className="text-sm font-bold text-primary">${fmt(parseFloat(amount) || confirmPlan.minAmount)}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-muted-foreground">Daily Rate</p>
                  <p className="text-sm font-bold text-success">{confirmPlan.dailyReturnPct}%</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                ${fmt(parseFloat(amount) || confirmPlan.minAmount)} USDT will be deducted from your balance.
              </p>
            </div>
          )}
          <DialogFooter className="flex gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => setConfirmPlan(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              className="flex-1 bg-gold hover:bg-gold/90 text-gold-foreground"
              onClick={handleConfirmStart}
              disabled={isStarting}
            >
              {isStarting ? 'Starting…' : 'Confirm & Deploy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
