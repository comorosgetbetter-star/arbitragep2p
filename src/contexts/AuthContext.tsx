import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
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
  const authEventVersion = useRef(0);

  useEffect(() => {
    let isMounted = true;

    const applyUser = (nextUser: User | null) => {
      if (!isMounted) return;
      setUser(nextUser);
      setLoading(false);
    };

    const initializeSession = async () => {
      const startedAtVersion = authEventVersion.current;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (startedAtVersion !== authEventVersion.current) return;
        applyUser(session?.user ?? null);
      } catch (error) {
        if (startedAtVersion !== authEventVersion.current) return;
        console.error('[Auth] Failed to restore session:', error);
        applyUser(null);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event !== 'INITIAL_SESSION') {
        authEventVersion.current += 1;
      }
      console.log('[Auth] event:', event, 'authenticated:', !!session?.user);

      if (event === 'SIGNED_OUT') {
        clearSensitiveClientState(true);
      }

      const nextUser = session?.user ?? null;
      // Preserve identity across TOKEN_REFRESHED / USER_UPDATED so downstream
      // effects (useMemberAccess, page effects) don't remount forms and lose
      // state when the tab returns from background on mobile / PWA.
      setUser((prev) => {
        if (prev && nextUser && prev.id === nextUser.id) return prev;
        return nextUser;
      });
      setLoading(false);
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
