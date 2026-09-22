// Mapa do Maroto · edição 19 anos — service worker
const CACHE = 'maroto-19-v2';
const CORE = [
  './', './index.html', './styles.css?v=19', './app.js?v=19', './manifest.json?v=19', './favicon.svg?v=19',
  './assets/icon-192.png', './assets/icon-512.png',
  './fotos/thumb-01.jpg', './fotos/thumb-02.jpg', './fotos/thumb-03.jpg', './fotos/thumb-04.jpg',
  './fotos/thumb-05.jpg', './fotos/thumb-06.jpg', './fotos/thumb-07.jpg',
  './fotos/foto-01.jpg', './fotos/foto-02.jpg', './fotos/foto-03.jpg', './fotos/foto-04.jpg',
  './fotos/foto-05.jpg', './fotos/foto-06.jpg', './fotos/foto-07.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => Promise.allSettled(CORE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// HTML/CSS/JS: rede primeiro (pra atualizar sempre que eu mudar algo), cache se estiver offline.
// Fotos e ícones: cache primeiro.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  const isCore = req.mode === 'navigate' || /\.(html|css|js|json)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (isCore) {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
        .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
