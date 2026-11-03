import type { ReactNode } from "react";
import { ACTIONS, ACTION_IDS, SONGS, VIDEOS, actionsOf, defaultVersion, videoIdFor, type Action } from "../data";
import { usePlayer } from "../player/PlayerProvider";
import { navigate, songHref } from "../lib/router";
import { usePrefs } from "../lib/store";

export function Chip({ action }: { action: Action }) {
  const a = ACTIONS[action];
  return (
    <span className="chip">
      <i style={{ background: a.color }} />
      {a.label}
    </span>
  );
}

export function Dots({ actions }: { actions: Action[] }) {
  return (
    <span className="dots" aria-label={`動作：${actions.map((a) => ACTIONS[a].label).join("、")}`}>
      {actions.map((a) => (
        <i key={a} style={{ background: ACTIONS[a].color }} />
      ))}
    </span>
  );
}

export function Legend() {
  return (
    <div className="legend">
      {ACTION_IDS.map((a) => (
        <Chip key={a} action={a} />
      ))}
    </div>
  );
}

export function ThemeButton() {
  const [prefs, set] = usePrefs();
  const next = prefs.theme === "dark" ? "light" : "dark";
  return (
    <button type="button" className="icon-btn" onClick={() => set({ theme: next })} aria-label={`切換為${next === "dark" ? "深色" : "淺色"}模式`}>
      {prefs.theme === "dark" ? "淺色" : "深色"}
    </button>
  );
}

export function Topbar({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="topbar">
      <a className="back" href="#/" aria-label="回首頁">
        ‹
      </a>
      <h1>{title}</h1>
      {right}
      <ThemeButton />
    </div>
  );
}

/** 開歌：在點擊事件裡同步呼叫 player.play()，手機才會出聲 */
export function useOpenSong() {
  const player = usePlayer();
  return (id: string, opts: { from?: "setlist" | "all"; version?: "live" | "mv" } = {}) => {
    const version = opts.version ?? defaultVersion(id);
    const vid = version ? videoIdFor(id, version) : undefined;
    if (vid) player.play(vid);
    else player.pause();
    navigate(songHref(id, { version: opts.version, from: opts.from }));
  };
}

export function SongRow({
  id,
  n,
  variant,
  hot,
  alt,
  from,
}: {
  id: string;
  n: ReactNode;
  variant?: string;
  hot?: string;
  alt?: string;
  from: "setlist" | "all";
}) {
  const open = useOpenSong();
  const s = SONGS[id];
  const v = VIDEOS[id];
  const go = (sid: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    open(sid, { from });
  };
  return (
    <li>
      <a className="song-btn" href={songHref(id, { from })} onClick={go(id)}>
        <span className="song-no num">{n}</span>
        <span className="song-main">
          <span className="song-title">{s.title}</span>
          {s.zh && s.zh !== s.title && <span className="song-zh">{s.zh}</span>}
          {variant && <span className="variant">{variant}</span>}
          {hot && <span className="variant hot">{hot}</span>}
          {v?.live && <span className="variant">▶ Live</span>}
          {!v && <span className="variant">無影片</span>}
          {s.tie && <span className="song-tie">{s.tie}</span>}
        </span>
        <Dots actions={actionsOf(s)} />
      </a>
      {alt && (
        <div className="alt-row">
          或{" "}
          <a className="chip chip-link" href={songHref(alt, { from })} onClick={go(alt)}>
            {SONGS[alt].title}
          </a>
        </div>
      )}
    </li>
  );
}

export function Footer() {
  return (
    <footer className="site-footer">
      <p>
        <b>非官方粉絲製作</b>，與 YOASOBI、Sony Music 及主辦單位無關。內容以現場與官方公告為準。
      </p>
      <p>
        影片：YOASOBI 官方 YouTube 頻道（嵌入播放）。動作整理：
        <a href="https://onioni2004.hatenablog.com/entry/2025/12/14/231422" target="_blank" rel="noopener">
          未来を拾いに
        </a>
        、
        <a href="https://kokemomo55.com/yoasobi-live-enjoy/" target="_blank" rel="noopener">
          kokemomo55
        </a>
        、
        <a href="https://note.com/kind_heart128/n/n50387f5af9ef" target="_blank" rel="noopener">
          note
        </a>
        。歌單：
        <a href="https://live-setlist.hatenablog.com/entry/yoasobi-osakadome-2026-10" target="_blank" rel="noopener">
          ライブ-セットリスト
        </a>
        。歌詞翻譯的譯者標示在各歌曲頁。
      </p>
      <p>
        版面與播放器互動參考{" "}
        <a href="https://vaundy.tiaui.co/" target="_blank" rel="noopener">
          Vaundy HORO 台北場應援指南
        </a>
        。
      </p>
    </footer>
  );
}
