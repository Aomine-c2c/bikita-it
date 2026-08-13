"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Video, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, RefreshCw, Copy, Check, ShieldCheck, Eye, Activity
} from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CameraDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  camera: any;
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

  const rtspUrl = `rtsp://admin:pass@${camera.ip_address || "192.168.1.100"}:554/live/ch0`;

  const handleCopyRtsp = () => {
    navigator.clipboard.writeText(rtspUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePtzAction = (action: string) => {
    setPtzMessage(`PTZ Command: ${action}`);
    setTimeout(() => setPtzMessage(null), 2000);
  };

  const handleReboot = async () => {
    setRebooting(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to reboot NVR channel", err);
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-screen w-[580px] max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0 shadow-sm">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground tracking-tight">{camera.name || "NVR Camera Feed"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-emerald-500">{camera.ip_address || "192.168.1.100"}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> ONLINE (30 FPS)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* RTSP Stream URL Copy Bar */}
              <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between bg-muted/30 border border-border/40 p-2.5 rounded-xl text-xs">
                <span className="font-mono text-muted-foreground truncate max-w-[340px]">{rtspUrl}</span>
                <button
                  onClick={handleCopyRtsp}
                  className="flex items-center gap-1 px-2.5 py-1 bg-card border border-border/60 rounded-lg font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-primary" />}
                  <span>{copied ? "Copied" : "Copy RTSP"}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Main Simulated 4K Feed Screen */}
              <section className="relative rounded-2xl overflow-hidden border border-border/60 bg-black aspect-video flex flex-col justify-between p-4 shadow-lg group">
                {/* Overlay Indicators */}
                <div className="flex items-center justify-between z-10">
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> REC • 4K UHD
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-white/80">
                    2026-08-09 10:08:12 PST
                  </span>
                </div>

                {/* Grid Scan Lines Effect */}
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

                {/* Bottom Overlay Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                    Bitrate: 8.4 Mbps
                  </span>
                  <span className="text-[10px] font-mono font-bold text-white/80 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded">
                    Codec: H.265+
                  </span>
                </div>
              </section>

              {/* PTZ D-Pad Controller */}
              <section className="bg-muted/30 border border-border/40 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-primary" /> PTZ Pan / Tilt / Zoom Controls
                  </h4>
                  {ptzMessage && <span className="text-[10px] font-mono font-bold text-primary animate-pulse">{ptzMessage}</span>}
                </div>

                <div className="grid grid-cols-2 gap-4 items-center">
                  {/* 4-Way D-Pad */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={() => handlePtzAction("TILT_UP")}
                      className="p-2.5 rounded-xl bg-card border border-border/60 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
                    >
                      <ChevronUp className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePtzAction("PAN_LEFT")}
                        className="p-2.5 rounded-xl bg-card border border-border/60 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-[9px] font-mono font-bold text-primary">
                        PTZ
                      </div>
                      <button
                        onClick={() => handlePtzAction("PAN_RIGHT")}
                        className="p-2.5 rounded-xl bg-card border border-border/60 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handlePtzAction("TILT_DOWN")}
                      className="p-2.5 rounded-xl bg-card border border-border/60 hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer shadow-sm"
                    >
                      <ChevronDown className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Zoom Controls & Reboot Trigger */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePtzAction("ZOOM_IN")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-card border border-border/60 rounded-xl text-xs font-bold hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
                      >
                        <ZoomIn className="w-4 h-4 text-emerald-500" />
                        <span>Zoom In</span>
                      </button>
                      <button
                        onClick={() => handlePtzAction("ZOOM_OUT")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-card border border-border/60 rounded-xl text-xs font-bold hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
                      >
                        <ZoomOut className="w-4 h-4 text-amber-500" />
                        <span>Zoom Out</span>
                      </button>
                    </div>

                    <button
                      onClick={handleReboot}
                      disabled={rebooting}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rebooting ? "animate-spin" : ""}`} />
                      <span>{rebooting ? "Rebooting NVR Channel..." : "Reboot Camera Channel"}</span>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
