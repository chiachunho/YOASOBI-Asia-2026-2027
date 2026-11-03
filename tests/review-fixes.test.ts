import { describe, expect, test } from "vitest";
import { formatTime } from "../src/lib/timeline";
import { marks, marksStore, sanitizePrefs } from "../src/lib/store";
import { emptyTimings } from "../src/lib/timings";

describe("formatTime 不受浮點誤差影響", () => {
  test.each([
    [65.3, "1:05.3"],
    [0.3, "0:00.3"],
    [59.9, "0:59.9"],
    [60, "1:00.0"],
    [125.7, "2:05.7"],
  ])("%s → %s", (sec, out) => {
    expect(formatTime(sec, true)).toBe(out);
  });
});

describe("復原只作用在同一首歌、同一個版本", () => {
  test("在別首歌按復原不會動到這首的標記", () => {
    marksStore.set(emptyTimings());
    marks.setCue("idol", "mv", 0, 6, 10);
    marks.setCue("gunjou", "mv", 0, 4, 20);
    marks.setCue("idol", "mv", 1, 6, 30);

    expect(marks.undo("gunjou", "mv")).toBe(true);
    expect(marksStore.get().cues.gunjou?.mv).toBeUndefined();
    // idol 的兩個標記（含 gunjou 之後才標的那個）都還在
    expect(marksStore.get().cues.idol.mv?.slice(0, 2)).toEqual([10, 30]);

    expect(marks.undo("idol", "mv")).toBe(true);
    expect(marksStore.get().cues.idol.mv?.slice(0, 2)).toEqual([10, null]);
    expect(marks.canUndo("idol", "live")).toBe(false);
    expect(marks.undo("idol", "live")).toBe(false);
  });
});

describe("localStorage 的設定值逐欄檢查", () => {
  test("不合法的值退回預設", () => {
    expect(sanitizePrefs({ day: 3, rate: "x", fontSize: "huge", autoScroll: "yes", showJp: false })).toEqual({
      day: 1,
      rate: 1,
      fontSize: "m",
      autoScroll: true,
      showJp: false,
      showZh: true,
      simple: false,
    });
    expect(sanitizePrefs(null).day).toBe(1);
    expect(sanitizePrefs({ day: 2, rate: 1.5, fontSize: "xl" })).toMatchObject({ day: 2, rate: 1.5, fontSize: "xl" });
  });
});
