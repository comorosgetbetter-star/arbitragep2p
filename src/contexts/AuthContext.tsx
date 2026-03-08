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

    // Set up auth state listener FIRST — this is the single source of truth.
    // The INITIAL_SESSION event fires synchronously with the persisted session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      console.log('[Auth] event:', event, 'authenticated:', !!session?.user);
      setUser(session?.user ?? null);

      if (!initialSessionHandled.current) {
        initialSessionHandled.current = true;
        setLoading(false);
      }
    });

    // Fallback: if onAuthStateChange doesn't fire within 1.5s (e.g. cold start edge case),
    // manually check the session so the app never stays stuck in loading.
    const fallbackTimer = setTimeout(async () => {
      if (!initialSessionHandled.current && isMounted) {
        console.log('[Auth] Fallback: checking session manually');
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (isMounted) {
            setUser(session?.user ?? null);
          }
        } catch (e) {
          console.error('[Auth] getSession error:', e);
        }
        if (isMounted && !initialSessionHandled.current) {
          initialSessionHandled.current = true;
          setLoading(false);
        }
      }
    }, 1500);

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
