/* 用 YouTube oEmbed 檢查每個影片 ID 存在、標題含有歌名。
   執行：npm run verify:videos
   有不符的項目時以 exit code 1 結束。 */
import { BASE_SONGS } from "../src/data/songs";
import { VIDEOS } from "../src/data/videos";
import { checkVideo, type VideoCheck } from "../src/lib/verify";

const checks: VideoCheck[] = [];
for (const [songId, v] of Object.entries(VIDEOS)) {
  const song = BASE_SONGS[songId];
  const names = song ? [song.title, ...(song.aliases ?? [])] : [songId];
  if (v.live) checks.push({ songId, version: "live", videoId: v.live.id, names });
  if (v.mv) checks.push({ songId, version: "mv", videoId: v.mv, names });
}

const results = [];
for (const c of checks) {
  const r = await checkVideo(c, (url) => fetch(url));
  results.push(r);
  process.stdout.write(r.ok ? "." : "x");
}
process.stdout.write("\n\n");

const bad = results.filter((r) => !r.ok);
for (const r of results.filter((r) => r.ok)) {
  console.log(`OK  ${r.check.songId.padEnd(11)} ${r.check.version.padEnd(4)} ${r.check.videoId}  ${r.ok ? r.title : ""}`);
}
if (bad.length) {
  console.log(`\n不符 ${bad.length} 筆：`);
  console.table(
    bad.map((r) => ({
      歌曲: r.check.songId,
      版本: r.check.version,
      影片ID: r.check.videoId,
      原因: r.ok ? "" : r.reason,
      實際標題: r.ok ? r.title : (r.title ?? ""),
      比對名稱: r.check.names.join(" / "),
    })),
  );
  process.exit(1);
}
console.log(`\n全部 ${results.length} 支影片都通過。`);
