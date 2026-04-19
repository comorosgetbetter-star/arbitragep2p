import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { BotTradingView } from '@/components/BotTradingView';
import { FlywheelBot } from '@/components/FlywheelBot';
import { BotsSkeleton } from '@/components/skeletons/BotsSkeleton';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

import botFlywheelImg from '@/assets/bot-flywheel.png';
import botFuturesDcaImg from '@/assets/bot-futures-dca.png';
import botFuturesGridImg from '@/assets/bot-futures-grid.png';
import botSpotDcaImg from '@/assets/bot-spot-dca.png';
import botSignalImg from '@/assets/bot-signal.png';

interface BotItem {
  id: string;
  name: string;
  description: string;
  image: string;
  badge?: string;
  badgeVariant?: 'hot' | 'new' | 'free';
  stats: { label: string; value: string }[];
  subscriptionCost?: number;
}

const bots: BotItem[] = [
  {
    id: 'flywheel',
    name: 'Flywheel AI',
    description: '5 free trades/day · Instant market execution · Real-time win/loss tracking.',
    image: botFlywheelImg,
    badge: '5 Free Trades/Day',
    badgeVariant: 'free',
    stats: [
      { label: 'Trades/Day', value: '5' },
      { label: 'Execution', value: 'Instant' },
      { label: 'Risk', value: 'Very Low' },
    ],
  },
  {
    id: 'futures-dca',
    name: 'Futures DCA',
    description: '25 trades/day · Dollar-cost averaging with staged entries · Futures markets.',
    image: botFuturesDcaImg,
    subscriptionCost: 300,
    stats: [
      { label: 'Trades/Day', value: '25' },
      { label: 'Strategy', value: 'DCA' },
      { label: 'Risk', value: 'Very Low' },
    ],
  },
  {
    id: 'futures-grid',
    name: 'Futures Grid',
    description: '35 trades/day · Automated grid orders · Profit from market volatility.',
    image: botFuturesGridImg,
    badge: 'New',
    badgeVariant: 'new',
    subscriptionCost: 500,
    stats: [
      { label: 'Trades/Day', value: '35' },
      { label: 'Strategy', value: 'Grid' },
      { label: 'Risk', value: 'Very Low' },
    ],
  },
  {
    id: 'spot-dca',
    name: 'Spot DCA',
    description: '45 trades/day · Indicator-triggered accumulation · Long-term spot growth.',
    image: botSpotDcaImg,
    subscriptionCost: 700,
    stats: [
      { label: 'Trades/Day', value: '45' },
      { label: 'Strategy', value: 'DCA' },
      { label: 'Risk', value: 'Very Low' },
    ],
  },
  {
    id: 'signal-bot',
    name: 'Signal Bot',
    description: '70 trades/day · Low-latency market signals · Multi-asset execution.',
    image: botSignalImg,
    subscriptionCost: 1000,
    stats: [
      { label: 'Trades/Day', value: '70' },
      { label: 'Latency', value: '<50ms' },
      { label: 'Risk', value: 'Very Low' },
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
    if (bot.id === 'flywheel') {
      setShowFlywheel(true);
      return;
    }
    if (subscriptions.includes(bot.id)) {
      setActiveBot(bot);
      return;
    }
    if (balance < (bot.subscriptionCost || 0)) {
      setLowBalanceBot(bot);
      return;
    }
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
        <span className="text-lg font-bold text-foreground tracking-normal">
          {balance
            .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            .replace(/\s*([,.])\s*/g, '$1')
            .replace(/\s+/g, '')}
          <span className="text-sm text-muted-foreground ml-1.5 font-normal">USDT</span>
        </span>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Trade AI</span>
        <span className="text-xs text-muted-foreground font-medium">{bots.length} available</span>
      </div>

      <div className="space-y-3">
        {bots.map((bot) => {
          const isSubscribed = subscriptions.includes(bot.id);
          const isFree = bot.id === 'flywheel';

          return (
            <div
              key={bot.id}
              className="w-full bg-card border border-border/40 rounded-2xl p-5 hover:border-primary/30 hover:shadow-[0_0_24px_hsl(var(--primary)/0.08)] transition-all text-left group relative overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="flex items-start gap-4">
                {/* Bot icon */}
                <div className="w-14 h-14 rounded-2xl bg-secondary/60 flex items-center justify-center shrink-0 border border-border/30 overflow-hidden">
                  <img
                    src={bot.image}
                    alt={bot.name}
                    className="w-10 h-10 object-contain"
                    loading="lazy"
                    width={40}
                    height={40}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Name + badges */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-base font-bold text-foreground tracking-tight">{bot.name}</span>
                    {isFree && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                        Free
                      </span>
                    )}
                    {!isFree && bot.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        bot.badgeVariant === 'hot' 
                          ? 'bg-destructive/10 text-destructive border-destructive/20' 
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {bot.badge}
                      </span>
                    )}
                    {isSubscribed && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/20 flex items-center gap-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-foreground/70 leading-relaxed mb-3">{bot.description}</p>

                  {/* Stats row */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    {bot.stats.map((stat) => (
                      <div key={stat.label} className="bg-secondary/50 rounded-lg px-2.5 py-1 text-center">
                        <span className="text-[11px] text-muted-foreground">{stat.label} </span>
                        <span className="text-[11px] font-bold font-mono text-foreground">{stat.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action row */}
                  <div className="flex items-center gap-2">
                    {isFree ? (
                      <button
                        onClick={() => handleBotClick(bot)}
                        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Open
                      </button>
                    ) : isSubscribed ? (
                      <button
                        onClick={() => handleBotClick(bot)}
                        className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        Open
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBotClick(bot)}
                        className="px-5 py-2 rounded-xl bg-primary/10 text-primary text-sm font-semibold border border-primary/20 hover:bg-primary/20 transition-colors flex items-center gap-1.5"
                      >
                        Subscribe · ${bot.subscriptionCost?.toLocaleString()}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
                <span className="font-mono text-foreground">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/\s/g, '')} USDT</span>
              </div>
              <div className="border-t border-border/40 pt-2 flex justify-between text-sm">
                <span className="text-muted-foreground">After Subscription</span>
                <span className="font-mono font-bold text-foreground">
                  {(balance - (confirmBot?.subscriptionCost || 0)).toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/\s/g, '')} USDT
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
              You need <span className="font-bold text-foreground">${lowBalanceBot?.subscriptionCost?.toLocaleString()} USDT</span> to subscribe to {lowBalanceBot?.name}. Your current balance is <span className="font-bold text-foreground">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 }).replace(/\s/g, '')} USDT</span>.
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
