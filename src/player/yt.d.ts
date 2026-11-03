/* YouTube IFrame Player API 用到的部分 */
declare namespace YT {
  const enum PlayerState {
    UNSTARTED = -1,
    ENDED = 0,
    PLAYING = 1,
    PAUSED = 2,
    BUFFERING = 3,
    CUED = 5,
  }
  interface PlayerEvent {
    target: Player;
    data: number;
  }
  interface PlayerOptions {
    width?: string | number;
    height?: string | number;
    videoId?: string;
    host?: string;
    playerVars?: Record<string, string | number>;
    events?: {
      onReady?: (e: PlayerEvent) => void;
      onStateChange?: (e: PlayerEvent) => void;
      onError?: (e: PlayerEvent) => void;
      onPlaybackRateChange?: (e: PlayerEvent) => void;
    };
  }
  class Player {
    constructor(el: HTMLElement | string, opts: PlayerOptions);
    loadVideoById(opts: { videoId: string; startSeconds?: number }): void;
    cueVideoById(opts: { videoId: string; startSeconds?: number }): void;
    playVideo(): void;
    pauseVideo(): void;
    seekTo(seconds: number, allowSeekAhead: boolean): void;
    getCurrentTime(): number;
    getDuration(): number;
    getPlayerState(): number;
    setPlaybackRate(rate: number): void;
    getPlaybackRate(): number;
    getAvailablePlaybackRates(): number[];
    unMute(): void;
    destroy(): void;
  }
}

interface Window {
  YT?: typeof YT;
  onYouTubeIframeAPIReady?: () => void;
}
