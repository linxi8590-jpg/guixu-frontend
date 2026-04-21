(function () {
  "use strict";
  if (!("serviceWorker" in navigator)) return;

  const v = (window.LLM_HUB_VERSION || "v1").toString();
  const swUrl = "sw.js?v=" + encodeURIComponent(v);

  navigator.serviceWorker
    .register(swUrl)
    .then((reg) => {
      // iOS 有时会卡住不主动检查更新，这里手动触发一下
      try {
        reg.update();
      } catch (e) {}

      // 一旦新的 SW 接管，就自动刷新页面拿到最新资源
      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    })
    .catch((err) => {
      console.warn("Service Worker 注册失败：", err);
    });
})();