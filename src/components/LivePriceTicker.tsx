import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { featuredCryptoSymbols } from '@/lib/cryptoMarkets';

export const LivePriceTicker = () => {
  const { prices, isLoading } = useCryptoPrices();
  const featuredPrices = prices.filter((crypto) => featuredCryptoSymbols.includes(crypto.symbol));

  if (isLoading) {
    return (
      <section id="prices" className="py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-16 mb-2" />
                <div className="h-6 bg-muted rounded w-24 mb-1" />
                <div className="h-4 bg-muted rounded w-12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="prices" className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-semibold">
            Live <span className="gradient-text">Crypto Prices</span>
          </h2>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {featuredPrices.map((crypto, index) => (
            <div 
              key={crypto.symbol}
              className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-300 group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{crypto.icon}</span>
                  <span className="font-medium text-sm">{crypto.symbol}</span>
                </div>
                <div className={`flex items-center gap-1 text-xs ${
                  crypto.change24h >= 0 ? 'text-success' : 'text-destructive'
                }`}>
                  {crypto.change24h >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>{crypto.change24h >= 0 ? '+' : ''}{crypto.change24h.toFixed(2)}%</span>
                </div>
              </div>
              
              <p className="text-lg font-display font-bold ticker-pulse">
                ${crypto.price.toLocaleString('en-US', { 
                  minimumFractionDigits: crypto.price < 1 ? 4 : 2,
                  maximumFractionDigits: crypto.price < 1 ? 4 : 2
                })}
              </p>
              
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {crypto.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
