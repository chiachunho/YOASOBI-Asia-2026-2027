import type { Action, Cue, Song } from "./types";

/* 應援位置主要依據「未来を拾いに」〈YOASOBIライブの定番振り付け＆特殊振り付けについて〉（2025/12）
   與 kokemomo55〈YOASOBIライブのコールや合いの手は？〉整理；「」內是該動作開始的那句歌詞開頭，方便對位置。
   沒有可靠來源的新歌維持「跟著現場走」。
   段落秒數不寫在這裡，統一放在 timings.json（標記模式會匯出那個檔）。 */
type RawCue = [section: string, actions: Action[], note: string];
interface RawSong extends Omit<Song, "id" | "cues"> {
  cues: RawCue[];
}

const RAW: Record<string, RawSong> = {
  shukufuku: {
    title: "祝福", zh: "祝福", tie: "《機動戰士鋼彈 水星的魔女》OP", aliases: ["The Blessing", "Shukufuku"],
    tip: "Oi 曲＋合唱曲，Oi 的位置固定，C 段與最後一段的合唱建議先背。",
    cues: [
      ["開頭", ["chant"], "「共に生きるから」後喊「Oi! Oi!」×2 組"],
      ["主歌", ["chant"], "「夢を描き未来を見る」後喊「Oi!」×4"],
      ["導歌", ["chant"], "「逃げ出すよりも進むことを君が選んだのなら」後喊「Oi!」×4"],
      ["副歌結尾", ["sing"], "「僕たちが作ってくストーリー」後，全場接唱「決して独りにはさせないから！」"],
      ["間奏", ["chant"], "喊「Oi!」×4"],
      ["C 段", ["sing"], "「決めつけられた運命」起的兩句全場合唱"],
      ["最後副歌", ["sing"], "一問一答：台上「これは君の人生」→台下唱「誰のものでもない」；「それは答えなんてない」→「自分で選ぶ道」；「呪い呪われた未来は」ikura 把麥克風轉向觀眾 →「君がその手で変えていくんだ」"],
      ["尾奏", ["chant"], "「目一杯の、ああ祝福を君に」後喊「Oi!」×4 收尾"],
    ],
  },
  undead: {
    title: "UNDEAD", tie: "《物語系列》主題曲",
    tip: "口號多又快，建議先看影片練。",
    cues: [
      ["開頭口號", ["chant"], "跟著音源喊「UNHAPPY? UNLUCKY? BE HAPPY! UNDEAD!」"],
      ["拍手段", ["clap", "chant"], "「まだ離れない」後拍 4 下、「在りし日の自分」後拍 4 下，接著喊「UNDEAD!」"],
      ["收尾前", ["gesture", "chant"], "「閑話休題ピースピース」「古今東西…森羅万象ピースピース」後，雙手比 ✌️ 喊「ピースピース！」"],
      ["英文段", ["chant"], "一起喊「Past & Future / can't change the Past / Past & Future / run for the Future」"],
      ["最後", ["clap"], "「生き抜け この 化け物 ばかりの 物語」唱完拍兩下收尾"],
    ],
  },
  kaibutsu: {
    title: "怪物", zh: "怪物", tie: "《BEASTARS》第 2 季 OP", aliases: ["Monster", "Kaibutsu"],
    tip: "第二段的「Oi」Ayase 會帶，放開喊。",
    cues: [
      ["前奏", ["clap"], "照旋律節奏拍手"],
      ["主歌", ["clap"], "「何ができるのか」「僕には何ができるのか」後各拍「啪啪、啪 啪啪、啪」"],
      ["第二段主歌", ["chant"], "「清く正しく生きること」「誰も悲しませずに生きること」「はみ出さずまっすぐ生きること」「それが間違わないで生きること」每句後喊「Oi!」×4"],
      ["尾奏", ["chant"], "「僕の中の僕を超える」後喊「Oi!」×4 兩組"],
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
    title: "PLAYERS", tie: "PlayStation 合作曲",
    cues: [
      ["開頭", ["chant"], "跟著喊「Play! On! You & me! / Set on the legacy!」兩次"],
      ["副歌", ["chant"], "一起喊「もう一回もう一回！」（「初めから始められたら」前後各一次）"],
    ],
  },
  loveletter: {
    title: "ラブレター", zh: "情書", aliases: ["Love Letter"],
    tip: "掛け合い（一問一答）很多，詞又偏快，建議先背。",
    cues: [
      ["開頭", ["sing"], "全場唱「伝えたいことがあるんです」「届いてくれますように」"],
      ["主歌掛け合い", ["sing"], "ikura「いつもあなたのことを求めちゃうんだ」後，台下接「踊りだしたくなる時も 爆発しちゃいそうな時も」"],
      ["副歌", ["sing"], "ikura「救われたんだ」後，台下唱「心が動かされるんです」「心が満たされてくんです」「受け取ってどうか私の想いを」"],
      ["結尾", ["sing"], "ikura「きっと音楽だけなんだ」後，台下唱「代わりなんて一つもないんです」"],
    ],
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
      ["B 段", ["clap"], "從「好きにしていいと」開始拍手"],
      ["副歌", ["wave"], "從「ありふれた、あの日々を」開始，手掌舉起前後揮"],
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
    tip: "合唱段大螢幕通常會打歌詞，ikura 也會喊「みんなの声を聞かせて」。",
    cues: [
      ["主歌", ["clap"], "「足がすくんでしまっても」「声が震えても」「お構いなし」「心は置き去りのままで」每句後拍兩下"],
      ["合唱段", ["sing"], "「あーあーあー」後全場唱「ずっと遠くに見ていた」起的四句"],
      ["最後合唱", ["sing"], "「世界で一つの証」後全場唱「ずっと遠くに見ていた」起，接「ずっと前から僕が」共八句"],
    ],
  },
  anoyume: {
    title: "あの夢をなぞって", zh: "重現夢境", aliases: ["Ano Yume wo Nazotte", "Tracing A Dream"],
    cues: [["全曲", ["listen"], "開頭是清唱，安靜聽；之後跟著現場走"]],
  },
  seventeen: {
    title: "セブンティーン", zh: "Seventeen", aliases: ["Seventeen"],
    cues: [
      ["前奏", ["chant"], "前奏旋律後喊「Oi! Oi!」×2 組"],
      ["主歌", ["chant"], "「同じ姿形 中身は正反対」後的過門喊「Oi! Oi!」×2 組"],
      ["副歌", ["wave"], "手臂跟著節奏甩"],
      ["尾奏", ["chant"], "「さあ在るべき場所に帰ろう…セブンティーン」後喊「Oi! Oi!」×2 組"],
    ],
  },
  idol: {
    title: "アイドル", zh: "偶像", tie: "《【我推的孩子】》OP", aliases: ["Idol"],
    tip: "全場最重要的一首。喊聲位置大多跟原曲音源一樣，先看官方 Live 影片練時機。",
    cues: [
      ["開頭", ["chant"], "ikura「完璧で嘘つきな君は」後，全場大喊「天才的なアイドル様！」"],
      ["主歌", ["chant"], "「誰かを好きになることなんて」「私分からなくてさ」「嘘か本当か知り得ない」「そんな言葉にまた一人堕ちる」每句後喊「Oi! Oi!」"],
      ["副歌", ["chant"], "「君は完璧で究極の」「まさに最強で無敵の」後大喊「アイドル！」"],
      ["第二段 B 段", ["chant"], "「弱いとこなんて見せちゃダメダメ」「知りたくないとこは見せずに」「唯一無二じゃなくちゃイヤイヤ」每句後喊「Oi! Oi!」"],
      ["最後副歌", ["clap", "chant"], "「いつかきっと全部手に入れる」後拍 4 下、「私はそう欲張りな」後拍 2 下，接著喊「アイドル！」"],
      ["結尾", ["chant"], "「愛してる」後喊「Oi! Oi!」×3 組收尾"],
    ],
  },
  adventure: {
    title: "アドベンチャー", zh: "冒險", aliases: ["Adventure"],
    tip: "合唱曲，最後一次副歌要整段唱，建議先背。",
    cues: [
      ["B 段", ["sing"], "「高鳴る胸 抑えられない」後唱「ラララ ターター」、「約束の場所は」後再唱一次"],
      ["副歌", ["wave"], "從「待ちに待った今日は特別な日」開始手舉高左右揮"],
      ["最後副歌", ["sing"], "全場大合唱整段副歌（「当たり前から抜け出して」起到「特別な一日に」）"],
    ],
  },
  tsubame: {
    title: "ツバメ", zh: "燕子", aliases: ["Tsubame"],
    cues: [["全曲", ["listen"], "原整理沒有收錄，跟著現場走"]],
  },
  sakihokore: {
    title: "咲き誇れ", zh: "盛放吧", tie: "NHK 晨間劇《ブラッサム》主題曲", aliases: ["Sakihokore"],
    tip: "本巡迴首次樂團版演出，大阪場觀眾回報有合唱段。",
    cues: [["合唱段", ["sing"], "有讓全場合唱的段落，具體位置還沒有可靠整理；跟著 ikura 的指示與大螢幕歌詞唱"]],
  },
  watchme: {
    title: "Watch me!", tie: "《WITCH WATCH》OP",
    tip: "曲中的合いの手還沒有固定的現場喊法，其他部分跟著台上走。",
    cues: [["副歌", ["wave"], "從「こんな Day by day がいい」開始，ikura 會帶大家揮手"]],
  },
  gunjou: {
    title: "群青", zh: "群青", aliases: ["Gunjou"],
    tip: "幾乎每場必唱、合唱最多的一首，副歌前的合唱段和最後兩輪合唱一定要背。最後一輪歌詞跟前面不一樣。",
    cues: [
      ["合唱段", ["clap", "sing"], "副歌前「知らず知らず隠してた」起的四句，邊拍手邊唱"],
      ["間奏", ["clap"], "照吉他旋律節奏拍「啪啪！」"],
      ["C 段", ["wave"], "「本当にできる？」後，從「あぁ 何枚でも」到「自信がないから描いてきたんだよ」手掌舉起前後揮（ikura 也會一起揮）"],
      ["最後合唱", ["sing"], "ikura 喊完後全場唱兩輪「知らず知らず隠してた」：第一輪結尾「確かにそこに今もそこにあるよ」，第二輪改成「…響かせてよ、さあ」「確かにそこに 君の中に」"],
    ],
  },
  yoru: {
    title: "夜に駆ける", zh: "向夜晚奔去", tie: "出道曲", aliases: ["Racing Into The Night", "Yoru ni Kakeru"],
    tip: "壓軸曲，留點體力。",
    cues: [
      ["前奏", ["jump"], "跟著節奏跳"],
      ["第一段副歌後", ["jump", "chant"], "「二人だけの空が広がる夜に」後，ikura 喊「ちゃー！」，全場邊跳邊跟著「ちゃっちゃっちゃっ！」"],
      ["第二段前間奏", ["jump", "chant"], "「怖くないよ…二人でいよう」後，同樣邊跳邊喊「ちゃっちゃっちゃっ！」"],
      ["第二段後間奏", ["clap"], "照旋律拍手"],
      ["C 段", ["clap"], "「それでもきっといつかはきっと…分かり合えるさ 信じてるよ」後，雙手舉高拍 4 下"],
      ["結尾", ["jump", "chant"], "「二人今 夜に駆け出していく」後，再邊跳邊喊「ちゃっちゃっちゃっ！」收尾"],
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
