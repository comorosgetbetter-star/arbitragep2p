import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { Check } from 'lucide-react';

export const CryptoGrid = () => {
  const { prices, isLoading } = useCryptoPrices();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl bg-card p-4 animate-pulse">
            <div className="h-5 bg-muted rounded w-20 mb-2" />
            <div className="h-4 bg-muted rounded w-14" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {prices.map((crypto) => (
        <div
          key={crypto.symbol}
          className="rounded-xl bg-card border border-border p-4 flex items-center justify-between hover:border-primary/40 transition-colors cursor-pointer"
        >
          <div>
            <p className="font-bold text-sm">
              {crypto.symbol}<span className="text-muted-foreground font-normal">/USDT</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{crypto.name}</p>
          </div>
          <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center">
            <Check className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      ))}
    </div>
  );
};
