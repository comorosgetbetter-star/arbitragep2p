import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  network: string;
}

interface Deposit {
  id: string;
  amount: number;
  reason: string | null;
  created_at: string;
}

interface CryptoBalance {
  symbol: string;
  amount: number;
}

interface UserDataContextType {
  balance: number;
  cryptoBalances: CryptoBalance[];
  withdrawals: Withdrawal[];
  deposits: Deposit[];
  isLoading: boolean;
  refetchBalance: () => Promise<void>;
  refetchCryptoBalances: () => Promise<void>;
  refetchWithdrawals: () => Promise<void>;
  refetchDeposits: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType>({
  balance: 0,
  cryptoBalances: [],
  withdrawals: [],
  deposits: [],
  isLoading: true,
  refetchBalance: async () => {},
  refetchCryptoBalances: async () => {},
  refetchWithdrawals: async () => {},
  refetchDeposits: async () => {},
});

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [cryptoBalances, setCryptoBalances] = useState<CryptoBalance[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBalance = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_balances')
      .select('usdt_balance')
      .eq('user_id', user.id)
      .single();
    if (data) setBalance(Number(data.usdt_balance));
  }, [user]);

  const fetchCryptoBalances = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_crypto_balances')
      .select('symbol, amount')
      .eq('user_id', user.id);
    if (data) setCryptoBalances(data.map(d => ({ symbol: d.symbol, amount: Number(d.amount) })));
  }, [user]);

  const fetchWithdrawals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('withdrawals')
      .select('id, amount, status, created_at, network')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setWithdrawals(data);
  }, [user]);

  const fetchDeposits = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('deposits')
      .select('id, amount, reason, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setDeposits(data);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setBalance(0);
      setCryptoBalances([]);
      setWithdrawals([]);
      setDeposits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([fetchBalance(), fetchCryptoBalances(), fetchWithdrawals(), fetchDeposits()]).finally(() => setIsLoading(false));

    const balanceChannel = supabase
      .channel('global-balance')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_balances',
        filter: `user_id=eq.${user.id}`,
      }, (payload: { new: { usdt_balance?: number } }) => {
        if (payload.new?.usdt_balance !== undefined) {
          setBalance(Number(payload.new.usdt_balance));
        }
      })
      .subscribe();

    const cryptoChannel = supabase
      .channel('global-crypto-balances')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_crypto_balances',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchCryptoBalances();
      })
      .subscribe();

    const withdrawalChannel = supabase
      .channel('global-withdrawals')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'withdrawals',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchWithdrawals();
      })
      .subscribe();

    const depositChannel = supabase
      .channel('global-deposits')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deposits',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchDeposits();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(balanceChannel);
      supabase.removeChannel(cryptoChannel);
      supabase.removeChannel(withdrawalChannel);
      supabase.removeChannel(depositChannel);
    };
  }, [user, fetchBalance, fetchCryptoBalances, fetchWithdrawals, fetchDeposits]);

  return (
    <UserDataContext.Provider value={{
      balance,
      cryptoBalances,
      withdrawals,
      deposits,
      isLoading,
      refetchBalance: fetchBalance,
      refetchCryptoBalances: fetchCryptoBalances,
      refetchWithdrawals: fetchWithdrawals,
      refetchDeposits: fetchDeposits,
    }}>
      {children}
    </UserDataContext.Provider>
  );
};
