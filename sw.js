/**
 * table-ro Service Worker
 * - Network-first for HTML/JS/CSS (so version bumps always show)
 * - Cache-first only for fonts/icons (stable assets)
 * Bump CACHE_NAME on every release that must reach users.
 */

const CACHE_NAME = 'table-ro-v1.7.8';

const PRECACHE = [
  '/table-ro/manifest.json',
  '/table-ro/icons/icon.svg',
  '/table-ro/icons/icon-maskable.svg',
  '/table-ro/fonts/Chillax-Regular.woff2',
  '/table-ro/fonts/Chillax-Semibold.woff2',
  '/table-ro/fonts/Chillax-Bold.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

function isShellAsset(url) {
  const p = url.pathname;
  if (p.endsWith('.html') || p.endsWith('/')) return true;
  if (p.includes('/js/') || p.endsWith('.js')) return true;
  if (p.includes('/css/') || p.endsWith('.css')) return true;
  if (p.endsWith('/sw.js')) return true;
  return false;
}

function isStaticAsset(url) {
  const p = url.pathname;
  return (
    p.includes('/fonts/') ||
    p.includes('/icons/') ||
    p.endsWith('.woff2') ||
    p.endsWith('.svg') ||
    p.endsWith('manifest.json')
  );
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('/api/')) return;

  // Always network for SW itself
  if (url.pathname.endsWith('/sw.js')) {
    event.respondWith(fetch(req));
    return;
  }

  // HTML / JS / CSS: network-first so ?v= and releases show up
  if (isShellAsset(url) || req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req).then((c) => c || caches.match('/table-ro/index.html')))
    );
    return;
  }

  // Fonts / icons: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, clone));
          }
          return res;
        });
      })
    );
  }
});
