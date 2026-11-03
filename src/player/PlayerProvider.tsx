import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/*
 * 整個 App 只有一個 YouTube 播放器。
 *
 * 手機瀏覽器只在使用者點擊之後允許出聲；如果每次換歌都重建 iframe，
 * 新的 iframe 沒有拿到那次點擊的許可，會被擋成靜音或無法播放。
 * 所以播放器在 App 啟動時建立一次，之後換歌一律 loadVideoById，
 * 而且要在點擊事件裡同步呼叫 play()，不要等 React 換頁後才呼叫。
 *
 * 播放器的 DOM 節點掛在 App 最外層（見 App.tsx 的 player-shell），
 * 不會隨路由卸載或搬動；iframe 只要被搬動，瀏覽器就會重新載入它。
 */

export type PlayerStatus = "loading" | "idle" | "playing" | "paused" | "buffering" | "ended" | "error";

interface PlayerApi {
  ready: boolean;
  status: PlayerStatus;
  videoId: string | null;
  error: number | null;
  /** 在點擊事件裡呼叫：載入並播放 */
  play(videoId: string, start?: number): void;
  /** 非點擊情境（直接開連結）：只載入不播放 */
  cue(videoId: string): void;
  seek(seconds: number): void;
  pause(): void;
  toggle(): void;
  getTime(): number | null;
  setRate(rate: number): void;
  availableRates(): number[];
  /** App 用來掛播放器的容器 */
  hostRef: (el: HTMLDivElement | null) => void;
}

const Ctx = createContext<PlayerApi | null>(null);

let apiPromise: Promise<void> | null = null;
function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error("YouTube API 載入失敗"));
    };
    document.head.appendChild(s);
  });
  return apiPromise;
}

const STATE_MAP: Record<number, PlayerStatus> = {
  [-1]: "idle",
  0: "ended",
  1: "playing",
  2: "paused",
  3: "buffering",
  5: "idle",
};

export function PlayerProvider({ children }: { children: ReactNode }) {
  const playerRef = useRef<YT.Player | null>(null);
  const readyRef = useRef(false);
  const currentId = useRef<string | null>(null);
  const pending = useRef<{ id: string; autoplay: boolean; start: number } | null>(null);
  const rateRef = useRef(1);
  const [host, setHost] = useState<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<PlayerStatus>("loading");
  const [videoId, setVideoId] = useState<string | null>(null);
  const [error, setError] = useState<number | null>(null);

  const hostRef = useCallback((el: HTMLDivElement | null) => setHost(el), []);
  // 只讀 ref，身分固定，usePlayhead 的計時器不會因為播放狀態改變而重建
  const getTime = useCallback((): number | null => {
    const pl = readyRef.current ? playerRef.current : null;
    if (!pl) return null;
    try {
      const t = pl.getCurrentTime();
      return Number.isFinite(t) ? t : null;
    } catch {
      return null;
    }
  }, []);

  // 建立唯一的播放器
  useEffect(() => {
    if (!host || playerRef.current) return;
    let cancelled = false;
    const mount = document.createElement("div");
    host.appendChild(mount);
    loadApi()
      .then(() => {
        if (cancelled || playerRef.current || !window.YT) return;
        playerRef.current = new window.YT.Player(mount, {
          width: "100%",
          height: "100%",
          host: "https://www.youtube-nocookie.com",
          playerVars: { playsinline: 1, rel: 0, modestbranding: 1, autoplay: 0 },
          events: {
            onReady: () => {
              readyRef.current = true;
              setReady(true);
              setStatus("idle");
              const p = pending.current;
              pending.current = null;
              if (p) {
                currentId.current = p.id;
                setVideoId(p.id);
                if (p.autoplay) playerRef.current!.loadVideoById({ videoId: p.id, startSeconds: p.start });
                else playerRef.current!.cueVideoById({ videoId: p.id });
              }
            },
            onStateChange: (e) => {
              setStatus(STATE_MAP[e.data] ?? "idle");
              if (e.data === 1) {
                setError(null);
                // loadVideoById 會把速度重設為 1
                if (rateRef.current !== 1) {
                  try {
                    e.target.setPlaybackRate(rateRef.current);
                  } catch {
                    /* ignore */
                  }
                }
              }
            },
            onError: (e) => {
              setError(e.data);
              setStatus("error");
            },
          },
        });
      })
      .catch(() => setStatus("error"));
    return () => {
      cancelled = true;
      // 還沒建立播放器就被卸載（例如 StrictMode 的第二次 effect），把空容器拿掉
      if (!playerRef.current) mount.remove();
    };
  }, [host]);

  const api = useMemo<PlayerApi>(() => {
    const p = () => (readyRef.current ? playerRef.current : null);
    return {
      ready,
      status,
      videoId,
      error,
      hostRef,
      play(id, start = 0) {
        const pl = p();
        setError(null);
        if (!pl) {
          pending.current = { id, autoplay: true, start };
          setVideoId(id);
          return;
        }
        try {
          pl.unMute();
          if (currentId.current === id) {
            pl.seekTo(start, true);
            pl.playVideo();
          } else {
            currentId.current = id;
            setVideoId(id);
            pl.loadVideoById({ videoId: id, startSeconds: start });
          }
        } catch {
          /* ignore */
        }
      },
      cue(id) {
        const pl = p();
        if (currentId.current === id || pending.current?.id === id) return;
        if (!pl) {
          pending.current = { id, autoplay: false, start: 0 };
          setVideoId(id);
          return;
        }
        currentId.current = id;
        setVideoId(id);
        setError(null);
        pl.cueVideoById({ videoId: id });
      },
      seek(sec) {
        const pl = p();
        if (!pl) return;
        pl.seekTo(Math.max(0, sec), true);
        pl.playVideo();
      },
      pause() {
        try {
          p()?.pauseVideo();
        } catch {
          /* ignore */
        }
      },
      toggle() {
        const pl = p();
        if (!pl) return;
        const st = pl.getPlayerState();
        if (st === 1 || st === 3) pl.pauseVideo();
        else pl.playVideo();
      },
      getTime,
      setRate(rate) {
        rateRef.current = rate;
        try {
          p()?.setPlaybackRate(rate);
        } catch {
          /* ignore */
        }
      },
      availableRates() {
        try {
          const r = p()?.getAvailablePlaybackRates();
          return r && r.length ? r : [0.5, 0.75, 1, 1.25, 1.5];
        } catch {
          return [0.5, 0.75, 1, 1.25, 1.5];
        }
      },
    };
  }, [ready, status, videoId, error, hostRef, getTime]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer 必須在 PlayerProvider 裡使用");
  return v;
}

/** 每 intervalMs 讀一次 getCurrentTime()，回傳目前秒數 */
export function usePlayhead(enabled: boolean, intervalMs = 250): number | null {
  const player = usePlayer();
  const getTime = player.getTime;
  const [t, setT] = useState<number | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const tick = () => setT(getTime());
    tick();
    const id = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, getTime]);
  return enabled ? t : null;
}
