import { createHash } from "node:crypto";

/** 從建置產出的檔名決定要預先下載的清單（純函式，方便測試） */
export function precacheList(fileNames: string[]): string[] {
  const keep = fileNames.filter((f) => /\.(js|css|svg|png|webp|woff2?)$/.test(f) && f !== "sw.js");
  return ["./", ...[...new Set(keep)].sort()];
}

/** 把版本與清單填進 Service Worker 樣板 */
export function buildServiceWorker(template: string, fileNames: string[]): string {
  if (!template.includes("__VERSION__") || !template.includes("__PRECACHE__")) {
    throw new Error("sw-template.js 缺少 __VERSION__ 或 __PRECACHE__ 佔位");
  }
  const list = precacheList(fileNames);
  const version = createHash("sha256").update(list.join("\n")).digest("hex").slice(0, 10);
  return template.replace("__VERSION__", version).replace("__PRECACHE__", JSON.stringify(list, null, 2));
}
