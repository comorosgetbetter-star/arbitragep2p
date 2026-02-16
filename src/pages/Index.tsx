import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { LivePriceTicker } from '@/components/LivePriceTicker';
import { TrustIndicators } from '@/components/TrustIndicators';
import { ExpressP2P } from '@/components/ExpressP2P';
import { PlatformDescription } from '@/components/PlatformDescription';
import { CryptoCalculator } from '@/components/CryptoCalculator';
import { Testimonials } from '@/components/Testimonials';
import { FAQ } from '@/components/FAQ';
import { Footer } from '@/components/Footer';

const Index = () => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Default to dark mode
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
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(hsl(280 80% 60% / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(280 80% 60% / 0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
        {/* Top-center purple glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-[radial-gradient(ellipse_at_center,hsl(280_80%_60%_/_0.08)_0%,transparent_70%)]" />
        {/* Bottom-left accent glow */}
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,hsl(320_80%_55%_/_0.05)_0%,transparent_70%)]" />
      </div>
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      
      <main className="relative z-10">
        <HeroSection />
        <LivePriceTicker />
        <TrustIndicators />
        <ExpressP2P />
        <CryptoCalculator />
        <Testimonials />
        <PlatformDescription />
        <FAQ />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
