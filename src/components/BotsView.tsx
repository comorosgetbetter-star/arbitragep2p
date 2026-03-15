import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ArrowDownUp, DollarSign, TrendingUp, RefreshCw, Signal, Lock } from 'lucide-react';
import { useUserData } from '@/contexts/UserDataContext';
import { useAuth } from '@/contexts/AuthContext';
import { BotTradingView } from '@/components/BotTradingView';
import { FlywheelBot } from '@/components/FlywheelBot';
import { BotsSkeleton } from '@/components/skeletons/BotsSkeleton';

interface BotItem {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
  badgeVariant?: 'hot' | 'new';
  stats: { label: string; value: string }[];
}

const bots: BotItem[] = [
  {
    id: 'flywheel',
    name: 'Flywheel',
    description: 'Automated cycle trading with real-time win/loss tracking.',
    icon: <ArrowDownUp className="h-5 w-5" />,
    badge: 'Hot',
    badgeVariant: 'hot',
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
    stats: [
      { label: 'Latency', value: '<50ms' },
      { label: 'Risk', value: 'Med' },
      { label: 'Type', value: 'Multi' },
    ],
  },
];

export const BotsView = () => {
  const { user, loading } = useAuth();
  const { balance, isLoading: dataLoading } = useUserData();
  const navigate = useNavigate();
  const [activeBot, setActiveBot] = useState<BotItem | null>(null);
  const [showFlywheel, setShowFlywheel] = useState(false);

  if (loading || (user && dataLoading)) {
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
    setActiveBot(bot);
  };

  return (
    <div className="space-y-3">
      {/* Balance */}
      <div className="flex items-center justify-between bg-card rounded-lg px-4 py-3 border border-border/40">
        <span className="text-sm text-muted-foreground">Available</span>
        <span className="text-base font-mono font-medium text-foreground tabular-nums">
          {balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-sm text-muted-foreground ml-1 font-sans">USDT</span>
        </span>
      </div>

      <div className="flex items-center justify-between px-0.5">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Trading Bots</span>
        <span className="text-xs text-muted-foreground">{bots.length} available</span>
      </div>

      <div className="space-y-1">
        {bots.map((bot) => (
          <button
            key={bot.id}
            onClick={() => handleBotClick(bot)}
            className="w-full rounded-lg px-3.5 py-3.5 hover:bg-muted/40 transition-colors text-left group flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
              {bot.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-base font-medium text-foreground">{bot.name}</span>
                {bot.badge && (
                  <span className={`text-xs px-1.5 py-px rounded font-semibold uppercase tracking-wider ${
                    bot.badgeVariant === 'hot' 
                      ? 'bg-destructive/15 text-destructive' 
                      : 'bg-primary/15 text-primary'
                  }`}>
                    {bot.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-snug mb-1.5 line-clamp-1">{bot.description}</p>
              <div className="flex gap-3">
                {bot.stats.map((stat) => (
                  <span key={stat.label} className="text-xs text-muted-foreground">
                    {stat.label} <span className="font-mono text-foreground/70">{stat.value}</span>
                  </span>
                ))}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
};
