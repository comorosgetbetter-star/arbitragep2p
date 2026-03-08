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
import { BottomNav, BottomNavTab } from '@/components/BottomNav';
import { MarketsView } from '@/components/MarketsView';
import { StakingView } from '@/components/StakingView';
import { Button } from '@/components/ui/button';
import { Download, Zap, ShoppingBag, ArrowLeft } from 'lucide-react';

type ActiveSection = 'home' | 'deposit' | 'express' | 'p2p';

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [bottomTab, setBottomTab] = useState<BottomNavTab>('home');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleBottomTab = (tab: BottomNavTab) => {
    setBottomTab(tab);
    if (tab === 'home') {
      setActiveSection('home');
    }
  };

  const btnClass = (section: ActiveSection) =>
    `h-12 rounded-xl text-sm font-semibold transition-all ${
      activeSection === section
        ? 'bg-[hsl(80,85%,55%)] hover:bg-[hsl(80,85%,48%)] text-[hsl(0,0%,6%)]'
        : 'bg-card border border-border text-foreground hover:border-primary/40'
    }`;

  // Determine what to render based on bottom tab
  const renderContent = () => {
    if (bottomTab === 'markets') {
      return (
        <div className="container mx-auto px-4 max-w-lg">
          <h2 className="text-lg font-display font-bold mb-4 pt-2">Markets</h2>
          <MarketsView />
        </div>
      );
    }

    if (bottomTab === 'explore') {
      return (
        <div className="container mx-auto px-4 max-w-lg">
          <h2 className="text-lg font-display font-bold mb-4 pt-2">Explore</h2>
          <StakingView />
        </div>
      );
    }

    if (bottomTab === 'assets') {
      return (
        <div className="container mx-auto px-4 max-w-lg text-center py-20">
          <p className="text-muted-foreground">Assets coming soon</p>
        </div>
      );
    }

    if (bottomTab === 'trade') {
      // Trade tab shows the Express P2P directly
      return (
        <div className="container mx-auto px-4 max-w-lg">
          <h2 className="text-lg font-display font-bold mb-4 pt-2">Trade</h2>
          <ExpressP2P />
        </div>
      );
    }

    // Home tab - original layout
    return (
      <>
        <div className="container mx-auto px-4 max-w-lg">
          <PortfolioCard />

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

        <div className="container mx-auto px-4 max-w-lg">
          <div id="why-usdt">
            <WhyUsdt />
          </div>
        </div>
        <FAQ />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Header isDark={isDark} toggleTheme={toggleTheme} />

      <main className="relative z-10 pt-20 pb-24">
        {renderContent()}
      </main>

      <Footer />
      <BottomNav activeTab={bottomTab} onTabChange={handleBottomTab} />
    </div>
  );
};

export default Index;
