import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAdminAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    let cancelled = false;

    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (!cancelled) {
          setIsAdmin(false);
          setUser(null);
          setIsLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setUser(session.user);
      }

      const { data: roleData, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn('[useAdminAuth] admin role check failed:', error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!roleData);
      }

      setIsLoading(false);
    };

    void checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void checkAdminStatus();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, user };
};
