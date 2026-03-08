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
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Auth] event:', event, 'authenticated:', !!session?.user);
      setUser(session?.user ?? null);

      if (event === 'INITIAL_SESSION' || !initialSessionHandled.current) {
        initialSessionHandled.current = true;
        setLoading(false);
      }
    });

    // Fallback: if onAuthStateChange doesn't fire INITIAL_SESSION within 2 seconds,
    // manually check the session to prevent the app from being stuck in loading state
    const fallbackTimer = setTimeout(async () => {
      if (!initialSessionHandled.current) {
        console.log('[Auth] Fallback: checking session manually');
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        initialSessionHandled.current = true;
        setLoading(false);
      }
    }, 2000);

    return () => {
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
