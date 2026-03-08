import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { PortfolioCard } from '@/components/PortfolioCard';
import { ActionButtons } from '@/components/ActionButtons';
import { CryptoGrid } from '@/components/CryptoGrid';
import { ExpressP2P } from '@/components/ExpressP2P';
import { P2POrders } from '@/components/P2POrders';
import { Footer } from '@/components/Footer';

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'p2p-orders' | 'p2p-express'>('favorites');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative">
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      
      <main className="relative z-10 pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-lg">
          {/* Portfolio Card */}
          <PortfolioCard />

          {/* Action Buttons */}
          <ActionButtons />

          {/* Category Tabs */}
          <div className="flex items-center gap-1 mt-8 mb-4 overflow-x-auto scrollbar-hide">
            {[
              { key: 'favorites', label: 'Favorites' },
              { key: 'p2p-orders', label: 'P2P Orders' },
              { key: 'p2p-express', label: 'Express' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content based on active tab */}
          {activeTab === 'favorites' && (
            <>
              <h3 className="text-base font-semibold mb-3">Select crypto</h3>
              <CryptoGrid />
            </>
          )}

          {activeTab === 'p2p-orders' && (
            <P2POrders />
          )}

          {activeTab === 'p2p-express' && (
            <ExpressP2P />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
