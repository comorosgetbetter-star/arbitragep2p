// Kill-switch service worker — replaces the previous PeerBitX SW.
// Purpose: evict stale caches that were serving old index.html referencing
// hashed JS chunks that no longer exist after redeploys (causing white pages
// in in-app browsers like Nicegram / Telegram webviews).
//
// This worker takes over the /sw.js scope, wipes its own caches, claims all
// clients, reloads open tabs, then unregisters itself. After one visit,
// affected users no longer have any service worker registered.

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('fetch', () => {
  // Do nothing — fall through to the network for every request.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.allSettled(cacheNames.map((name) => caches.delete(name)));
        await self.clients.claim();
        const windowClients = await self.clients.matchAll({ type: 'window' });
        await Promise.allSettled(windowClients.map((client) => client.navigate(client.url)));
      } finally {
        await self.registration.unregister();
      }
    })(),
  );
});
