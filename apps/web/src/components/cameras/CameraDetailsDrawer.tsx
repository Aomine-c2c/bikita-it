"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Video, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, RefreshCw, Copy, Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type Camera } from "@/lib/api";

interface CameraDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  camera: (Camera & { fps?: number; location?: string }) | null;
  onRefresh?: () => void;
}

export function CameraDetailsDrawer({
  isOpen,
  onClose,
  camera,
  onRefresh,
}: CameraDetailsDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [rebooting, setRebooting] = useState(false);
  const [ptzMessage, setPtzMessage] = useState<string | null>(null);

  if (!isOpen || !camera) return null;

  const rtspUrl = `rtsp://admin:auth_token@${camera.ip_address || "192.168.20.10"}:554/live/stream0`;

  const handleCopyRtsp = () => {
    navigator.clipboard.writeText(rtspUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePtzAction = (action: string) => {
    setPtzMessage(`PTZ: ${action}`);
    setTimeout(() => setPtzMessage(null), 1500);
  };

  const handleReboot = async () => {
    setRebooting(true);
    try {
      await new Promise((r) => setTimeout(r, 1200));
      if (onRefresh) onRefresh();
    } finally {
      setRebooting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-screen w-140 max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/40 bg-card/80 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-foreground tracking-tight">{camera.name}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-muted-foreground">{camera.ip_address}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live RTSP Feed
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Simulated High-Res Video Viewport */}
              <div className="relative aspect-video bg-neutral-950 rounded-2xl overflow-hidden border border-border/70 shadow-inner flex flex-col justify-between p-4">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px] pointer-events-none opacity-40" />

                <div className="flex items-center justify-between z-10 font-mono text-[10px]">
                  <span className="bg-black/80 px-2 py-0.5 rounded text-white font-bold border border-white/10">
                    {camera.resolution || "4K UHD"} • 30 FPS
                  </span>
                  <span className="bg-black/80 px-2 py-0.5 rounded text-emerald-400 font-bold border border-emerald-500/30">
                    H.265+ (6.2 Mbps)
                  </span>
                </div>

                {ptzMessage && (
                  <div className="z-10 self-center bg-black/80 text-white text-xs font-bold font-mono px-3 py-1 rounded-xl border border-white/20 animate-pulse">
                    {ptzMessage}
                  </div>
                )}

                <div className="flex items-center justify-between z-10 text-[10px] font-mono text-white/80">
                  <span>LATENCY: 42ms</span>
                  <span>ENCRYPTED RTSP/TLS</span>
                </div>
              </div>

              {/* PTZ Pan-Tilt-Zoom D-Pad Control Panel */}
              <div className="bg-muted/20 border border-border/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    PTZ Pan-Tilt-Zoom Controller
                  </h4>
                  <span className="text-[10px] font-mono text-muted-foreground">Pelco-D / ONVIF Profile S</span>
                </div>

                <div className="flex items-center justify-center gap-8 py-2">
                  {/* Directional D-Pad */}
                  <div className="relative w-32 h-32 flex items-center justify-center">
                    <button
                      onClick={() => handlePtzAction("TILT_UP")}
                      className="absolute top-0 w-9 h-9 rounded-xl bg-card border border-border/70 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs cursor-pointer"
                      title="Tilt Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePtzAction("PAN_LEFT")}
                      className="absolute left-0 w-9 h-9 rounded-xl bg-card border border-border/70 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs cursor-pointer"
                      title="Pan Left"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-[9px] font-black text-primary font-mono">
                      PTZ
                    </div>
                    <button
                      onClick={() => handlePtzAction("PAN_RIGHT")}
                      className="absolute right-0 w-9 h-9 rounded-xl bg-card border border-border/70 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs cursor-pointer"
                      title="Pan Right"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handlePtzAction("TILT_DOWN")}
                      className="absolute bottom-0 w-9 h-9 rounded-xl bg-card border border-border/70 flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs cursor-pointer"
                      title="Tilt Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="space-y-2 flex flex-col">
                    <button
                      onClick={() => handlePtzAction("ZOOM_IN")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/70 text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs cursor-pointer"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      <span>Zoom In</span>
                    </button>
                    <button
                      onClick={() => handlePtzAction("ZOOM_OUT")}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/70 text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-xs cursor-pointer"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                      <span>Zoom Out</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* RTSP Stream URL */}
              <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Secure RTSP Media Stream URI
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={rtspUrl}
                    className="flex-1 px-3 py-1.5 bg-muted/40 border border-border/50 rounded-xl text-xs font-mono text-muted-foreground outline-none select-all"
                  />
                  <button
                    onClick={handleCopyRtsp}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Device Telemetry Specs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-card p-3 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Hardware Vendor</span>
                  <span className="font-bold text-foreground mt-0.5 block">{camera.vendor || "Hikvision"}</span>
                </div>
                <div className="bg-card p-3 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Camera Model</span>
                  <span className="font-bold text-foreground mt-0.5 block">{camera.model || "IP Dome"}</span>
                </div>
                <div className="bg-card p-3 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Resolution</span>
                  <span className="font-bold font-mono text-foreground mt-0.5 block">{camera.resolution || "4K UHD"}</span>
                </div>
                <div className="bg-card p-3 rounded-2xl border border-border/50">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Channel Status</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{camera.status || "Online"}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-border/40 bg-card/80 flex items-center justify-between">
              <button
                onClick={handleReboot}
                disabled={rebooting}
                className="flex items-center gap-1.5 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground border border-border/60 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", rebooting && "animate-spin")} />
                <span>{rebooting ? "Rebooting..." : "Reboot Stream"}</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
