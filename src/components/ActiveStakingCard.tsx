import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, X, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StakingSession {
  id: string;
  plan_name: string;
  staked_amount: number;
  daily_return_pct: number;
  lock_days: number;
  started_at: string;
  ends_at: string;
  status: string;
}

interface ActiveStakingCardProps {
  session: StakingSession;
  onCancelled: () => void;
}

export const ActiveStakingCard = ({ session, onCancelled }: ActiveStakingCardProps) => {
  const { toast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Tick every second for real-time earnings
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

  // Calculate earnings based on elapsed time (continuous compounding per second)
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);
  const currentEarnings = session.staked_amount * (session.daily_return_pct / 100) * elapsedDays;
  const currentTotal = session.staked_amount + currentEarnings;

  // Time remaining
  const remainingMs = Math.max(0, endsAt - now);
  const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const { error } = await supabase.rpc('cancel_staking', { _session_id: session.id });
      if (error) throw error;
      toast({ title: 'Staking cancelled', description: 'Your principal has been returned to your balance.' });
      onCancelled();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to cancel staking', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  }, [session.id, onCancelled, toast]);

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-card overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{session.plan_name}</p>
              <p className="text-[10px] text-muted-foreground">{session.lock_days}-day lock • {session.daily_return_pct}% daily</p>
            </div>
          </div>
          <Badge className={isCompleted ? 'bg-success/15 text-success border-0' : 'bg-primary/15 text-primary border-0'}>
            {isCompleted ? 'Completed' : 'Active'}
          </Badge>
        </div>

        {/* Earnings display */}
        <div className="bg-card/80 border border-border/30 rounded-xl p-3 space-y-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Value</p>
          <p className="text-2xl font-bold font-display text-foreground">
            ${currentTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-success font-semibold">
            +${currentEarnings.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })} earned
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>Progress</span>
            <span>{progressPct.toFixed(1)}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        {/* Time remaining */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {isCompleted ? (
            <span className="text-success font-medium">Staking period complete!</span>
          ) : (
            <span>
              {remainingDays}d {remainingHours}h {remainingMinutes}m {remainingSeconds}s remaining
            </span>
          )}
        </div>

        {/* Staked amount info */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Staked</p>
            <p className="text-xs font-bold text-foreground">
              ${session.staked_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2 text-center">
            <p className="text-[10px] text-muted-foreground">Est. Total ({session.lock_days}d)</p>
            <p className="text-xs font-bold text-success">
              ${(session.staked_amount + session.staked_amount * (session.daily_return_pct / 100) * session.lock_days).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Cancel button */}
        {!isCompleted && session.status === 'active' && (
          <Button
            variant="outline"
            className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
            onClick={handleCancel}
            disabled={cancelling}
          >
            <X className="h-4 w-4 mr-1.5" />
            {cancelling ? 'Cancelling…' : 'Cancel Staking'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
