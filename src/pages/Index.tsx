import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { LivePriceTicker } from '@/components/LivePriceTicker';
import { TrustIndicators } from '@/components/TrustIndicators';
import { ExpressP2P } from '@/components/ExpressP2P';
import { P2POrders } from '@/components/P2POrders';
import { PlatformDescription } from '@/components/PlatformDescription';

import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Zap, ShoppingBag } from 'lucide-react';

const Index = () => {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'express' | 'orders'>('express');

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
      {/* Serverix-inspired background effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(280 80% 60% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(280 80% 60% / 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,hsl(280_80%_60%_/_0.08)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(320_80%_55%_/_0.05)_0%,transparent_70%)]" />
      </div>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      
      <main className="relative z-10">
        <HeroSection />
        <LivePriceTicker />
        <TrustIndicators />
        
        {/* P2P Section with Tab Toggle */}
        <section id="rates" className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-center gap-3 mb-10">
              <Button
                variant={activeTab === 'express' ? 'default' : 'outline'}
                onClick={() => setActiveTab('express')}
                className="gap-2 w-44 justify-center"
              >
                <Zap className="h-4 w-4" />
                P2P Express Rates
              </Button>
              <Button
                variant={activeTab === 'orders' ? 'default' : 'outline'}
                onClick={() => setActiveTab('orders')}
                className="gap-2 w-44 justify-center ring-1 ring-primary/30 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
              >
                <ShoppingBag className="h-4 w-4" />
                P2P Orders
              </Button>
            </div>

            {activeTab === 'express' ? <ExpressP2P /> : <P2POrders />}
          </div>
        </section>
        <Testimonials />
        <PlatformDescription />
        <FAQ />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
