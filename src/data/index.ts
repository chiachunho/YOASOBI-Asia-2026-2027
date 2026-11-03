import { BASE_SONGS, ORDER } from "./songs";
import timingsJson from "./timings.json";
import type { Action, Song } from "./types";
import type { Timings } from "../lib/timings";

export { ORDER, BASE_SONGS } from "./songs";
export { SETLIST, setlistOrder } from "./setlist";
export { VIDEOS, videoIdFor, defaultVersion } from "./videos";
export { ACTIONS } from "./actions";
export * from "./types";

export const BASE_TIMINGS = timingsJson as Timings;

/** 把段落秒數合併進 Cue.t */
export function applyCueTimes(songs: Record<string, Song>, timings: Timings): Record<string, Song> {
  return Object.fromEntries(
    Object.entries(songs).map(([id, s]) => {
      const ct = timings.cues[id];
      if (!ct) return [id, s];
      return [
        id,
        {
          ...s,
          cues: s.cues.map((c, i) => {
            const live = ct.live?.[i];
            const mv = ct.mv?.[i];
            const t: { live?: number; mv?: number } = {};
            if (typeof live === "number") t.live = live;
            if (typeof mv === "number") t.mv = mv;
            return Object.keys(t).length ? { ...c, t } : c;
          }),
        },
      ];
    }),
  );
}

export const SONGS: Record<string, Song> = applyCueTimes(BASE_SONGS, BASE_TIMINGS);

export const actionsOf = (song: Song): Action[] => [...new Set(song.cues.flatMap((c) => c.actions))];

export const allSongs = (): Song[] => ORDER.map((id) => SONGS[id]);
