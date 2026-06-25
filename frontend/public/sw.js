// Minimal offline-first service worker — caches the app shell so the caregiver
// field app's UI still loads with no connectivity (§1.3). API calls are left to
// the in-app IndexedDB sync queue (src/lib/offlineQueue.js), not cached here.
const CACHE = 'matrupitru-shell-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(['/']))
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || request.url.includes('/v1/')) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            caches.open(CACHE).then((cache) => cache.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
