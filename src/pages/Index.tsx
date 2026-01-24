import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { LivePriceTicker } from '@/components/LivePriceTicker';
import { ExchangeRates } from '@/components/ExchangeRates';
import { PlatformDescription } from '@/components/PlatformDescription';
import { TradeCalculator } from '@/components/TradeCalculator';
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
        <ExchangeRates />
        <PlatformDescription />
        <TradeCalculator />
        <FAQ />
      </main>
      
      <Footer />
    </div>
  );
};

export default Index;
