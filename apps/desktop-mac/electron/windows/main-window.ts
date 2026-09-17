import { BrowserWindow, screen, shell } from "electron";
import path from "node:path";
import { getStoreValue, setStoreValue } from "../services/store";
import { getWebOrigin } from "../services/web-server";
import { isAppQuitting } from "../services/app-lifecycle";

export function createMainWindow(): BrowserWindow {
  const saved = getStoreValue("mainBounds");
  const display = screen.getPrimaryDisplay().workArea;
  const isMac = process.platform === "darwin";

  const win = new BrowserWindow({
    width: saved?.width ?? Math.min(1280, display.width),
    height: saved?.height ?? Math.min(820, display.height),
    x: saved?.x,
    y: saved?.y,
    minWidth: 960,
    minHeight: 640,
    show: false,
    frame: false,
    title: "CueAI",
    backgroundColor: "#e8e8ed",
    titleBarStyle: isMac ? "hiddenInset" : "hidden",
    trafficLightPosition: { x: 16, y: 18 },
    vibrancy: isMac ? "sidebar" : undefined,
    visualEffectState: "active",
    backgroundMaterial: isMac ? "acrylic" : undefined,
    roundedCorners: true,
    hasShadow: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: true,
    },
  });

  win.setTitle("CueAI");
  win.on("page-title-updated", (event) => {
    event.preventDefault();
    if (!win.isDestroyed()) win.setTitle("CueAI");
  });

  const origin = getWebOrigin().replace(/\/$/, "");
  const target = `${origin}/dashboard?desktop=mac`;
  void win.loadURL(target);

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  win.webContents.on("did-fail-load", (_e, code, desc, url, isMainFrame) => {
    if (!isMainFrame || win.isDestroyed()) return;
    const html = `<!doctype html><html><body style="margin:0;background:#e8e8ed;color:#1d1d1f;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
      <div style="padding:88px 48px 48px">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#86868b">CueAI for Mac</p>
        <h1 style="font-size:28px;letter-spacing:-.03em;margin:0 0 12px">The workspace couldn’t load</h1>
        <p style="color:#6e6e73;line-height:1.5;max-width:420px">Couldn’t open <code>${url || target}</code>. ${desc || "Connection refused"} (${code}).</p>
        <p style="color:#1d1d1f;margin-top:24px">Start the web app, then reopen CueAI:</p>
        <pre style="background:#fff;border-radius:12px;padding:14px 16px;margin-top:10px;color:#c2410c">npm run dev:web</pre>
      </div></body></html>`;
    void win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    if (!win.isVisible()) {
      win.show();
      win.focus();
    }
  });

  win.on("close", (e) => {
    if (!win.isDestroyed()) {
      setStoreValue("mainBounds", win.getBounds());
    }
    if (isAppQuitting()) return;
    e.preventDefault();
    win.hide();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}
