# YOASOBI 超惑星 札幌場應援指南

YOASOBI「超惑星」札幌場（2026/11/14–15）的非官方粉絲應援指南。手機優先，Vite + React + TypeScript。

## 指令

```bash
npm install
npm run dev            # 本機開發
npm test               # 資料檢查與單元測試
npm run build          # 型別檢查 + 建置到 dist/
npm run verify:videos  # 用 YouTube oEmbed 檢查影片 ID（需要能連到 youtube.com）
```

## 資料在哪裡

| 檔案 | 內容 |
|---|---|
| `src/data/songs.ts` | 每首歌的應援段落（段落、動作、說明）、別名、翻譯署名 |
| `src/data/videos.ts` | 官方 YouTube 影片 ID（`live`／`mv`） |
| `src/data/setlist.ts` | 預測歌單順序、日替、管弦樂、提醒標籤 |
| `src/data/timings.json` | 段落開始秒數與歌詞校正（標記模式匯出的檔案） |
| `lyrics/*.srt` | 逐行歌詞，格式見 `lyrics/README.md` |

動作代號：`chant` 喊聲、`clap` 拍手、`wave` 揮手、`jump` 跳、`sing` 合唱、`gesture` 手勢、`listen` 靜靜聽。

## 播放器

整個 App 只建立一個 YouTube IFrame 播放器（`src/player/PlayerProvider.tsx`），掛在 App 最外層，不隨換頁卸載。換歌一律用 `loadVideoById`，並且在點擊事件裡同步呼叫，手機瀏覽器才會沿用使用者的播放許可、不被擋成靜音。歌曲頁每 250ms 讀一次 `getCurrentTime()`，標出目前段落與歌詞行。

## 離線使用

正式建置會產生 `dist/sw.js`（Service Worker），第一次開網站時就把所有頁面程式、樣式與**每首歌的歌詞**預先下載。之後在會場沒有網路也能開網站、看歌詞與應援；只有 YouTube 影片需要網路。

- 頁面：先連網，失敗或 4 秒沒回應就用快取。
- 建置產出的檔案（檔名含雜湊）：先用快取。
- 新版本部署後，下次開啟會在畫面下方出現「新版本已準備好・重新整理」。
- `vercel.json` 已設定 `sw.js` 不快取，確保使用者拿得到新版。

建議在社群公告：**出發前先在家用手機打開網站一次**。

## 標記時間點

1. 打開歌曲頁，按右上角「標記」。
2. 選「應援段落」或「歌詞行」。
3. 播放影片，到段落開始時按「標記這段」（或「這行開始了」），會自動選下一段。點清單可以改選要標的項目，`−0.2s／+0.2s` 微調剛剛標的時間，「復原」回上一步。
4. Live 與 MV 的時間分開存，用上方 Live／MV 切換。
5. 按「複製 JSON」，把內容整個取代 `src/data/timings.json`，跑 `npm test` 確認後提交。

標記先存在這台裝置的 localStorage，清掉瀏覽器資料就會不見，記得定期複製出來。

## 部署到 GitHub Pages

1. repo 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。
2. 合併或推送到 `main` 後，`.github/workflows/pages.yml` 會執行 `npm ci`、`npm test`、`npm run build`，再發布 `dist/`。
3. 完成後網址是 `https://chiachunho.github.io/YOASOBI-Asia-2026-2027/`。

網站全部用相對路徑（`vite.config.ts` 的 `base: "./"`），放在子路徑或自訂網域都能用。開 PR 時 `.github/workflows/ci.yml` 只跑測試與建置，不部署。

### 綁定 `yoasobi.jefferyho.cc`（選用）

1. 到 `jefferyho.cc` 的 DNS 管理介面（網域商或 Cloudflare）新增一筆：

   | 類型 | 名稱 | 值 |
   |---|---|---|
   | CNAME | `yoasobi` | `chiachunho.github.io` |

   用 Cloudflare 的話，先設成 **DNS only（灰色雲）**，等 GitHub 簽好 HTTPS 憑證再決定要不要開 Proxy。
2. repo 的 **Settings → Pages → Custom domain** 填 `yoasobi.jefferyho.cc` → **Save**，等 DNS 檢查通過。
3. 勾選 **Enforce HTTPS**（憑證簽發可能要幾分鐘到一小時）。
4. 建議到 GitHub 帳號的 **Settings → Pages** 驗證 `jefferyho.cc` 網域，避免別人的 repo 搶用這個子網域。

用 GitHub Actions 部署時不需要在 repo 放 `CNAME` 檔，網域設定存在 repo 的 Pages 設定裡。

### 改用 Vercel（選用）

`vercel.json` 已經準備好。在 Vercel 匯入這個 repo 即可，Framework 會自動偵測為 Vite；自訂網域在 Vercel 專案的 **Settings → Domains** 新增，DNS 改成 Vercel 顯示的 CNAME 值。

## 來源與聲明

非官方粉絲製作，與 YOASOBI、Sony Music 及主辦單位無關。影片為 YOASOBI 官方 YouTube 頻道嵌入。動作整理參考：未来を拾いに、kokemomo55、note；歌單參考：ライブ-セットリスト。版面與播放器互動參考 [Vaundy HORO 台北場應援指南](https://github.com/watain666/Vaundy-Taiwan-2026)。
