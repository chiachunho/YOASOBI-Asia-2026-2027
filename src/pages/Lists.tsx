import { useMemo, useState } from "react";
import { ACTIONS, ACTION_IDS, ORDER, SETLIST, SONGS, actionsOf, type Action } from "../data";
import { Footer, Legend, SongRow, Topbar } from "../components/ui";

export function Setlist() {
  const groups: { head: string; rows: Exclude<(typeof SETLIST)[number], { head: string }>[] }[] = [];
  for (const r of SETLIST) {
    if ("head" in r) groups.push({ head: r.head, rows: [] });
    else groups[groups.length - 1].rows.push(r);
  }
  return (
    <section className="view">
      <Topbar title="預測歌單" />
      <div className="note-box">
        <strong>⚠️ 劇透注意</strong>　以下是 10/25 大阪 Day2 的歌單，札幌場可能會有調整。第 7 首是日替曲，大阪 Day1 唱「ラブレター」、Day2
        唱「ハルカ」；大阪 Day1 還在「劇上」後面多唱了一次 KILLA。11/7–8 名古屋場結束後會更清楚。
      </div>
      <Legend />
      {groups.map((g) => (
        <div key={g.head}>
          <div className="set-head">{g.head}</div>
          <ul className="songs">
            {g.rows.map((r, i) => (
              <SongRow key={`${r.id}-${i}`} id={r.id} n={r.n} variant={r.variant} hot={r.hot} alt={r.alt} from="setlist" />
            ))}
          </ul>
        </div>
      ))}
      <Footer />
    </section>
  );
}

/** 搜尋與篩選（純函式，方便測試） */
export function filterSongs(query: string, filter: ReadonlySet<Action>): string[] {
  const q = query.trim().toLowerCase().normalize("NFKC");
  return ORDER.filter((id) => {
    const s = SONGS[id];
    const hay = [s.title, s.zh ?? "", s.tie ?? "", ...(s.aliases ?? [])].join(" ").toLowerCase().normalize("NFKC");
    if (q && !hay.includes(q)) return false;
    const a = actionsOf(s);
    for (const f of filter) if (!a.includes(f)) return false;
    return true;
  });
}

export function AllSongs() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Set<Action>>(new Set());
  const list = useMemo(() => filterSongs(q, filter), [q, filter]);
  const toggle = (a: Action) =>
    setFilter((prev) => {
      const n = new Set(prev);
      if (n.has(a)) n.delete(a);
      else n.add(a);
      return n;
    });
  return (
    <section className="view">
      <Topbar title="全部歌曲應援" />
      <label className="search">
        <span aria-hidden="true">🔍</span>
        <span className="sr-only">搜尋歌名</span>
        <input id="song-search" type="search" placeholder="搜尋歌名（日文、中文都可以）" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>
      <p className="lead">點選動作只看需要那個動作的歌（可複選）：</p>
      <div className="legend" role="group" aria-label="依動作篩選">
        {ACTION_IDS.map((a) => (
          <button key={a} type="button" className="chip" aria-pressed={filter.has(a)} onClick={() => toggle(a)}>
            <i style={{ background: ACTIONS[a].color }} />
            {ACTIONS[a].label}
          </button>
        ))}
      </div>
      <ul className="songs">
        {list.length ? list.map((id, i) => <SongRow key={id} id={id} n={i + 1} from="all" />) : <li className="empty">沒有符合的歌</li>}
      </ul>
      <Footer />
    </section>
  );
}
