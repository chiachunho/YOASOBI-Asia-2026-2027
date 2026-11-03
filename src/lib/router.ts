import { useEffect, useState } from "react";
import type { VideoVersion } from "../data/types";

/* hash 路由：#/、#/setlist、#/songs、#/song/idol?v=mv&from=setlist、#/info、#/etiquette
   用 hash 是因為部署成靜態檔，不需要伺服器 rewrite。 */
export type Route =
  | { name: "home" }
  | { name: "setlist" }
  | { name: "songs" }
  | { name: "info" }
  | { name: "etiquette" }
  | { name: "song"; id: string; version?: VideoVersion; from: "setlist" | "all" };

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  const [path, query = ""] = h.split("?");
  const parts = path.split("/").filter(Boolean);
  const q = new URLSearchParams(query);
  switch (parts[0]) {
    case "setlist":
      return { name: "setlist" };
    case "songs":
      return { name: "songs" };
    case "info":
      return { name: "info" };
    case "etiquette":
      return { name: "etiquette" };
    case "song": {
      if (!parts[1]) return { name: "home" };
      const v = q.get("v");
      return {
        name: "song",
        id: decodeURIComponent(parts[1]),
        version: v === "live" || v === "mv" ? v : undefined,
        from: q.get("from") === "all" ? "all" : "setlist",
      };
    }
    default:
      return { name: "home" };
  }
}

export function songHref(id: string, opts: { version?: VideoVersion; from?: "setlist" | "all" } = {}): string {
  const q = new URLSearchParams();
  if (opts.version) q.set("v", opts.version);
  if (opts.from) q.set("from", opts.from);
  const qs = q.toString();
  return `#/song/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`;
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const on = () => setRoute(parseHash(location.hash));
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function navigate(href: string, replace = false) {
  if (replace) history.replaceState(null, "", href);
  else history.pushState(null, "", href);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}
