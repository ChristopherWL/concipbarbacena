import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { applyThemeSnapshotFromSession } from "@/lib/themeCache";

// Apply cached theme ASAP to prevent theme flash on reload
applyThemeSnapshotFromSession();

// Prevent unexpected "tab switch" reloads caused by a previously registered PWA service worker.
// We disable SW for now and unregister any existing ones.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((regs) => regs.forEach((r) => r.unregister()))
    .catch(() => {
      // ignore
    });
}


createRoot(document.getElementById("root")!).render(<App />);
