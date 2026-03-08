import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ArrowDownUp, DollarSign, TrendingUp, RefreshCw, Signal, Wallet, Lock, Loader2 } from 'lucide-react';
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
}

const bots: BotItem[] = [
  {
    id: 'flywheel',
    name: 'Flywheel',
    description: 'Maximize with dual crypto. Buy low, sell high, and trade in cycles.',
    icon: <ArrowDownUp className="h-5 w-5 text-foreground" />,
    badge: 'Hot',
  },
  {
    id: 'futures-dca',
    name: 'Futures DCA',
    description: 'Enter low, exit high in stages.',
    icon: <DollarSign className="h-5 w-5 text-foreground" />,
  },
  {
    id: 'futures-grid',
    name: 'Futures Grid (Crypto-M)',
    description: 'Amplify your non-stablecoin returns with automated compounding.',
    icon: <TrendingUp className="h-5 w-5 text-foreground" />,
    badge: 'New',
  },
  {
    id: 'spot-dca',
    name: 'Spot DCA',
    description: 'Triggered by indicators, gradually grow your crypto holdings.',
    icon: <RefreshCw className="h-5 w-5 text-foreground" />,
  },
  {
    id: 'signal-bot',
    name: 'Signal Bot',
    description: 'Trade with low-latency signals automatically.',
    icon: <Signal className="h-5 w-5 text-foreground" />,
  },
];

export const BotsView = () => {
  const { user, loading } = useAuth();
  const { balance } = useUserData();
  const navigate = useNavigate();
  const [activeBot, setActiveBot] = useState<BotItem | null>(null);
  const [showFlywheel, setShowFlywheel] = useState(false);

  // Auth loading state
  if (loading) {
    return <BotsSkeleton />;
  }

  // Auth gate
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-primary" />
        </div>
        <p className="text-foreground font-display font-bold text-lg mb-1">Sign in to continue</p>
        <p className="text-muted-foreground text-sm mb-4 text-center">Log in to use trading bots</p>
        <button onClick={() => navigate('/login')} className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
          Sign In
        </button>
      </div>
    );
  }

  // Flywheel sub-view
  if (showFlywheel) {
    return <FlywheelBot onBack={() => setShowFlywheel(false)} />;
  }

  // Other bot sub-view
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
    <div className="space-y-4">
      {/* Balance card */}
      <div className="bg-card border border-border/50 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Wallet className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">Available Balance</p>
          <p className="text-xl font-display font-bold text-foreground">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      <h3 className="text-base font-display font-bold text-foreground">Popular bots</h3>
      <div className="space-y-1">
        {bots.map((bot) => (
          <button
            key={bot.id}
            onClick={() => handleBotClick(bot)}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-secondary/50 transition-colors text-left"
          >
            <div className="w-11 h-11 rounded-full bg-secondary border border-border/50 flex items-center justify-center shrink-0">
              {bot.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">{bot.name}</p>
                {bot.badge && (
                  <Badge className="bg-primary/90 text-primary-foreground text-[10px] px-1.5 py-0 h-4 border-0 font-semibold">
                    {bot.badge}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{bot.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};
