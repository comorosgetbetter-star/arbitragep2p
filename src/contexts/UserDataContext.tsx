import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  network: string;
  crypto_symbol?: string;
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
  loadedForUser: string | null;
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
  loadedForUser: null,
  refetchBalance: async () => {},
  refetchCryptoBalances: async () => {},
  refetchWithdrawals: async () => {},
  refetchDeposits: async () => {},
});

export const useUserData = () => useContext(UserDataContext);

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [balance, setBalance] = useState(0);
  const [cryptoBalances, setCryptoBalances] = useState<CryptoBalance[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Track which user's data we've loaded to prevent stale renders
  const [loadedForUser, setLoadedForUser] = useState<string | null>(null);

  // Request deduplication: track in-flight promises
  const inflightRef = useRef<Record<string, Promise<void>>>({});
  const activeUserIdRef = useRef<string | null>(null);
  const refetchTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Deduplicating wrapper: if a fetch for the same key is already in flight, reuse it
  const deduped = useCallback((key: string, fn: () => Promise<void>) => {
    if (inflightRef.current[key]) return inflightRef.current[key];
    const promise = fn().finally(() => { delete inflightRef.current[key]; });
    inflightRef.current[key] = promise;
    return promise;
  }, []);

  const scheduleRefetch = useCallback((key: string, fn: () => Promise<void>) => {
    if (refetchTimersRef.current[key]) clearTimeout(refetchTimersRef.current[key]);
    refetchTimersRef.current[key] = setTimeout(() => {
      delete refetchTimersRef.current[key];
      fn();
    }, 350);
  }, []);

  const fetchBalance = useCallback(async () => {
    if (!user || authLoading) return;
    const currentUserId = user.id;
    return deduped(`balance-${currentUserId}`, async () => {
      const { data } = await supabase
        .from('user_balances')
        .select('usdt_balance')
        .eq('user_id', currentUserId)
        .single();
      if (activeUserIdRef.current !== currentUserId) return;
      if (data) setBalance(Number(data.usdt_balance));
    });
  }, [user, authLoading, deduped]);

  const fetchCryptoBalances = useCallback(async () => {
    if (!user || authLoading) return;
    const currentUserId = user.id;
    return deduped(`crypto-${currentUserId}`, async () => {
      const { data } = await supabase
        .from('user_crypto_balances')
        .select('symbol, amount')
        .eq('user_id', currentUserId);
      if (activeUserIdRef.current !== currentUserId) return;
      if (data) setCryptoBalances(data.map(d => ({ symbol: d.symbol, amount: Number(d.amount) })));
    });
  }, [user, authLoading, deduped]);

  const fetchWithdrawals = useCallback(async () => {
    if (!user || authLoading) return;
    const currentUserId = user.id;
    return deduped(`withdrawals-${currentUserId}`, async () => {
      const { data } = await supabase
        .from('withdrawals')
        .select('id, amount, status, created_at, network, crypto_symbol' as any)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (activeUserIdRef.current !== currentUserId) return;
      if (data) setWithdrawals(data as any);
    });
  }, [user, authLoading, deduped]);

  const fetchDeposits = useCallback(async () => {
    if (!user || authLoading) return;
    const currentUserId = user.id;
    return deduped(`deposits-${currentUserId}`, async () => {
      const { data } = await supabase
        .from('deposits')
        .select('id, amount, reason, created_at')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(10);
      if (activeUserIdRef.current !== currentUserId) return;
      if (data) setDeposits(data);
    });
  }, [user, authLoading, deduped]);

  useEffect(() => {
    if (authLoading) {
      activeUserIdRef.current = null;
      setIsLoading(true);
      return;
    }

    if (!user) {
      activeUserIdRef.current = null;
      inflightRef.current = {};
      Object.values(refetchTimersRef.current).forEach(clearTimeout);
      refetchTimersRef.current = {};
      setBalance(0);
      setCryptoBalances([]);
      setWithdrawals([]);
      setDeposits([]);
      setIsLoading(false);
      setLoadedForUser(null);
      return;
    }

    activeUserIdRef.current = user.id;

    // Mark loading immediately for this user
    setIsLoading(true);
    setLoadedForUser(null);
    Promise.all([fetchBalance(), fetchCryptoBalances(), fetchWithdrawals(), fetchDeposits()]).finally(() => {
      setIsLoading(false);
      setLoadedForUser(user.id);
    });

    const userDataChannel = supabase
      .channel(`user-data-${user.id}`)
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
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_crypto_balances',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        scheduleRefetch(`crypto-${user.id}`, fetchCryptoBalances);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'withdrawals',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        scheduleRefetch(`withdrawals-${user.id}`, fetchWithdrawals);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'deposits',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        scheduleRefetch(`deposits-${user.id}`, fetchDeposits);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(userDataChannel);
      Object.entries(refetchTimersRef.current).forEach(([key, timer]) => {
        if (key.includes(user.id)) {
          clearTimeout(timer);
          delete refetchTimersRef.current[key];
        }
      });
    };
  }, [user, authLoading, fetchBalance, fetchCryptoBalances, fetchWithdrawals, fetchDeposits, scheduleRefetch]);

  return (
    <UserDataContext.Provider value={{
      balance,
      cryptoBalances,
      withdrawals,
      deposits,
      isLoading,
      loadedForUser,
      refetchBalance: fetchBalance,
      refetchCryptoBalances: fetchCryptoBalances,
      refetchWithdrawals: fetchWithdrawals,
      refetchDeposits: fetchDeposits,
    }}>
      {children}
    </UserDataContext.Provider>
  );
};
