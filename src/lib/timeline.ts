/** 找最後一個開始時間 ≤ t 的索引；沒有時間的項目略過。找不到回傳 -1。 */
export function activeIndex(starts: readonly (number | null | undefined)[], t: number | null): number {
  if (t === null || !Number.isFinite(t)) return -1;
  let best = -1;
  let bestStart = -Infinity;
  starts.forEach((s, i) => {
    if (typeof s === "number" && s <= t && s >= bestStart) {
      best = i;
      bestStart = s;
    }
  });
  return best;
}

export function formatTime(sec: number | null | undefined, withTenths = false): string {
  if (sec === null || sec === undefined || !Number.isFinite(sec)) return "--:--";
  // 先換成整數的 0.1 秒再拆，避免 65.3 這類浮點數被算成 65.29999…
  const tenths = Math.floor(Math.max(0, sec) * 10 + 1e-6);
  const m = Math.floor(tenths / 600);
  const s = Math.floor(tenths / 10) % 60;
  const base = `${m}:${String(s).padStart(2, "0")}`;
  return withTenths ? `${base}.${tenths % 10}` : base;
}
