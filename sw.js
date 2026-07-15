// ================================================================
// SERVICE WORKER — PrendaVaro Cotizador
//
// ⚠ IMPORTANTE: Cada vez que se actualicen precios o tasas,
//   cambiar CACHE_VERSION a la fecha del cambio.
//   Esto fuerza a todos los dispositivos a descargar la versión nueva.
//
//   Ejemplo: '2026-03-03' → '2026-05-15'
// ================================================================

const CACHE_VERSION = '2026-07-15';
const CACHE_NAME    = `prendavaro-${CACHE_VERSION}`;

const FILES_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// ----------------------------------------------------------------
// INSTALL — Cachea todos los archivos al instalar el SW
// ----------------------------------------------------------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(FILES_TO_CACHE))
      .then(() => self.skipWaiting()) // Activa inmediatamente sin esperar
  );
});

// ----------------------------------------------------------------
// ACTIVATE — Elimina cachés viejos de versiones anteriores
// ----------------------------------------------------------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // Toma control de todas las pestañas abiertas
  );
});

// ----------------------------------------------------------------
// FETCH — Estrategia: Network-first, caché como respaldo
//
//   Con internet  → descarga versión más reciente, actualiza caché
//   Sin internet  → sirve desde caché local
// ----------------------------------------------------------------
self.addEventListener('fetch', event => {
  // Solo manejar peticiones GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guardar copia fresca en caché
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request)) // Sin internet: usar caché
  );
});

// ----------------------------------------------------------------
// MESSAGE — Recibe instrucción de activación desde la app
// ----------------------------------------------------------------
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
