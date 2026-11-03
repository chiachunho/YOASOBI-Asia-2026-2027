import { useSyncExternalStore } from "react";
import { readJson, readStore, writeStore } from "./storage";
import { emptyTimings, mergeTimings, serializeTimings, type LyricFix, type Timings } from "./timings";
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

export const prefsStore = createStore<Prefs>(
  typeof window === "undefined"
    ? defaults
    : { ...defaults, ...readJson<Partial<Prefs>>(PREFS_KEY, {}), theme: initialTheme() },
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

const undoStack: Timings[] = [];

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

function edit(fn: (draft: Timings) => void) {
  const prev = marksStore.get();
  undoStack.push(prev);
  if (undoStack.length > 100) undoStack.shift();
  const next = structuredClone(prev);
  fn(next);
  marksStore.set(next);
}

export const marks = {
  setCue(songId: string, version: VideoVersion, index: number, cueCount: number, seconds: number | null) {
    edit((d) => {
      const byVer = (d.cues[songId] ??= {});
      const arr = byVer[version] ?? [];
      const next = Array.from({ length: Math.max(cueCount, arr.length) }, (_, i) => arr[i] ?? null);
      next[index] = seconds === null ? null : Math.max(0, Math.round(seconds * 10) / 10);
      byVer[version] = next;
    });
  },
  setLine(songId: string, version: VideoVersion, index: number, seconds: number | null) {
    edit((d) => {
      const fix: LyricFix = ((d.lyrics[songId] ??= {})[version] ??= {});
      const lines = (fix.lines ??= {});
      if (seconds === null) delete lines[String(index)];
      else lines[String(index)] = Math.max(0, Math.round(seconds * 10) / 10);
    });
  },
  shiftLyrics(songId: string, version: VideoVersion, delta: number) {
    edit((d) => {
      const fix: LyricFix = ((d.lyrics[songId] ??= {})[version] ??= {});
      fix.offset = Math.round(((fix.offset ?? 0) + delta) * 10) / 10;
    });
  },
  clearSong(songId: string, version: VideoVersion) {
    edit((d) => {
      if (d.cues[songId]) delete d.cues[songId][version];
      if (d.lyrics[songId]) delete d.lyrics[songId][version];
    });
  },
  canUndo: () => undoStack.length > 0,
  undo() {
    const prev = undoStack.pop();
    if (prev) marksStore.set(prev);
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
