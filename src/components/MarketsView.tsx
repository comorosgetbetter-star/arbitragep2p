import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCryptoLogo } from '@/lib/cryptoLogos';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { cryptoMarketDefinitions } from '@/lib/cryptoMarkets';

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
  const { prices } = useCryptoPrices();
  const [filter, setFilter] = useState<Filter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const priceMap = useMemo(
    () => new Map(prices.map((price) => [price.symbol, price])),
    [prices]
  );

  const pairs = useMemo<MarketPair[]>(() => {
    return cryptoMarketDefinitions
      .filter((definition) => Boolean(definition.marketSymbol))
      .map((definition) => {
        const livePrice = priceMap.get(definition.symbol);
        const price = livePrice?.price ?? definition.fallbackPrice;
        const change24h = livePrice?.change24h ?? definition.fallbackChange24h;

        return {
          symbol: `${definition.symbol}/USDT`,
          base: definition.symbol,
          quote: definition.name,
          icon: definition.icon,
          price,
          change24h,
          volume: definition.volume,
          marketCap: definition.marketCap,
          sparkDirection: change24h >= 0 ? 'up' : 'down',
          featured: definition.featured,
        };
      });
  }, [priceMap]);

  const toggleFavorite = (symbol: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(symbol) ? next.delete(symbol) : next.add(symbol);
      return next;
    });
  };

  const filtered = pairs
    .filter((pair) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return pair.base.toLowerCase().includes(query) || pair.quote.toLowerCase().includes(query);
      }

      return true;
    })
    .filter((pair) => {
      if (filter === 'gainers') return pair.change24h > 0;
      if (filter === 'losers') return pair.change24h < 0;
      if (filter === 'hot') return pair.featured;
      return true;
    });

  const formatPrice = (price: number) =>
    price.toLocaleString('en-US', {
      minimumFractionDigits: price < 1 ? 4 : 2,
      maximumFractionDigits: price < 1 ? 4 : 2,
    });

  return (
    <div className="space-y-4 pb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search trading pairs..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide">
        {(['all', 'hot', 'gainers', 'losers'] as Filter[]).map((currentFilter) => (
          <button
            key={currentFilter}
            onClick={() => setFilter(currentFilter)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors whitespace-nowrap',
              filter === currentFilter
                ? 'bg-primary/15 text-primary border border-primary/30'
                : 'bg-card border border-border/40 text-muted-foreground hover:text-foreground'
            )}
          >
            {currentFilter === 'hot'
              ? '🔥 Hot'
              : currentFilter === 'gainers'
                ? '📈 Gainers'
                : currentFilter === 'losers'
                  ? '📉 Losers'
                  : 'All'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-2 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground border-b border-border/30">
        <span>Pair</span>
        <span className="text-right w-20">Price</span>
        <span className="text-center w-10">7d</span>
        <span className="text-right w-[72px]">24h %</span>
      </div>

      <div className="space-y-0.5">
        {filtered.map((pair) => {
          const isUp = pair.change24h >= 0;
          const isFav = favorites.has(pair.symbol);

          return (
            <div
              key={pair.symbol}
              className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-2 px-3 py-3 rounded-xl hover:bg-muted/30 transition-colors group"
            >
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

              <div className="text-right w-20">
                <p className={cn(
                  'font-mono text-sm font-bold tabular-nums',
                  isUp ? 'text-success' : 'text-destructive'
                )}>
                  ${formatPrice(pair.price)}
                </p>
                <p className="text-[9px] text-muted-foreground">MCap ${pair.marketCap}</p>
              </div>

              <div className="w-10 flex justify-center">
                <MiniSparkline
                  direction={pair.sparkDirection}
                  color={isUp ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
                />
              </div>

              <div className="w-[72px]">
                <span className={cn(
                  'flex items-center justify-center gap-0.5 w-full py-1.5 rounded-md text-xs font-bold tabular-nums',
                  isUp ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive'
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