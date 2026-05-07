/**
 * table-ro Service Worker — Offline-first caching
 * Strategy: Cache-first for static assets, network-first for API calls
 */

const CACHE_NAME = 'table-ro-v6';

const STATIC_ASSETS = [
    '/table-ro/',
    '/table-ro/index.html',
    '/table-ro/css/styles.css',
    '/table-ro/js/app.js',
    '/table-ro/manifest.json',
    '/table-ro/fonts/Chillax-Regular.woff2',
    '/table-ro/fonts/Chillax-Semibold.woff2',
    '/table-ro/fonts/Chillax-Bold.woff2',
];

// Install: pre-cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip API / external requests — let them go to network
    if (url.origin !== self.location.origin) return;
    if (url.pathname.includes('/api/')) return;

    // Cache-first for static assets
    event.respondWith(
        caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return fetch(event.request).then((response) => {
                // Cache new static assets on the fly
                if (response.ok && url.pathname.startsWith('/table-ro/')) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return response;
            });
        })
    );
});