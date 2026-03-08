import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove', 'focus'];

export const useInactivityLogout = () => {
  const { user, signOut } = useAuth();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    clearTimer();
    await signOut();
  }, [signOut, clearTimer]);

  const resetTimer = useCallback(() => {
    if (!user) return;
    clearTimer();
    timeoutRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [user, clearTimer, handleLogout]);

  useEffect(() => {
    if (!user) {
      clearTimer();
      return;
    }

    resetTimer();

    const onActivity = () => resetTimer();

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, onActivity, { passive: true }));

    return () => {
      clearTimer();
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, onActivity));
    };
  }, [user, resetTimer, clearTimer]);
};
