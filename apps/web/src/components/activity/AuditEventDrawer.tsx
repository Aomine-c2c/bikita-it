"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, ShieldAlert, Check, Copy, User, Clock, MapPin, Globe,
  FileCode, ArrowRight, ShieldCheck, AlertTriangle, Info, Terminal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditEventDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
}

export function AuditEventDrawer({
  isOpen,
  onClose,
  event,
}: AuditEventDrawerProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !event) return null;

  const beforeState = event.before_state || {
    status: "ACTIVE",
    role: "USER",
    assigned_to: "unassigned",
  };

  const afterState = event.after_state || {
    status: "REPAIRED",
    role: "ADMIN",
    assigned_to: "tech_john",
  };

  const jsonTrace = JSON.stringify(
    {
      event_id: event.id || "EVT-90421",
      timestamp: event.timestamp || new Date().toISOString(),
      action: event.action || "ASSET_REASSIGNED",
      actor: event.user || "admin@bikita.io",
      ip_address: event.ip || "192.168.1.45",
      geo_location: "Frankfurt, DE (AWS eu-central-1)",
      user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) BikitaDesktop/2.4.0",
      before: beforeState,
      after: afterState,
    },
    null,
    2
  );

  const handleCopyTrace = () => {
    navigator.clipboard.writeText(jsonTrace);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "WARNING":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
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
            className="fixed top-0 right-0 h-screen w-[600px] max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground tracking-tight">
                      {event.title || event.action || "Security Audit Log Event"}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-primary">#{event.id || "EVT-90421"}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border", getSeverityBadge(event.severity))}>
                        {event.severity || "INFO"}
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

              {/* Drawer Quick Actions Header */}
              <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
                <span className="text-xs font-mono text-muted-foreground">SOC2 Compliance Log Trace</span>
                <button
                  onClick={handleCopyTrace}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all cursor-pointer shadow-md"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Trace Copied" : "Copy Audit Trace JSON"}</span>
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Actor & Session Metadata */}
              <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <User className="w-3 h-3 text-primary" /> Actor Account
                  </p>
                  <p className="font-bold text-foreground mt-0.5 font-mono">{event.user || event.actor || "admin@bikita.io"}</p>
                </div>

                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Globe className="w-3 h-3 text-emerald-500" /> IP Address & Location
                  </p>
                  <p className="font-bold text-foreground mt-0.5 font-mono">
                    {event.ip || "192.168.1.45"} (Frankfurt, DE)
                  </p>
                </div>
              </section>

              {/* Side-by-Side JSON Payload Diff */}
              <section className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileCode className="w-3.5 h-3.5 text-primary" /> State Change Payload Diff (Before vs After)
                </h4>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Before State */}
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-3.5 space-y-2">
                    <span className="text-[10px] font-black uppercase text-rose-500 tracking-wider">Before Change</span>
                    <pre className="font-mono text-[11px] text-foreground overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(beforeState, null, 2)}
                    </pre>
                  </div>

                  {/* After State */}
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-3.5 space-y-2">
                    <span className="text-[10px] font-black uppercase text-emerald-500 tracking-wider">After Change</span>
                    <pre className="font-mono text-[11px] text-foreground overflow-x-auto whitespace-pre-wrap">
                      {JSON.stringify(afterState, null, 2)}
                    </pre>
                  </div>
                </div>
              </section>

              {/* Raw JSON Trace Code View */}
              <section className="space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-primary" /> Complete Audit Telemetry JSON
                </h4>
                <div className="bg-black/90 text-emerald-400 font-mono text-[11px] rounded-2xl p-4 overflow-x-auto border border-border/50 shadow-inner">
                  {jsonTrace}
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
