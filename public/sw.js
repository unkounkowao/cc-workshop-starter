const CACHE_NAME = 'charsheet-v1'

// インストール時：即座にアクティブ化
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// フェッチ：キャッシュ優先、バックグラウンドで更新
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  // chrome-extension等は無視
  if (!url.protocol.startsWith('http')) return

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request)

      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            cache.put(event.request, response.clone())
          }
          return response
        })
        .catch(() => {
          // オフライン時はキャッシュから返す
          if (cached) return cached
          // HTMLリクエストならトップページのキャッシュを返す
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return cache.match('/cc-workshop-starter/')
          }
          return new Response('Offline', { status: 503 })
        })

      // キャッシュがあればすぐ返し、バックグラウンドで更新
      return cached || fetchPromise
    })
  )
})
