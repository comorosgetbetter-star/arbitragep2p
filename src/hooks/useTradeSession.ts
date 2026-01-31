import { useState, useEffect, useCallback } from 'react';

export interface TradeSession {
  usd: number;
  usdt: number;
  isCustom?: boolean;
  startedAt: number; // timestamp
  expiresAt: number; // timestamp
}

const TRADE_SESSION_KEY = 'activeTradeSession';
const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes in ms

export const useTradeSession = () => {
  const [session, setSession] = useState<TradeSession | null>(null);

  // Load session from storage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(TRADE_SESSION_KEY);
    if (stored) {
      try {
        const parsed: TradeSession = JSON.parse(stored);
        // Check if session is still valid
        if (Date.now() < parsed.expiresAt) {
          setSession(parsed);
        } else {
          // Session expired, clear it
          sessionStorage.removeItem(TRADE_SESSION_KEY);
          sessionStorage.removeItem('selectedPackage');
        }
      } catch {
        sessionStorage.removeItem(TRADE_SESSION_KEY);
      }
    }
  }, []);

  // Start a new trade session
  const startSession = useCallback((usd: number, usdt: number, isCustom?: boolean) => {
    const now = Date.now();
    const newSession: TradeSession = {
      usd,
      usdt,
      isCustom,
      startedAt: now,
      expiresAt: now + SESSION_DURATION,
    };
    
    sessionStorage.setItem(TRADE_SESSION_KEY, JSON.stringify(newSession));
    sessionStorage.setItem('selectedPackage', JSON.stringify({ usd, usdt, isCustom }));
    setSession(newSession);
    
    return newSession;
  }, []);

  // Clear the current session
  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TRADE_SESSION_KEY);
    sessionStorage.removeItem('selectedPackage');
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
    const stored = sessionStorage.getItem(TRADE_SESSION_KEY);
    if (!stored) return false;
    
    try {
      const parsed: TradeSession = JSON.parse(stored);
      return Date.now() < parsed.expiresAt;
    } catch {
      return false;
    }
  }, []);

  // Get session without state (for immediate checks)
  const getStoredSession = useCallback((): TradeSession | null => {
    const stored = sessionStorage.getItem(TRADE_SESSION_KEY);
    if (!stored) return null;
    
    try {
      const parsed: TradeSession = JSON.parse(stored);
      if (Date.now() < parsed.expiresAt) {
        return parsed;
      }
    } catch {
      // Invalid session
    }
    return null;
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
