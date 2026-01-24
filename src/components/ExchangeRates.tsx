import { TrendingUp, Info } from 'lucide-react';

const rates = [
  { capital: 50, gains: 60, profit: 10 },
  { capital: 100, gains: 121, profit: 21 },
  { capital: 1000, gains: 1219, profit: 219 },
  { capital: 10000, gains: 12195, profit: 2195 },
];

export const ExchangeRates = () => {
  return (
    <section id="rates" className="py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-display font-bold mb-4">
            Exchange <span className="gradient-text">Rates</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estimated gains per trade based on starting capital. 
            Profit from real-time price gaps across exchanges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {rates.map((rate, index) => (
            <div 
              key={rate.capital}
              className="glass-card rounded-2xl p-6 text-center hover:border-primary/40 transition-all duration-300 group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">Starting with</p>
              <p className="text-2xl font-display font-bold mb-4">
                ${rate.capital.toLocaleString()}
              </p>
              
              <div className="h-px bg-border my-4" />
              
              <p className="text-sm text-muted-foreground mb-1">Estimated Return</p>
              <p className="text-3xl font-display font-bold text-success">
                ${rate.gains.toLocaleString()}
              </p>
              <p className="text-sm text-success mt-1">
                +${rate.profit.toLocaleString()} profit
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-8 p-4 max-w-2xl mx-auto rounded-lg bg-muted/30">
          <Info className="h-4 w-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground text-center">
            Values are estimates based on current market conditions. Actual returns may vary 
            depending on market volatility and trading conditions.
          </p>
        </div>
      </div>
    </section>
  );
};
