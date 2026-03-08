import { useState } from 'react';
import { Wallet, Menu, X, Sun, Moon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletDropdown } from './WalletDropdown';
import { AddFundsModal } from './AddFundsModal';
import { AccountDropdown } from './AccountDropdown';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
}

export const Header = ({ isDark, toggleTheme }: HeaderProps) => {
  const { user } = useAuth();
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAddFundsOpen, setIsAddFundsOpen] = useState(false);

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/30">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="PeerBitX" className="w-10 h-10 rounded-xl" />
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <button onClick={() => scrollTo('why-usdt')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              Why USDT
            </button>
            <button onClick={() => scrollTo('faq')} className="text-muted-foreground hover:text-foreground transition-colors text-sm">
              FAQ
            </button>
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
              <button onClick={() => scrollTo('why-usdt')} className="text-muted-foreground hover:text-foreground transition-colors py-2 text-left">
                Why USDT
              </button>
              <button onClick={() => scrollTo('faq')} className="text-muted-foreground hover:text-foreground transition-colors py-2 text-left">
                FAQ
              </button>
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
