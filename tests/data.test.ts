import { readdirSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { ACTION_IDS, BASE_SONGS, BASE_TIMINGS, ORDER, SETLIST, SONGS, VIDEOS } from "../src/data";

const ids = Object.keys(BASE_SONGS);

describe("歌單與歌曲", () => {
  test("歌單裡每個 id（含日替 alt）都存在", () => {
    const missing: string[] = [];
    for (const r of SETLIST) {
      if ("head" in r) continue;
      if (!BASE_SONGS[r.id]) missing.push(r.id);
      if (r.alt && !BASE_SONGS[r.alt]) missing.push(`${r.alt}（alt）`);
    }
    expect(missing).toEqual([]);
  });

  test("ORDER 剛好列出每首歌一次", () => {
    expect(new Set(ORDER).size).toBe(ORDER.length);
    expect([...ORDER].sort()).toEqual([...ids].sort());
  });

  test("動作代號都合法", () => {
    const bad: string[] = [];
    for (const s of Object.values(BASE_SONGS)) {
      s.cues.forEach((c, i) => {
        if (c.actions.length === 0) bad.push(`${s.id}#${i} 沒有動作`);
        for (const a of c.actions) if (!(ACTION_IDS as readonly string[]).includes(a)) bad.push(`${s.id}#${i} ${a}`);
      });
    }
    expect(bad).toEqual([]);
  });

  test("每首歌至少一個段落、段落名稱與說明不為空", () => {
    for (const s of Object.values(BASE_SONGS)) {
      expect(s.cues.length, s.id).toBeGreaterThan(0);
      for (const c of s.cues) {
        expect(c.section.trim(), s.id).not.toBe("");
        expect(c.note.trim(), s.id).not.toBe("");
      }
    }
  });
});

describe("影片", () => {
  test("影片表的 id 都對得到歌曲", () => {
    expect(Object.keys(VIDEOS).filter((id) => !BASE_SONGS[id])).toEqual([]);
  });

  test("影片 ID 是 11 字元的 YouTube 格式", () => {
    const bad: string[] = [];
    for (const [id, v] of Object.entries(VIDEOS)) {
      for (const vid of [v.live?.id, v.mv]) if (vid && !/^[A-Za-z0-9_-]{11}$/.test(vid)) bad.push(`${id}: ${vid}`);
    }
    expect(bad).toEqual([]);
  });
});

describe("時間點資料檔 timings.json", () => {
  test("段落時間：歌曲存在、長度不超過段落數、非負且遞增", () => {
    const bad: string[] = [];
    for (const [id, byVer] of Object.entries(BASE_TIMINGS.cues)) {
      const song = BASE_SONGS[id];
      if (!song) {
        bad.push(`${id} 不存在`);
        continue;
      }
      for (const [ver, arr] of Object.entries(byVer)) {
        if (!arr) continue;
        if (!VIDEOS[id] || (ver === "live" ? !VIDEOS[id].live : !VIDEOS[id].mv)) bad.push(`${id}.${ver} 沒有這個版本的影片`);
        if (arr.length > song.cues.length) bad.push(`${id}.${ver} 比段落多`);
        let prev = -1;
        arr.forEach((t, i) => {
          if (t === null) return;
          if (t < 0) bad.push(`${id}.${ver}[${i}] 是負數`);
          if (t < prev) bad.push(`${id}.${ver}[${i}] 比前一段早`);
          prev = t;
        });
      }
    }
    expect(bad).toEqual([]);
  });

  test("歌詞校正只對存在的歌曲", () => {
    expect(Object.keys(BASE_TIMINGS.lyrics).filter((id) => !BASE_SONGS[id])).toEqual([]);
  });

  test("合併後的 SONGS 與 BASE_SONGS 段落數相同", () => {
    for (const id of ids) expect(SONGS[id].cues.length).toBe(BASE_SONGS[id].cues.length);
  });
});

describe("歌詞檔命名", () => {
  test("lyrics/ 下的 .srt 都是 <歌曲id>.<live|mv>.srt，且有對應的影片", () => {
    let files: string[] = [];
    try {
      files = readdirSync(new URL("../lyrics/", import.meta.url)).filter((f) => f.endsWith(".srt"));
    } catch {
      files = [];
    }
    const bad = files.filter((f) => {
      const m = /^([a-z0-9]+)\.(live|mv)\.srt$/.exec(f);
      if (!m) return true;
      const v = VIDEOS[m[1]];
      return !BASE_SONGS[m[1]] || !v || (m[2] === "live" ? !v.live : !v.mv);
    });
    expect(bad).toEqual([]);
  });
});
