import { Shield, Zap, Globe, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: Zap,
    title: 'Premium P2P Signals',
    description: 'Access real-time arbitrage opportunities across major exchanges.',
  },
  {
    icon: Globe,
    title: 'Global Exchange Access',
    description: 'Connect to Binance, Coinbase, and other major platforms seamlessly.',
  },
  {
    icon: Shield,
    title: 'Secure Transactions',
    description: 'Enterprise-grade security protecting every trade you make.',
  },
];

export const PlatformDescription = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mb-6 leading-tight">
            Your Gateway to <span className="gradient-text">Profitable</span> P2P Trading
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            This platform provides premium P2P arbitrage signals, allowing you to buy USDT at 
            competitive prices and transfer to major exchanges such as Binance to sell at 
            higher market rates. Profit is generated from real-time price gaps across exchanges.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Button variant="glow" size="xl" className="group" onClick={() => document.getElementById('rates')?.scrollIntoView({ behavior: 'smooth' })}>
            Start Trading Now
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};
