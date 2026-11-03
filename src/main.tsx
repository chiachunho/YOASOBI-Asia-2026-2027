import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PlayerProvider } from "./player/PlayerProvider";
import "./styles.css";
import { registerServiceWorker } from "./lib/sw-register";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PlayerProvider>
      <App />
    </PlayerProvider>
  </StrictMode>,
);

registerServiceWorker();
