import type { Action } from "./types";

export const ACTIONS: Record<Action, { label: string; color: string }> = {
  chant: { label: "喊聲", color: "var(--c-chant)" },
  clap: { label: "拍手", color: "var(--c-clap)" },
  wave: { label: "揮手", color: "var(--c-wave)" },
  jump: { label: "跳", color: "var(--c-jump)" },
  sing: { label: "合唱", color: "var(--c-sing)" },
  gesture: { label: "手勢", color: "var(--c-gesture)" },
  listen: { label: "靜靜聽", color: "var(--c-listen)" },
};
