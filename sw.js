/* 归墟 Service Worker
   iPhone/PWA 更新关键点：
   - 注册 sw.js 时带版本号：sw.js?v=xxx
   - SW 里用该版本号做 cache 名称，避免旧缓存“死锁”
*/
const VERSION = new URL(self.location.href).searchParams.get("v") || "v1";
const CACHE_NAME = "llm-hub-" + VERSION;

const ASSETS = [
  "./",
  "./index.html",
  "./connections.html",
  "./memory.html",
  "./data.html",
  "./styles.css",
  "./state.js",
  "./config.js",
  "./api.js",
  "./chat.js",
  "./connections.js",
  "./memory.js",
  "./data.js",
  "./mcp.js",
  "./tts.js",
  "./imagegen.js",
  "./version.js",
  "./sw-register.js"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((k) => k.startsWith("llm-hub-") && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim()).catch(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // 页面导航：网络优先，失败再用缓存
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() =>
          caches.match(req).then((r) => r || caches.match("./index.html"))
        )
    );
    return;
  }

  // 静态资源：缓存优先 + 后台更新
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
          return resp;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});