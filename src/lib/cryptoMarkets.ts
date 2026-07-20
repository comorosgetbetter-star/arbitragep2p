export interface CryptoMarketDefinition {
  symbol: string;
  name: string;
  icon: string;
  marketSymbol?: string;
  fallbackPrice: number;
  fallbackChange24h: number;
  volume: string;
  marketCap: string;
  featured?: boolean;
}

export interface CryptoPriceSnapshot {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

const BINANCE_TICKER_ENDPOINT = 'https://data-api.binance.vision/api/v3/ticker/24hr';

// SOL price adjustment (admin-controlled). Added to live SOL price everywhere.
let cachedSolAdjustment = 0;
let cachedSolAdjustmentAt = 0;
const SOL_ADJUSTMENT_TTL_MS = 15000;

export const getSolPriceAdjustment = (): number => cachedSolAdjustment;

export const fetchSolPriceAdjustment = async (): Promise<number> => {
  const now = Date.now();
  if (now - cachedSolAdjustmentAt < SOL_ADJUSTMENT_TTL_MS) return cachedSolAdjustment;
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'sol_price_adjustment')
      .maybeSingle();
    const raw = (data?.value as { adjustment?: number } | null)?.adjustment;
    const num = typeof raw === 'number' ? raw : Number(raw);
    cachedSolAdjustment = Number.isFinite(num) ? num : 0;
    cachedSolAdjustmentAt = now;
  } catch {
    // keep previous cached value
  }
  return cachedSolAdjustment;
};

const applySolAdjustment = (snapshots: CryptoPriceSnapshot[], adjustment: number): CryptoPriceSnapshot[] => {
  if (!adjustment) return snapshots;
  return snapshots.map((s) =>
    s.symbol === 'SOL' ? { ...s, price: Math.max(0, s.price + adjustment) } : s
  );
};

export const cryptoMarketDefinitions: CryptoMarketDefinition[] = [
  { symbol: 'BTC', name: 'Bitcoin', icon: '₿', marketSymbol: 'BTCUSDT', fallbackPrice: 69981.45, fallbackChange24h: -1.21, volume: '1.27B', marketCap: '1.39T', featured: true },
  { symbol: 'ETH', name: 'Ethereum', icon: 'Ξ', marketSymbol: 'ETHUSDT', fallbackPrice: 2120.61, fallbackChange24h: -2.08, volume: '606.9M', marketCap: '255B', featured: true },
  { symbol: 'USDT', name: 'Tether', icon: '₮', fallbackPrice: 1, fallbackChange24h: 0.01, volume: '--', marketCap: '143B', featured: true },
  { symbol: 'BNB', name: 'BNB', icon: '⬡', marketSymbol: 'BNBUSDT', fallbackPrice: 634.36, fallbackChange24h: -1.54, volume: '71.1M', marketCap: '90.2B', featured: true },
  { symbol: 'SOL', name: 'Solana', icon: '◎', marketSymbol: 'SOLUSDT', fallbackPrice: 89.08, fallbackChange24h: -3.31, volume: '247.9M', marketCap: '45.4B', featured: true },
  { symbol: 'XRP', name: 'XRP', icon: '✕', marketSymbol: 'XRPUSDT', fallbackPrice: 1.384, fallbackChange24h: -2.52, volume: '132.9M', marketCap: '80.5B', featured: true },
  { symbol: 'ADA', name: 'Cardano', icon: '₳', marketSymbol: 'ADAUSDT', fallbackPrice: 0.2609, fallbackChange24h: -3.48, volume: '31.6M', marketCap: '9.2B' },
  { symbol: 'DOGE', name: 'Dogecoin', icon: 'Ð', marketSymbol: 'DOGEUSDT', fallbackPrice: 0.09258, fallbackChange24h: -4.7, volume: '66.2M', marketCap: '13.7B' },
  { symbol: 'AVAX', name: 'Avalanche', icon: '🔺', marketSymbol: 'AVAXUSDT', fallbackPrice: 9.43, fallbackChange24h: -1.98, volume: '16.4M', marketCap: '3.9B' },
  { symbol: 'DOT', name: 'Polkadot', icon: '●', marketSymbol: 'DOTUSDT', fallbackPrice: 1.327, fallbackChange24h: -4.19, volume: '11.2M', marketCap: '2.1B' },
  { symbol: 'LINK', name: 'Chainlink', icon: '⬡', marketSymbol: 'LINKUSDT', fallbackPrice: 9.09, fallbackChange24h: -2.26, volume: '25.8M', marketCap: '5.7B' },
  { symbol: 'MATIC', name: 'Polygon', icon: '⬟', marketSymbol: 'MATICUSDT', fallbackPrice: 0.3794, fallbackChange24h: -0.29, volume: '1.1M', marketCap: '3.6B' },
  { symbol: 'LTC', name: 'Litecoin', icon: 'Ł', marketSymbol: 'LTCUSDT', fallbackPrice: 55.22, fallbackChange24h: -2.3, volume: '17.7M', marketCap: '4.2B' },
  { symbol: 'UNI', name: 'Uniswap', icon: '🦄', marketSymbol: 'UNIUSDT', fallbackPrice: 3.605, fallbackChange24h: -1.21, volume: '12.4M', marketCap: '2.2B' },
  { symbol: 'ATOM', name: 'Cosmos', icon: '⚛', marketSymbol: 'ATOMUSDT', fallbackPrice: 1.722, fallbackChange24h: -4.01, volume: '2.4M', marketCap: '673M' },
  { symbol: 'FIL', name: 'Filecoin', icon: '⨍', marketSymbol: 'FILUSDT', fallbackPrice: 0.9, fallbackChange24h: -1.64, volume: '6.5M', marketCap: '560M' },
  { symbol: 'APT', name: 'Aptos', icon: '🅰', marketSymbol: 'APTUSDT', fallbackPrice: 1.031, fallbackChange24h: -3.56, volume: '7.8M', marketCap: '620M' },
  { symbol: 'ARB', name: 'Arbitrum', icon: '🔵', marketSymbol: 'ARBUSDT', fallbackPrice: 0.0951, fallbackChange24h: -3.75, volume: '4.8M', marketCap: '430M' },
  { symbol: 'OP', name: 'Optimism', icon: '🔴', marketSymbol: 'OPUSDT', fallbackPrice: 0.1105, fallbackChange24h: -2.39, volume: '2.8M', marketCap: '180M' },
  { symbol: 'NEAR', name: 'NEAR Protocol', icon: 'Ⓝ', marketSymbol: 'NEARUSDT', fallbackPrice: 1.234, fallbackChange24h: -3.59, volume: '16.6M', marketCap: '1.5B' },
  { symbol: 'SUI', name: 'Sui', icon: '💧', marketSymbol: 'SUIUSDT', fallbackPrice: 0.9398, fallbackChange24h: -2.29, volume: '22.7M', marketCap: '3.0B' },
];

export const featuredCryptoSymbols = cryptoMarketDefinitions
  .filter((definition) => definition.featured)
  .map((definition) => definition.symbol);

export const buildFallbackPrices = (
  definitions: CryptoMarketDefinition[] = cryptoMarketDefinitions
): CryptoPriceSnapshot[] =>
  definitions.map((definition) => ({
    symbol: definition.symbol,
    name: definition.name,
    price: definition.fallbackPrice,
    change24h: definition.fallbackChange24h,
    icon: definition.icon,
  }));

export const fetchCryptoPriceSnapshots = async (
  definitions: CryptoMarketDefinition[] = cryptoMarketDefinitions
): Promise<CryptoPriceSnapshot[]> => {
  const trackedDefinitions = definitions.filter((definition) => definition.marketSymbol);

  const adjustmentPromise = fetchSolPriceAdjustment();

  if (trackedDefinitions.length === 0) {
    const adjustment = await adjustmentPromise;
    return applySolAdjustment(buildFallbackPrices(definitions), adjustment);
  }

  const symbols = trackedDefinitions.map((definition) => definition.marketSymbol);
  const [response, adjustment] = await Promise.all([
    fetch(`${BINANCE_TICKER_ENDPOINT}?symbols=${encodeURIComponent(JSON.stringify(symbols))}`),
    adjustmentPromise,
  ]);

  if (!response.ok) {
    throw new Error(`Failed to fetch crypto prices: ${response.status}`);
  }

  const tickers = (await response.json()) as BinanceTicker[];
  const tickerMap = new Map(tickers.map((ticker) => [ticker.symbol, ticker]));

  const snapshots = definitions.map((definition) => {
    const ticker = definition.marketSymbol ? tickerMap.get(definition.marketSymbol) : null;

    return {
      symbol: definition.symbol,
      name: definition.name,
      price: ticker ? Number.parseFloat(ticker.lastPrice) : definition.fallbackPrice,
      change24h: ticker ? Number.parseFloat(ticker.priceChangePercent) : definition.fallbackChange24h,
      icon: definition.icon,
    };
  });

  return applySolAdjustment(snapshots, adjustment);
};