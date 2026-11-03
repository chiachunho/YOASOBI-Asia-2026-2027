import { ACTION_IDS, type Action, type LyricLine, type LyricPart } from "../data/types";
import type { LyricFix } from "./timings";

export class SrtError extends Error {
  constructor(public file: string, public line: number, public rule: string, detail: string) {
    super(`${file}:${line} [${rule}] ${detail}`);
  }
}

const TIME = /^(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})$/;

function toSeconds(stamp: string): number | null {
  const m = TIME.exec(stamp.trim());
  if (!m) return null;
  const [, h, mi, s, ms] = m;
  return Number(h) * 3600 + Number(mi) * 60 + Number(s) + Number(ms.padEnd(3, "0")) / 1000;
}

const BACKING = /^[(（].*[)）]$/;

/**
 * 逐行應援標記（寫在 SRT 的日文行）：
 *   行首 [clap] 或 [wave,jump] 或 [clap][wave] → 這一行的動作
 *   {…}                                         → 這段要一起喊／唱
 * 例：[clap]ここは普通{ここを喊}ここは普通
 */
export function parseCueMarkup(raw: string, file = "lyrics.srt", line = 0): { actions: Action[]; parts: LyricPart[]; text: string } {
  let rest = raw;
  const actions: Action[] = [];
  for (let m = /^\s*\[([^\]]*)\]/.exec(rest); m; m = /^\s*\[([^\]]*)\]/.exec(rest)) {
    for (const name of m[1].split(/[,，\s]+/).filter(Boolean)) {
      if (!(ACTION_IDS as readonly string[]).includes(name)) {
        throw new SrtError(file, line, "unknown-action", `不認得的動作代號「${name}」，可用：${ACTION_IDS.join("、")}`);
      }
      if (!actions.includes(name as Action)) actions.push(name as Action);
    }
    rest = rest.slice(m[0].length);
  }
  rest = rest.trimStart();
  const parts: LyricPart[] = [];
  let buf = "";
  let inChant = false;
  for (const ch of rest) {
    if (ch === "{" || ch === "}") {
      if ((ch === "{") === inChant) {
        throw new SrtError(file, line, "unbalanced-brace", "{ } 沒有成對");
      }
      if (buf) parts.push({ text: buf, chant: inChant });
      buf = "";
      inChant = ch === "{";
    } else buf += ch;
  }
  if (inChant) throw new SrtError(file, line, "unbalanced-brace", "{ 沒有對應的 }");
  if (buf) parts.push({ text: buf, chant: false });
  return { actions, parts, text: parts.map((p) => p.text).join("") };
}

/**
 * 解析 SRT。每個區塊：序號、時間、日文一行、中文（選填）一行。
 * 只有一行文字的區塊視為沒有翻譯。三行以上會報錯，避免日中錯位。
 */
export function parseSrt(text: string, file = "lyrics.srt"): LyricLine[] {
  const rows = text.replace(/^﻿/, "").replace(/\r\n?/g, "\n").split("\n");
  const out: LyricLine[] = [];
  let i = 0;
  while (i < rows.length) {
    while (i < rows.length && rows[i].trim() === "") i++;
    if (i >= rows.length) break;
    const blockStart = i + 1;
    let header = rows[i].trim();
    // 序號可以省略：第一行直接是時間也接受
    if (/^\d+$/.test(header)) {
      i++;
      header = (rows[i] ?? "").trim();
    }
    const stamps = header.split("-->");
    if (stamps.length !== 2) throw new SrtError(file, i + 1, "time-format", `看不懂的時間行：「${header}」`);
    const start = toSeconds(stamps[0]);
    const end = toSeconds(stamps[1]);
    if (start === null || end === null) throw new SrtError(file, i + 1, "time-format", `時間格式錯誤：「${header}」`);
    if (end < start) throw new SrtError(file, i + 1, "end-before-start", "結束時間早於開始時間");
    i++;
    const textLine = i + 1;
    const textRows: string[] = [];
    while (i < rows.length && rows[i].trim() !== "") textRows.push(rows[i++].trim());
    if (textRows.length === 0) throw new SrtError(file, blockStart, "empty-block", "區塊沒有文字");
    if (textRows.length > 2) {
      throw new SrtError(file, blockStart, "too-many-lines", `區塊有 ${textRows.length} 行文字，預期是「日文」或「日文＋中文」`);
    }
    const prev = out[out.length - 1];
    if (prev && start < prev.start) {
      throw new SrtError(file, blockStart, "time-not-increasing", "開始時間比上一句早");
    }
    const [rawJp, zh] = textRows;
    const { actions, parts, text: jp } = parseCueMarkup(rawJp, file, textLine);
    out.push({ start, end, jp, zh, backing: BACKING.test(jp), actions, parts });
  }
  return out;
}

/** 套用校正：整首平移，再覆寫個別行的開始時間 */
export function applyLyricFix(lines: LyricLine[], fix?: LyricFix): LyricLine[] {
  if (!fix) return lines;
  const offset = fix.offset ?? 0;
  return lines.map((l, i) => {
    const override = fix.lines?.[String(i)];
    const start = override ?? l.start + offset;
    const end = l.end + offset;
    return { ...l, start, end: Math.max(end, start) };
  });
}

/** 把「漢字（かな）」拆成 ruby 片段 */
export type RubyPart = { text: string; ruby?: string };
const RUBY = /([㐀-鿿々〆ヶ]+)[（(]([ぁ-ゟ゠-ヿー]+)[）)]/g;
export function rubyParts(text: string): RubyPart[] {
  const out: RubyPart[] = [];
  let last = 0;
  for (const m of text.matchAll(RUBY)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index) });
    out.push({ text: m[1], ruby: m[2] });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last) });
  return out;
}
