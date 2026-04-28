// 归墟 Service Worker — Web Push 推送 + 旧缓存清理

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
      data: {
        url: self.registration.scope,
        ...data.data,
      },
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || '澈', options)
    );
  } catch (e) {
    console.error('[SW] push parse error:', e);
  }
});

// 点击通知打开归墟
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
  // 清理旧版本的离线缓存
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k.startsWith('llm-hub-'); })
            .map(function(k) { 
              console.log('[SW] 清理旧缓存:', k);
              return caches.delete(k); 
            })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});
