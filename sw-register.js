(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;

  navigator.serviceWorker
    .register("/sw.js")
    .then((reg) => {
      try { reg.update(); } catch (e) {}
      console.log("[SW] 已注册");
    })
    .catch((err) => {
      console.warn("Service Worker 注册失败：", err);
    });
})();
