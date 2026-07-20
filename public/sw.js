// DartFit Service Worker — push notifications + offline app shell
const CACHE = 'dartfit-v3';
const STATIC_ASSETS = [
  '/fonts.css',
  '/fonts/inter-var.woff2',
  '/fonts/outfit-var.woff2',
  '/fonts/sharetechmono-400.woff2',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png',
  '/manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;

  // API: network only — fitting results must always be live
  if (url.pathname.startsWith('/api/')) return;

  // Static assets: cache-first (immutable between SW versions)
  if (STATIC_ASSETS.includes(url.pathname)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
    return;
  }

  // App shell (HTML): network-first so deploys land instantly,
  // cached copy as offline fallback
  if (e.request.mode === 'navigate' || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
  }
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(self.registration.showNotification(data.title || 'DartFit', {
    body: data.body || 'New dart alert!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
    actions: [{ action: 'view', title: 'View Dart' }]
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.notification.data?.url || '/';
  e.waitUntil(clients.openWindow(url));
});
