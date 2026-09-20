import { session } from "electron";
import { macOSSystemAudio } from "../platform/macos";

export type ListenSources = {
  mic: boolean;
  systemAudio: boolean;
};

/** Allow mic / display-capture prompts from the companion renderer. */
export function registerMediaPermissionHandler() {
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
    const ok =
      permission === "media" ||
      permission === "mediaKeySystem" ||
      permission === "display-capture" ||
      (permission as string) === "audioCapture" ||
      (permission as string) === "microphone";
    callback(ok);
  });

  session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
    const p = permission as string;
    return (
      p === "media" ||
      p === "mediaKeySystem" ||
      p === "display-capture" ||
      p === "audioCapture" ||
      p === "microphone"
    );
  });
}

/** macOS desktop source id for system-audio capture. Null when unauthorized. */
export async function getDesktopAudioSourceId(): Promise<string | null> {
  if (process.platform === "darwin") {
    return macOSSystemAudio.getDesktopAudioSourceId();
  }
  return null;
}
