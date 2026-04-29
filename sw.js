// 归墟 Service Worker — Web Push + 自动更新

const SW_VERSION = 'v61';

// HTML 页面永远走网络（保证 PWA 每次打开拿最新代码）
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  // 只拦截同源的 HTML 导航请求
  if (event.request.mode === 'navigate' && url.origin === self.location.origin) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return caches.match(event.request);
      })
    );
  }
});

// Push 通知
self.addEventListener('push', function(event) {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'guixu-dream-' + Date.now(),
      renotify: true,
      data: { url: self.registration.scope, ...data.data },
    };
    event.waitUntil(
      Promise.all([
        self.registration.showNotification(data.title || '澈', options),
        self.clients.matchAll({ type: 'window' }).then(function(clients) {
          clients.forEach(function(client) {
            client.postMessage({ type: 'dream-message', data: data });
          });
        })
      ])
    );
  } catch (e) {
    console.error('[SW] push parse error:', e);
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k.startsWith('llm-hub-'); })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});
