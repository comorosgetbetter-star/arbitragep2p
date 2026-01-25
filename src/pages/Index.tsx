import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { LivePriceTicker } from '@/components/LivePriceTicker';
import { ExpressP2P } from '@/components/ExpressP2P';
import { PlatformDescription } from '@/components/PlatformDescription';
import { CryptoCalculator } from '@/components/CryptoCalculator';
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
    <div className="min-h-screen bg-background text-foreground">
      <Header isDark={isDark} toggleTheme={toggleTheme} />
      
      <main>
        <HeroSection />
        <LivePriceTicker />
        <ExpressP2P />
        <PlatformDescription />
        <CryptoCalculator />
        <FAQ />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
