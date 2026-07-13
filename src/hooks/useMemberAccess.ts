import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useMemberAccess = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [roleLoading, setRoleLoading] = useState(false);
  const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveAccess = async () => {
      if (authLoading) return;

      if (!user) {
        setIsAdmin(false);
        setRoleLoading(false);
        setCheckedUserId(null);
        return;
      }

      // Already resolved for this user — don't flip loading back on and
      // unmount downstream views (e.g. AssetsView withdraw/convert forms).
      if (checkedUserId === user.id) {
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

      setCheckedUserId(user.id);
      setRoleLoading(false);
    };

    void resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const loading = authLoading || (!!user && (roleLoading || checkedUserId !== user.id));

  return {
    user,
    isAdmin,
    loading,
    canUseMemberFeatures: !!user && !isAdmin && !loading,
  };
};
