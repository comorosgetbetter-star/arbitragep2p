import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// PWA Service Worker registration — guarded against iframes & Lovable preview hosts.
(() => {
  if (!('serviceWorker' in navigator)) return;

  const inIframe = (() => {
    try { return window.self !== window.top; } catch { return true; }
  })();
  const host = window.location.hostname;
  const isPreview =
    host.includes('id-preview--') ||
    host.includes('lovableproject.com') ||
    host.includes('lovable.app') === false && host.includes('localhost') === false && host.endsWith('.lovable.dev');

  if (inIframe || isPreview) {
    // Clean up any prior SW in preview/iframe to keep editor fresh.
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    return;
  }

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
})();
