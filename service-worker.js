// service-worker.js

const CACHE_NAME = 'biblioteca-v2';
const URLs_TO_CACHE = [
  '/',                      // raíz (index.html)
  '/index.html',
  '/minutas.html',
  '/manifest.json',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/service-worker.js',
  '/docs/calculadora_abonos.html'
  // + añade aquí cualquier otro CSS/JS/asset local que uses:
  // '/styles.css',
  // '/scripts.js',
];

self.addEventListener('install', event => {
  // Precache de archivos estáticos esenciales
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLs_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  // Limpiar caches antiguas
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Solo manejamos solicitudes GET
  if (event.request.method !== 'GET') return;

  // Si es navegación (página), intentamos siempre red y fallback offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Si la petición red es exitosa, la devolvemos
          return response;
        })
        .catch(() => {
          // Si falla (offline), servimos minutas.html o index.html
          return caches.match('/minutas.html')
            .then(cached => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Para recursos estáticos (CSS, JS, imágenes, etc.)
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Si lo encontramos en cache, lo devolvemos
          return cachedResponse;
        }
        // Si no, vamos a la red y lo almacenamos dinámicamente
        return fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
  );
});
