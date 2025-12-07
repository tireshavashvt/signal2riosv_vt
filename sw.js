const CACHE_NAME = 'ti-reshavash-v13';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://unpkg.com/docx@8.5.0/build/index.umd.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Montserrat:wght@600;700&display=swap'
  // Note: Font Awesome and Turnstile loaded directly, not cached
];

// Install - cache assets (don't skipWaiting - let user decide)
self.addEventListener('install', (event) => {
  console.log('SW installing, cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Don't call skipWaiting() here - wait for user to click update
});

// Listen for skip waiting message from page
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW received SKIP_WAITING, activating...');
    self.skipWaiting();
  }
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  console.log('SW activating, cleaning old caches...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => {
          console.log('Deleting old cache:', key);
          return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip non-http(s) requests (chrome-extension, etc.)
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  // Skip API calls - always go to network
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses for same-origin only
        if (response.ok && url.origin === self.location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request);
      })
  );
});
