import type { CryptoPrice } from '@/hooks/useCryptoPrices';

interface CryptoBalance {
  symbol: string;
  amount: number;
}

export const calculatePortfolioValue = (
  usdtBalance: number,
  cryptoBalances: CryptoBalance[],
  prices: CryptoPrice[]
) => {
  const priceBySymbol = new Map(prices.map((price) => [price.symbol, price.price]));

  return cryptoBalances.reduce((total, cryptoBalance) => {
    const symbol = cryptoBalance.symbol.toUpperCase();
    const price = symbol === 'USDT' ? 1 : priceBySymbol.get(symbol) ?? 0;
    return total + cryptoBalance.amount * price;
  }, usdtBalance);
};

export const formatUsd = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(amount).replace(/\s/g, '');