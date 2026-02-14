import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  TRADE_SESSION_KEY,
  SELECTED_PACKAGE_KEY,
  TRADE_SESSION_CHANGED_EVENT,
  notifyTradeSessionChange,
  clearTradeStorage,
  clearPendingTrade,
} from '@/lib/tradeSessionStorage';

export interface TradeSession {
  id: string;
  usd: number;
  usdt: number;
  isCustom?: boolean;
  userId?: string;
  startedAt: number; // timestamp
  expiresAt: number; // timestamp
}
const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes in ms

const generateSessionId = (now: number) => {
  // crypto.randomUUID is supported in modern browsers; fallback kept for safety.
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const c = (globalThis as any).crypto;
    if (c?.randomUUID) return c.randomUUID() as string;
  } catch {
    // ignore
  }
  return `${now}-${Math.random().toString(16).slice(2)}`;
};

const readSessionFromStorage = (): TradeSession | null => {
  const stored = localStorage.getItem(TRADE_SESSION_KEY);
  if (!stored) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw: any = JSON.parse(stored);
    if (!raw || typeof raw !== 'object') return null;

    const startedAt = typeof raw.startedAt === 'number' ? raw.startedAt : Date.now();
    const expiresAt = typeof raw.expiresAt === 'number' ? raw.expiresAt : startedAt;
    const usd = typeof raw.usd === 'number' ? raw.usd : 0;
    const usdt = typeof raw.usdt === 'number' ? raw.usdt : 0;
    const userId = typeof raw.userId === 'string' && raw.userId.length > 0 ? raw.userId : undefined;

    // Backward compatibility: older sessions may not have an id.
    const id = typeof raw.id === 'string' && raw.id.length > 0 ? raw.id : String(startedAt);

    const normalized: TradeSession = {
      id,
      usd,
      usdt,
      isCustom: !!raw.isCustom,
      userId,
      startedAt,
      expiresAt,
    };

    if (Date.now() >= normalized.expiresAt) return null;

    // Persist normalization (adds id for old sessions)
    localStorage.setItem(TRADE_SESSION_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return null;
  }
};

const notifySessionChange = () => notifyTradeSessionChange();

export const useTradeSession = () => {
  // Initialize synchronously from sessionStorage so UI (badge) appears immediately.
  const [session, setSession] = useState<TradeSession | null>(() => readSessionFromStorage());

  // Keep trade session strictly tied to a verified login lifecycle.
  // - On SIGNED_OUT: purge all trade storage so logged-out users never see/continue prior trades.
  // - On SIGNED_IN: bind anonymous (pre-login) sessions to the signed-in user without restarting the timer.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (event === 'SIGNED_OUT') {
        clearTradeStorage();
        clearPendingTrade();
        setSession(null);
        return;
      }

      if (event === 'SIGNED_IN' && authSession?.user) {
        const stored = readSessionFromStorage();
        if (!stored) return;

        // If a stored session belongs to a different user, purge it.
        if (stored.userId && stored.userId !== authSession.user.id) {
          clearTradeStorage();
          setSession(null);
          return;
        }

        // Bind anonymous sessions (created pre-login) to the signed-in user.
        if (!stored.userId) {
          const bound: TradeSession = { ...stored, userId: authSession.user.id };
          localStorage.setItem(TRADE_SESSION_KEY, JSON.stringify(bound));

          // Keep selectedPackage consistent for payment restore logic.
          const selected = localStorage.getItem(SELECTED_PACKAGE_KEY);
          if (selected) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pkg: any = JSON.parse(selected);
              if (pkg && typeof pkg === 'object' && !pkg.sessionId) {
                pkg.sessionId = bound.id;
                localStorage.setItem(SELECTED_PACKAGE_KEY, JSON.stringify(pkg));
              }
            } catch {
              // ignore
            }
          }

          setSession(bound);
          notifySessionChange();
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load session from storage on mount
  useEffect(() => {
    const stored = readSessionFromStorage();
    if (stored) {
      setSession(stored);
      return;
    }

    // Session expired or invalid, clear it.
    clearTradeStorage();
  }, []);

  // Keep multiple hook instances in sync (badge, payment page, etc.)
  useEffect(() => {
    const sync = () => setSession(readSessionFromStorage());
    window.addEventListener(TRADE_SESSION_CHANGED_EVENT, sync);
    // storage does not reliably fire for sessionStorage in the same tab, but keep for completeness.
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TRADE_SESSION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Start a new trade session
  const startSession = useCallback((usd: number, usdt: number, isCustom?: boolean, userId?: string) => {
    const now = Date.now();
    const newSession: TradeSession = {
      id: generateSessionId(now),
      usd,
      usdt,
      isCustom,
      userId,
      startedAt: now,
      expiresAt: now + SESSION_DURATION,
    };
    
    localStorage.setItem(TRADE_SESSION_KEY, JSON.stringify(newSession));
    localStorage.setItem(SELECTED_PACKAGE_KEY, JSON.stringify({ usd, usdt, isCustom, sessionId: newSession.id }));
    setSession(newSession);
    notifySessionChange();
    
    return newSession;
  }, []);

  // Clear the current session
  const clearSession = useCallback(() => {
    clearTradeStorage();
    setSession(null);
  }, []);

  // Check if session is still valid
  const isSessionValid = useCallback(() => {
    if (!session) return false;
    return Date.now() < session.expiresAt;
  }, [session]);

  // Get remaining time in seconds
  const getRemainingTime = useCallback(() => {
    if (!session) return 0;
    const remaining = Math.max(0, session.expiresAt - Date.now());
    return Math.floor(remaining / 1000);
  }, [session]);

  // Check for existing session (used when selecting new package)
  const hasActiveSession = useCallback(() => {
    return !!readSessionFromStorage();
  }, []);

  // Get session without state (for immediate checks)
  const getStoredSession = useCallback((): TradeSession | null => {
    return readSessionFromStorage();
  }, []);

  return {
    session,
    startSession,
    clearSession,
    isSessionValid,
    getRemainingTime,
    hasActiveSession,
    getStoredSession,
  };
};
