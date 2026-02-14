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

interface UserDataContextType {
  balance: number;
  withdrawals: Withdrawal[];
  isLoading: boolean;
  refetchBalance: () => Promise<void>;
  refetchWithdrawals: () => Promise<void>;
}

const UserDataContext = createContext<UserDataContextType>({
  balance: 0,
  withdrawals: [],
  isLoading: true,
  refetchBalance: async () => {},
  refetchWithdrawals: async () => {},
});

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
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

  // Eagerly fetch all data on login
  useEffect(() => {
    if (!user) {
      setBalance(0);
      setWithdrawals([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    Promise.all([fetchBalance(), fetchWithdrawals()]).finally(() => setIsLoading(false));

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

    return () => {
      supabase.removeChannel(balanceChannel);
      supabase.removeChannel(withdrawalChannel);
    };
  }, [user, fetchBalance, fetchWithdrawals]);

  return (
    <UserDataContext.Provider value={{
      balance,
      withdrawals,
      isLoading,
      refetchBalance: fetchBalance,
      refetchWithdrawals: fetchWithdrawals,
    }}>
      {children}
    </UserDataContext.Provider>
  );
};
