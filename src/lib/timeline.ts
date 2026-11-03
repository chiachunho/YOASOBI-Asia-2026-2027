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
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  const whole = Math.floor(r);
  const base = `${m}:${String(whole).padStart(2, "0")}`;
  return withTenths ? `${base}.${Math.floor((r - whole) * 10)}` : base;
}
