"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, X, RefreshCw, CheckCircle2 } from "lucide-react";

interface UpdatePayload {
  version: string;
  body: string | null;
  date: string | null;
}

interface ProgressPayload {
  chunk_length: number;
  content_length: number | null;
}

/**
 * Floating update notification banner.
 * Only renders when running inside the Tauri desktop shell.
 * Listens for `update-available` and `update-progress` events from the Rust backend.
 */
export function UpdateNotification() {
  const [update, setUpdate] = useState<UpdatePayload | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [downloaded, setDownloaded] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [isTauri, setIsTauri] = useState(false);

  // Detect Tauri environment
  useEffect(() => {
    setIsTauri(
      typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
    );
  }, []);

  // Listen for update events from the Rust backend
  useEffect(() => {
    if (!isTauri) return;

    let unlistenAvailable: (() => void) | null = null;
    let unlistenProgress: (() => void) | null = null;

    (async () => {
      const { listen } = await import("@tauri-apps/api/event");

      unlistenAvailable = await listen<UpdatePayload>(
        "update-available",
        (event) => {
          setUpdate(event.payload);
          setDismissed(false);
        }
      );

      unlistenProgress = await listen<ProgressPayload>(
        "update-progress",
        (event) => {
          setDownloaded((prev) => prev + event.payload.chunk_length);
          if (event.payload.content_length) {
            setTotal(event.payload.content_length);
          }
        }
      );
    })();

    return () => {
      unlistenAvailable?.();
      unlistenProgress?.();
    };
  }, [isTauri]);

  const handleInstall = useCallback(async () => {
    setInstalling(true);
    setDownloaded(0);
    setTotal(null);
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("install_update");
    } catch (err) {
      console.error("[updater] Install failed:", err);
      setInstalling(false);
    }
  }, []);

  // Don't render in browser or when dismissed
  if (!isTauri || !update || dismissed) return null;

  const progress =
    total && total > 0 ? Math.round((downloaded / total) * 100) : null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[9999] w-[380px] animate-in slide-in-from-bottom-4 fade-in duration-300"
      role="alert"
    >
      <div className="rounded-xl border border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl shadow-primary/10 overflow-hidden">
        {/* Progress bar */}
        {installing && progress !== null && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {installing ? (
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <RefreshCw className="h-4.5 w-4.5 text-primary animate-spin" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {installing
                  ? `Installing v${update.version}…`
                  : `Update v${update.version} Available`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                {installing
                  ? progress !== null
                    ? `Downloading… ${progress}%`
                    : "Preparing download…"
                  : update.body || "A new version of Xiphos is ready to install."}
              </p>
            </div>

            {!installing && (
              <button
                onClick={() => setDismissed(true)}
                className="flex-shrink-0 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Dismiss update notification"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Actions */}
          {!installing && (
            <div className="flex items-center gap-2 mt-3 pl-12">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Update Now
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                Later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
