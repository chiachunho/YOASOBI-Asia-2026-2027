/* Service Worker：離線快取。由 vite.config.ts 在建置時填入版本與預先下載清單，輸出到 dist/sw.js。
   - 網頁本身：先連網，失敗或 4 秒沒回應就用快取（現場網路差時仍能開）
   - 建置產出的 JS／CSS（檔名含雜湊，含每首歌的歌詞分檔）：先用快取
   - Google Fonts：先用快取，背景更新
   - YouTube：不快取，影片仍需要網路 */
const VERSION = "__VERSION__";
const PRECACHE = __PRECACHE__;
const STATIC = `static-${VERSION}`;
const RUNTIME = "runtime-fonts";
const MATCH = { ignoreVary: true, ignoreSearch: false };

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(STATIC).then((c) => c.addAll(PRECACHE)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== STATIC && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC);
  try {
    const res = await Promise.race([fetch(request), timeout(4000)]);
    if (res.ok) cache.put("./", res.clone());
    return res;
  } catch {
    return (await cache.match("./", MATCH)) || Response.error();
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC);
  // 用網址比對並忽略 Vary：模組腳本的請求帶 Origin 標頭，和預先下載時的請求不同
  const hit = await cache.match(request.url, MATCH);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok) cache.put(request.url, res.clone());
  return res;
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  const net = fetch(request)
    .then((res) => {
      if (res.ok || res.type === "opaque") cache.put(request, res.clone());
      return res;
    })
    .catch(() => hit);
  return hit || net;
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (req.mode === "navigate") event.respondWith(networkFirst(req));
    else event.respondWith(cacheFirst(req));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(staleWhileRevalidate(req));
  }
  // 其他（YouTube 等）不處理，照常連網
});
