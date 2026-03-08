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
  { id: 'turbo-sprint', name: 'Turbo Sprint', dailyReturnPct: 120, minAmount: 100, badge: 'Fast' },
  { id: 'turbo-rush', name: 'Turbo Rush', dailyReturnPct: 80, minAmount: 250, badge: 'Popular' },
  { id: 'turbo-wave', name: 'Turbo Wave', dailyReturnPct: 60, minAmount: 500, badge: 'Steady' },
  { id: 'turbo-titan', name: 'Turbo Titan', dailyReturnPct: 40, minAmount: 1000, badge: 'Safe' },
];

// Deriv-style active session card with round-by-round win/loss
const ActiveFlywheelCard = ({ session, onCancelled }: { session: FlywheelSession; onCancelled: () => void }) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [trades, setTrades] = useState<TradeRound[]>([]);
  const [isTrading, setIsTrading] = useState(false);
  const [tradingCountdown, setTradingCountdown] = useState(0);
  const roundIdRef = useRef(0);
  const tradesEndRef = useRef<HTMLDivElement>(null);

  // Tick for countdown and progress
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

  // Time remaining
  const remainingMs = Math.max(0, endsAt - now);
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  // Calculate total from trades
  const totalWinnings = trades.reduce((sum, t) => sum + (t.isWin ? t.amount : -t.amount), 0);

  // Generate trade rounds at intervals (every 3-6 seconds)
  useEffect(() => {
    if (isCompleted || session.status !== 'active') return;

    const runTradeRound = () => {
      // Start "trading" animation
      setIsTrading(true);
      const tradeDuration = 2000 + Math.random() * 2000; // 2-4 seconds of "trading"
      setTradingCountdown(Math.ceil(tradeDuration / 1000));

      const countdownInterval = setInterval(() => {
        setTradingCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => {
        setIsTrading(false);
        
        // 70% chance of win, 30% chance of loss
        const isWin = Math.random() < 0.7;
        
        // Win amounts are bigger than loss amounts
        const baseAmount = session.staked_amount * 0.005; // 0.5% of staked as base
        let amount: number;
        if (isWin) {
          amount = baseAmount * (0.8 + Math.random() * 2.5); // Win: 0.8x - 3.3x base
        } else {
          amount = baseAmount * (0.3 + Math.random() * 0.8); // Loss: 0.3x - 1.1x base (smaller)
        }
        amount = Math.round(amount * 100) / 100;

        roundIdRef.current += 1;
        const newTrade: TradeRound = {
          id: roundIdRef.current,
          isWin,
          amount,
          timestamp: Date.now(),
        };
        
        setTrades(prev => [...prev, newTrade]);
      }, tradeDuration);
    };

    // Initial trade after 1 second
    const initialTimeout = setTimeout(runTradeRound, 1000);

    // Then repeat every 4-7 seconds
    const interval = setInterval(runTradeRound, 4000 + Math.random() * 3000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [isCompleted, session.status, session.staked_amount]);

  // Auto scroll to latest trade
  useEffect(() => {
    tradesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [trades.length]);

  const handleCancelRequest = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = useCallback(async () => {
    setCancelling(true);
    setShowCancelConfirm(false);
    try {
      const { error } = await supabase.rpc('cancel_staking', { _session_id: session.id });
      if (error) throw error;
      toast({ title: 'Bot stopped ✅', description: `Profits of $${fmt(Math.max(0, totalWinnings))} returned to your balance.` });
      onCancelled();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to stop bot', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  }, [session.id, onCancelled, toast, totalWinnings]);

  return (
    <>
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <ArrowDownUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{session.plan_name}</p>
                <p className="text-[10px] text-muted-foreground">Flywheel • {session.daily_return_pct}% daily</p>
              </div>
            </div>
            <Badge className={isCompleted ? 'bg-success/15 text-success border-0' : 'bg-primary/15 text-primary border-0'}>
              {isCompleted ? 'Done' : 'Running'}
            </Badge>
          </div>

          {/* Trading animation indicator */}
          {isTrading && !isCompleted && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-primary">Bot is trading...</p>
                <p className="text-[10px] text-muted-foreground">Analyzing market • {tradingCountdown}s</p>
              </div>
              <div className="flex gap-0.5">
                <div className="w-1.5 h-4 bg-primary/40 rounded-full animate-[pulse_0.6s_ease-in-out_infinite]" />
                <div className="w-1.5 h-6 bg-primary/60 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.1s]" />
                <div className="w-1.5 h-3 bg-primary/30 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.2s]" />
                <div className="w-1.5 h-5 bg-primary/50 rounded-full animate-[pulse_0.6s_ease-in-out_infinite_0.3s]" />
              </div>
            </div>
          )}

          {/* Trade history feed */}
          <div className="space-y-1">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Trade History</p>
            <ScrollArea className="h-[140px] rounded-lg border border-border/30 bg-card/80">
              <div className="p-2 space-y-1.5">
                {trades.length === 0 && !isTrading && (
                  <p className="text-xs text-muted-foreground text-center py-6">Waiting for first trade...</p>
                )}
                {trades.map((trade, idx) => (
                  <div
                    key={trade.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs animate-fade-in ${
                      trade.isWin ? 'bg-success/10' : 'bg-destructive/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {trade.isWin ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-destructive" />
                      )}
                      <span className="text-muted-foreground">Round #{idx + 1}</span>
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

          {/* Total winnings */}
          <div className="bg-card/80 border border-border/30 rounded-xl p-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-gold" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Profit</p>
            </div>
            <p className={`text-2xl font-bold font-display tabular-nums ${totalWinnings >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalWinnings >= 0 ? '+' : '-'}${fmt(Math.abs(totalWinnings))}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {trades.filter(t => t.isWin).length}W / {trades.filter(t => !t.isWin).length}L from {trades.length} trades
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Session progress</span>
              <span>{progressPct.toFixed(1)}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {/* Countdown */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {isCompleted ? (
              <span className="text-success font-medium">Trading cycle complete!</span>
            ) : (
              <span className="tabular-nums">
                {remainingHours}h {remainingMinutes}m {remainingSeconds}s remaining
              </span>
            )}
          </div>

          {/* Info row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Invested</p>
              <p className="text-xs font-bold text-foreground">${fmt(session.staked_amount)}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-2 text-center">
              <p className="text-[10px] text-muted-foreground">Current Value</p>
              <p className={`text-xs font-bold ${totalWinnings >= 0 ? 'text-success' : 'text-destructive'}`}>
                ${fmt(session.staked_amount + totalWinnings)}
              </p>
            </div>
          </div>

          {/* Stop button */}
          {!isCompleted && session.status === 'active' && (
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={handleCancelRequest}
              disabled={cancelling}
            >
              <X className="h-4 w-4 mr-1.5" />
              {cancelling ? 'Stopping…' : 'Stop Bot & Collect'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gold" />
              Collect Profits
            </DialogTitle>
            <DialogDescription>
              Review your trading session results before collecting.
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
              Keep Trading
            </Button>
            <Button
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Collecting…' : 'Collect Profits'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
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
    const amountNum = parseFloat(amount || String(plan.minAmount));
    if (amountNum < plan.minAmount) {
      toast({ title: 'Minimum not met', description: `Minimum is $${fmt(plan.minAmount)}`, variant: 'destructive' });
      return;
    }
    if (amountNum > balance) {
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
        _lock_minutes: confirmPlan.lockMinutes,
      });
      if (error) throw error;
      toast({ title: 'Flywheel started! 🚀', description: `$${fmt(amountNum)} deployed on ${confirmPlan.name}` });
      setSelectedPlan(null);
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
    refetchBalance();
    fetchSessions();
  };

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

      {/* Active Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Bots</h3>
          {activeSessions.map((session) => (
            <ActiveFlywheelCard key={session.id} session={session} onCancelled={handleSessionDone} />
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
                      <p className="text-xs text-muted-foreground">{plan.duration} cycle • {plan.dailyReturnPct}%/day</p>
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
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Amount (USDT)</label>
                      <Input
                        type="number"
                        placeholder={`Min $${fmt(plan.minAmount)}`}
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        className="bg-secondary/50 border-border/50"
                      />
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
                  <p className="text-sm font-bold text-foreground">{confirmPlan.duration}</p>
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
