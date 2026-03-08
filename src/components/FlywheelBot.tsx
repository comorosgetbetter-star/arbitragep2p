import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ArrowDownUp, Wallet, Clock, TrendingUp, Zap, X, AlertTriangle } from 'lucide-react';
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

const FLYWHEEL_PLANS = [
  { id: 'turbo-1h', name: 'Turbo 1H', duration: '1 hour', lockMinutes: 60, dailyReturnPct: 120, minAmount: 100, badge: 'Fast' },
  { id: 'turbo-3h', name: 'Turbo 3H', duration: '3 hours', lockMinutes: 180, dailyReturnPct: 80, minAmount: 250, badge: 'Popular' },
  { id: 'turbo-6h', name: 'Turbo 6H', duration: '6 hours', lockMinutes: 360, dailyReturnPct: 60, minAmount: 500, badge: 'Steady' },
  { id: 'turbo-12h', name: 'Turbo 12H', duration: '12 hours', lockMinutes: 720, dailyReturnPct: 40, minAmount: 1000, badge: 'Safe' },
];

// Active session card with fast ticking profits
const ActiveFlywheelCard = ({ session, onCancelled }: { session: FlywheelSession; onCancelled: () => void }) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Fast tick every 100ms for rapid profit display
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(interval);
  }, []);

  const startedAt = new Date(session.started_at).getTime();
  const endsAt = new Date(session.ends_at).getTime();
  const totalDurationMs = endsAt - startedAt;
  const elapsedMs = Math.max(0, Math.min(now - startedAt, totalDurationMs));
  const progressPct = totalDurationMs > 0 ? (elapsedMs / totalDurationMs) * 100 : 0;
  const isCompleted = now >= endsAt;

  // Calculate earnings (daily_return_pct is high, so profits build fast)
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const currentEarnings = session.staked_amount * (session.daily_return_pct / 100) * elapsedDays;
  const currentTotal = session.staked_amount + currentEarnings;

  // Time remaining
  const remainingMs = Math.max(0, endsAt - now);
  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const { error } = await supabase.rpc('cancel_staking', { _session_id: session.id });
      if (error) throw error;
      toast({ title: 'Flywheel stopped', description: 'Your funds + profits have been returned to your balance.' });
      onCancelled();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to stop bot', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  }, [session.id, onCancelled, toast]);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <ArrowDownUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{session.plan_name}</p>
              <p className="text-[10px] text-muted-foreground">Flywheel • {session.daily_return_pct}% daily rate</p>
            </div>
          </div>
          <Badge className={isCompleted ? 'bg-success/15 text-success border-0' : 'bg-primary/15 text-primary border-0'}>
            {isCompleted ? 'Done' : 'Trading'}
          </Badge>
        </div>

        {/* Live profit counter */}
        <div className="bg-card/80 border border-border/30 rounded-xl p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Live Value</p>
          <p className="text-2xl font-bold font-display text-foreground tabular-nums">
            ${fmt(currentTotal, 4)}
          </p>
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-success" />
            <p className="text-xs text-success font-semibold tabular-nums">
              +${fmt(currentEarnings, 6)} profit
            </p>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Trading progress</span>
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
            <p className="text-xs font-bold text-foreground">
              ${fmt(session.staked_amount)}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Est. Final</p>
            <p className="text-xs font-bold text-success">
              ${fmt(session.staked_amount + session.staked_amount * (session.daily_return_pct / 100) * session.lock_days)}
            </p>
          </div>
        </div>

        {/* Stop button */}
        {!isCompleted && session.status === 'active' && (
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleCancel}
            disabled={cancelling}
          >
            <X className="h-4 w-4 mr-1.5" />
            {cancelling ? 'Stopping…' : 'Stop Bot & Collect'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export const FlywheelBot = ({ onBack }: FlywheelBotProps) => {
  const { user } = useAuth();
  const { balance, refetchBalance } = useUserData();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const [activeSessions, setActiveSessions] = useState<FlywheelSession[]>([]);
  const [confirmPlan, setConfirmPlan] = useState<typeof FLYWHEEL_PLANS[0] | null>(null);
  const [activeSessions, setActiveSessions] = useState<FlywheelSession[]>([]);

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
      toast({ title: 'Minimum not met', description: `Minimum is $${plan.minAmount}`, variant: 'destructive' });
      return;
    }
    if (amountNum > balance) {
      toast({ title: 'Insufficient balance', description: `Your balance is $${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, variant: 'destructive' });
      return;
    }

    setIsStarting(true);
    try {
      const { error } = await supabase.rpc('start_flywheel', {
        _plan_name: plan.name,
        _amount: amountNum,
        _daily_return_pct: plan.dailyReturnPct,
        _lock_minutes: plan.lockMinutes,
      });
      if (error) throw error;
      toast({ title: 'Flywheel started! 🚀', description: `$${amountNum.toLocaleString()} deployed on ${plan.name}` });
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
            Maximize with dual crypto cycling. Deploy USDT, watch profits build up <span className="text-primary font-semibold">in real-time</span>.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /><span>Fast returns</span></div>
            <div className="flex items-center gap-1"><TrendingUp className="h-3.5 w-3.5 text-success" /><span>Auto-compound</span></div>
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
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Trades</h3>
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
                    <p className="text-xs font-bold text-foreground">${plan.minAmount}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Rate</p>
                    <p className="text-xs font-bold text-primary">{plan.dailyReturnPct}%/day</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Est. Profit</p>
                    <p className="text-xs font-bold text-success">+${estProfit.toFixed(2)}</p>
                  </div>
                </div>

                {isSelected ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Amount (USDT)</label>
                      <Input
                        type="number"
                        placeholder={`Min $${plan.minAmount}`}
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
                        {isStarting ? 'Starting…' : `Deploy $${amount || plan.minAmount}`}
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
    </div>
  );
};
