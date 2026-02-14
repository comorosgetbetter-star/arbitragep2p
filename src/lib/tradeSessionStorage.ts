export const TRADE_SESSION_KEY = 'activeTradeSession';
export const SELECTED_PACKAGE_KEY = 'selectedPackage';
export const PAYMENT_STATE_PREFIX = 'tradePaymentState:';

// Keep hook instances (badge, payment page, etc.) in sync.
export const TRADE_SESSION_CHANGED_EVENT = 'trade-session-changed';

export const notifyTradeSessionChange = () => {
  try {
    window.dispatchEvent(new Event(TRADE_SESSION_CHANGED_EVENT));
  } catch {
    // ignore
  }
};

export const clearTradeStorage = () => {
  try {
    localStorage.removeItem(TRADE_SESSION_KEY);
    localStorage.removeItem(SELECTED_PACKAGE_KEY);

    // Remove per-session payment state snapshots.
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(PAYMENT_STATE_PREFIX)) {
        localStorage.removeItem(key);
      }
    }
  } finally {
    notifyTradeSessionChange();
  }
};

/** Clear pending trade intent (used on logout) */
export const clearPendingTrade = () => {
  localStorage.removeItem('pendingTrade');
};
