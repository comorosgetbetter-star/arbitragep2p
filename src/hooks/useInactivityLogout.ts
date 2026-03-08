import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_BEFORE = 60 * 1000; // warn 1 minute before
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];

export const useInactivityLogout = () => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastShownRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    toastShownRef.current = false;
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimers();
    await signOut();
    // Use toast import lazily to avoid circular deps
    const { toast } = await import('sonner');
    toast.info('You have been signed out due to inactivity.');
  }, [signOut, clearTimers]);

  const resetTimers = useCallback(() => {
    if (!user) return;
    clearTimers();

    // Warning timer
    warningRef.current = setTimeout(() => {
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        import('sonner').then(({ toast }) => {
          toast.warning('Session expiring soon', {
            description: 'You will be signed out in 1 minute due to inactivity.',
            duration: 10000,
          });
        });
      }
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE);

    // Logout timer
    timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [user, clearTimers, handleLogout]);

  useEffect(() => {
    if (!user) {
      clearTimers();
      return;
    }

    resetTimers();

    const onActivity = () => resetTimers();

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));

    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity));
    };
  }, [user, resetTimers, clearTimers]);
};
