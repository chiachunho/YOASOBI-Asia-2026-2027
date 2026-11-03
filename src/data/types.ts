export const ACTION_IDS = ["chant", "clap", "wave", "jump", "sing", "gesture", "listen"] as const;
export type Action = (typeof ACTION_IDS)[number];

/** 影片版本：官方 Live 影片或官方 MV。兩者的時間點分開存。 */
export type VideoVersion = "live" | "mv";
export const VERSIONS: readonly VideoVersion[] = ["live", "mv"];

export interface Cue {
  section: string;
  actions: Action[];
  note: string;
  /** 段落開始的秒數，Live 與 MV 分開 */
  t?: { live?: number; mv?: number };
}

export interface Song {
  id: string;
  title: string;
  zh?: string;
  /** 合作作品、背景說明 */
  tie?: string;
  tip?: string;
  /** 影片標題比對用的其他名稱（羅馬字、英文名） */
  aliases?: string[];
  /** 歌詞翻譯來源，顯示在歌曲頁 */
  translationCredit?: string;
  cues: Cue[];
}

export interface SongVideos {
  live?: { id: string; label: string };
  mv?: string;
}

export type SetlistRow =
  | { head: string }
  | {
      n: number | string;
      id: string;
      /** 灰色小標籤，例如「日替」「管弦樂」 */
      variant?: string;
      /** 紅色小標籤，例如「必練」 */
      hot?: string;
      /** 日替的另一首 */
      alt?: string;
    };

/** 日文行的片段；chant = 這段要一起喊／唱 */
export interface LyricPart {
  text: string;
  chant: boolean;
}

/** 由 SRT 解析出的一行歌詞 */
export interface LyricLine {
  start: number;
  end: number;
  /** 去掉標記後的日文 */
  jp: string;
  zh?: string;
  /** 整行包在括號裡的和聲、呼喊 */
  backing: boolean;
  /** 這一行的動作（行首 [clap] 等標記）；空陣列表示沿用所在段落的動作 */
  actions: Action[];
  parts: LyricPart[];
}
