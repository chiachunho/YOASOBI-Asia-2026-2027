/* 影片 ID 檢查邏輯（scripts/verify-videos.ts 與測試共用） */

export function normalizeTitle(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s「」『』【】\[\]()（）"'’!！?？・.,，、:：\-—_~〜]/g, "");
}

/** 影片標題是否含有歌名（或任一別名） */
export function titleMatches(videoTitle: string, names: string[]): boolean {
  const t = normalizeTitle(videoTitle);
  return names.some((n) => {
    const k = normalizeTitle(n);
    return k.length > 0 && t.includes(k);
  });
}

export interface VideoCheck {
  songId: string;
  version: "live" | "mv";
  videoId: string;
  names: string[];
}

export type CheckResult =
  | { ok: true; check: VideoCheck; title: string }
  | { ok: false; check: VideoCheck; reason: string; title?: string };

type FetchLike = (url: string) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;

export const oembedUrl = (id: string) =>
  `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${id}`)}&format=json`;

export async function checkVideo(check: VideoCheck, fetchImpl: FetchLike): Promise<CheckResult> {
  let res;
  try {
    res = await fetchImpl(oembedUrl(check.videoId));
  } catch (e) {
    return { ok: false, check, reason: `連線失敗：${(e as Error).message}` };
  }
  if (res.status === 404 || res.status === 400) return { ok: false, check, reason: "影片不存在" };
  if (res.status === 401 || res.status === 403) return { ok: false, check, reason: "影片不允許嵌入或為私人影片" };
  if (!res.ok) return { ok: false, check, reason: `HTTP ${res.status}` };
  const data = (await res.json()) as { title?: string };
  const title = data.title ?? "";
  if (!titleMatches(title, check.names)) return { ok: false, check, title, reason: "標題不含歌名" };
  return { ok: true, check, title };
}
