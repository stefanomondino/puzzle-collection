const CACHE_NAME = 'puzzle-v4';
const ASSETS = [
  './',
  './index.html',
  './crowns.html',
  './pathtrace.html',
  './armonia.html',
  './logica.html',
  './indovina.html',
  './labamba.html',
  './confini.html',
  './scaletta.html',
  './icon.svg'
];

self.addEventListener('install', e => {
  // Cache assets individually so a single failure doesn't block install
  e.waitUntil(
    caches.open(CACHE_NAME).then(c =>
      Promise.allSettled(ASSETS.map(url => c.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Only handle same-origin navigation and asset requests
  if (url.origin !== self.location.origin) return;

  // Network first, cache fallback, then network error passthrough
  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() =>
        caches.match(e.request).then(cached => {
          if (cached) return cached;
          // No cache match: let the browser handle the error naturally
          return fetch(e.request);
        })
      )
  );
});
