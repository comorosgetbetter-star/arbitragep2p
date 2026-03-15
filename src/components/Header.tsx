import { useState } from 'react';
import { Menu, X, Sun, Moon, Home, BarChart3, ArrowLeftRight, Compass, Wallet as WalletIcon2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AccountDropdown } from './AccountDropdown';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type NavTab = 'home' | 'markets' | 'trade' | 'explore' | 'assets';

const desktopTabs: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'markets', label: 'Markets', icon: BarChart3 },
  { id: 'trade', label: 'Trade', icon: ArrowLeftRight },
  { id: 'explore', label: 'Explore', icon: Compass },
  { id: 'assets', label: 'Assets', icon: WalletIcon2 },
];

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
}

export const Header = ({ isDark, toggleTheme, activeTab = 'home', onTabChange }: HeaderProps) => {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-b border-border/40">
      <div className="container mx-auto px-4 h-12 md:h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer shrink-0 mr-6" onClick={() => { onTabChange?.('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <img src="/logo.png" alt="PeerBitX" className="w-7 h-7 md:w-8 md:h-8 rounded-md" />
          <span className="font-semibold text-sm md:text-base text-foreground whitespace-nowrap">Peer<span className="text-primary">BitX</span></span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {desktopTabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onTabChange?.(id)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors rounded',
                activeTab === id
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:flex h-8 w-8">
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <AccountDropdown />

          <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-card border-t border-border/40">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-2">
            <Button variant="ghost" size="sm" onClick={toggleTheme} className="justify-start gap-2 text-sm">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};
