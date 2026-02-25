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

interface UserDataContextType {
  balance: number;
  withdrawals: Withdrawal[];
  deposits: Deposit[];
  isLoading: boolean;
  refetchBalance: () => Promise<void>;
  refetchWithdrawals: () => Promise<void>;
  refetchDeposits: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType>({
  balance: 0,
  withdrawals: [],
  deposits: [],
  isLoading: true,
  refetchBalance: async () => {},
  refetchWithdrawals: async () => {},
  refetchDeposits: async () => {},
});

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
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

  // Eagerly fetch all data on login
  useEffect(() => {
    if (!user) {
      setBalance(0);
      setWithdrawals([]);
      setDeposits([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([fetchBalance(), fetchWithdrawals(), fetchDeposits()]).finally(() => setIsLoading(false));

    // Realtime subscriptions for instant updates
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
      supabase.removeChannel(withdrawalChannel);
      supabase.removeChannel(depositChannel);
    };
  }, [user, fetchBalance, fetchWithdrawals, fetchDeposits]);

  return (
    <UserDataContext.Provider value={{
      balance,
      withdrawals,
      deposits,
      isLoading,
      refetchBalance: fetchBalance,
      refetchWithdrawals: fetchWithdrawals,
      refetchDeposits: fetchDeposits,
    }}>
      {children}
    </UserDataContext.Provider>
  );
};
