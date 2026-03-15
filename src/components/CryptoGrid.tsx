import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { CryptoGridSkeleton } from '@/components/skeletons/CryptoGridSkeleton';
import { getCryptoLogo } from '@/lib/cryptoLogos';

export const CryptoGrid = () => {
  const { prices, isLoading } = useCryptoPrices();

  if (isLoading) {
    return <CryptoGridSkeleton />;
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
              <img src={getCryptoLogo(crypto.symbol)} alt={crypto.symbol} className="w-6 h-6 rounded-full" />
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
