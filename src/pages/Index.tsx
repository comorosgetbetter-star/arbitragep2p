import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PortfolioCard } from '@/components/PortfolioCard';
import { CryptoGrid } from '@/components/CryptoGrid';
import { DepositCrypto } from '@/components/DepositCrypto';
import { ExpressP2P } from '@/components/ExpressP2P';
import { P2POrders } from '@/components/P2POrders';
import { WhyUsdt } from '@/components/WhyUsdt';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Download, Zap, ShoppingBag, ArrowLeft } from 'lucide-react';

type ActiveSection = 'home' | 'deposit' | 'express' | 'p2p';

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const btnClass = (section: ActiveSection) =>
    `h-12 rounded-xl text-sm font-semibold transition-all ${
      activeSection === section
        ? 'bg-[hsl(80,85%,55%)] hover:bg-[hsl(80,85%,48%)] text-[hsl(0,0%,6%)]'
        : 'bg-card border border-border text-foreground hover:border-primary/40'
    }`;

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Header isDark={isDark} toggleTheme={toggleTheme} />

      <main className="relative z-10 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-lg">
          <PortfolioCard />

          {/* 3 Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Button
              className={btnClass('deposit')}
              onClick={() => setActiveSection(activeSection === 'deposit' ? 'home' : 'deposit')}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Deposit
            </Button>
            <Button
              className={btnClass('express')}
              onClick={() => setActiveSection(activeSection === 'express' ? 'home' : 'express')}
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Express
            </Button>
            <Button
              className={btnClass('p2p')}
              onClick={() => setActiveSection(activeSection === 'p2p' ? 'home' : 'p2p')}
            >
              <ShoppingBag className="h-4 w-4 mr-1.5" />
              P2P
            </Button>
          </div>

          {/* Content */}
          <div className="mt-6">
            {activeSection !== 'home' && (
              <button
                onClick={() => setActiveSection('home')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            )}
            {activeSection === 'home' && <CryptoGrid />}
            {activeSection === 'deposit' && <DepositCrypto />}
            {activeSection === 'express' && <ExpressP2P />}
            {activeSection === 'p2p' && <P2POrders />}
          </div>
        </div>

        {/* Why USDT & FAQ - always visible below */}
        <div className="container mx-auto px-4 max-w-lg">
          <div id="why-usdt">
            <WhyUsdt />
          </div>
        </div>
        <FAQ />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
