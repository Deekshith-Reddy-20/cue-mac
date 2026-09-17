import { Menu, app, BrowserWindow, shell } from "electron";
import { showCompanion, toggleCompanion, hideCompanion } from "../windows/companion-window";

export function installMacAppMenu(getMainWindow: () => BrowserWindow | null) {
  const isMac = process.platform === "darwin";
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              {
                label: "Preferences…",
                accelerator: "Command+,",
                click: () => {
                  const win = getMainWindow();
                  win?.show();
                  win?.webContents.send("navigate", "/settings");
                },
              },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    { role: "editMenu" },
    {
      label: "View",
      submenu: [
        {
          label: "Show Companion",
          accelerator: "CommandOrControl+Shift+Space",
          click: () => toggleCompanion(),
        },
        {
          label: "Hide Companion",
          accelerator: "CommandOrControl+Shift+H",
          click: () => hideCompanion(),
        },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Session",
      submenu: [
        {
          label: "Start Meeting",
          accelerator: "CommandOrControl+Shift+M",
          click: () => {
            const win = getMainWindow();
            win?.show();
            win?.webContents.send("navigate", "/meetings/live");
          },
        },
        {
          label: "Open Dashboard",
          click: () => {
            const win = getMainWindow();
            win?.show();
            win?.webContents.send("navigate", "/dashboard");
            showCompanion();
          },
        },
      ],
    },
    { role: "windowMenu" },
    {
      role: "help",
      submenu: [
        {
          label: "CueAI on the web",
          click: () => void shell.openExternal("https://github.com/indrakiran7b/CueAI"),
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
