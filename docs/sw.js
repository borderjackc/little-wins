/* Offline support: always try the network first so updates arrive straight away,
   and fall back to the cached copy when the phone is offline. */
const CACHE = 'little-wins-f72e60cf01';
const SHELL = ["./", "index.html", "manifest.webmanifest", "sync.js", "firebase-config.js", "vendor/firebase-app.js", "vendor/firebase-auth.js", "vendor/firebase-firestore.js", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png"];
const FONTS = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const sameOrigin = new URL(req.url).origin === location.origin;
  if (!sameOrigin && !FONTS.test(req.url)) return; // leave Firebase traffic alone
  e.respondWith(caches.open(CACHE).then(async cache => {
    try {
      const res = await fetch(req);
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  }));
});
