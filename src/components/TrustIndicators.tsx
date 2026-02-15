import { useState, useEffect } from 'react';
import { Users, Shield, Globe, TrendingUp } from 'lucide-react';

// Fixed epoch: every user calculates the same count based on elapsed time
const COUNTER_EPOCH = new Date('2025-01-01T00:00:00Z').getTime();
const BASE_VALUE = 56000;
const MAX_VALUE = 56999;
const INCREMENT_INTERVAL_MS = 30000;

const useDeterministicCounter = () => {
  const getCount = () => {
    const elapsed = Date.now() - COUNTER_EPOCH;
    const increment = Math.floor(elapsed / INCREMENT_INTERVAL_MS);
    return BASE_VALUE + (increment % (MAX_VALUE - BASE_VALUE));
  };

  const [count, setCount] = useState(getCount);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(getCount());
    }, INCREMENT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  return count;
};

export const TrustIndicators = () => {
  const activeUsers = useDeterministicCounter();

  const stats = [
    {
      icon: Users,
      value: `${activeUsers.toLocaleString()}+`,
      label: 'Active Users',
      description: 'Trusted worldwide',
    },
    {
      icon: TrendingUp,
      value: '$50M+',
      label: 'Volume Traded',
      description: 'Monthly transactions',
    },
    {
      icon: Globe,
      value: '150+',
      label: 'Countries',
      description: 'Global access',
    },
    {
      icon: Shield,
      value: '99.9%',
      label: 'Uptime',
      description: 'Platform reliability',
    },
  ];

  return (
    <section className="py-12 border-y border-border/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-sm text-primary font-medium mb-2">Trusted by Thousands</p>
          <h3 className="text-2xl font-display font-bold">
            Platform Built on <span className="gradient-text">Reliability</span>
          </h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div 
              key={stat.label}
              className="text-center animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">{stat.value}</p>
              <p className="text-sm font-medium text-foreground mt-1">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
