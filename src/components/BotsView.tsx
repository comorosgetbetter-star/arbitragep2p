import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, ArrowDownUp, DollarSign, TrendingUp, RefreshCw, Signal } from 'lucide-react';

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
  return (
    <div className="space-y-3">
      <h3 className="text-base font-display font-bold text-foreground">Popular bots</h3>
      <div className="space-y-1">
        {bots.map((bot) => (
          <button
            key={bot.id}
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
