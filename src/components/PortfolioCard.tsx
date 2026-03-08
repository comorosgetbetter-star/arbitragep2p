import { Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useState } from 'react';

export const PortfolioCard = () => {
  const { user } = useAuth();
  const { balance, cryptoBalances } = useUserData();
  const { prices } = useCryptoPrices();
  const [hidden, setHidden] = useState(false);

  const totalPortfolioValue = (() => {
    let total = balance;
    cryptoBalances.forEach((cb) => {
      const p = prices.find(pr => pr.symbol === cb.symbol);
      if (p) total += cb.amount * p.price;
    });
    return total;
  })();

  const displayBalance = user ? totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm text-muted-foreground">Est total value</span>
        <button onClick={() => setHidden(!hidden)} className="text-muted-foreground hover:text-foreground transition-colors">
          <Eye className="h-4 w-4" />
        </button>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold font-display">
          {hidden ? '****' : displayBalance}
        </span>
        <span className="text-lg text-muted-foreground">USD</span>
      </div>
      <p className="text-sm text-muted-foreground mt-1">
        Today's PnL <span className="text-destructive">-$0.02 (0.00%)</span>
      </p>
    </div>
  );
};
