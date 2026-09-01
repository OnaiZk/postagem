const CACHE_NAME = 'eletromidia-postagem-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/assets/LOGOELETRO.png',
  '/assets/Eletromidia Horizontal (3).png',
  '/assets/eletromidia-app logo-512px.png',
  '/assets/eletromidia-app logo-1024px.png',
  '/fonts/RethinkSans-Medium.ttf',
  '/fonts/RethinkSans-Bold.ttf'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request).catch(() => caches.match('/index.html'));
    })
  );
});
