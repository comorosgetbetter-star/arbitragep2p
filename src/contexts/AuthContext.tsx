import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import { clearPendingTrade, clearTradeStorage } from '@/lib/tradeSessionStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => {} });

export const useAuth = () => useContext(AuthContext);

const clearLocalAuthState = () => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
};

const clearSensitiveClientState = (includePendingTrade = false) => {
  clearLocalAuthState();
  clearTradeStorage();

  if (includePendingTrade) {
    clearPendingTrade();
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const applyUser = (nextUser: User | null) => {
      if (!isMounted) return;
      setUser(nextUser);
      setLoading(false);
    };

    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        applyUser(session?.user ?? null);
      } catch (error) {
        console.error('[Auth] Failed to restore session:', error);
        applyUser(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      console.log('[Auth] event:', event, 'authenticated:', !!session?.user);

      if (event === 'SIGNED_OUT') {
        clearSensitiveClientState(true);
      }

      applyUser(session?.user ?? null);
    });

    void initializeSession();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('[Auth] signOut error, forcing local cleanup:', e);
    }
    clearSensitiveClientState(true);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
