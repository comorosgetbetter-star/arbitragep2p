import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { PortfolioCard } from '@/components/PortfolioCard';
import { CryptoGrid } from '@/components/CryptoGrid';
import { DepositCrypto } from '@/components/DepositCrypto';
import { ExpressP2P } from '@/components/ExpressP2P';
import { BotsView } from '@/components/BotsView';
import { P2POrders } from '@/components/P2POrders';
import { WhyUsdt } from '@/components/WhyUsdt';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { BottomNav, BottomNavTab } from '@/components/BottomNav';
import { MarketsView } from '@/components/MarketsView';
import { StakingView } from '@/components/StakingView';
import { AssetsView } from '@/components/AssetsView';
import { Button } from '@/components/ui/button';
import { useMemberAccess } from '@/hooks/useMemberAccess';
import { Download, Zap, ShoppingBag, ArrowLeft, Bot, Lock } from 'lucide-react';
import { PortfolioSkeleton } from '@/components/skeletons/PortfolioSkeleton';
import { TradeSkeleton } from '@/components/skeletons/TradeSkeleton';

type ExploreTab = 'staking' | 'bots';

type ActiveSection = 'home' | 'deposit' | 'express' | 'p2p';

const VALID_TABS: BottomNavTab[] = ['home', 'markets', 'trade', 'explore', 'assets'];
const PROTECTED_TABS: BottomNavTab[] = ['trade', 'explore', 'assets'];
const PAGE_SHELL = 'container mx-auto w-full px-4 max-w-lg md:max-w-4xl xl:max-w-6xl';

const getTabFromHash = (): BottomNavTab => {
  const hash = window.location.hash.replace('#', '') as BottomNavTab;
  return VALID_TABS.includes(hash) ? hash : 'home';
};

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeSection, setActiveSection] = useState<ActiveSection>('home');
  const [exploreTab, setExploreTab] = useState<ExploreTab>('staking');
  const [bottomTab, setBottomTab] = useState<BottomNavTab>(getTabFromHash);
  const { loading, canUseMemberFeatures } = useMemberAccess();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  useEffect(() => {
    if (!loading && !canUseMemberFeatures && activeSection !== 'home') {
      setActiveSection('home');
    }
  }, [loading, canUseMemberFeatures, activeSection]);

  useEffect(() => {
    if (!loading && !canUseMemberFeatures && PROTECTED_TABS.includes(bottomTab)) {
      setBottomTab('home');
      window.location.hash = '';
    }
  }, [loading, canUseMemberFeatures, bottomTab]);

  const toggleTheme = () => setIsDark(!isDark);

  const renderAuthRequired = (title: string, description: string) => (
    <div className="text-center py-12 rounded-xl border border-border bg-card/50">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
        <Lock className="h-6 w-6 text-primary" />
      </div>
      <p className="font-semibold mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>
      <Button onClick={() => navigate('/login')}>Sign In</Button>
    </div>
  );

  const openProtectedSection = (section: Exclude<ActiveSection, 'home'>) => {
    if (loading) return;
    if (!canUseMemberFeatures) {
      navigate('/login');
      return;
    }
    setActiveSection(activeSection === section ? 'home' : section);
  };
  const handleBottomTab = (tab: BottomNavTab) => {
    if (PROTECTED_TABS.includes(tab) && !loading && !canUseMemberFeatures) {
      navigate('/login');
      return;
    }

    setBottomTab(tab);
    window.location.hash = tab === 'home' ? '' : tab;
    if (tab === 'home') {
      setActiveSection('home');
    }
  };

  // Listen for browser back/forward
  useEffect(() => {
    const onHashChange = () => setBottomTab(getTabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const btnClass = (section: ActiveSection) =>
    `h-12 rounded-xl text-sm font-semibold transition-all ${
      activeSection === section
        ? 'bg-gold hover:bg-gold/90 text-gold-foreground shadow-[0_0_16px_hsl(45_100%_50%/0.3)]'
        : 'bg-card border border-gold/30 text-gold hover:border-gold/60 hover:bg-gold/5'
    }`;

  // Determine what to render based on bottom tab
  const renderContent = () => {
    if (bottomTab === 'markets') {
      return (
        <div className={PAGE_SHELL}>
          <h2 className="text-lg font-display font-bold mb-4 pt-2">Markets</h2>
          <MarketsView />
        </div>
      );
    }

    if (bottomTab === 'explore') {
      if (loading) {
        return (
          <div className={PAGE_SHELL}>
            <TradeSkeleton />
          </div>
        );
      }

      if (!canUseMemberFeatures) {
        return (
          <div className={PAGE_SHELL}>
            {renderAuthRequired('Sign in to continue', 'Bots and staking are available only for logged-in users.')}
          </div>
        );
      }

      return (
        <div className={PAGE_SHELL}>
          <h2 className="text-lg font-display font-bold mb-4 pt-2">Explore</h2>
          <div className="flex gap-2 mb-4">
            <Button
              className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
                exploreTab === 'staking'
                  ? 'bg-gold text-gold-foreground shadow-md'
                  : 'bg-card border border-gold/30 text-gold hover:border-gold/60 hover:bg-gold/5'
              }`}
              onClick={() => setExploreTab('staking')}
            >
              Crypto Staking
            </Button>
            <Button
              className={`flex-1 h-10 rounded-xl text-sm font-semibold transition-all ${
                exploreTab === 'bots'
                  ? 'bg-gold text-gold-foreground shadow-md'
                  : 'bg-card border border-gold/30 text-gold hover:border-gold/60 hover:bg-gold/5'
              }`}
              onClick={() => setExploreTab('bots')}
            >
              <Bot className="h-4 w-4 mr-1.5" />
              Bots
            </Button>
          </div>
          {exploreTab === 'staking' && <StakingView />}
          {exploreTab === 'bots' && <BotsView />}
        </div>
      );
    }

    if (bottomTab === 'assets') {
      if (loading) {
        return (
          <div className={PAGE_SHELL}>
            <TradeSkeleton />
          </div>
        );
      }

      if (!canUseMemberFeatures) {
        return (
          <div className={PAGE_SHELL}>
            {renderAuthRequired('Sign in to continue', 'Assets are available only for logged-in users.')}
          </div>
        );
      }

      return (
        <div className={PAGE_SHELL}>
          <AssetsView />
        </div>
      );
    }

    if (bottomTab === 'trade') {
      return (
        <div className={PAGE_SHELL}>
          <h2 className="text-lg font-display font-bold mb-4 pt-2">Trade</h2>
          {loading ? (
            <TradeSkeleton />
          ) : !canUseMemberFeatures ? (
            renderAuthRequired('Sign in to start trading', 'Express and P2P trades are available only for logged-in users.')
          ) : (
            <ExpressP2P />
          )}
        </div>
      );
    }

    // Home tab - original layout
    return (
      <>
        <div className={PAGE_SHELL}>
          <PortfolioCard />

          <div className="grid grid-cols-3 gap-2">
            <Button
              className={btnClass('deposit')}
              onClick={() => openProtectedSection('deposit')}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Deposit
            </Button>
            <Button
              className={btnClass('express')}
              onClick={() => openProtectedSection('express')}
            >
              <Zap className="h-4 w-4 mr-1.5" />
              Express
            </Button>
            <Button
              className={btnClass('p2p')}
              onClick={() => openProtectedSection('p2p')}
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
            {activeSection !== 'home' && loading && <TradeSkeleton />}
            {activeSection !== 'home' && !loading && !canUseMemberFeatures && (
              renderAuthRequired('Sign in to continue', 'This action is available only to logged-in users.')
            )}
            {activeSection === 'deposit' && canUseMemberFeatures && <DepositCrypto />}
            {activeSection === 'express' && canUseMemberFeatures && <ExpressP2P />}
            {activeSection === 'p2p' && canUseMemberFeatures && <P2POrders />}
          </div>
        </div>

        <div className="container mx-auto px-4 max-w-lg md:max-w-2xl lg:max-w-4xl">
          <div id="why-usdt">
            <WhyUsdt />
          </div>
        </div>
        <FAQ />
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col">
      <Header isDark={isDark} toggleTheme={toggleTheme} activeTab={bottomTab} onTabChange={handleBottomTab} />

      <main className="relative z-10 pt-14 md:pt-20 pb-24 md:pb-12 flex-1">
        {renderContent()}
      </main>

      <Footer />
      <BottomNav activeTab={bottomTab} onTabChange={handleBottomTab} />
    </div>
  );
};

export default Index;
