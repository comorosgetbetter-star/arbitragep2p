import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMemberAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resolveAccess = async () => {
      if (authLoading) return;

      if (!user) {
        setIsAdmin(false);
        setRoleLoading(false);
        return;
      }

      setRoleLoading(true);

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (cancelled) return;

      if (error) {
        console.warn('[useMemberAccess] admin role check failed:', error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }

      setRoleLoading(false);
    };

    void resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const loading = authLoading || (!!user && roleLoading);

  return {
    user,
    isAdmin,
    loading,
    canUseMemberFeatures: !!user && !isAdmin && !loading,
  };
};
