/* =========================================================
   Aura · Espacio — Service Worker
   Estrategia:
   - navegación: red primero, cache de la última visita, offline.html
   - estáticos de Next: cache primero
   - API/Supabase: siempre red (nunca cachear datos privados)
   ========================================================= */
const VERSION = 'anotador-v1'
const APP_SHELL = [
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/avatars/') ||
    /\.(?:css|js|mjs|woff2?|ttf|otf|png|jpg|jpeg|webp|svg|ico|json)$/.test(
      url.pathname
    )
  )
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Supabase y otras APIs: siempre red, sin cache.
  if (url.origin !== self.location.origin) return
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/signup')
  ) {
    return
  }

  // Navegación: red primero, luego cache, luego offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (
            response.ok &&
            !response.headers.get('cache-control')?.includes('no-store')
          ) {
            const copy = response.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          return (
            (await caches.match('/offline.html')) ??
            new Response('Sin conexión', { status: 503 })
          )
        })
    )
    return
  }

  // Estáticos: cache primero, luego red.
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone()
            caches.open(VERSION).then((cache) => cache.put(request, copy))
          }
          return response
        })
      })
    )
    return
  }

  // Resto: red con fallback a cache.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone()
          caches.open(VERSION).then((cache) => cache.put(request, copy))
        }
        return response
      })
      .catch(() => caches.match(request))
  )
})
