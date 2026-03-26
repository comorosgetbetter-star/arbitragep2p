import { useState, useEffect, useCallback } from 'react';

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  icon: string;
}

const initialPrices: CryptoPrice[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 87420.15, change24h: 1.82, icon: '₿' },
  { symbol: 'ETH', name: 'Ethereum', price: 2048.63, change24h: -0.73, icon: 'Ξ' },
  { symbol: 'USDT', name: 'Tether', price: 1.00, change24h: 0.01, icon: '₮' },
  { symbol: 'BNB', name: 'BNB', price: 632.18, change24h: 0.95, icon: '⬡' },
  { symbol: 'SOL', name: 'Solana', price: 139.47, change24h: 3.21, icon: '◎' },
  { symbol: 'XRP', name: 'XRP', price: 2.31, change24h: -1.15, icon: '✕' },
];

export const useCryptoPrices = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>(initialPrices);
  const [isLoading, setIsLoading] = useState(true);

  const simulatePriceUpdate = useCallback(() => {
    setPrices(prevPrices =>
      prevPrices.map(crypto => {
        if (crypto.symbol === 'USDT') return crypto;
        
        const volatility = crypto.symbol === 'BTC' ? 0.001 : 0.002;
        const change = (Math.random() - 0.5) * 2 * volatility;
        const newPrice = crypto.price * (1 + change);
        const newChange24h = crypto.change24h + (Math.random() - 0.5) * 0.1;
        
        return {
          ...crypto,
          price: Math.max(0.01, newPrice),
          change24h: Math.max(-20, Math.min(20, newChange24h)),
        };
      })
    );
  }, []);

  useEffect(() => {
    setIsLoading(false);
    const interval = setInterval(simulatePriceUpdate, 3000);
    return () => clearInterval(interval);
  }, [simulatePriceUpdate]);

  return { prices, isLoading };
};
