import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { SrtError, applyLyricFix, parseSrt, rubyParts } from "../src/lib/srt";
import { activeIndex, formatTime } from "../src/lib/timeline";
import { emptyTimings, mergeTimings, serializeTimings } from "../src/lib/timings";
import { checkVideo, titleMatches } from "../src/lib/verify";
import { filterSongs } from "../src/pages/Lists";
import { parseHash, songHref } from "../src/lib/router";

/* 測試用字幕是自己寫的佔位文字，不是任何歌曲的歌詞 */
const SAMPLE = `1
00:00:01,000 --> 00:00:03,500
テスト一行目
測試第一行

2
00:00:03,600 --> 00:00:05,000
（コーラス）

3
00:00:05,200 --> 00:00:08,000
漢字（かんじ）のテスト
`;

describe("SRT 解析", () => {
  test("日文、中文、和聲、無翻譯", () => {
    const lines = parseSrt(SAMPLE);
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ start: 1, end: 3.5, jp: "テスト一行目", zh: "測試第一行", backing: false });
    expect(lines[1]).toMatchObject({ backing: true, zh: undefined });
    expect(lines[2].start).toBeCloseTo(5.2);
  });

  test("CRLF、BOM、省略序號都能讀", () => {
    const text = "﻿00:00:01,000 --> 00:00:02,000\r\nA\r\n\r\n2\r\n00:00:02.5 --> 00:00:03,000\r\nB\r\n";
    expect(parseSrt(text).map((l) => l.jp)).toEqual(["A", "B"]);
  });

  test("三行以上報錯並指出行號與規則", () => {
    const bad = "1\n00:00:01,000 --> 00:00:02,000\nA\nB\nC\n";
    expect(() => parseSrt(bad, "x.srt")).toThrow(SrtError);
    expect(() => parseSrt(bad, "x.srt")).toThrow(/x\.srt:1 \[too-many-lines\]/);
  });

  test("時間倒退、格式錯誤會報錯", () => {
    expect(() => parseSrt("1\n00:00:05,000 --> 00:00:06,000\nA\n\n2\n00:00:01,000 --> 00:00:02,000\nB\n")).toThrow(/time-not-increasing/);
    expect(() => parseSrt("1\n0:01 -> 0:02\nA\n")).toThrow(/time-format/);
    expect(() => parseSrt("1\n00:00:05,000 --> 00:00:04,000\nA\n")).toThrow(/end-before-start/);
  });

  test("校正：整首平移與單行覆寫", () => {
    const lines = parseSrt(SAMPLE);
    const fixed = applyLyricFix(lines, { offset: 0.5, lines: { "2": 9 } });
    expect(fixed[0].start).toBe(1.5);
    expect(fixed[2].start).toBe(9);
    expect(applyLyricFix(lines, undefined)).toBe(lines);
  });

  test("逐行應援標記：行首動作與 {} 喊唱段", () => {
    const text = "1\n00:00:01,000 --> 00:00:02,000\n[clap][wave, jump]ふつう{さけぶ}ふつう\n中文\n";
    const [l] = parseSrt(text);
    expect(l.actions).toEqual(["clap", "wave", "jump"]);
    expect(l.jp).toBe("ふつうさけぶふつう");
    expect(l.parts).toEqual([
      { text: "ふつう", chant: false },
      { text: "さけぶ", chant: true },
      { text: "ふつう", chant: false },
    ]);
    expect(l.zh).toBe("中文");
  });

  test("沒有標記時 actions 為空、整行一個片段", () => {
    const [l] = parseSrt("00:00:01,000 --> 00:00:02,000\nテスト\n");
    expect(l.actions).toEqual([]);
    expect(l.parts).toEqual([{ text: "テスト", chant: false }]);
  });

  test("標記後的和聲仍會被判斷為 backing", () => {
    const [l] = parseSrt("00:00:01,000 --> 00:00:02,000\n[chant]（コール）\n");
    expect(l.backing).toBe(true);
    expect(l.actions).toEqual(["chant"]);
  });

  test("不認得的動作、{} 不成對會報錯並指出文字所在行", () => {
    const head = "1\n00:00:01,000 --> 00:00:02,000\n";
    expect(() => parseSrt(head + "[dance]テスト\n", "x.srt")).toThrow(/x\.srt:3 \[unknown-action\]/);
    expect(() => parseSrt(head + "テ{スト\n")).toThrow(/unbalanced-brace/);
    expect(() => parseSrt(head + "テ}スト\n")).toThrow(/unbalanced-brace/);
  });

  test("ruby 拆解", () => {
    expect(rubyParts("漢字（かんじ）のテスト")).toEqual([{ text: "漢字", ruby: "かんじ" }, { text: "のテスト" }]);
    expect(rubyParts("括號（Idol）不是讀音")).toEqual([{ text: "括號（Idol）不是讀音" }]);
  });
});

describe("lyrics/ 裡實際的歌詞檔都能解析", () => {
  let files: string[] = [];
  try {
    files = readdirSync(new URL("../lyrics/", import.meta.url)).filter((f) => f.endsWith(".srt"));
  } catch {
    files = [];
  }
  test.skipIf(files.length === 0)("每個 .srt 都解析得過", () => {
    for (const f of files) {
      const text = readFileSync(new URL(`../lyrics/${f}`, import.meta.url), "utf8");
      expect(() => parseSrt(text, `lyrics/${f}`)).not.toThrow();
    }
  });
});

describe("時間軸", () => {
  test("activeIndex 略過沒有時間的項目", () => {
    expect(activeIndex([0, null, 10, 20], 15)).toBe(2);
    expect(activeIndex([5, 10], 1)).toBe(-1);
    expect(activeIndex([5, undefined, 10], null)).toBe(-1);
    expect(activeIndex([null, 3], 4)).toBe(1);
  });
  test("formatTime", () => {
    expect(formatTime(65.37)).toBe("1:05");
    expect(formatTime(65.37, true)).toBe("1:05.3");
    expect(formatTime(undefined)).toBe("--:--");
  });
});

describe("時間點合併與輸出", () => {
  test("本機值覆蓋資料檔，null 不覆蓋", () => {
    const base = { cues: { idol: { mv: [1, 2, 3] } }, lyrics: {} };
    const local = { cues: { idol: { mv: [null, 2.5], live: [4] } }, lyrics: { idol: { mv: { offset: 0.3 } } } };
    const m = mergeTimings(base, local);
    expect(m.cues.idol.mv).toEqual([1, 2.5, 3]);
    expect(m.cues.idol.live).toEqual([4]);
    expect(m.lyrics.idol.mv?.offset).toBe(0.3);
    expect(base.cues.idol.mv).toEqual([1, 2, 3]);
  });
  test("輸出時去掉空項目、取到 0.1 秒", () => {
    const t = emptyTimings();
    t.cues.a = { live: [null, null], mv: [1.234, null] };
    t.lyrics.b = { mv: { offset: 0, lines: {} } };
    expect(JSON.parse(serializeTimings(t))).toEqual({ cues: { a: { mv: [1.2, null] } }, lyrics: {} });
  });
});

describe("影片標題比對", () => {
  test("日文名或別名都算", () => {
    expect(titleMatches("YOASOBI「アイドル」 Official Music Video", ["アイドル", "Idol"])).toBe(true);
    expect(titleMatches("YOASOBI - Racing Into The Night (Official Video)", ["夜に駆ける", "Racing Into The Night"])).toBe(true);
    expect(titleMatches("YOASOBI「群青」", ["夜に駆ける"])).toBe(false);
  });

  const fake = (status: number, body: unknown) => async () => ({ ok: status >= 200 && status < 300, status, json: async () => body });
  const c = { songId: "idol", version: "mv" as const, videoId: "ZRtdQ81jPUQ", names: ["アイドル"] };
  test("oEmbed：存在且相符、不存在、標題不符", async () => {
    expect((await checkVideo(c, fake(200, { title: "YOASOBI「アイドル」" }))).ok).toBe(true);
    expect(await checkVideo(c, fake(404, {}))).toMatchObject({ ok: false, reason: "影片不存在" });
    expect(await checkVideo(c, fake(200, { title: "別的歌" }))).toMatchObject({ ok: false, reason: "標題不含歌名" });
  });
});

describe("搜尋與篩選", () => {
  test("日文、中文、別名都搜得到", () => {
    expect(filterSongs("アイドル", new Set())).toContain("idol");
    expect(filterSongs("偶像", new Set())).toContain("idol");
    expect(filterSongs("idol", new Set())).toContain("idol");
    expect(filterSongs("向夜晚", new Set())).toEqual(["yoru"]);
  });
  test("動作篩選要同時含有全部選取的動作", () => {
    const r = filterSongs("", new Set(["jump", "chant"]));
    expect(r).toEqual(["yoru"]);
  });
});

describe("路由", () => {
  test("歌曲連結來回解析", () => {
    expect(parseHash(songHref("idol", { version: "mv", from: "all" }))).toEqual({ name: "song", id: "idol", version: "mv", from: "all" });
    expect(parseHash("#/song/idol")).toEqual({ name: "song", id: "idol", version: undefined, from: "setlist" });
    expect(parseHash("")).toEqual({ name: "home" });
    expect(parseHash("#/nope")).toEqual({ name: "home" });
  });
});
