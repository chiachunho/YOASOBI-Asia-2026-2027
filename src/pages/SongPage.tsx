import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ACTIONS,
  BASE_SONGS,
  ORDER,
  VIDEOS,
  applyCueTimes,
  defaultVersion,
  setlistOrder,
  videoIdFor,
  type LyricLine,
  type Song,
  type VideoVersion,
} from "../data";
import { Chip, Footer, useOpenSong } from "../components/ui";
import { usePlayer, usePlayhead } from "../player/PlayerProvider";
import { loadLyrics } from "../lib/lyrics";
import { applyLyricFix, rubyParts } from "../lib/srt";
import { activeIndex, formatTime } from "../lib/timeline";
import { marks, useEffectiveTimings, usePrefs } from "../lib/store";
import { navigate, songHref } from "../lib/router";
import { MarkPanel } from "./MarkPanel";
import { Sheet } from "../components/Sheet";

/** 比實際播放位置早一點切換，眼睛才跟得上 */
const LEAD = 0.15;

export function useSong(id: string): Song | undefined {
  const timings = useEffectiveTimings();
  return useMemo(() => {
    if (!BASE_SONGS[id]) return undefined;
    return applyCueTimes({ [id]: BASE_SONGS[id] }, timings)[id];
  }, [id, timings]);
}

export function resolveVersion(id: string, v?: VideoVersion): VideoVersion | undefined {
  if (v && videoIdFor(id, v)) return v;
  return defaultVersion(id);
}

function useLyrics(id: string, version: VideoVersion | undefined) {
  const [state, setState] = useState<{ key: string; lines: LyricLine[] | null; error: string | null }>({
    key: "",
    lines: null,
    error: null,
  });
  const key = `${id}.${version}`;
  useEffect(() => {
    if (!version) return;
    const p = loadLyrics(id, version);
    if (!p) {
      setState({ key, lines: null, error: null });
      return;
    }
    let alive = true;
    p.then(
      (lines) => alive && setState({ key, lines, error: null }),
      (e: Error) => alive && setState({ key, lines: null, error: e.message }),
    );
    return () => {
      alive = false;
    };
  }, [id, version, key]);
  return state.key === key ? state : { key, lines: null, error: null };
}

function Ruby({ text }: { text: string }) {
  return (
    <>
      {rubyParts(text).map((p, i) =>
        p.ruby ? (
          <ruby key={i}>
            {p.text}
            <rt>{p.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}

function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    const req = () =>
      navigator.wakeLock
        .request("screen")
        .then((l) => (lock = l))
        .catch(() => {});
    req();
    const vis = () => document.visibilityState === "visible" && req();
    document.addEventListener("visibilitychange", vis);
    return () => {
      document.removeEventListener("visibilitychange", vis);
      lock?.release().catch(() => {});
    };
  }, [active]);
}

export function SongPage({ id, version: vParam, from }: { id: string; version?: VideoVersion; from: "setlist" | "all" }) {
  const song = useSong(id);
  const player = usePlayer();
  const openSong = useOpenSong();
  const [prefs, setPrefs] = usePrefs();
  const timings = useEffectiveTimings();
  const version = resolveVersion(id, vParam);
  const videoId = version ? videoIdFor(id, version) : undefined;
  const [markMode, setMarkMode] = useState(false);
  const [view, setView] = useState<"lyrics" | "cues">("lyrics");
  const [practice, setPractice] = useState(false);
  const [sheet, setSheet] = useState<null | "songs" | "settings">(null);
  const [selCue, setSelCue] = useState(0);
  const [selLine, setSelLine] = useState(0);
  const [markTarget, setMarkTarget] = useState<"cue" | "line">("cue");
  const listRef = useRef<HTMLDivElement>(null);
  const userScrollAt = useRef(0);
  const lastSeek = useRef(0);

  // 直接開連結進來（不是點擊）時只 cue，不自動播放
  useEffect(() => {
    if (videoId) player.cue(videoId);
    else player.pause();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  // 換歌時重設
  useEffect(() => {
    setSelCue(0);
    setSelLine(0);
    setPractice(false);
    window.scrollTo(0, 0);
  }, [id, version]);

  useWakeLock(player.status === "playing");

  const rawLyrics = useLyrics(id, version);
  const lines = useMemo(
    () => (rawLyrics.lines && version ? applyLyricFix(rawLyrics.lines, timings.lyrics[id]?.[version]) : null),
    [rawLyrics.lines, timings, id, version],
  );
  // 標記模式下，顯示內容跟著標記對象走
  const showLyrics = !!lines && (markMode ? markTarget === "line" : view === "lyrics");

  // 標記模式時縮小影片，讓清單有空間
  useEffect(() => {
    document.documentElement.dataset.mark = String(markMode);
    return () => {
      delete document.documentElement.dataset.mark;
    };
  }, [markMode]);

  const t = usePlayhead(!!videoId && player.ready);
  const now = t === null ? null : t + LEAD;
  const cueStarts = useMemo(() => (song && version ? song.cues.map((c) => c.t?.[version]) : []), [song, version]);
  const timedCount = cueStarts.filter((x) => typeof x === "number").length;
  const activeCue = activeIndex(cueStarts, now);
  const lineStarts = useMemo(() => lines?.map((l) => l.start) ?? [], [lines]);
  const activeLine = activeIndex(lineStarts, now);

  // 只練應援：跳過「靜靜聽」與沒有動作的空檔
  useEffect(() => {
    if (!practice || !song || now === null || player.status !== "playing") return;
    if (Date.now() - lastSeek.current < 1200) return;
    const isAction = (i: number) => song.cues[i].actions.some((a) => a !== "listen");
    if (activeCue >= 0 && isAction(activeCue)) return;
    const next = cueStarts
      .map((s, i) => ({ s, i }))
      .filter((x): x is { s: number; i: number } => typeof x.s === "number" && x.s > now && isAction(x.i))
      .sort((a, b) => a.s - b.s)[0];
    lastSeek.current = Date.now();
    if (next) player.seek(Math.max(0, next.s - 1));
    else {
      player.pause();
      setPractice(false);
    }
  }, [practice, song, now, activeCue, cueStarts, player]);

  // 自動捲動：只在目前行／段落改變時捲
  const focusIdx = markMode ? (showLyrics ? selLine : selCue) : showLyrics ? activeLine : activeCue;
  useEffect(() => {
    if (!prefs.autoScroll || focusIdx < 0) return;
    if (Date.now() - userScrollAt.current < 3000) return;
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${focusIdx}"]`);
    const top = document.getElementById("song-top");
    if (!el) return;
    const topH = top?.getBoundingClientRect().bottom ?? 0;
    const bottomH = document.getElementById("song-dock")?.getBoundingClientRect().height ?? 0;
    const rect = el.getBoundingClientRect();
    const visible = window.innerHeight - topH - bottomH;
    const y = window.scrollY + rect.top - topH - visible * 0.3;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
  }, [focusIdx, prefs.autoScroll, showLyrics]);

  useEffect(() => {
    const mark = () => (userScrollAt.current = Date.now());
    window.addEventListener("touchmove", mark, { passive: true });
    window.addEventListener("wheel", mark, { passive: true });
    return () => {
      window.removeEventListener("touchmove", mark);
      window.removeEventListener("wheel", mark);
    };
  }, []);

  const [slots, setSlots] = useState<{ head: HTMLElement | null; under: HTMLElement | null }>({ head: null, under: null });
  useEffect(() => {
    setSlots({ head: document.getElementById("song-head-slot"), under: document.getElementById("song-under-slot") });
  }, []);

  if (!song) {
    return (
      <section className="view">
        <div className="card">
          <h2>找不到這首歌</h2>
          <p>
            <a href="#/songs">回全部歌曲</a>
          </p>
        </div>
      </section>
    );
  }

  const list = from === "all" ? ORDER : setlistOrder();
  const pos = list.indexOf(id);
  const prevId = pos > 0 ? list[pos - 1] : undefined;
  const nextId = pos >= 0 && pos < list.length - 1 ? list[pos + 1] : undefined;
  const v = VIDEOS[id];
  const ytSearch = (q: string) => "https://www.youtube.com/results?search_query=" + encodeURIComponent(q);

  const switchVersion = (ver: VideoVersion) => {
    const vid = videoIdFor(id, ver);
    if (vid) player.play(vid);
    navigate(songHref(id, { version: ver, from }), true);
  };

  const onCueClick = (i: number) => {
    const s = cueStarts[i];
    if (markMode) {
      setSelCue(i);
      setMarkTarget("cue");
      if (typeof s === "number") player.seek(Math.max(0, s - 2));
      return;
    }
    if (typeof s === "number") player.seek(s);
  };
  const onLineClick = (i: number) => {
    const s = lines?.[i]?.start;
    if (markMode) {
      setSelLine(i);
      setMarkTarget("line");
      if (typeof s === "number") player.seek(Math.max(0, s - 2));
      return;
    }
    if (typeof s === "number") player.seek(s);
  };

  const cueOfLine = (l: LyricLine) => activeIndex(cueStarts, l.start + 0.05);

  const header = (
    <div className="song-head">
      <a className="back" href={from === "all" ? "#/songs" : "#/setlist"} aria-label="回歌單">
        ‹
      </a>
      <div className="song-head-title">
        <b className="jp">{song.title}</b>
        {song.zh && song.zh !== song.title && <small>{song.zh}</small>}
      </div>
      <button type="button" className={"icon-btn" + (markMode ? " on" : "")} aria-pressed={markMode} onClick={() => setMarkMode((m) => !m)} disabled={!videoId}>
        {markMode ? "標記中" : "標記"}
      </button>
    </div>
  );

  const nowCue = activeCue >= 0 ? song.cues[activeCue] : null;
  const under = (
    <div className="song-under">
      {player.error !== null && videoId && (
        <div className="video-error">
          影片無法在這裡播放（錯誤 {player.error}）。
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener">
            在 YouTube 開啟 ↗
          </a>
        </div>
      )}
      {(v?.live && v?.mv) || (lines && !markMode) ? (
        <div className="under-row">
          {v?.live && v?.mv && (
            <div className="seg" role="group" aria-label="影片版本">
              <button type="button" aria-pressed={version === "live"} onClick={() => switchVersion("live")}>
                Live
              </button>
              <button type="button" aria-pressed={version === "mv"} onClick={() => switchVersion("mv")}>
                MV
              </button>
            </div>
          )}
          {lines && !markMode && (
            <div className="seg" role="group" aria-label="顯示內容">
              <button type="button" aria-pressed={view === "lyrics"} onClick={() => setView("lyrics")}>
                歌詞
              </button>
              <button type="button" aria-pressed={view === "cues"} onClick={() => setView("cues")}>
                應援段落
              </button>
            </div>
          )}
        </div>
      ) : null}
      {version === "live" && v?.live && <p className="video-label">Live 影片：{v.live.label}</p>}
      {!markMode && showLyrics && nowCue && (
        <div className="now-cue" aria-live="polite">
          <span className="now-sec">{nowCue.section}</span>
          {nowCue.actions.map((a) => (
            <Chip key={a} action={a} />
          ))}
          <span className="now-note">{nowCue.note}</span>
        </div>
      )}
      {markMode && version && (
        <MarkPanel
          song={song}
          version={version}
          time={t}
          target={markTarget}
          setTarget={setMarkTarget}
          hasLines={!!lines}
          lines={lines}
          selCue={selCue}
          setSelCue={setSelCue}
          selLine={selLine}
          setSelLine={setSelLine}
          lyricOffset={timings.lyrics[id]?.[version]?.offset ?? 0}
        />
      )}
    </div>
  );

  return (
    <section className={`view song-view fs-${prefs.fontSize}`}>
      {slots.head && createPortal(header, slots.head)}
      {slots.under && createPortal(under, slots.under)}

      {!videoId && (
        <div className="card no-video">
          <p>這首目前沒有官方影片可以內嵌播放。</p>
          <div className="links">
            <a className="btn" href={ytSearch("YOASOBI " + song.title)} target="_blank" rel="noopener">
              ▶ 在 YouTube 搜尋
            </a>
            <a className="btn ghost" href={ytSearch("YOASOBI " + song.title + " live")} target="_blank" rel="noopener">
              找 Live 影片
            </a>
          </div>
        </div>
      )}

      {song.tie && <p className="song-meta">{song.tie}</p>}

      {rawLyrics.error && <div className="card warn">歌詞檔格式錯誤：{rawLyrics.error}</div>}

      <div ref={listRef} className={"song-list" + (now !== null ? " syncing" : "")}>
        {showLyrics && lines ? (
          <ol className="lyrics" aria-label="歌詞">
            {lines.map((l, i) => {
              const ci = cueOfLine(l);
              const showCue = ci >= 0 && (i === 0 || cueOfLine(lines[i - 1]) !== ci);
              const c = ci >= 0 ? song.cues[ci] : null;
              // 行內標記優先；沒有就沿用所在段落的動作
              const acts = l.actions.length ? l.actions : (c?.actions ?? []);
              const prevActs = i > 0 ? lines[i - 1].actions.join() : "";
              const showLineChips = l.actions.length > 0 && l.actions.join() !== prevActs;
              const cls = ["line", l.backing ? "backing" : "", i === activeLine ? "now" : "", markMode && markTarget === "line" && i === selLine ? "sel" : ""]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={i} data-idx={i}>
                  {showCue && c && (
                    <div className="line-cue">
                      <span>{c.section}</span>
                      {c.actions.map((a) => (
                        <Chip key={a} action={a} />
                      ))}
                      <span className="line-cue-note">{c.note}</span>
                    </div>
                  )}
                  <button type="button" className={cls} onClick={() => onLineClick(i)}>
                    {acts.length > 0 && (
                      <span className="line-bar" aria-hidden="true">
                        {acts.map((a) => (
                          <i key={a} style={{ background: ACTIONS[a].color }} />
                        ))}
                      </span>
                    )}
                    <span className="line-text">
                      {showLineChips && (
                        <span className="line-chips">
                          {l.actions.map((a) => (
                            <Chip key={a} action={a} />
                          ))}
                        </span>
                      )}
                      {prefs.showJp && (
                        <span className="jp line-jp">
                          {l.parts.map((p, k) =>
                            p.chant ? (
                              <mark key={k} className="chant">
                                <Ruby text={p.text} />
                              </mark>
                            ) : (
                              <Ruby key={k} text={p.text} />
                            ),
                          )}
                        </span>
                      )}
                      {prefs.showZh && l.zh && <span className="line-zh">{l.zh}</span>}
                      {!prefs.showJp && !l.zh && <span className="line-zh">{l.jp}</span>}
                    </span>
                    {markMode && <span className="tm num">{formatTime(l.start, true)}</span>}
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <ol className="cues" aria-label="應援段落">
            {song.cues.map((c, i) => {
              const s = cueStarts[i];
              const timed = typeof s === "number";
              const cls = ["cue", i === activeCue ? "now" : "", markMode && markTarget === "cue" && i === selCue ? "sel" : "", timed ? "" : "untimed"]
                .filter(Boolean)
                .join(" ");
              return (
                <li key={i} data-idx={i}>
                  <button type="button" className={cls} onClick={() => onCueClick(i)} aria-disabled={!timed && !markMode}>
                    <span className="cue-sec">{c.section}</span>
                    <span className="cue-act">
                      {c.actions.map((a) => (
                        <Chip key={a} action={a} />
                      ))}
                      <span className="cue-text">{c.note}</span>
                    </span>
                    <span className="tm num">{formatTime(s, markMode)}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {!lines && videoId && !rawLyrics.error && <p className="src">這個版本還沒有歌詞檔。有時間點的段落可以點一下跳過去。</p>}
        {lines && song.translationCredit && <p className="src">歌詞翻譯：{song.translationCredit}</p>}
      </div>

      {song.tip && <div className="tip">💡 {song.tip}</div>}
      <Footer />

      <div className="song-dock" id="song-dock">
        <div className="dock-pill">
          <button type="button" disabled={!prevId} onClick={() => prevId && openSong(prevId, { from })} aria-label="上一首">
            ‹
          </button>
          <button type="button" className="dock-title" onClick={() => setSheet("songs")}>
            <span className="num">
              {pos + 1}/{list.length}
            </span>{" "}
            <span className="jp">{song.title}</span>
          </button>
          <button type="button" disabled={!nextId} onClick={() => nextId && openSong(nextId, { from })} aria-label="下一首">
            ›
          </button>
        </div>
        <div className="toolbar" role="toolbar" aria-label="播放工具">
          <button type="button" className="bar-chip play" onClick={() => player.toggle()} disabled={!videoId} aria-label={player.status === "playing" ? "暫停" : "播放"}>
            {player.status === "playing" || player.status === "buffering" ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            className="bar-chip"
            aria-pressed={practice}
            disabled={!videoId || timedCount === 0}
            title={timedCount === 0 ? "這個版本的段落還沒有時間點" : "只播有動作的段落"}
            onClick={() => setPractice((p) => !p)}
          >
            只練應援
          </button>
          {lines && (
            <>
              <button type="button" className="bar-chip" aria-pressed={prefs.showJp} onClick={() => setPrefs({ showJp: !prefs.showJp })}>
                日文
              </button>
              <button type="button" className="bar-chip" aria-pressed={prefs.showZh} onClick={() => setPrefs({ showZh: !prefs.showZh })}>
                中文
              </button>
            </>
          )}
          <button type="button" className="bar-chip" aria-pressed={prefs.simple} disabled={!videoId} onClick={() => setPrefs({ simple: !prefs.simple })} title="隱藏影片，聲音繼續播">
            簡潔
          </button>
          <button type="button" className="bar-chip" onClick={() => setSheet("settings")}>
            設定
          </button>
        </div>
      </div>

      <Sheet open={sheet === "songs"} title={from === "all" ? "全部歌曲" : "預測歌單"} onClose={() => setSheet(null)}>
        <ul className="pick-list">
          {list.map((sid, i) => (
            <li key={sid}>
              <button
                type="button"
                aria-current={sid === id}
                onClick={() => {
                  setSheet(null);
                  openSong(sid, { from });
                }}
              >
                <span className="num">{i + 1}</span> <span className="jp">{BASE_SONGS[sid].title}</span>
              </button>
            </li>
          ))}
        </ul>
      </Sheet>

      <Sheet open={sheet === "settings"} title="顯示設定" onClose={() => setSheet(null)}>
        <div className="settings">
          <div className="set-row">
            <span>主題</span>
            <div className="seg">
              <button type="button" aria-pressed={prefs.theme === "light"} onClick={() => setPrefs({ theme: "light" })}>
                淺色
              </button>
              <button type="button" aria-pressed={prefs.theme === "dark"} onClick={() => setPrefs({ theme: "dark" })}>
                深色
              </button>
            </div>
          </div>
          <div className="set-row">
            <label htmlFor="rate">播放速度</label>
            <select
              id="rate"
              value={prefs.rate}
              onChange={(e) => {
                const r = Number(e.target.value);
                setPrefs({ rate: r });
                player.setRate(r);
              }}
            >
              {[...new Set([...player.availableRates(), prefs.rate])]
                .sort((a, b) => a - b)
                .map((r) => (
                  <option key={r} value={r}>
                    x{r}
                  </option>
                ))}
            </select>
          </div>
          <div className="set-row">
            <span>字級</span>
            <div className="seg">
              {(["s", "m", "l", "xl"] as const).map((f) => (
                <button key={f} type="button" aria-pressed={prefs.fontSize === f} onClick={() => setPrefs({ fontSize: f })}>
                  {{ s: "小", m: "標準", l: "大", xl: "特大" }[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="set-row">
            <span>自動捲動</span>
            <button type="button" className="switch" aria-pressed={prefs.autoScroll} onClick={() => setPrefs({ autoScroll: !prefs.autoScroll })}>
              <span />
            </button>
          </div>
          {marks.hasLocal() && <p className="src">這台裝置有尚未寫回資料檔的時間點標記，可在標記模式按「複製 JSON」。</p>}
        </div>
      </Sheet>
    </section>
  );
}
