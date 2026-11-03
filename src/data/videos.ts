import type { SongVideos } from "./types";

/* 官方 YouTube 影片 ID：live = 官方 Live 影片，mv = 官方 MV。
   用 `npm run verify:videos` 檢查每個 ID 存在、標題含歌名。 */
export const VIDEOS: Record<string, SongVideos> = {
  shukufuku: { live: { id: "KPK23K7ipVo", label: "2023 電光石火 埼玉" }, mv: "3eytpBOkOFA" },
  undead: { mv: "Jj1_mfUzjOs" },
  kaibutsu: { mv: "dy90tA3TT1c" },
  taisho: { mv: "wJQ9ig_d8yY" },
  players: { live: { id: "1fFuHOoWJ5g", label: "2025 Echoes Baa 橫濱" } },
  loveletter: { mv: "mnta9Pp2LqA" },
  haruka: { mv: "vd3IlOjSUGQ" },
  suisei: { mv: "VyvhvlYvRnc" },
  encore: { mv: "vcGbefQBvJ4" },
  orion: { mv: "EjaQdBcF6K4" },
  yuusha: { mv: "OIBODIPC_8Y" },
  heartbeat: { live: { id: "vuEl3u-va-k", label: "2025 超現實 新加坡" } },
  anoyume: { mv: "sAuEeM_6zpk" },
  seventeen: { live: { id: "ky8XXmCrdko", label: "2024 超現實 東京巨蛋" }, mv: "0yoM7ETNPIY" },
  idol: { live: { id: "RzXTe-QfWTw", label: "2023 電光石火 埼玉" }, mv: "ZRtdQ81jPUQ" },
  adventure: { mv: "Av3xaZkVpJs" },
  tsubame: { mv: "qDL3zhB8-MM" },
  sakihokore: { mv: "qwYhKlY4Tx0" },
  gunjou: { mv: "Y4nEEZwckuU" },
  yoru: { mv: "x8VYWazR5mE" },
};

export function videoIdFor(songId: string, version: "live" | "mv"): string | undefined {
  const v = VIDEOS[songId];
  if (!v) return undefined;
  return version === "live" ? v.live?.id : v.mv;
}

/** 預設版本：有 Live 就用 Live */
export function defaultVersion(songId: string): "live" | "mv" | undefined {
  const v = VIDEOS[songId];
  if (v?.live) return "live";
  if (v?.mv) return "mv";
  return undefined;
}
