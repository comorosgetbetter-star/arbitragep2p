import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCryptoLogo } from '@/lib/cryptoLogos';

interface MarketPair {
  symbol: string;
  base: string;
  quote: string;
  icon: string;
  price: number;
  change24h: number;
  volume: string;
  marketCap: string;
  sparkDirection: 'up' | 'down';
  featured?: boolean;
}

const initialPairs: MarketPair[] = [
  { symbol: 'BTC/USDT', base: 'BTC', quote: 'Bitcoin', icon: '₿', price: 67231.00, change24h: 2.34, volume: '1.2B', marketCap: '1.32T', sparkDirection: 'up', featured: true },
  { symbol: 'ETH/USDT', base: 'ETH', quote: 'Ethereum', icon: 'Ξ', price: 3521.48, change24h: -0.45, volume: '892M', marketCap: '423B', sparkDirection: 'down', featured: true },
  { symbol: 'BNB/USDT', base: 'BNB', quote: 'BNB Chain', icon: '⬡', price: 617.39, change24h: 1.68, volume: '312M', marketCap: '94.2B', sparkDirection: 'up', featured: true },
  { symbol: 'SOL/USDT', base: 'SOL', quote: 'Solana', icon: '◎', price: 178.45, change24h: 5.90, volume: '485M', marketCap: '78.1B', sparkDirection: 'up' },
  { symbol: 'XRP/USDT', base: 'XRP', quote: 'Ripple', icon: '✕', price: 0.6300, change24h: -2.15, volume: '267M', marketCap: '34.5B', sparkDirection: 'down' },
  { symbol: 'ADA/USDT', base: 'ADA', quote: 'Cardano', icon: '₳', price: 0.4501, change24h: -1.23, volume: '189M', marketCap: '15.9B', sparkDirection: 'down' },
  { symbol: 'DOGE/USDT', base: 'DOGE', quote: 'Dogecoin', icon: 'Ð', price: 0.08884, change24h: 3.45, volume: '213M', marketCap: '12.8B', sparkDirection: 'up' },
  { symbol: 'AVAX/USDT', base: 'AVAX', quote: 'Avalanche', icon: '🔺', price: 22.15, change24h: -3.12, volume: '142M', marketCap: '8.9B', sparkDirection: 'down' },
  { symbol: 'DOT/USDT', base: 'DOT', quote: 'Polkadot', icon: '●', price: 4.82, change24h: 1.07, volume: '98M', marketCap: '6.7B', sparkDirection: 'up' },
  { symbol: 'LINK/USDT', base: 'LINK', quote: 'Chainlink', icon: '⬡', price: 14.56, change24h: -2.57, volume: '156M', marketCap: '8.5B', sparkDirection: 'down' },
  { symbol: 'MATIC/USDT', base: 'MATIC', quote: 'Polygon', icon: '⬟', price: 0.5423, change24h: 0.89, volume: '87M', marketCap: '5.0B', sparkDirection: 'up' },
  { symbol: 'LTC/USDT', base: 'LTC', quote: 'Litecoin', icon: 'Ł', price: 72.70, change24h: -1.14, volume: '78M', marketCap: '5.4B', sparkDirection: 'down' },
  { symbol: 'UNI/USDT', base: 'UNI', quote: 'Uniswap', icon: '🦄', price: 6.32, change24h: 2.78, volume: '112M', marketCap: '4.8B', sparkDirection: 'up' },
  { symbol: 'ATOM/USDT', base: 'ATOM', quote: 'Cosmos', icon: '⚛', price: 7.89, change24h: -0.65, volume: '64M', marketCap: '2.9B', sparkDirection: 'down' },
  { symbol: 'FIL/USDT', base: 'FIL', quote: 'Filecoin', icon: '⨍', price: 4.21, change24h: 1.34, volume: '53M', marketCap: '2.3B', sparkDirection: 'up' },
  { symbol: 'APT/USDT', base: 'APT', quote: 'Aptos', icon: '🅰', price: 6.78, change24h: -4.21, volume: '92M', marketCap: '3.1B', sparkDirection: 'down' },
  { symbol: 'ARB/USDT', base: 'ARB', quote: 'Arbitrum', icon: '🔵', price: 0.8234, change24h: 0.56, volume: '74M', marketCap: '2.6B', sparkDirection: 'up' },
  { symbol: 'OP/USDT', base: 'OP', quote: 'Optimism', icon: '🔴', price: 1.67, change24h: -1.89, volume: '68M', marketCap: '1.9B', sparkDirection: 'down' },
  { symbol: 'NEAR/USDT', base: 'NEAR', quote: 'NEAR Protocol', icon: 'Ⓝ', price: 3.45, change24h: 2.12, volume: '82M', marketCap: '3.7B', sparkDirection: 'up' },
  { symbol: 'SUI/USDT', base: 'SUI', quote: 'Sui', icon: '💧', price: 0.8866, change24h: -1.74, volume: '95M', marketCap: '2.8B', sparkDirection: 'down' },
];

type Filter = 'all' | 'gainers' | 'losers' | 'hot';

const MiniSparkline = ({ direction, color }: { direction: 'up' | 'down'; color: string }) => {
  const points = direction === 'up'
    ? 'M0,14 L4,12 L8,13 L12,10 L16,11 L20,7 L24,8 L28,4 L32,5 L36,2'
    : 'M0,2 L4,4 L8,3 L12,6 L16,5 L20,9 L24,8 L28,12 L32,11 L36,14';
  return (
    <svg width="40" height="16" viewBox="0 0 40 16" className="flex-shrink-0">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const MarketsView = () => {
  const [pairs, setPairs] = useState(initialPairs);
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const simulateUpdate = useCallback(() => {
    setPairs(prev =>
      prev.map(pair => {
        const volatility = 0.0012;
        const change = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = pair.price * (1 + change);
        const newChange = pair.change24h + (Math.random() - 0.5) * 0.06;
        return {
          ...pair,
          price: Math.max(0.001, newPrice),
          change24h: Math.max(-15, Math.min(15, newChange)),
          sparkDirection: newChange >= 0 ? 'up' as const : 'down' as const,
        };
      })
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(simulateUpdate, 4000);
    return () => clearInterval(interval);
  }, [simulateUpdate]);

  const toggleFavorite = (symbol: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  const filtered = pairs
    .filter(p => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.base.toLowerCase().includes(q) || p.quote.toLowerCase().includes(q);
      }
      return true;
    })
    .filter(p => {
      if (filter === 'gainers') return p.change24h > 0;
      if (filter === 'losers') return p.change24h < 0;
      if (filter === 'hot') return p.featured;
      return true;
    });

  const formatPrice = (price: number) =>
    price.toLocaleString('en-US', {
      minimumFractionDigits: price < 1 ? 4 : 2,
      maximumFractionDigits: price < 1 ? 4 : 2,
    });

  return (
    <div className="space-y-4 pb-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search trading pairs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {(['all', 'hot', 'gainers', 'losers'] as Filter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap',
              filter === f
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-card border border-border/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {f === 'hot' ? '🔥 Hot' : f === 'gainers' ? '📈 Gainers' : f === 'losers' ? '📉 Losers' : 'All'}
          </button>
        ))}
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/30">
        <span>Pair</span>
        <span className="text-right w-20">Price</span>
        <span className="text-center w-10">7d</span>
        <span className="text-right w-[72px]">24h %</span>
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {filtered.map((pair) => {
          const isUp = pair.change24h >= 0;
          const isFav = favorites.has(pair.symbol);
          return (
            <div
              key={pair.symbol}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-3 rounded-xl hover:bg-muted/30 transition-colors group"
            >
              {/* Pair Info */}
              <div className="flex items-center gap-2.5 min-w-0">
                <button onClick={() => toggleFavorite(pair.symbol)} className="flex-shrink-0">
                  <Star className={cn('h-3.5 w-3.5 transition-colors', isFav ? 'fill-warning text-warning' : 'text-muted-foreground/40 group-hover:text-muted-foreground')} />
                </button>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img src={getCryptoLogo(pair.base)} alt={pair.base} className="w-8 h-8 rounded-full" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm text-foreground">{pair.base}</span>
                    <span className="text-[10px] text-muted-foreground">/USDT</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">Vol ${pair.volume}</p>
                </div>
              </div>

              {/* Price */}
              <div className="text-right w-20">
                <p className={cn(
                  'font-mono text-sm font-bold tabular-nums',
                  isUp ? 'text-success' : 'text-destructive'
                )}>
                  ${formatPrice(pair.price)}
                </p>
                <p className="text-[9px] text-muted-foreground">MCap ${pair.marketCap}</p>
              </div>

              {/* Sparkline */}
              <div className="w-10 flex justify-center">
                <MiniSparkline
                  direction={pair.sparkDirection}
                  color={isUp ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                />
              </div>

              {/* Change Badge */}
              <div className="w-[72px]">
                <span className={cn(
                  'flex items-center justify-center gap-0.5 w-full py-1.5 rounded-md text-xs font-bold tabular-nums',
                  isUp
                    ? 'bg-success/15 text-success'
                    : 'bg-destructive/15 text-destructive'
                )}>
                  {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {isUp ? '+' : ''}{pair.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            No pairs found
          </div>
        )}
      </div>
    </div>
  );
};
