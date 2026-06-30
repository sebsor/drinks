// Heron & Oak — minimal service worker
//
// This file exists for one reason: Chrome's PWA installability criteria
// require a registered service worker with a real fetch handler before it
// will treat "Add to Home Screen" as a true install rather than a bookmark
// shortcut (the small browser badge on the icon is Chrome's way of marking
// shortcuts). Empty/no-op fetch handlers are explicitly ignored by Chrome,
// so this does real (if simple) work: cache the app shell, serve it from
// cache when offline, and let everything else hit the network normally.

const CACHE_NAME = 'heron-oak-shell-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Network-first for the app shell so updates show up on next load;
  // falls back to the cached copy if the network is unavailable.
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
