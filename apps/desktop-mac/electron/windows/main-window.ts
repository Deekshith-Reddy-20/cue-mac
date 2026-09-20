import { BrowserWindow, screen, shell } from "electron";
import path from "node:path";
import { getStoreValue, setStoreValue } from "../services/store";
import { getWebOrigin } from "../services/web-server";
import { consumeAllowWindowClose, isAppQuitting } from "../services/app-lifecycle";
import {
  installMacContextMenu,
  macMainWindowOptions,
} from "../platform/macos";

export function createMainWindow(): BrowserWindow {
  const saved = getStoreValue("mainBounds");
  const display = screen.getPrimaryDisplay().workArea;
  const isMac = process.platform === "darwin";

  const win = new BrowserWindow(
    macMainWindowOptions({
      width: saved?.width ?? Math.min(1280, display.width),
      height: saved?.height ?? Math.min(820, display.height),
      x: saved?.x,
      y: saved?.y,
      minWidth: 960,
      minHeight: 640,
      show: false,
      title: "CueAI",
      autoHideMenuBar: !isMac,
      webPreferences: {
        preload: path.join(__dirname, "../preload/index.js"),
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        spellcheck: true,
      },
    })
  );

  win.setTitle("CueAI");
  if (process.platform === "darwin") {
    win.setWindowButtonVisibility(false);
  }
  win.webContents.on("console-message", (_event, _level, message) => {
    if (message.startsWith("[DEVICE]") || message.startsWith("[AUTH]")) {
      console.log(message);
    }
  });
  win.on("page-title-updated", (event) => {
    event.preventDefault();
    if (!win.isDestroyed()) win.setTitle("CueAI");
  });

  if (isMac) installMacContextMenu(win);

  const origin = getWebOrigin().replace(/\/$/, "");
  const target = `${origin}/login?desktop=mac`;
  void win.loadURL(target);

  win.once("ready-to-show", () => {
    win.show();
    win.focus();
  });

  win.webContents.on("did-fail-load", (_e, code, desc, url, isMainFrame) => {
    if (!isMainFrame || win.isDestroyed()) return;
    const html = `<!doctype html><html><body style="margin:0;background:#090909;color:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,sans-serif">
      <div style="padding:88px 48px 48px">
        <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#86868b">CueAI for Mac</p>
        <h1 style="font-size:28px;letter-spacing:-.03em;margin:0 0 12px">The workspace couldn’t load</h1>
        <p style="color:#a1a1aa;line-height:1.5;max-width:420px">Couldn’t open <code>${url || target}</code>. ${desc || "Connection refused"} (${code}).</p>
        <p style="color:#f5f5f7;margin-top:24px">Start the web app, then reopen CueAI:</p>
        <pre style="background:#141414;border-radius:12px;padding:14px 16px;margin-top:10px;color:#0099ff">npm run dev:web</pre>
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
    if (isAppQuitting() || consumeAllowWindowClose()) return;
    e.preventDefault();
    win.hide();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url);
    return { action: "deny" };
  });

  return win;
}
