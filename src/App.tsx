import { useEffect } from "react";
import { usePlayer } from "./player/PlayerProvider";
import { useRoute } from "./lib/router";
import { usePrefs } from "./lib/store";
import { Home } from "./pages/Home";
import { AllSongs, Setlist } from "./pages/Lists";
import { Etiquette, Info } from "./pages/InfoPages";
import { SongPage, resolveVersion } from "./pages/SongPage";
import { videoIdFor } from "./data";
import { applyUpdate, useAppStatus } from "./lib/sw-register";

export function App() {
  const route = useRoute();
  const player = usePlayer();
  const [prefs] = usePrefs();
  const isSong = route.name === "song";
  const version = isSong ? resolveVersion(route.id, route.version) : undefined;
  const hasVideo = isSong && !!version && !!videoIdFor(route.id, version);
  const status = useAppStatus();

  // 離開歌曲頁就暫停
  useEffect(() => {
    if (!isSong) player.pause();
    if (!isSong) window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSong, route.name]);

  return (
    <>
      {/* 唯一的播放器：永遠在 DOM 裡，不隨換頁卸載或搬動 */}
      <div id="song-top" className="song-top" data-active={isSong}>
        <div id="song-head-slot" />
        <div className="player-shell" data-show={hasVideo && !prefs.simple}>
          <div className="player-ratio" ref={player.hostRef} />
        </div>
        <div id="song-under-slot" />
      </div>

      {(status.offline || status.updateReady) && (
        <div className="app-banner" role="status" data-song={isSong}>
          {status.offline ? (
            <span>目前離線：歌詞與應援照常可用，影片需要網路。</span>
          ) : (
            <>
              <span>新版本已準備好。</span>
              <button type="button" onClick={applyUpdate}>
                重新整理
              </button>
            </>
          )}
        </div>
      )}

      {route.name === "home" && <Home />}
      {route.name === "setlist" && <Setlist />}
      {route.name === "songs" && <AllSongs />}
      {route.name === "info" && <Info />}
      {route.name === "etiquette" && <Etiquette />}
      {route.name === "song" && <SongPage key={route.id} id={route.id} version={route.version} from={route.from} />}
    </>
  );
}
