import type { SetlistRow } from "./types";

/* 10/25 大阪 Day2 的歌單順序 */
export const SETLIST: SetlistRow[] = [
  { head: "正篇" },
  { n: 1, id: "shukufuku" },
  { n: 2, id: "undead" },
  { n: 3, id: "kaibutsu" },
  { n: 4, id: "taisho" },
  { n: 5, id: "gekijo" },
  { n: "＊", id: "killa", variant: "大阪 Day1 才有" },
  { n: 6, id: "players" },
  { n: 7, id: "haruka", variant: "日替", alt: "loveletter" },
  { n: 8, id: "suisei", hot: "不要開燈" },
  { n: 9, id: "baby" },
  { n: 10, id: "encore", variant: "管弦樂" },
  { n: 11, id: "orion", variant: "管弦樂" },
  { n: 12, id: "yuusha", variant: "管弦樂" },
  { n: 13, id: "heartbeat" },
  { n: 14, id: "anoyume" },
  { n: 15, id: "seventeen" },
  { n: 16, id: "idol", hot: "必練" },
  { n: 17, id: "adventure" },
  { n: 18, id: "tsubame" },
  { n: 19, id: "sakihokore" },
  { head: "安可" },
  { n: "EN1", id: "watchme" },
  { n: "EN2", id: "gunjou" },
  { n: "EN3", id: "killa" },
  { n: "EN4", id: "yoru" },
];

/** 歌曲頁上一首／下一首用的演出順序（不重複；日替曲兩首都放） */
export function setlistOrder(): string[] {
  const out: string[] = [];
  for (const r of SETLIST) {
    if ("head" in r) continue;
    for (const id of [r.id, r.alt]) if (id && !out.includes(id)) out.push(id);
  }
  return out;
}
