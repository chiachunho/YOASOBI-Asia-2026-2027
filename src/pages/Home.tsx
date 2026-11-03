import { useEffect, useMemo, useState } from "react";
import { usePrefs } from "../lib/store";

export const SHOWS = {
  1: { start: Date.parse("2026-11-14T18:00:00+09:00"), open: "15:30", time: "18:00", label: "11/14（六）" },
  2: { start: Date.parse("2026-11-15T17:00:00+09:00"), open: "14:30", time: "17:00", label: "11/15（日）" },
} as const;

export function countdownText(diffMs: number): { label: string; clock: string } {
  if (diffMs > 0) {
    const d = Math.floor(diffMs / 864e5);
    const h = Math.floor((diffMs % 864e5) / 36e5);
    const m = Math.floor((diffMs % 36e5) / 6e4);
    const s = Math.floor((diffMs % 6e4) / 1e3);
    const p = (n: number) => String(n).padStart(2, "0");
    return { label: "距離開演", clock: `${d} 天 ${p(h)}:${p(m)}:${p(s)}` };
  }
  if (diffMs > -3.5 * 36e5) return { label: "現在", clock: "演出中 🪐" };
  return { label: "這一場", clock: "已結束，謝謝大家！" };
}

function Stars() {
  const out = useMemo(() => {
    let seed = 7;
    const r = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
    return Array.from({ length: 70 }, () => ({
      cx: (r() * 100).toFixed(2) + "%",
      cy: (r() * 100).toFixed(2) + "%",
      r: (r() * 1.4 + 0.3).toFixed(2),
      o: (r() * 0.7 + 0.2).toFixed(2),
    }));
  }, []);
  return (
    <svg className="stars" aria-hidden="true">
      {out.map((s, i) => (
        <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#fff" opacity={s.o} />
      ))}
      <circle cx="88%" cy="16%" r="46" fill="none" stroke="#c9b8ff" strokeOpacity=".35" />
      <ellipse cx="88%" cy="16%" rx="78" ry="14" fill="none" stroke="#c9b8ff" strokeOpacity=".3" transform="rotate(-18)" style={{ transformOrigin: "88% 16%" }} />
    </svg>
  );
}

export function Home() {
  const [prefs, set] = usePrefs();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const show = SHOWS[prefs.day];
  const cd = countdownText(show.start - now);

  return (
    <section className="hero">
      <Stars />
      <div className="hero-inner">
        <p className="eyebrow">YOASOBI ASIA 10-CITY DOME &amp; STADIUM TOUR 2026-2027</p>
        <h1 className="tour-title jp">
          超惑星<small>SUPER PLANET</small>
        </h1>
        <p className="city jp">札幌・大和ハウス プレミストドーム</p>
        <div className="daytabs" role="group" aria-label="選擇場次">
          {([1, 2] as const).map((d) => (
            <button key={d} type="button" aria-pressed={prefs.day === d} onClick={() => set({ day: d })}>
              Day {d}・{SHOWS[d].label}
            </button>
          ))}
        </div>
        <div className="countdown" aria-live="off">
          <p className="cd-label">{cd.label}</p>
          <div className="cd-clock num">{cd.clock}</div>
          <div className="cd-sub num">
            {show.label} 開場 {show.open}／開演 {show.time}（日本時間）
          </div>
        </div>
        <nav className="menu" aria-label="主選單">
          <a href="#/setlist">
            預測歌單 <span>依大阪場順序</span>
          </a>
          <a href="#/songs">
            全部歌曲應援 <span>搜尋・篩選動作</span>
          </a>
          <a href="#/info" className="secondary">
            演出資訊・交通 <span>時間・會場</span>
          </a>
          <a href="#/etiquette" className="secondary">
            應援禮儀・第一次參加 <span>必看</span>
          </a>
        </nav>
        <p className="disclaimer">非官方粉絲整理・內容以現場與官方公告為準</p>
        <button type="button" className="theme-link" onClick={() => set({ theme: prefs.theme === "dark" ? "light" : "dark" })}>
          切換為{prefs.theme === "dark" ? "淺色" : "深色"}模式（內頁）
        </button>
      </div>
    </section>
  );
}
