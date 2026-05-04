import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, TrendingUp, TrendingDown, Clock, Shield, ChevronRight, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { StakingConfirmModal } from '@/components/StakingConfirmModal';
import { ActiveStakingCard } from '@/components/ActiveStakingCard';
import { StakingSkeleton } from '@/components/skeletons/StakingSkeleton';
import { getCryptoLogo } from '@/lib/cryptoLogos';
import { featuredCryptoSymbols } from '@/lib/cryptoMarkets';

interface StakingPlan {
  id: string;
  name: string;
  minAmount: number;
  dailyReturn: number;
  lockDays: number;
  badge: string;
}

const stakingPlans: StakingPlan[] = [
  { id: 'starter', name: 'Starter', minAmount: 500, dailyReturn: 5, lockDays: 7, badge: 'Popular' },
  { id: 'growth', name: 'Growth', minAmount: 1000, dailyReturn: 5, lockDays: 14, badge: 'Best Value' },
  { id: 'premium', name: 'Premium', minAmount: 5000, dailyReturn: 5, lockDays: 30, badge: 'High Yield' },
  { id: 'elite', name: 'Elite', minAmount: 10000, dailyReturn: 5, lockDays: 60, badge: 'VIP' },
  { id: 'pro', name: 'Pro', minAmount: 15000, dailyReturn: 5, lockDays: 90, badge: 'Pro' },
  { id: 'whale', name: 'Whale', minAmount: 25000, dailyReturn: 5, lockDays: 120, badge: 'Whale 🐳' },
];

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

export const StakingView = () => {
  const { user, loading } = useAuth();
  const { balance, refetchBalance, isLoading: dataLoading } = useUserData();
  const { prices } = useCryptoPrices();
  const featuredPrices = prices.filter((crypto) => featuredCryptoSymbols.includes(crypto.symbol));
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ plan: StakingPlan; amount: number } | null>(null);
  const [isStaking, setIsStaking] = useState(false);
  const [activeSessions, setActiveSessions] = useState<StakingSession[]>([]);

  const fetchSessions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('staking_sessions')
      .select('id, plan_name, staked_amount, daily_return_pct, lock_days, started_at, ends_at, status')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('started_at', { ascending: false });
    if (data) setActiveSessions(data as StakingSession[]);
  }, [user]);

  useEffect(() => {
    fetchSessions();
    if (!user) return;
    const channel = supabase
      .channel(`staking-sessions-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'staking_sessions', filter: `user_id=eq.${user.id}` }, () => {
        fetchSessions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchSessions]);
  if (loading || (user && dataLoading)) {
    return <StakingSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <p className="text-foreground font-display font-bold text-lg mb-1">Sign in to continue</p>
        <p className="text-muted-foreground text-sm mb-4 text-center">Log in to start earning with crypto staking</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          Sign In
        </button>
      </div>
    );
  }

  const handleStakeClick = (plan: StakingPlan) => {
    if (!user) { navigate('/login'); return; }
    const amount = parseFloat(stakeAmount || String(plan.minAmount));
    if (amount < plan.minAmount) {
      toast({ title: 'Minimum not met', description: `Minimum stake for ${plan.name} is $${plan.minAmount.toLocaleString()}`, variant: 'destructive' });
      return;
    }
    if (amount > balance) {
      toast({ title: 'Insufficient balance', description: `Your balance is $${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}. Please deposit more funds.`, variant: 'destructive' });
      return;
    }
    setConfirmModal({ plan, amount });
  };

  const handleConfirmStake = async () => {
    if (!confirmModal || !user) return;
    setIsStaking(true);
    try {
      const { error } = await supabase.rpc('start_staking', {
        _plan_name: confirmModal.plan.name,
        _amount: confirmModal.amount,
        _daily_return_pct: confirmModal.plan.dailyReturn,
        _lock_days: confirmModal.plan.lockDays,
      });
      if (error) throw error;
      toast({ title: 'Staking started! 🎉', description: `$${confirmModal.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} staked on ${confirmModal.plan.name} plan.` });
      setConfirmModal(null);
      setSelectedPlan(null);
      setStakeAmount('');
      refetchBalance();
      fetchSessions();
    } catch (err: any) {
      toast({ title: 'Staking failed', description: err.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setIsStaking(false);
    }
  };

  const handleSessionCancelled = () => {
    refetchBalance();
    fetchSessions();
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card overflow-hidden relative">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-display font-bold text-foreground">Crypto Staking</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Earn <span className="text-primary font-semibold">5% daily</span> on your staked crypto. Lock your assets and watch them grow.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-success" /><span>Secure</span></div>
            <div className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-warning" /><span>Auto-compound</span></div>
            <div className="flex items-center gap-1"><Zap className="h-3.5 w-3.5 text-primary" /><span>Instant rewards</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Info */}
      {user && (
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-xl font-bold font-display text-foreground">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <Badge variant="outline" className="text-success border-success/30 bg-success/10">5% Daily</Badge>
          </CardContent>
        </Card>
      )}

      {/* Active Staking Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Active Stakes</h3>
          {activeSessions.map((session) => (
            <ActiveStakingCard key={session.id} session={session} onCancelled={handleSessionCancelled} />
          ))}
        </div>
      )}

      {/* Live Market Prices */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Live Markets</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
          {featuredPrices.map((crypto) => {
            const isUp = crypto.change24h >= 0;
            return (
              <div key={crypto.symbol} className="flex-shrink-0 bg-card border border-border/50 rounded-xl px-3.5 py-2.5 min-w-[120px]">
                <div className="flex items-center gap-1.5 mb-1">
                  <img src={getCryptoLogo(crypto.symbol)} alt={crypto.symbol} className="w-5 h-5 rounded-full" />
                  <span className="text-xs font-semibold text-foreground">{crypto.symbol}</span>
                </div>
                <p className="text-sm font-bold font-display text-foreground">
                  ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: crypto.price < 1 ? 4 : 2, maximumFractionDigits: crypto.price < 1 ? 4 : 2 })}
                </p>
                <span className={`text-[10px] font-medium ${isUp ? 'text-success' : 'text-destructive'}`}>
                  {isUp ? '+' : ''}{crypto.change24h.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
        <Card className="border-border/50 overflow-hidden">
          <div className="divide-y divide-border/30">
            {featuredPrices.map((crypto) => {
              const isUp = crypto.change24h >= 0;
              return (
                <div key={crypto.symbol} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img src={getCryptoLogo(crypto.symbol)} alt={crypto.symbol} className="w-9 h-9 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{crypto.symbol}<span className="text-muted-foreground font-normal">/USDT</span></p>
                      <p className="text-[11px] text-muted-foreground">{crypto.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-display text-foreground">
                      ${crypto.price.toLocaleString('en-US', { minimumFractionDigits: crypto.price < 1 ? 4 : 2, maximumFractionDigits: crypto.price < 1 ? 4 : 2 })}
                    </p>
                    <div className={`flex items-center justify-end gap-0.5 text-[11px] font-medium ${isUp ? 'text-success' : 'text-destructive'}`}>
                      {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      <span>{isUp ? '+' : ''}{crypto.change24h.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Staking Plans */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Staking Plans</h3>
        {stakingPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const dailyEarning = plan.minAmount * (plan.dailyReturn / 100);
          const totalReturn = dailyEarning * plan.lockDays;

          return (
            <Card
              key={plan.id}
              className={`border transition-all ${isSelected ? 'border-gold/50 bg-gold/5 ring-1 ring-gold/30' : 'border-border/50'}`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-gold/15 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.lockDays}-day lock</p>
                    </div>
                  </div>
                  <Badge className="bg-gold/15 text-gold border-0 text-[10px]">{plan.badge}</Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Stake Amount</p>
                    <p className="text-xs font-bold text-foreground">${plan.minAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Daily</p>
                    <p className="text-xs font-bold text-success">+${dailyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Total ({plan.lockDays}d)</p>
                    <p className="text-xs font-bold text-success">+${totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="bg-success/5 border border-success/20 rounded-lg p-3 mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Estimated daily earnings</span>
                      <span className="text-success font-semibold">
                        +${dailyEarning.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total after {plan.lockDays} days</span>
                      <span className="text-success font-semibold">
                        ${(plan.minAmount + totalReturn).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                {isSelected ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 h-11 font-semibold text-sm border-border/50 text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(null);
                        setStakeAmount('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-[2] h-11 font-semibold text-sm bg-gold hover:bg-gold/90 text-gold-foreground shadow-[0_0_16px_hsl(43_96%_56%/0.3)]"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStakeClick(plan);
                      }}
                    >
                      <Lock className="h-4 w-4 mr-1.5" />
                      Stake ${plan.minAmount.toLocaleString()} Now
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    className="w-full h-11 font-semibold text-sm bg-gold/15 hover:bg-gold/25 text-gold border border-gold/30"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!user) { navigate('/login'); return; }
                      setSelectedPlan(plan.id);
                      setStakeAmount(String(plan.minAmount));
                    }}
                  >
                    Select Plan
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-[10px] text-muted-foreground text-center px-4 pb-4">
        Staking rewards are subject to market conditions. Past performance does not guarantee future results. Staked assets are locked for the selected duration.
      </p>

      {/* Confirmation Modal */}
      {confirmModal && (
        <StakingConfirmModal
          open={!!confirmModal}
          onClose={() => setConfirmModal(null)}
          onConfirm={handleConfirmStake}
          planName={confirmModal.plan.name}
          amount={confirmModal.amount}
          dailyReturn={confirmModal.plan.dailyReturn}
          lockDays={confirmModal.plan.lockDays}
          isLoading={isStaking}
        />
      )}
    </div>
  );
};
