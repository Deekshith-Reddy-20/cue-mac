"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Monitor,
  RefreshCw,
  ScanText,
  Shield,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { getDesktop, isMacDesktopApp, type MacDisplayInfo } from "@/lib/desktop";

export default function ScreenContextPage() {
  const [enabled, setEnabled] = useState(false);
  const [privacy, setPrivacy] = useState(true);
  const [showPermission, setShowPermission] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [displays, setDisplays] = useState<MacDisplayInfo[]>([]);
  const [displayId, setDisplayId] = useState<number | null>(null);
  const [permMsg, setPermMsg] = useState<string | null>(null);
  const mac = isMacDesktopApp();

  useEffect(() => {
    const desktop = getDesktop();
    if (!desktop?.listDisplays) return;
    void desktop.listDisplays().then((list) => {
      setDisplays(list);
      setDisplayId(list.find((d) => d.primary)?.id ?? list[0]?.id ?? null);
    });
    void desktop.getPermissions?.().then((perms) => {
      setPermMsg(perms.screenRecording.message);
    });
  }, []);

  async function captureAndAnalyze() {
    if (!enabled) return;
    setBusy(true);
    setAnalysis(null);
    try {
      const desktop = getDesktop();
      let dataUrl: string | undefined;
      if (desktop?.captureScreenshot) {
        if (mac && desktop.requestPermission) {
          const permission = await desktop.requestPermission("screen");
          setPermMsg(permission.message);
          if (permission.state === "denied" || permission.state === "restricted") {
            setAnalysis(permission.message);
            return;
          }
        }
        const shot = await desktop.captureScreenshot({
          save: false,
          displayId: displayId ?? undefined,
        });
        if (!shot.ok) {
          setAnalysis(shot.error || "Could not capture the selected display.");
          return;
        }
        dataUrl = shot.dataUrl;
      } else {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        await video.play();
        await new Promise((r) => window.setTimeout(r, 200));
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext("2d")?.drawImage(video, 0, 0);
        dataUrl = canvas.toDataURL("image/png");
        stream.getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
      if (!dataUrl) {
        setAnalysis("Could not capture a frame. Allow Screen Recording and try again.");
        return;
      }
      setPreviewUrl(privacy ? null : dataUrl);
      const res = await fetch("/api/live/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt:
            "What is happening on this screen? Describe it briefly, then give a first-person interview-ready answer if there is a question or prompt.",
          image: dataUrl,
          mode: "screen",
        }),
      });
      const data = (await res.json()) as { answer?: string; error?: string };
      if (!res.ok) {
        setAnalysis(data.error || "Vision AI could not read this capture.");
        return;
      }
      setAnalysis(data.answer || "No answer returned.");
    } catch (err) {
      setAnalysis(err instanceof Error ? err.message : "Screen capture cancelled.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-fade-up">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Screen Context AI
          </h1>
          <p className="mt-1 text-sm text-muted">
            Opt-in visual context with OCR — never without your permission.
          </p>
        </div>
        <Button
          variant={enabled ? "danger" : "gradient"}
          onClick={() => {
            if (!enabled) setShowPermission(true);
            else setEnabled(false);
          }}
        >
          {enabled ? "Disable" : "Enable Screen AI"}
        </Button>
      </div>

      {showPermission && !enabled && (
        <Card glow className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary-muted)] text-primary">
              <Shield className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Allow screen capture?</h3>
              <p className="mt-1 text-sm text-muted">
                CueAI will analyze visible content to answer questions about what&apos;s
                on your screen. You can exclude apps and disable anytime. Data is not
                stored unless you pin an answer.
              </p>
              <div className="mt-4 flex gap-2">
                <Button
                  variant="gradient"
                  size="sm"
                  onClick={() => {
                    setEnabled(true);
                    setShowPermission(false);
                  }}
                >
                  Allow
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermission(false)}
                >
                  Not now
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Screen preview</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={enabled ? "success" : "default"}>
                {busy ? "Analyzing" : enabled ? "Ready" : "Idle"}
              </Badge>
              <Badge variant="info">
                <ScanText className="h-3 w-3" />
                {busy ? "Analyzing screen..." : analysis ? "Screen analyzed" : enabled ? "OCR ready" : "OCR off"}
              </Badge>
            </div>
          </div>
          <div
            className="relative flex aspect-video items-center justify-center bg-[var(--background-secondary,var(--background))]"
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Screen capture preview" className="h-full w-full object-cover object-top" />
            ) : (
              <p className="relative z-10 px-6 text-center text-sm text-muted">
                {!enabled
                  ? "Enable Screen AI to preview context"
                  : busy
                    ? "Analyzing screen..."
                    : "Screen preview"}
              </p>
            )}
          </div>
          <div className="flex gap-2 border-t border-[var(--border)] p-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!enabled || busy}
              loading={busy}
              onClick={() => void captureAndAnalyze()}
            >
              Analyze Screen
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!enabled || busy}
              onClick={() => void captureAndAnalyze()}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto"
              onClick={() => setPrivacy((p) => !p)}
            >
              {privacy ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Privacy {privacy ? "on" : "off"}
            </Button>
          </div>
          {(previewUrl || analysis) && (
            <div className="space-y-2 border-t border-[var(--border)] p-3">
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Screen capture preview"
                  className="max-h-40 w-full rounded-lg object-cover object-top"
                />
              )}
              {analysis && (
                <p className="text-sm text-foreground">
                  {/unable|could not|denied|error|fail/i.test(analysis) ? `Unable to analyze screen. ${analysis}` : analysis}
                </p>
              )}
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <CardTitle className="mb-3">Display selection</CardTitle>
            <div className="space-y-2">
              {(displays.length ? displays : [{ id: 0, label: "Primary display", primary: true, scaleFactor: 1, internal: true, bounds: { x: 0, y: 0, width: 0, height: 0 } }]).map((display) => (
                <label
                  key={display.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--border)] px-3 py-2.5 text-sm hover:bg-[var(--surface-hover)]"
                >
                  <input
                    type="radio"
                    name="monitor"
                    checked={displayId === display.id || (displayId == null && display.primary)}
                    onChange={() => setDisplayId(display.id)}
                  />
                  <span>
                    {display.label}
                    {display.primary ? " · Primary" : ""}
                    {display.scaleFactor > 1 ? ` · ${display.scaleFactor}x` : ""}
                  </span>
                </label>
              ))}
            </div>
            {permMsg && <p className="mt-3 text-xs text-muted">{permMsg}</p>}
            {mac && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3"
                onClick={() => void getDesktop()?.openPrivacySettings?.("screen")}
              >
                Open System Settings
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <CardTitle className="mb-3">Capture notes</CardTitle>
            <p className="text-xs leading-relaxed text-muted">
              CueAI captures the selected physical display, hides CueAI windows for the
              shot, and sends that image to the existing vision pipeline. The overlay is
              excluded where macOS content protection allows. Some ScreenCaptureKit paths
              may still see protected windows.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
