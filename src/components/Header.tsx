import { useState } from 'react';
import { Wallet, Menu, X, Sun, Moon, Plus, Home, BarChart3, ArrowLeftRight, Compass, Wallet as WalletIcon2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletDropdown } from './WalletDropdown';
import { AddFundsModal } from './AddFundsModal';
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
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
        <div className="container mx-auto px-4 h-12 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => { onTabChange?.('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
            <img src="/logo.png" alt="PeerBitX" className="w-10 h-10 rounded-xl" />
          </div>

          {/* Desktop Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopTabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => onTabChange?.(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === id
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {user && (
              <Button
                variant="glow"
                size="sm"
                onClick={() => setIsAddFundsOpen(true)}
                className="hidden sm:flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Funds
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={toggleTheme} className="hidden sm:flex">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <AccountDropdown />

            {user && (
              <div className="relative">
                <Button
                  variant="glass"
                  size="default"
                  onClick={() => setIsWalletOpen(!isWalletOpen)}
                  className="flex items-center gap-2"
                >
                  <Wallet className="h-5 w-5" />
                  <span className="hidden sm:inline">Wallet</span>
                </Button>
                <WalletDropdown 
                  isOpen={isWalletOpen} 
                  onClose={() => setIsWalletOpen(false)}
                  onAddFunds={() => setIsAddFundsOpen(true)}
                />
              </div>
            )}

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden glass-card border-t border-border/30 animate-fade-in-up">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              {user && (
                <Button variant="glow" size="sm" onClick={() => { setIsMobileMenuOpen(false); setIsAddFundsOpen(true); }} className="justify-start gap-2">
                  <Plus className="h-4 w-4" />
                  Add Funds
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={toggleTheme} className="justify-start gap-2">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Button>
            </nav>
          </div>
        )}
      </header>

      <AddFundsModal isOpen={isAddFundsOpen} onClose={() => setIsAddFundsOpen(false)} />
    </>
  );
};
