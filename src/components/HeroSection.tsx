import { ArrowRight, Shield, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stats = [
  { icon: TrendingUp, value: '21.9%', label: 'Avg. ROI' },
  { icon: Clock, value: '<15min', label: 'Trade Time' },
  { icon: Shield, value: '100%', label: 'Secure' },
];

export const HeroSection = () => {
  return (
    <section className="pt-24 pb-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in-up">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-primary font-medium">Live P2P Trading Platform</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Buy USDT at the <span className="gradient-text">Best Rates</span> and Profit Instantly
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Access premium P2P arbitrage signals. Buy low, sell high on Binance. 
            Start profiting from real-time exchange price gaps today.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Button variant="glow" size="xl" className="group w-full sm:w-auto">
              Start Trading
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="outline" size="xl" className="w-full sm:w-auto">
              View Rates
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-xl sm:text-2xl font-display font-bold">{stat.value}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
