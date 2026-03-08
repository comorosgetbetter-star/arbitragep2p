import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, signOut: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSessionHandled = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const applySession = (sessionUser: User | null) => {
      if (!isMounted) return;
      setUser(sessionUser);
    };

    const finishInit = () => {
      if (!isMounted || initialSessionHandled.current) return;
      initialSessionHandled.current = true;
      setLoading(false);
    };

    // Listen for auth changes first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] event:', event, 'authenticated:', !!session?.user);
      applySession(session?.user ?? null);

      if (event === 'INITIAL_SESSION') {
        finishInit();
      }
    });

    // Resolve auth readiness immediately from persisted session
    void supabase.auth.getSession()
      .then(({ data: { session } }) => {
        applySession(session?.user ?? null);
        finishInit();
      })
      .catch((error) => {
        console.error('[Auth] getSession error:', error);
        finishInit();
      });

    // Safety net: never keep UI blocked in loading state
    const fallbackTimer = setTimeout(() => {
      finishInit();
    }, 1200);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const signOut = async () => {
    try {
      // Use scope: 'local' to ensure sign out works even if network fails
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('[Auth] signOut error, forcing local cleanup:', e);
      // Force clear local storage auth keys as fallback
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      });
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
