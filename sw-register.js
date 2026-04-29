(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      // 立即检查更新
      try { reg.update(); } catch (e) {}
      // 每5分钟检查一次SW更新
      setInterval(() => { try { reg.update(); } catch(e) {} }, 5 * 60 * 1000);
      
      // SW更新后自动刷新页面
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              console.log('[SW] 新版本已激活，刷新页面...');
              window.location.reload();
            }
          });
        }
      });
      
      console.log("[SW] 已注册");
    })
    .catch((err) => {
      console.warn("Service Worker 注册失败：", err);
    });
})();
