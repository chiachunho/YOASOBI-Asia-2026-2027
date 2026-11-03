import type { VideoVersion } from "../data/types";

/** 每個段落的開始秒數，索引對應 song.cues；null 表示還沒標 */
export type CueTimes = Partial<Record<VideoVersion, (number | null)[]>>;

/** 歌詞校正：整首平移秒數，加上個別行的開始時間覆寫（key 是行索引） */
export interface LyricFix {
  offset?: number;
  lines?: Record<string, number>;
}

export interface Timings {
  cues: Record<string, CueTimes>;
  lyrics: Record<string, Partial<Record<VideoVersion, LyricFix>>>;
}

export const emptyTimings = (): Timings => ({ cues: {}, lyrics: {} });

/** 時間點統一取到 0.1 秒 */
export const round10 = (n: number) => Math.round(n * 10) / 10;
const round = round10;

/** 把本機標記疊到資料檔上。本機有值的格子優先。 */
export function mergeTimings(base: Timings, local: Timings): Timings {
  const out: Timings = structuredClone(base);
  for (const [id, byVer] of Object.entries(local.cues)) {
    const target = (out.cues[id] ??= {});
    for (const [ver, arr] of Object.entries(byVer) as [VideoVersion, (number | null)[]][]) {
      const merged = [...(target[ver] ?? [])];
      arr.forEach((v, i) => {
        if (v !== null && v !== undefined) merged[i] = v;
        else if (merged[i] === undefined) merged[i] = null;
      });
      target[ver] = merged;
    }
  }
  for (const [id, byVer] of Object.entries(local.lyrics)) {
    const target = (out.lyrics[id] ??= {});
    for (const [ver, fix] of Object.entries(byVer) as [VideoVersion, LyricFix][]) {
      const cur = (target[ver] ??= {});
      if (fix.offset !== undefined) cur.offset = fix.offset;
      if (fix.lines) cur.lines = { ...(cur.lines ?? {}), ...fix.lines };
    }
  }
  return out;
}

/** 輸出給資料檔用的 JSON：拿掉空的項目，秒數取到 0.1 */
export function serializeTimings(t: Timings): string {
  const clean: Timings = emptyTimings();
  for (const id of Object.keys(t.cues).sort()) {
    const byVer: CueTimes = {};
    for (const ver of ["live", "mv"] as const) {
      const arr = t.cues[id][ver];
      if (arr && arr.some((v) => v !== null && v !== undefined)) {
        byVer[ver] = Array.from(arr, (v) => (v === null || v === undefined ? null : round(v)));
      }
    }
    if (Object.keys(byVer).length) clean.cues[id] = byVer;
  }
  for (const id of Object.keys(t.lyrics).sort()) {
    const byVer: Partial<Record<VideoVersion, LyricFix>> = {};
    for (const ver of ["live", "mv"] as const) {
      const fix = t.lyrics[id][ver];
      if (!fix) continue;
      const f: LyricFix = {};
      if (fix.offset) f.offset = round(fix.offset);
      if (fix.lines && Object.keys(fix.lines).length) {
        f.lines = Object.fromEntries(
          Object.entries(fix.lines)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([k, v]) => [k, round(v)]),
        );
      }
      if (Object.keys(f).length) byVer[ver] = f;
    }
    if (Object.keys(byVer).length) clean.lyrics[id] = byVer;
  }
  return JSON.stringify(clean, null, 2) + "\n";
}
