// we'll version our cache (and learn how to delete caches in
// some other post)
const cacheName = 'v16::static';

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
      '/favicon.png',
      '/font.woff',
      '/font.woff2',
      '/index.css',
      '/index.js',
      '/memory.js',
      '/vue.js',
    ]);
  });
}

function clearOldCaches() {
  return caches.keys().then(keys => {
    return Promise.all(
      keys
        .filter(key => {
          return !key.startsWith(cacheName);
        })
        .map(key => {
          return caches.delete(key);
        })
    );
  });
}

self.addEventListener('install', event => {
  event.waitUntil(updateStaticCache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(clearOldCaches().then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  let request = event.request;
  event.respondWith(caches.match(request).then(res => {
    console.log(request.url, !!res);

    return res || fetch(request);

    if (res) {
      console.log(res.status);
      return res;
    }

    return fetch(request);
  }));
});
