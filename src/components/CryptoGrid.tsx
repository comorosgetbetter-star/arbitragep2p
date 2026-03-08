import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoGridSkeleton } from '@/components/skeletons/CryptoGridSkeleton';

export const CryptoGrid = () => {
  const { prices, isLoading } = useCryptoPrices();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-20 mb-2" />
            <div className="h-4 bg-muted rounded w-16 mb-1" />
            <div className="h-3 bg-muted rounded w-12" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {prices.map((crypto) => {
        const isUp = crypto.change24h >= 0;
        return (
          <div
            key={crypto.symbol}
            className="rounded-xl bg-card border border-border p-4 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{crypto.icon}</span>
              <span className="font-bold text-sm">
                {crypto.symbol}<span className="text-muted-foreground font-normal">/USDT</span>
              </span>
            </div>
            <p className="font-display font-bold text-base">
              ${crypto.price.toLocaleString('en-US', {
                minimumFractionDigits: crypto.price < 1 ? 4 : 2,
                maximumFractionDigits: crypto.price < 1 ? 4 : 2,
              })}
            </p>
            <div className={`flex items-center gap-1 text-xs mt-1 ${isUp ? 'text-success' : 'text-destructive'}`}>
              {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{isUp ? '+' : ''}{crypto.change24h.toFixed(2)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
