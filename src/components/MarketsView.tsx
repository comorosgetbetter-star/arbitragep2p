import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MarketPair {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume: string;
  localPrice: string;
}

const initialPairs: MarketPair[] = [
  { symbol: 'ETHUSD', name: 'ETH', price: 1941.48, change24h: -2.24, volume: '32.57M Cont', localPrice: 'KSh 250,831.35' },
  { symbol: 'BTCUSD', name: 'BTC', price: 67231.0, change24h: -1.09, volume: '6.54M Cont', localPrice: 'KSh 8,684,641.61' },
  { symbol: 'SOLUSD', name: 'SOL', price: 82.08, change24h: -2.33, volume: '3.95M Cont', localPrice: 'KSh 10,602.27' },
  { symbol: 'XRPUSD', name: 'XRP', price: 1.3466, change24h: -1.05, volume: '2.75M Cont', localPrice: 'KSh 173.99' },
  { symbol: 'DOGEUSD', name: 'DOGE', price: 0.08884, change24h: -1.34, volume: '2.13M Cont', localPrice: 'KSh 11.48' },
  { symbol: 'BNBUSD', name: 'BNB', price: 617.39, change24h: -1.68, volume: '2.11M Cont', localPrice: 'KSh 79,748.27' },
  { symbol: 'ADAUSD', name: 'ADA', price: 0.2501, change24h: -2.15, volume: '747,565 Cont', localPrice: 'KSh 32.32' },
  { symbol: 'SUIUSD', name: 'SUI', price: 0.8866, change24h: -1.74, volume: '568,749 Cont', localPrice: 'KSh 114.52' },
  { symbol: 'LINKUSD', name: 'LINK', price: 8.567, change24h: -2.57, volume: '462,435 Cont', localPrice: 'KSh 1,106.6' },
  { symbol: 'LTCUSD', name: 'LTC', price: 52.70, change24h: -2.14, volume: '347,570 Cont', localPrice: 'KSh 6,809.84' },
  { symbol: 'BCHUSD', name: 'BCH', price: 447.61, change24h: -0.50, volume: '215,890 Cont', localPrice: 'KSh 57,822.49' },
  { symbol: 'AVAXUSD', name: 'AVAX', price: 22.15, change24h: -3.12, volume: '189,430 Cont', localPrice: 'KSh 2,861.38' },
];

export const MarketsView = () => {
  const [pairs, setPairs] = useState(initialPairs);

  const simulateUpdate = useCallback(() => {
    setPairs(prev =>
      prev.map(pair => {
        const volatility = 0.0015;
        const change = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = pair.price * (1 + change);
        const newChange = pair.change24h + (Math.random() - 0.5) * 0.08;
        return {
          ...pair,
          price: Math.max(0.001, newPrice),
          change24h: Math.max(-15, Math.min(15, newChange)),
        };
      })
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(simulateUpdate, 4000);
    return () => clearInterval(interval);
  }, [simulateUpdate]);

  return (
    <div className="pb-4">
      {/* Header row */}
      <div className="flex items-center justify-between px-1 py-3 text-xs text-muted-foreground border-b border-border/30">
        <span className="w-[40%]">Name / Vol</span>
        <span className="w-[30%] text-right">Last Price</span>
        <span className="w-[30%] text-right">24h Chg%</span>
      </div>

      {/* Pair rows */}
      <div className="divide-y divide-border/20">
        {pairs.map((pair) => {
          const isUp = pair.change24h >= 0;
          return (
            <div key={pair.symbol} className="flex items-center justify-between py-4 px-1">
              {/* Left: Name + Volume */}
              <div className="w-[40%]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-foreground">{pair.symbol} CM</span>
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 font-medium bg-muted text-muted-foreground">
                    Perp
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{pair.volume}</p>
              </div>

              {/* Center: Price */}
              <div className="w-[30%] text-right">
                <p className="font-bold text-sm text-foreground">
                  {pair.price.toLocaleString('en-US', {
                    minimumFractionDigits: pair.price < 1 ? 4 : pair.price < 100 ? 2 : pair.price < 1000 ? 2 : 1,
                    maximumFractionDigits: pair.price < 1 ? 5 : 2,
                  })}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{pair.localPrice}</p>
              </div>

              {/* Right: 24h Change badge */}
              <div className="w-[30%] flex justify-end">
                <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-semibold min-w-[72px] ${
                  isUp
                    ? 'bg-success/20 text-success'
                    : 'bg-destructive/20 text-destructive'
                }`}>
                  {isUp ? '+' : ''}{pair.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
