import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Service worker cleanup — the previous PeerBitX SW cached stale index.html
// references, causing white pages in in-app browsers (Nicegram, Telegram, etc.)
// after redeploys. We now ship a kill-switch worker at /sw.js that unregisters
// itself, and we no longer register any new service worker here. Any browser
// that still has the old SW will fetch the replacement /sw.js on next visit,
// which wipes caches and unregisters. Returning visitors self-heal in one load.
(() => {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {});
  if (window.caches?.keys) {
    caches.keys().then((names) => names.forEach((n) => caches.delete(n))).catch(() => {});
  }
})();
