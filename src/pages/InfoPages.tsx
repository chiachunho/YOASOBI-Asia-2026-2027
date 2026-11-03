import { Footer, Legend, Topbar } from "../components/ui";

export function Info() {
  return (
    <section className="view">
      <Topbar title="演出資訊・交通" />
      <div className="card">
        <h2>場次</h2>
        <dl className="kv num">
          <dt>Day 1</dt>
          <dd>2026/11/14（六）開場 15:30／開演 18:00</dd>
          <dt>Day 2</dt>
          <dd>2026/11/15（日）開場 14:30／開演 17:00</dd>
          <dt>會場</dt>
          <dd className="jp">大和ハウス プレミストドーム（札幌巨蛋）</dd>
          <dt>票價</dt>
          <dd>指定席 ¥14,000</dd>
        </dl>
        <p className="src">時間為日本時間（比台灣快 1 小時）。</p>
      </div>
      <div className="card">
        <h2>交通方式</h2>
        <ul>
          <li>
            最近的車站是札幌市營地下鐵<b>東豊線「福住」站</b>，出站步行約 10 分鐘。
          </li>
          <li>從大通、札幌站搭東豊線往福住方向，福住是終點站，不怕坐過頭。</li>
          <li>散場時福住站人潮非常多，進站常要排隊管制，回程時間抓寬一點，或先在附近逛一下再走。</li>
          <li>札幌 11 月中旬晚上可能已經零度上下、有機會下雪，排隊和散場走路都在室外，記得穿暖。</li>
        </ul>
      </div>
      <div className="card">
        <h2>札幌場限定</h2>
        <ul>
          <li>わかさいも本舗為札幌場推出聯名點心「てくてくYOASOBI×北海道あんぽてと」，在特設網站預購。</li>
        </ul>
      </div>
      <div className="card">
        <h2>相關連結</h2>
        <ul>
          <li>
            <a href="https://www.yoasobi-music.jp/" target="_blank" rel="noopener">
              YOASOBI 官方網站
            </a>
          </li>
          <li>
            <a href="https://www.yoasobi-music.jp/live/54776" target="_blank" rel="noopener">
              超惑星 巡迴官方頁面
            </a>
          </li>
        </ul>
      </div>
      <Footer />
    </section>
  );
}

export function Etiquette() {
  return (
    <section className="view">
      <Topbar title="應援禮儀・第一次參加" />
      <div className="card warn">
        <h2>📵 巨蛋場不要開手機燈</h2>
        <p>
          「優しい彗星」在 Live House／體育館場常會揮手機燈，但<b>巨蛋場是禁止的</b>。札幌是巨蛋，請不要開。
        </p>
      </div>
      <div className="card">
        <h2>不用怕跟不上</h2>
        <p>
          YOASOBI 的 Live 沒有固定舞步，主要是喊聲、拍手跟合唱。ikura 和 Ayase 會用話或手勢帶大家，沒預習也能玩得很開心。真正值得先準備的是
          <b>合唱曲的歌詞</b>（群青、アドベンチャー、HEART BEAT、ラブレター）。
        </p>
      </div>
      <div className="card">
        <h2>帶什麼</h2>
        <ul>
          <li>
            <b>有照片的身分證件</b>（護照）＋門票（電子票的手機要有電）
          </li>
          <li>行動電源</li>
          <li>毛巾：Ayase 有時會帶大家甩毛巾，也可以擦汗</li>
          <li>雙筒望遠鏡（巨蛋很大）</li>
          <li>
            入場時會發 <b>Freeflow 手環（フリフラ）</b>，燈光由主辦統一控制，不需要自己切顏色
          </li>
        </ul>
      </div>
      <div className="card">
        <h2>動作代號說明</h2>
        <Legend />
        <ul>
          <li>
            <b>Oi!</b>：跟著節拍，手握拳往前推、一起喊「Oi!」
          </li>
          <li>
            <b>揮手掌</b>：手舉高，手掌左右慢慢揮
          </li>
          <li>
            <b>甩手臂</b>：手臂跟著節奏大幅擺動
          </li>
        </ul>
      </div>
      <p className="src">
        動作整理參考：
        <a href="https://onioni2004.hatenablog.com/entry/2025/12/14/231422" target="_blank" rel="noopener">
          未来を拾いに（日本粉絲個人整理，2025/12）
        </a>
        、
        <a href="https://kokemomo55.com/yoasobi-live-enjoy/" target="_blank" rel="noopener">
          kokemomo55
        </a>
        、
        <a href="https://note.com/kind_heart128/n/n50387f5af9ef" target="_blank" rel="noopener">
          note：アイドル的喊聲
        </a>
        。歌單參考：
        <a href="https://live-setlist.hatenablog.com/entry/yoasobi-osakadome-2026-10" target="_blank" rel="noopener">
          ライブ-セットリスト
        </a>
        。
      </p>
      <Footer />
    </section>
  );
}
