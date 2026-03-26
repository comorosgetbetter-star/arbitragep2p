import { useState, useEffect, useCallback } from 'react';
import {
  buildFallbackPrices,
  cryptoMarketDefinitions,
  fetchCryptoPriceSnapshots,
  type CryptoPriceSnapshot,
} from '@/lib/cryptoMarkets';

export type CryptoPrice = CryptoPriceSnapshot;

const REFRESH_INTERVAL_MS = 30000;

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>(() => buildFallbackPrices(cryptoMarketDefinitions));
  const [isLoading, setIsLoading] = useState(true);

  const refreshPrices = useCallback(async () => {
    try {
      const nextPrices = await fetchCryptoPriceSnapshots(cryptoMarketDefinitions);
      setPrices(nextPrices);
    } catch (error) {
      console.error('Failed to fetch live crypto prices:', error);
      setPrices(buildFallbackPrices(cryptoMarketDefinitions));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPrices();

    const interval = window.setInterval(() => {
      void refreshPrices();
    }, REFRESH_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [refreshPrices]);

  return { prices, isLoading };
};