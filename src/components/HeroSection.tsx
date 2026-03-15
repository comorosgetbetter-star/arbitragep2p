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
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-32 left-1/3 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/4 rounded-full blur-[80px]" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border/50 mb-6 animate-fade-in-up">
            <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground font-medium tracking-wide">Live P2P Trading</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold mb-5 leading-[1.1] tracking-tight animate-fade-in-up" style={{ animationDelay: '100ms' }}>
            Buy USDT at the{' '}
            <span className="gradient-text">Best Rates</span>
            <br className="hidden sm:block" />
            {' '}and Profit Instantly
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            Access premium P2P arbitrage signals. Buy low, sell high on Binance. 
            Start profiting from real-time price gaps.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <Button 
              variant="glow" 
              size="xl" 
              className="group w-full sm:w-auto"
              onClick={() => document.getElementById('rates')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Start Trading
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              variant="outline" 
              size="xl" 
              className="w-full sm:w-auto border-border/50"
              onClick={() => document.getElementById('calculator')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View Rates
            </Button>
          </div>

          {/* Stats - tighter, mono numbers */}
          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto animate-fade-in-up" style={{ animationDelay: '400ms' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center mx-auto mb-1.5">
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-lg font-mono font-bold tracking-tight">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground tracking-wide uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
