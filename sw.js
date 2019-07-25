// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = 'v2::static';

function updateStaticCache() {
  return caches.open(cacheName).then(cache => {
    return cache.addAll([
      '/',
      '/index.html',
      '/Tetromino.js',
      '/bit-tools.js',
      '/blocks.js',
      '/canvas.js',
      '/config.js',
      '/down.svg',
      '/favicon.png',
      '/font.woff',
      '/font.woff2',
      '/index.css',
      '/index.js',
      '/left.svg',
      '/memory.js',
      '/right.svg',
      '/rotate.svg',
      '/vue.js',
    ]);
  });
}

self.addEventListener('install', event => {
  event.waitUntil(updateStaticCache().then(() => self.skipWaiting()));
});

// self.addEventListener('activate', event => {
//   event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
// });

self.addEventListener('fetch', event => {
  let request = event.request;
  event.respondWith(fetch(request).catch(() => caches.match(request)));
  return;
});