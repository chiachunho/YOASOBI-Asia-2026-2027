import { useSyncExternalStore } from "react";
import { readJson, readStore, writeStore } from "./storage";
import { emptyTimings, mergeTimings, round10, serializeTimings, type LyricFix, type Timings } from "./timings";
import { BASE_TIMINGS } from "../data";
import type { VideoVersion } from "../data/types";

/* ---------- 小型 store ---------- */
function createStore<T>(initial: T, persist?: (v: T) => void) {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(next: T | ((prev: T) => T)) {
      value = typeof next === "function" ? (next as (p: T) => T)(value) : next;
      persist?.(value);
      subs.forEach((f) => f());
    },
    subscribe(f: () => void) {
      subs.add(f);
      return () => subs.delete(f);
    },
  };
}

/* ---------- 顯示設定 ---------- */
export type Theme = "light" | "dark";
export interface Prefs {
  theme: Theme;
  day: 1 | 2;
  rate: number;
  fontSize: "s" | "m" | "l" | "xl";
  autoScroll: boolean;
  showJp: boolean;
  showZh: boolean;
  /** 簡潔模式：隱藏影片，只看歌詞／段落 */
  simple: boolean;
}

const PREFS_KEY = "yoa-prefs";
const initialTheme = (): Theme => {
  const t = readStore("yoa-theme");
  if (t === "light" || t === "dark") return t;
  try {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "dark";
  }
};
const defaults: Prefs = {
  theme: "dark",
  day: 1,
  rate: 1,
  fontSize: "m",
  autoScroll: true,
  showJp: true,
  showZh: true,
  simple: false,
};

/** localStorage 裡的值可能是舊版或被改過的，逐欄檢查，不合法就用預設值 */
export function sanitizePrefs(raw: unknown): Omit<Prefs, "theme"> {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const bool = (k: keyof Prefs) => (typeof r[k] === "boolean" ? (r[k] as boolean) : (defaults[k] as boolean));
  return {
    day: r.day === 2 ? 2 : 1,
    rate: typeof r.rate === "number" && r.rate > 0 && r.rate <= 4 ? r.rate : 1,
    fontSize: r.fontSize === "s" || r.fontSize === "l" || r.fontSize === "xl" ? r.fontSize : "m",
    autoScroll: bool("autoScroll"),
    showJp: bool("showJp"),
    showZh: bool("showZh"),
    simple: bool("simple"),
  };
}

export const prefsStore = createStore<Prefs>(
  typeof window === "undefined"
    ? defaults
    : { ...sanitizePrefs(readJson<unknown>(PREFS_KEY, {})), theme: initialTheme() },
  (v) => {
    const { theme, ...rest } = v;
    writeStore(PREFS_KEY, JSON.stringify(rest));
    writeStore("yoa-theme", theme);
    document.documentElement.dataset.theme = theme;
  },
);

export function usePrefs(): [Prefs, (patch: Partial<Prefs>) => void] {
  const v = useSyncExternalStore(prefsStore.subscribe, prefsStore.get);
  return [v, (patch) => prefsStore.set((p) => ({ ...p, ...patch }))];
}

/* ---------- 標記模式的本機時間點 ---------- */
const MARKS_KEY = "yoa-timings-local";
export const marksStore = createStore<Timings>(
  typeof window === "undefined" ? emptyTimings() : { ...emptyTimings(), ...readJson<Timings>(MARKS_KEY, emptyTimings()) },
  (v) => writeStore(MARKS_KEY, JSON.stringify(v)),
);

/** 復原只作用在同一首歌、同一個版本，不會動到別首歌的標記 */
const undoStack: { songId: string; version: VideoVersion; prev: Timings }[] = [];

export function useLocalTimings(): Timings {
  return useSyncExternalStore(marksStore.subscribe, marksStore.get);
}

/** 資料檔 + 本機標記 */
let mergedCache: { local: Timings; merged: Timings } | null = null;
export function useEffectiveTimings(): Timings {
  const local = useLocalTimings();
  if (mergedCache?.local !== local) mergedCache = { local, merged: mergeTimings(BASE_TIMINGS, local) };
  return mergedCache.merged;
}

function edit(songId: string, version: VideoVersion, fn: (draft: Timings) => void) {
  const prev = marksStore.get();
  undoStack.push({ songId, version, prev });
  if (undoStack.length > 100) undoStack.shift();
  const next = structuredClone(prev);
  fn(next);
  marksStore.set(next);
}

export const marks = {
  setCue(songId: string, version: VideoVersion, index: number, cueCount: number, seconds: number | null) {
    edit(songId, version, (d) => {
      const byVer = (d.cues[songId] ??= {});
      const arr = byVer[version] ?? [];
      const next = Array.from({ length: Math.max(cueCount, arr.length) }, (_, i) => arr[i] ?? null);
      next[index] = seconds === null ? null : Math.max(0, round10(seconds));
      byVer[version] = next;
    });
  },
  setLine(songId: string, version: VideoVersion, index: number, seconds: number | null) {
    edit(songId, version, (d) => {
      const fix: LyricFix = ((d.lyrics[songId] ??= {})[version] ??= {});
      const lines = (fix.lines ??= {});
      if (seconds === null) delete lines[String(index)];
      else lines[String(index)] = Math.max(0, round10(seconds));
    });
  },
  shiftLyrics(songId: string, version: VideoVersion, delta: number) {
    edit(songId, version, (d) => {
      const fix: LyricFix = ((d.lyrics[songId] ??= {})[version] ??= {});
      fix.offset = round10((fix.offset ?? 0) + delta);
    });
  },
  clearSong(songId: string, version: VideoVersion) {
    edit(songId, version, (d) => {
      if (d.cues[songId]) delete d.cues[songId][version];
      if (d.lyrics[songId]) delete d.lyrics[songId][version];
    });
  },
  canUndo: (songId: string, version: VideoVersion) => undoStack.some((e) => e.songId === songId && e.version === version),
  /** 只把這首歌、這個版本還原到上一步；其他歌在那之後的標記保留 */
  undo(songId: string, version: VideoVersion): boolean {
    let i = undoStack.length - 1;
    while (i >= 0 && !(undoStack[i].songId === songId && undoStack[i].version === version)) i--;
    if (i < 0) return false;
    const [{ prev }] = undoStack.splice(i, 1);
    const next = structuredClone(marksStore.get());
    const restore = <T,>(target: Record<string, Partial<Record<VideoVersion, T>>>, source: Record<string, Partial<Record<VideoVersion, T>>>) => {
      const value = source[songId]?.[version];
      if (value === undefined) {
        if (target[songId]) delete target[songId][version];
      } else (target[songId] ??= {})[version] = structuredClone(value);
    };
    restore(next.cues, prev.cues);
    restore(next.lyrics, prev.lyrics);
    marksStore.set(next);
    return true;
  },
  /** 資料檔 + 本機標記，整理成可直接貼回 src/data/timings.json 的格式 */
  exportJson(): string {
    return serializeTimings(mergeTimings(BASE_TIMINGS, marksStore.get()));
  },
  hasLocal(): boolean {
    const l = marksStore.get();
    return Object.keys(l.cues).length > 0 || Object.keys(l.lyrics).length > 0;
  },
};
