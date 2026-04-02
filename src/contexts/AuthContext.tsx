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

const clearLocalAuthState = () => {
  const keys = Object.keys(localStorage);
  keys.forEach((key) => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSessionHandled = useRef(false);
  const validationInFlight = useRef<Promise<void> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const finishLoading = () => {
      if (!isMounted) return;
      initialSessionHandled.current = true;
      setLoading(false);
    };

    const applyUser = (nextUser: User | null) => {
      if (!isMounted) return;
      setUser(nextUser);
    };

    const validateSession = (blockUi = false) => {
      if (validationInFlight.current) return validationInFlight.current;

      const validationTask = (async () => {
        if (blockUi && isMounted) {
          setLoading(true);
        }

        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (!isMounted) return;

          if (!session) {
            applyUser(null);
            return;
          }

          const { data, error } = await supabase.auth.getUser();

          if (!isMounted) return;

          if (error || !data.user) {
            console.warn('[Auth] Session validation failed, clearing local auth state');
            clearLocalAuthState();
            applyUser(null);
            return;
          }

          applyUser(data.user);
        } catch (e) {
          console.error('[Auth] Session validation error:', e);
          clearLocalAuthState();
          applyUser(null);
        } finally {
          validationInFlight.current = null;
          finishLoading();
        }
      })();

      validationInFlight.current = validationTask;
      return validationTask;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      console.log('[Auth] event:', event, 'authenticated:', !!session?.user);

      if (event === 'SIGNED_OUT') {
        applyUser(null);
        finishLoading();
        return;
      }

      applyUser(session?.user ?? null);
    });

    const handleAppResume = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void validateSession(true);
    };

    void validateSession();
    window.addEventListener('focus', handleAppResume);
    document.addEventListener('visibilitychange', handleAppResume);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('focus', handleAppResume);
      document.removeEventListener('visibilitychange', handleAppResume);
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.error('[Auth] signOut error, forcing local cleanup:', e);
    }
    clearLocalAuthState();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
