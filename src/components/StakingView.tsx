import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, TrendingUp, TrendingDown, Clock, Shield, ChevronRight, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface StakingPlan {
  id: string;
  name: string;
  minAmount: number;
  dailyReturn: number;
  lockDays: number;
  badge: string;
}

const stakingPlans: StakingPlan[] = [
  { id: 'starter', name: 'Starter', minAmount: 500, dailyReturn: 10, lockDays: 7, badge: 'Popular' },
  { id: 'growth', name: 'Growth', minAmount: 1000, dailyReturn: 10, lockDays: 14, badge: 'Best Value' },
  { id: 'premium', name: 'Premium', minAmount: 5000, dailyReturn: 10, lockDays: 30, badge: 'High Yield' },
  { id: 'elite', name: 'Elite', minAmount: 10000, dailyReturn: 10, lockDays: 60, badge: 'VIP' },
];

export const StakingView = () => {
  const { user } = useAuth();
  const { balance } = useUserData();
  const { prices } = useCryptoPrices();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [stakeAmount, setStakeAmount] = useState('');

  const handleStake = (plan: StakingPlan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const amount = parseFloat(stakeAmount || String(plan.minAmount));

    if (amount < plan.minAmount) {
      toast({
        title: 'Minimum not met',
        description: `Minimum stake for ${plan.name} is $${plan.minAmount.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    if (amount > balance) {
      toast({
        title: 'Insufficient balance',
        description: `Your balance is $${balance.toFixed(2)}. Please deposit more funds.`,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Staking coming soon',
      description: `${plan.name} plan staking will be available shortly.`,
    });
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
            Earn <span className="text-primary font-semibold">10% daily</span> on your staked crypto. Lock your assets and watch them grow.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-success" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-warning" />
              <span>Auto-compound</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span>Instant rewards</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Balance Info */}
      {user && (
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Available Balance</p>
              <p className="text-xl font-bold font-display text-foreground">${balance.toFixed(2)}</p>
            </div>
            <Badge variant="outline" className="text-success border-success/30 bg-success/10">
              10% Daily
            </Badge>
          </CardContent>
        </Card>
      )}

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
              className={`border transition-all cursor-pointer ${
                isSelected
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/50 hover:border-border'
              }`}
              onClick={() => {
                setSelectedPlan(isSelected ? null : plan.id);
                setStakeAmount(String(plan.minAmount));
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
                      <Lock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.lockDays}-day lock</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-primary/15 text-primary border-0 text-[10px]">
                      {plan.badge}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Min Stake</p>
                    <p className="text-xs font-bold text-foreground">${plan.minAmount.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Daily</p>
                    <p className="text-xs font-bold text-success">+${dailyEarning.toLocaleString()}</p>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-2">
                    <p className="text-[10px] text-muted-foreground">Total ({plan.lockDays}d)</p>
                    <p className="text-xs font-bold text-success">+${totalReturn.toLocaleString()}</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="space-y-3 pt-2 border-t border-border/30">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Stake Amount (USD)</label>
                      <input
                        type="number"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        min={plan.minAmount}
                        className="w-full h-10 rounded-lg bg-input border border-border px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder={`Min $${plan.minAmount.toLocaleString()}`}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>

                    {stakeAmount && parseFloat(stakeAmount) >= plan.minAmount && (
                      <div className="bg-success/5 border border-success/20 rounded-lg p-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">Estimated daily earnings</span>
                          <span className="text-success font-semibold">
                            +${(parseFloat(stakeAmount) * 0.1).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Total after {plan.lockDays} days</span>
                          <span className="text-success font-semibold">
                            ${(parseFloat(stakeAmount) + parseFloat(stakeAmount) * 0.1 * plan.lockDays).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full h-11"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStake(plan);
                      }}
                    >
                      <Lock className="h-4 w-4 mr-1.5" />
                      Stake Now
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] text-muted-foreground text-center px-4 pb-4">
        Staking rewards are subject to market conditions. Past performance does not guarantee future results. Staked assets are locked for the selected duration.
      </p>
    </div>
  );
};
