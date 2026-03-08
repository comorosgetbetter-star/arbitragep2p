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
    <nav className="fixed bottom-0 left-0 right-0 z-[9999] bg-card border-t border-border/50 backdrop-blur-xl safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto pl-2 pr-20">
        {tabs.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
