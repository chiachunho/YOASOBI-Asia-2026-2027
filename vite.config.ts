import { readFileSync, readdirSync } from "node:fs";
import { defineConfig, type Plugin } from "vitest/config";
import react from "@vitejs/plugin-react";
import { buildServiceWorker } from "./src/build/sw";

/** 建置時產生 dist/sw.js，預先下載所有 JS／CSS（含每首歌的歌詞分檔）與 public 下的圖示 */
function serviceWorker(): Plugin {
  return {
    name: "precache-service-worker",
    apply: "build",
    generateBundle(_, bundle) {
      let publicFiles: string[] = [];
      try {
        publicFiles = readdirSync(new URL("./public/", import.meta.url));
      } catch {
        publicFiles = [];
      }
      const template = readFileSync(new URL("./src/build/sw-template.js", import.meta.url), "utf8");
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: buildServiceWorker(template, [...Object.keys(bundle), ...publicFiles]),
      });
    },
  };
}

export default defineConfig({
  // 相對路徑：GitHub Pages 的子路徑（/YOASOBI-Asia-2026-2027/）、自訂網域、Vercel 都能用
  base: "./",
  plugins: [react(), serviceWorker()],
  test: {
    environment: "node",
  },
});
