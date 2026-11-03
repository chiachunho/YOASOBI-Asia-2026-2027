import type { Action, Cue, Song } from "./types";

/* 由舊版單頁 HTML 的 SONGS 抽出，文案未改。
   段落秒數不寫在這裡，統一放在 timings.json（標記模式會匯出那個檔）。 */
type RawCue = [section: string, actions: Action[], note: string];
interface RawSong extends Omit<Song, "id" | "cues"> {
  cues: RawCue[];
}

const RAW: Record<string, RawSong> = {
  shukufuku: {
    title: "祝福", zh: "祝福", tie: "《機動戰士鋼彈 水星的魔女》OP", aliases: ["The Blessing", "Shukufuku"],
    cues: [
      ["前奏", ["chant"], "跟著節拍喊「Oi!」"],
      ["副歌", ["chant"], "繼續喊「Oi!」"],
      ["間奏・橋段", ["chant"], "喊「Oi!」"],
      ["合唱段", ["sing"], "全場一起唱"],
      ["尾奏", ["chant"], "喊「Oi!」收尾"],
    ],
  },
  undead: {
    title: "UNDEAD", tie: "《物語系列》主題曲",
    cues: [
      ["前奏", ["chant"], "一呼一應，台上喊、台下回"],
      ["拍手段", ["clap"], "有拍手的地方跟著拍"],
      ["最後一段", ["gesture"], "比 ✌️"],
    ],
  },
  kaibutsu: {
    title: "怪物", zh: "怪物", tie: "《BEASTARS》第 2 季 OP", aliases: ["Monster", "Kaibutsu"],
    cues: [
      ["前奏", ["clap"], "拍手"],
      ["主歌", ["clap", "chant"], "邊拍手邊一起喊"],
      ["第二段", ["chant"], "全場大聲喊"],
      ["尾奏", ["chant"], "全場大聲喊"],
    ],
  },
  taisho: {
    title: "大正浪漫", zh: "大正浪漫", aliases: ["Taisho Roman"],
    cues: [
      ["間奏", ["clap"], "照著旋律的節奏拍手"],
      ["尾奏", ["clap"], "照著旋律的節奏拍手"],
    ],
  },
  gekijo: {
    title: "劇上", tie: "日劇主題曲・Ayase 首次參與演唱的雙主唱曲", aliases: ["Gekijo"],
    cues: [["全曲", ["listen"], "原整理沒有收錄（2026/10 新歌），跟著台上和現場氣氛走"]],
  },
  killa: {
    title: "KILLA", tie: "新曲・預計年內發行",
    tip: "大阪 Day1 第一次唱時遇到器材故障，安可又唱了一次當驚喜。",
    cues: [["全曲", ["listen"], "巡迴首唱的新歌，還沒有固定應援，跟著現場走"]],
  },
  players: {
    title: "PLAYERS",
    cues: [
      ["全曲", ["listen"], "基本上跟著歌走"],
      ["反覆段", ["chant"], "口號一起喊"],
      ["合唱段", ["sing"], "一起唱"],
    ],
  },
  loveletter: {
    title: "ラブレター", zh: "情書", aliases: ["Love Letter"],
    tip: "合唱曲，建議先背歌詞。",
    cues: [["副歌那幾段", ["sing"], "一起唱，其他部分跟著歌走"]],
  },
  haruka: {
    title: "ハルカ", zh: "遙", aliases: ["Haruka"],
    cues: [["全曲", ["listen"], "抒情曲，靜靜聽就好"]],
  },
  suisei: {
    title: "優しい彗星", zh: "溫柔的彗星", tie: "《BEASTARS》ED", aliases: ["Comet", "Yasashii Suisei"],
    tip: "📵 札幌是巨蛋場，不要開手機燈。",
    cues: [["副歌", ["listen"], "原本會揮手機燈，但巨蛋場禁止，請不要開燈"]],
  },
  baby: {
    title: "BABY",
    cues: [["全曲", ["listen"], "原整理沒有收錄，跟著現場氣氛走"]],
  },
  encore: {
    title: "アンコール", zh: "安可", tie: "大阪場有管弦樂團伴奏", aliases: ["Encore"],
    cues: [
      ["B段", ["clap"], "從副歌前的導歌開始拍手"],
      ["副歌", ["wave"], "手舉高、手掌左右揮"],
    ],
  },
  orion: {
    title: "オリオン", zh: "獵戶座", tie: "《鬥陣特攻 Overwatch》合作曲・大阪場有管弦樂團伴奏", aliases: ["Orion"],
    cues: [["全曲", ["listen"], "新歌、管弦樂版，靜靜聽"]],
  },
  yuusha: {
    title: "勇者", zh: "勇者", tie: "《葬送的芙莉蓮》OP・大阪場有管弦樂團伴奏", aliases: ["The Brave", "Yuusha"],
    cues: [["全曲", ["listen"], "原整理沒有收錄，跟著現場走"]],
  },
  heartbeat: {
    title: "HEART BEAT", tie: "NHK「18祭」主題曲",
    tip: "合唱曲，建議先背歌詞。",
    cues: [
      ["主歌", ["clap"], "拍手"],
      ["副歌", ["sing"], "一起合唱"],
      ["最後一段", ["sing"], "全場合唱"],
    ],
  },
  anoyume: {
    title: "あの夢をなぞって", zh: "重現夢境", aliases: ["Ano Yume wo Nazotte", "Tracing A Dream"],
    cues: [["全曲", ["listen"], "開頭是清唱，安靜聽；之後跟著現場走"]],
  },
  seventeen: {
    title: "セブンティーン", zh: "Seventeen", aliases: ["Seventeen"],
    cues: [
      ["前奏", ["chant"], "喊「Oi!」"],
      ["主歌", ["chant"], "喊「Oi!」"],
      ["副歌", ["wave"], "手臂跟著節奏甩"],
      ["尾奏", ["chant"], "喊「Oi!」"],
    ],
  },
  idol: {
    title: "アイドル", zh: "偶像", tie: "《【我推的孩子】》OP", aliases: ["Idol"],
    tip: "全場最重要的一首。先看官方 Live 影片練喊聲的時機。",
    cues: [
      ["主歌・B段", ["chant"], "每一拍都喊「Oi!」（也有人喊「はい！」），原曲音源就有錄，照著原曲跟"],
      ["第一段副歌前", ["chant"], "宅宅應援（ヲタクコール）"],
      ["每段副歌", ["chant"], "大聲喊「アイドル！」"],
      ["副歌後半", ["chant"], "宅宅應援"],
      ["後段", ["clap"], "拍手"],
      ["結尾", ["chant"], "喊「Oi!」收尾"],
    ],
  },
  adventure: {
    title: "アドベンチャー", zh: "冒險", aliases: ["Adventure"],
    tip: "合唱曲，建議先背歌詞。",
    cues: [
      ["B段", ["sing"], "一起唱"],
      ["副歌", ["wave"], "手臂揮動"],
      ["反覆段", ["sing"], "一起唱"],
      ["最後一次副歌", ["sing"], "全場大合唱"],
    ],
  },
  tsubame: {
    title: "ツバメ", zh: "燕子", aliases: ["Tsubame"],
    cues: [["全曲", ["listen"], "原整理沒有收錄，跟著現場走"]],
  },
  sakihokore: {
    title: "咲き誇れ", zh: "盛放吧", tie: "NHK 晨間劇《ブラッサム》主題曲", aliases: ["Sakihokore"],
    cues: [["全曲", ["listen"], "本巡迴首次樂團版演出，靜靜聽"]],
  },
  watchme: {
    title: "Watch me!", tie: "《WITCH WATCH》OP",
    cues: [["副歌", ["wave"], "跟著 ikura 揮手臂"]],
  },
  gunjou: {
    title: "群青", zh: "群青", aliases: ["Gunjou"],
    tip: "合唱曲，建議先背歌詞。",
    cues: [
      ["合唱段", ["clap", "sing"], "一起唱、拍手"],
      ["間奏", ["clap"], "拍手"],
      ["橋段", ["wave"], "手舉高揮手掌"],
      ["結尾", ["sing"], "全場大合唱"],
    ],
  },
  yoru: {
    title: "夜に駆ける", zh: "向夜晚奔去", tie: "出道曲", aliases: ["Racing Into The Night", "Yoru ni Kakeru"],
    tip: "壓軸曲，留點體力。",
    cues: [
      ["前奏", ["jump"], "跳"],
      ["反覆段", ["jump", "chant"], "邊跳邊喊（包括第二段前的間奏）"],
      ["主歌後間奏", ["clap"], "拍手"],
      ["最後一段", ["clap"], "拍手"],
      ["結尾", ["jump", "chant"], "再跳再喊"],
    ],
  },
};

/** 全部歌曲頁的排列順序 */
export const ORDER = [
  "shukufuku", "undead", "kaibutsu", "taisho", "gekijo", "killa", "players", "loveletter", "haruka",
  "suisei", "baby", "encore", "orion", "yuusha", "heartbeat", "anoyume", "seventeen", "idol",
  "adventure", "tsubame", "sakihokore", "watchme", "gunjou", "yoru",
];

export const BASE_SONGS: Record<string, Song> = Object.fromEntries(
  Object.entries(RAW).map(([id, s]) => [
    id,
    {
      ...s,
      id,
      cues: s.cues.map(([section, actions, note]): Cue => ({ section, actions, note })),
    },
  ]),
);
