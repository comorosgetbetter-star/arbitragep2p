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
  badgeColor?: string;
  stats: { label: string; value: string }[];
}

const bots: BotItem[] = [
  {
    id: 'flywheel',
    name: 'Flywheel',
    description: 'Automated cycle trading with real-time win/loss tracking.',
    icon: <ArrowDownUp className="h-5 w-5" />,
    badge: 'Hot',
    badgeColor: 'bg-destructive/15 text-destructive',
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
    badgeColor: 'bg-primary/15 text-primary',
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
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-7 w-7 text-primary" />
        </div>
        <p className="text-foreground font-display font-bold text-lg mb-1">Sign in to continue</p>
        <p className="text-muted-foreground text-sm mb-4 text-center">Log in to use trading bots</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
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
    <div className="space-y-5">
      {/* Balance strip */}
      <div className="flex items-center justify-between bg-card border border-border/40 rounded-xl px-4 py-3">
        <span className="text-xs text-muted-foreground tracking-wide">Available</span>
        <span className="text-base font-mono font-semibold text-foreground">
          ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          <span className="text-xs text-muted-foreground ml-1.5 font-sans font-normal">USDT</span>
        </span>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-display font-semibold text-foreground tracking-tight">Trading Bots</h3>
        <span className="text-[11px] text-muted-foreground">{bots.length} available</span>
      </div>

      <div className="space-y-2.5">
        {bots.map((bot) => (
          <button
            key={bot.id}
            onClick={() => handleBotClick(bot)}
            className="w-full bg-card border border-border/40 rounded-xl p-3.5 hover:border-border/70 hover:bg-card/80 transition-all text-left group"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 text-foreground/80 group-hover:text-foreground transition-colors">
                {bot.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-semibold text-foreground tracking-tight">{bot.name}</span>
                  {bot.badge && (
                    <Badge className={`${bot.badgeColor} text-[9px] px-1.5 py-0 h-4 border-0 font-bold uppercase tracking-wider`}>
                      {bot.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{bot.description}</p>
                <div className="flex gap-3">
                  {bot.stats.map((stat) => (
                    <div key={stat.label} className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{stat.label}</span>
                      <span className="text-[10px] font-mono font-semibold text-foreground/80">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1 group-hover:text-muted-foreground transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
