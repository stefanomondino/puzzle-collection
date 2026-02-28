const CACHE_NAME = 'puzzle-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/crowns.html',
  '/pathtrace.html',
  '/armonia.html',
  '/logica.html',
  '/indovina.html',
  '/labamba.html',
  '/confini.html',
  '/scaletta.html',
  '/icon.svg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
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
  // Let cross-origin requests (e.g. iTunes API, audio previews) pass through without SW interference
  if (new URL(e.request.url).origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
