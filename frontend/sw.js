const CACHE_NAME = 'zeitstempel-v1';
const ASSETS = ['/', '/css/style.css', '/js/app.js', '/js/api.js', '/js/utils.js', '/js/components.js', '/js/router.js'];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('/api/')) return;
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
