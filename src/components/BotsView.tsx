import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowDownUp, DollarSign, TrendingUp, RefreshCw, Signal, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { BotTradingView } from '@/components/BotTradingView';
import { FlywheelBot } from '@/components/FlywheelBot';
import { BotsSkeleton } from '@/components/skeletons/BotsSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface BotItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'hot' | 'new' | 'free';
  stats: { label: string; value: string }[];
  subscriptionCost?: number;
}

const bots: BotItem[] = [
  {
    id: 'flywheel',
    name: 'Flywheel AI',
    description: 'Automated cycle trading with real-time win/loss tracking.',
    icon: <ArrowDownUp className="h-5 w-5" />,
    badge: '10 Free Runs/Day',
    badgeVariant: 'free',
    stats: [
      { label: 'Win Rate', value: '~70%' },
      { label: 'Min', value: '$100' },
      { label: 'Cycles', value: '1-10m' },
    ],
  },
  {
    id: 'futures-dca',
    name: 'Futures DCA',
    description: 'Dollar-cost average into positions with staged entries.',
    icon: <DollarSign className="h-5 w-5" />,
    subscriptionCost: 300,
    stats: [
      { label: 'Strategy', value: 'DCA' },
      { label: 'Risk', value: 'Med' },
      { label: 'Type', value: 'Futures' },
    ],
  },
  {
    id: 'futures-grid',
    name: 'Futures Grid',
    description: 'Profit from volatility with automated grid orders.',
    icon: <TrendingUp className="h-5 w-5" />,
    badge: 'New',
    badgeVariant: 'new',
    subscriptionCost: 500,
    stats: [
      { label: 'Strategy', value: 'Grid' },
      { label: 'Risk', value: 'High' },
      { label: 'Type', value: 'Futures' },
    ],
  },
  {
    id: 'spot-dca',
    name: 'Spot DCA',
    description: 'Indicator-triggered accumulation for long-term growth.',
    icon: <RefreshCw className="h-5 w-5" />,
    subscriptionCost: 700,
    stats: [
      { label: 'Strategy', value: 'DCA' },
      { label: 'Risk', value: 'Low' },
      { label: 'Type', value: 'Spot' },
    ],
  },
  {
    id: 'signal-bot',
    name: 'Signal Bot',
    description: 'Execute trades from low-latency market signals.',
    icon: <Signal className="h-5 w-5" />,
    subscriptionCost: 1000,
    stats: [
      { label: 'Latency', value: '<50ms' },
      { label: 'Risk', value: 'Med' },
      { label: 'Type', value: 'Multi' },
    ],
  },
];

export const BotsView = () => {
  const { user, loading } = useAuth();
  const { balance, isLoading: dataLoading, refetchBalance } = useUserData();
  const navigate = useNavigate();
  const [activeBot, setActiveBot] = useState<BotItem | null>(null);
  const [showFlywheel, setShowFlywheel] = useState(false);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [confirmBot, setConfirmBot] = useState<BotItem | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [lowBalanceBot, setLowBalanceBot] = useState<BotItem | null>(null);

  // Fetch user's bot subscriptions
  useEffect(() => {
    if (!user) {
      setSubscriptions([]);
      setSubsLoading(false);
      return;
    }
    setSubsLoading(true);
    supabase
      .from('bot_subscriptions' as any)
      .select('bot_id')
      .eq('user_id', user.id)
      .then(({ data }) => {
        if (data) setSubscriptions((data as any[]).map((d: any) => d.bot_id));
        setSubsLoading(false);
      });
  }, [user]);

  if (loading || (user && (dataLoading || subsLoading))) {
    return <BotsSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mb-3">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-foreground font-semibold text-base mb-1">Sign in to continue</p>
        <p className="text-muted-foreground text-sm mb-4 text-center">Log in to use trading bots</p>
        <button onClick={() => navigate('/login')} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          Sign In
        </button>
      </div>
    );
  }

  if (showFlywheel) {
    return <FlywheelBot onBack={() => setShowFlywheel(false)} />;
  }

  if (activeBot) {
    return (
      <BotTradingView
        botName={activeBot.name}
        botId={activeBot.id}
        onBack={() => setActiveBot(null)}
      />
    );
  }

  const handleBotClick = (bot: BotItem) => {
    // Flywheel is free
    if (bot.id === 'flywheel') {
      setShowFlywheel(true);
      return;
    }

    // If already subscribed, open the bot
    if (subscriptions.includes(bot.id)) {
      setActiveBot(bot);
      return;
    }

    // Check balance
    if (balance < (bot.subscriptionCost || 0)) {
      setLowBalanceBot(bot);
      return;
    }

    // Show confirmation
    setConfirmBot(bot);
  };

  const handleSubscribe = async () => {
    if (!confirmBot || !confirmBot.subscriptionCost) return;
    setSubscribing(true);
    try {
      const { error } = await supabase.rpc('subscribe_to_bot', {
        _bot_id: confirmBot.id,
        _cost: confirmBot.subscriptionCost,
      });
      if (error) throw error;
      setSubscriptions(prev => [...prev, confirmBot.id]);
      await refetchBalance();
      toast({
        title: 'Subscription Activated',
        description: `You've successfully subscribed to ${confirmBot.name}.`,
      });
      setConfirmBot(null);
      // Open the bot immediately
      setActiveBot(confirmBot);
    } catch (err: any) {
      toast({
        title: 'Subscription Failed',
        description: err.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Balance */}
      <div className="flex items-center justify-between bg-card rounded-2xl px-5 py-4 border border-border/40">
        <span className="text-sm text-muted-foreground font-medium">Available Balance</span>
        <span className="text-lg font-mono font-bold text-foreground tabular-nums">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-sm text-muted-foreground ml-1.5 font-sans font-normal">USDT</span>
        </span>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Trading Bots</span>
        <span className="text-xs text-muted-foreground font-medium">{bots.length} available</span>
      </div>

      <div className="space-y-3">
        {bots.map((bot) => {
          const isSubscribed = subscriptions.includes(bot.id);
          const isFree = bot.id === 'flywheel';

          return (
            <button
              key={bot.id}
              onClick={() => handleBotClick(bot)}
              className="w-full bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/30 hover:shadow-[0_0_20px_hsl(var(--primary)/0.06)] transition-all text-left group relative overflow-hidden"
            >
              {/* Hover accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary border border-primary/15 group-hover:bg-primary/15 transition-colors">
                  {bot.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-lg font-bold text-foreground tracking-tight">{bot.name}</span>
                    {isFree && (
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        10 Free Runs/Day
                      </span>
                    )}
                    {!isFree && bot.badge && (
                      <span className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                        bot.badgeVariant === 'hot' 
                          ? 'bg-destructive/10 text-destructive border-destructive/20' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {bot.badge}
                      </span>
                    )}
                    {isSubscribed && (
                      <span className="text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-500 border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">{bot.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {bot.stats.map((stat) => (
                      <div key={stat.label} className="bg-secondary/50 rounded-lg px-3 py-1.5 text-center">
                        <span className="text-xs text-muted-foreground">{stat.label} </span>
                        <span className="text-xs font-bold font-mono text-foreground">{stat.value}</span>
                      </div>
                    ))}
                    {bot.subscriptionCost && !isSubscribed && (
                      <div className="bg-primary/10 rounded-lg px-3 py-1.5 text-center border border-primary/20">
                        <span className="text-xs text-primary font-bold font-mono">${bot.subscriptionCost.toLocaleString()}</span>
                        <span className="text-xs text-primary/70 ml-1">to unlock</span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/30 shrink-0 group-hover:text-primary mt-1 transition-colors" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Subscription Confirmation Dialog */}
      <Dialog open={!!confirmBot} onOpenChange={() => setConfirmBot(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Activate {confirmBot?.name}</DialogTitle>
            <DialogDescription className="text-center">
              Subscribe to unlock full access to {confirmBot?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subscription Fee</span>
                <span className="font-bold font-mono text-foreground">${confirmBot?.subscriptionCost?.toLocaleString()} USDT</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Your Balance</span>
                <span className="font-mono text-foreground">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="border-t border-border/40 pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">After Subscription</span>
                <span className="font-mono font-bold text-foreground">
                  {(balance - (confirmBot?.subscriptionCost || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmBot(null)} disabled={subscribing}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleSubscribe} disabled={subscribing}>
                {subscribing ? 'Processing...' : 'Confirm & Subscribe'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Low Balance Dialog */}
      <Dialog open={!!lowBalanceBot} onOpenChange={() => setLowBalanceBot(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Insufficient Balance
            </DialogTitle>
            <DialogDescription className="text-center">
              You need <span className="font-bold text-foreground">${lowBalanceBot?.subscriptionCost?.toLocaleString()} USDT</span> to subscribe to {lowBalanceBot?.name}. Your current balance is <span className="font-bold text-foreground">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setLowBalanceBot(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={() => { setLowBalanceBot(null); navigate('/'); }}>
              Add Balance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
