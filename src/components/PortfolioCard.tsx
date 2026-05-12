import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserData } from '@/contexts/UserDataContext';
import { useCryptoPrices } from '@/hooks/useCryptoPrices';
import { useState, useEffect } from 'react';
import { PortfolioSkeleton } from '@/components/skeletons/PortfolioSkeleton';
import { calculatePortfolioValue, formatUsd } from '@/lib/portfolioValue';

export const PortfolioCard = () => {
  const { user, loading: authLoading } = useAuth();
  const { balance, cryptoBalances, isLoading: dataLoading, loadedForUser } = useUserData();
  const { prices, isLoading: pricesLoading } = useCryptoPrices();
  const [hidden, setHidden] = useState(true);

  // Logged-in users see balance by default; logged-out users see dots
  useEffect(() => {
    if (!authLoading) {
      setHidden(!user);
    }
  }, [user, authLoading]);

  if (authLoading || (user && (dataLoading || loadedForUser !== user.id || pricesLoading))) {
    return <PortfolioSkeleton />;
  }


  const totalPortfolioValue = calculatePortfolioValue(balance, cryptoBalances, prices);

  const displayBalance = user
    ? formatUsd(totalPortfolioValue)
    : '0.00';

  const effectiveHidden = user ? hidden : true;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-xs text-muted-foreground tracking-wide">Estimated total value</span>
        <button onClick={() => setHidden(!hidden)} className="text-muted-foreground hover:text-foreground transition-colors">
          {effectiveHidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-[2rem] font-bold leading-none" style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
          {effectiveHidden ? '••••••' : `$${displayBalance}`}
        </span>
        <span className="text-sm text-muted-foreground font-medium">USD</span>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        24h PnL <span className="text-destructive font-mono">-$0.02 (0.00%)</span>
      </p>
    </div>
  );
};
