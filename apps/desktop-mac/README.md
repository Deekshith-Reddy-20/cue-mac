# CueAI for Mac

A separate macOS desktop app — not a restyle of the Windows overlay.

Windows CueAI is a dark rectangular command bar plus a frameless web shell.
This Mac build is a **workspace window** with traffic-light chrome and a **Control Center HUD** at the top-right of the screen.

## Run

From the repo root (web app still provides the workspace):

```bash
npm run dev:web
npm run dev:desktop:mac
```

The HUD loads on `http://127.0.0.1:15175`. Toggle it with **⌘⇧Space** or **Show HUD** in the title bar. The workspace opens at `/dashboard?desktop=mac`.

## Package

A `.dmg` can only be built **on a Mac** (or GitHub Actions `macos-latest`). Windows will refuse `npm run dist:desktop:mac` on purpose.

## How it differs from Windows

| | Windows (`apps/desktop`) | Mac (`apps/desktop-mac`) |
|---|---|---|
| Workspace | Dark Framer shell, Windows caption buttons | Sand canvas, traffic lights, Spotlight jump palette |
| Overlay | Dark 752×76 toolbar | 420×176 Control Center widget, top-right |
| Window title | CueAI | Always CueAI (never Companion) |
| Shortcuts | Ctrl+Shift+Space | ⌘⇧Space |
