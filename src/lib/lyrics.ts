import type { LyricLine, VideoVersion } from "../data/types";
import { parseSrt } from "./srt";

/* 歌詞檔放在專案根目錄 lyrics/<歌曲id>.<live|mv>.srt。
   每個檔案各自分檔，打開那首歌才下載。 */
const FILES = import.meta.glob("../../lyrics/*.srt", { query: "?raw", import: "default" }) as Record<
  string,
  () => Promise<string>
>;

const NAME = /\/([a-z0-9]+)\.(live|mv)\.srt$/;

const index = new Map<string, () => Promise<string>>();
for (const [path, load] of Object.entries(FILES)) {
  const m = NAME.exec(path);
  if (m) index.set(`${m[1]}.${m[2]}`, load);
}

export function hasLyrics(songId: string, version: VideoVersion): boolean {
  return index.has(`${songId}.${version}`);
}

export function lyricVersions(songId: string): VideoVersion[] {
  return (["live", "mv"] as const).filter((v) => hasLyrics(songId, v));
}

const cache = new Map<string, Promise<LyricLine[]>>();

export function loadLyrics(songId: string, version: VideoVersion): Promise<LyricLine[]> | null {
  const key = `${songId}.${version}`;
  const load = index.get(key);
  if (!load) return null;
  let p = cache.get(key);
  if (!p) {
    p = load().then((text) => parseSrt(text, `lyrics/${key}.srt`));
    cache.set(key, p);
  }
  return p;
}
