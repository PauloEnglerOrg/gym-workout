// Offline helper: keeps a copy of the app and all pictures on the phone,
// so it still opens in a gym basement with no signal.
importScripts('library.js');

const VERSION = 'gym-v4';
const CORE = ['./', 'index.html', 'app.js', 'library.js', 'picto.js', 'picto-data.js', 'plan.js', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png'];
const IMAGES = LIBRARY.flatMap(e => [`img/${e.id}-0.jpg`, `img/${e.id}-1.jpg`]);

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // 'reload' skips the browser's own cached copy, so a new version always saves fresh files
    await cache.addAll(CORE.map(u => new Request(u, { cache: 'reload' })));
    await Promise.allSettled(IMAGES.map(u => cache.add(u)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const isImage = /\/img\/.+\.jpg$/.test(req.url);
  e.respondWith(isImage ? cacheFirst(req) : networkFirst(req));
});

async function cacheFirst(req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

// Code files: try the network for up to 2.5 s (so updates arrive), otherwise use the saved copy.
async function networkFirst(req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await Promise.race([
      fetch(req, { cache: 'no-cache' }),
      new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 2500))
    ]);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await cache.match(req, { ignoreSearch: true });
    if (hit) return hit;
    return fetch(req);
  }
}
