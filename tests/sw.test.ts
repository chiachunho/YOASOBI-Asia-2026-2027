import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { buildServiceWorker, precacheList } from "../src/build/sw";

const template = readFileSync(new URL("../src/build/sw-template.js", import.meta.url), "utf8");

describe("Service Worker 產生", () => {
  test("預先下載清單：首頁 + 建置產出的 JS/CSS/圖示，不含 sw.js 與 html", () => {
    expect(precacheList(["assets/a-1.js", "assets/b.css", "index.html", "sw.js", "favicon.svg", "assets/a-1.js"])).toEqual([
      "./",
      "assets/a-1.js",
      "assets/b.css",
      "favicon.svg",
    ]);
  });

  test("版本隨清單改變，同一份清單版本相同", () => {
    const a = buildServiceWorker(template, ["assets/a.js"]);
    const b = buildServiceWorker(template, ["assets/b.js"]);
    const v = (s: string) => /const VERSION = "([0-9a-f]+)"/.exec(s)?.[1];
    expect(v(a)).toBeTruthy();
    expect(v(a)).not.toBe(v(b));
    expect(v(buildServiceWorker(template, ["assets/a.js"]))).toBe(v(a));
    expect(a).not.toContain("__PRECACHE__");
  });

  test("樣板缺佔位時直接失敗", () => {
    expect(() => buildServiceWorker("const x = 1;", [])).toThrow(/佔位/);
  });
});
