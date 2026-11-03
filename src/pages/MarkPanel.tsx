import { useState } from "react";
import type { LyricLine, Song, VideoVersion } from "../data";
import { marks } from "../lib/store";
import { formatTime } from "../lib/timeline";
import { round10 } from "../lib/timings";

interface Props {
  song: Song;
  version: VideoVersion;
  time: number | null;
  target: "cue" | "line";
  setTarget: (t: "cue" | "line") => void;
  hasLines: boolean;
  lines: LyricLine[] | null;
  selCue: number;
  setSelCue: (i: number) => void;
  selLine: number;
  setSelLine: (i: number) => void;
  lyricOffset: number;
}

/**
 * 標記模式：
 * - 段落：播放時按「標記這段」，把目前秒數寫進選取的段落，再自動選下一段。
 * - 歌詞行：校正 SRT 的時間，按「這行開始了」覆寫該行開始時間，或整首平移。
 * 資料存在 localStorage，Live 與 MV 分開；「複製 JSON」輸出可直接取代 src/data/timings.json 的內容。
 */
export function MarkPanel(p: Props) {
  const { song, version } = p;
  const [last, setLast] = useState<{ kind: "cue" | "line"; index: number; value: number } | null>(null);
  const [copied, setCopied] = useState<"" | "ok" | "fail">("");
  const [fallback, setFallback] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const timed = song.cues.filter((c) => typeof c.t?.[version] === "number").length;
  const isLine = p.target === "line" && p.hasLines && p.lines;
  const total = isLine ? p.lines!.length : song.cues.length;
  const sel = isLine ? p.selLine : p.selCue;
  const selLabel = isLine ? `第 ${p.selLine + 1} 行` : song.cues[p.selCue]?.section ?? "";

  const mark = () => {
    if (p.time === null) return;
    const v = round10(p.time);
    if (isLine) {
      marks.setLine(song.id, version, p.selLine, v);
      setLast({ kind: "line", index: p.selLine, value: v });
      p.setSelLine(Math.min(p.selLine + 1, total - 1));
    } else {
      marks.setCue(song.id, version, p.selCue, song.cues.length, v);
      setLast({ kind: "cue", index: p.selCue, value: v });
      p.setSelCue(Math.min(p.selCue + 1, total - 1));
    }
  };

  const nudge = (d: number) => {
    if (!last) return;
    const value = Math.max(0, round10(last.value + d));
    if (last.kind === "line") marks.setLine(song.id, version, last.index, value);
    else marks.setCue(song.id, version, last.index, song.cues.length, value);
    setLast({ ...last, value });
  };

  const copy = async () => {
    const json = marks.exportJson();
    try {
      await navigator.clipboard.writeText(json);
      setCopied("ok");
      setFallback(null);
    } catch {
      setCopied("fail");
      setFallback(json);
    }
    setTimeout(() => setCopied(""), 2500);
  };

  return (
    <div className="mark-panel">
      <div className="mark-top">
        {p.hasLines && (
          <div className="seg" role="group" aria-label="標記對象">
            <button type="button" aria-pressed={p.target === "cue"} onClick={() => p.setTarget("cue")}>
              應援段落
            </button>
            <button type="button" aria-pressed={p.target === "line"} onClick={() => p.setTarget("line")}>
              歌詞行
            </button>
          </div>
        )}
        <span className="mark-ver">{version === "live" ? "Live 版" : "MV 版"}</span>
      </div>
      <div className="mark-main">
        <span className="mark-clock num" aria-label="目前秒數">
          {formatTime(p.time, true)}
        </span>
        <button type="button" className="mark-btn" onClick={mark} disabled={p.time === null}>
          {isLine ? "這行開始了" : "標記這段"}
        </button>
      </div>
      <p className="mark-hint">
        要標：<b>{selLabel}</b>（{sel + 1}/{total}）・點清單改選
        {!isLine && <>・已標 {timed}/{song.cues.length}</>}
        {isLine && <>・整首 {p.lyricOffset >= 0 ? "+" : ""}{p.lyricOffset.toFixed(1)}s</>}
      </p>
      <div className="mark-tools">
        <button type="button" className="pri" onClick={copy}>
          {copied === "ok" ? "已複製 ✓" : "複製 JSON"}
        </button>
        <button
          type="button"
          disabled={!marks.canUndo(song.id, version)}
          onClick={() => {
            marks.undo(song.id, version);
            // 復原後「剛剛標的」已不存在，微調按鈕不能再把它寫回去
            setLast(null);
          }}
        >
          ↶ 復原
        </button>
        <button type="button" onClick={() => nudge(-0.2)} disabled={!last} aria-label="上一個標記提早 0.2 秒">
          −0.2s
        </button>
        <button type="button" onClick={() => nudge(0.2)} disabled={!last} aria-label="上一個標記延後 0.2 秒">
          +0.2s
        </button>
        {isLine && (
          <>
            <button type="button" onClick={() => marks.shiftLyrics(song.id, version, -0.1)} aria-label="整首歌詞提早 0.1 秒">
              全部 −0.1
            </button>
            <button type="button" onClick={() => marks.shiftLyrics(song.id, version, 0.1)} aria-label="整首歌詞延後 0.1 秒">
              全部 +0.1
            </button>
          </>
        )}
        {!confirmClear ? (
          <button type="button" className="danger" onClick={() => setConfirmClear(true)}>
            清除本機標記
          </button>
        ) : (
          <>
            <span className="mark-hint">清除這首 {version === "live" ? "Live" : "MV"} 的本機標記？</span>
            <button
              type="button"
              className="danger"
              onClick={() => {
                marks.clearSong(song.id, version);
                setConfirmClear(false);
                setLast(null);
              }}
            >
              清除
            </button>
            <button type="button" onClick={() => setConfirmClear(false)}>
              取消
            </button>
          </>
        )}
      </div>
      {fallback && (
        <div className="mark-fallback">
          <label htmlFor="json-out">瀏覽器不允許自動複製，請手動全選複製：</label>
          <textarea id="json-out" readOnly value={fallback} rows={6} onFocus={(e) => e.currentTarget.select()} />
        </div>
      )}
    </div>
  );
}
