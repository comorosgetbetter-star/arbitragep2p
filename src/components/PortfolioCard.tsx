import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useState } from 'react';
import { PortfolioSkeleton } from '@/components/skeletons/PortfolioSkeleton';

export const PortfolioCard = () => {
  const { user, loading: authLoading } = useAuth();
  const { balance, cryptoBalances, isLoading: dataLoading } = useUserData();
  const { prices } = useCryptoPrices();
  const [hidden, setHidden] = useState(!user);

  if (authLoading || (user && dataLoading)) {
    return <PortfolioSkeleton />;
  }

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
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground tracking-wide">Estimated total value</span>
        <button onClick={() => setHidden(!hidden)} className="text-muted-foreground hover:text-foreground transition-colors">
          {hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[2rem] font-bold font-mono leading-none tracking-tight">
          {hidden ? '••••••' : displayBalance}
        </span>
        <span className="text-sm text-muted-foreground font-medium">USD</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        24h PnL <span className="text-destructive font-mono">-$0.02 (0.00%)</span>
      </p>
    </div>
  );
};
