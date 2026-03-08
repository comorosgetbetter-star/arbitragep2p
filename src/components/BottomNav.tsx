import { Home, BarChart3, ArrowLeftRight, Compass, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BottomNavTab = 'home' | 'markets' | 'trade' | 'explore' | 'assets';

interface BottomNavProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
}

const tabs: { id: BottomNavTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'markets', label: 'Markets', icon: BarChart3 },
  { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'assets', label: 'Assets', icon: Wallet },
];

export const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border/50 backdrop-blur-xl safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          const isCenter = id === 'trade';

          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isCenter ? (
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center -mt-3 mb-0.5',
                  isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                )}>
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <Icon className="h-5 w-5" />
              )}
              <span className={cn(
                'text-[10px] font-medium',
                isCenter && '-mt-0.5'
              )}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
