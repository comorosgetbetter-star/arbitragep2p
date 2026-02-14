import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const initialSessionHandled = useRef(false);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Use the session from the event - this handles login, logout, token refresh, etc.
      setUser(session?.user ?? null);

      // Mark loading as done once we receive the initial session event
      if (event === 'INITIAL_SESSION' || !initialSessionHandled.current) {
        initialSessionHandled.current = true;
        setLoading(false);
      }
    });

    // Fallback: if onAuthStateChange doesn't fire INITIAL_SESSION within 2 seconds,
    // manually check the session to prevent the app from being stuck in loading state
    const fallbackTimer = setTimeout(async () => {
      if (!initialSessionHandled.current) {
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

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
