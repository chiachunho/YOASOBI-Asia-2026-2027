import { useEffect, useState } from "react";

/* 註冊 Service Worker，並提供「有新版本」與「目前離線」兩種狀態給畫面顯示 */

let waiting: ServiceWorker | null = null;
/** 使用者按了「重新整理」才在新版接手後重載；第一次安裝接手時不重載 */
let updateRequested = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        const track = (w: ServiceWorker | null) => {
          if (!w) return;
          w.addEventListener("statechange", () => {
            // 已經有舊版在控制頁面時，新版裝好才算「有更新」；第一次安裝不提示
            if (w.state === "installed" && navigator.serviceWorker.controller) {
              waiting = w;
              notify();
            }
          });
        };
        if (reg.waiting && navigator.serviceWorker.controller) {
          waiting = reg.waiting;
          notify();
        }
        reg.addEventListener("updatefound", () => track(reg.installing));
      })
      .catch(() => {});
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!updateRequested || reloading) return;
      reloading = true;
      location.reload();
    });
  });
}

export function applyUpdate() {
  updateRequested = true;
  waiting?.postMessage("SKIP_WAITING");
}

export function useAppStatus(): { updateReady: boolean; offline: boolean } {
  const [, force] = useState(0);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    listeners.add(f);
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      listeners.delete(f);
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return { updateReady: waiting !== null, offline };
}
