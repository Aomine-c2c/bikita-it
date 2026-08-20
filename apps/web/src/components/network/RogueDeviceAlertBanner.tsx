"use client";

import React, { useState } from "react";
import { ShieldAlert, ShieldCheck, Lock, TicketPlus, Check, Loader2, Radio } from "lucide-react";
import { nocApi, type TopologyNode } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RogueDeviceAlertBannerProps {
  rogueDevices: TopologyNode[];
  onRefresh?: () => void;
  onAuthorize?: (device: TopologyNode) => void;
}

export function RogueDeviceAlertBanner({
  rogueDevices,
  onRefresh,
  onAuthorize,
}: RogueDeviceAlertBannerProps) {
  const [quarantiningId, setQuarantiningId] = useState<number | null>(null);
  const [ticketingId, setTicketingId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<{ id: number; text: string; type: "success" | "info" } | null>(null);

  if (!rogueDevices || rogueDevices.length === 0) return null;

  const handleQuarantine = async (device: TopologyNode) => {
    setQuarantiningId(device.id);
    try {
      const res = await nocApi.quarantineDevice(device.id, "Rogue device detected on campus network");
      setActionMessage({
        id: device.id,
        text: res.quarantined ? `Device ${device.ip_address} quarantined.` : `Device ${device.ip_address} released.`,
        type: "success",
      });
      if (onRefresh) onRefresh();
    } catch (_err) {
      setActionMessage({ id: device.id, text: "Failed to update quarantine status.", type: "info" });
    } finally {
      setQuarantiningId(null);
    }
  };

  const handleAutoTicket = async (device: TopologyNode) => {
    setTicketingId(device.id);
    try {
      const res = await nocApi.autoFileRogueTicket(device.id, "CRITICAL", "Unrecognized MAC address detected during CIDR subnet scan.");
      setActionMessage({
        id: device.id,
        text: `Security Ticket created (${res.tracking_code || `#${res.ticket_id}`})`,
        type: "success",
      });
      if (onRefresh) onRefresh();
    } catch (_err) {
      setActionMessage({ id: device.id, text: "Failed to generate security ticket.", type: "info" });
    } finally {
      setTicketingId(null);
    }
  };

  return (
    <div className="bg-rose-950/20 border-2 border-rose-500/40 rounded-3xl p-5 md:p-6 shadow-lg backdrop-blur-xl relative overflow-hidden space-y-4">
      {/* Background Pulse Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-500 shrink-0 animate-pulse">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-rose-500 uppercase tracking-wider">
                Rogue Intrusion Defense Alert
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-bold">
                {rogueDevices.length} Detected
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Uncataloged MAC addresses detected on campus subnets. Take immediate remediation action.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-rose-400/80 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-800/40">
          <Radio className="w-3.5 h-3.5 animate-spin" />
          <span>Real-Time Threat Polling Active</span>
        </div>
      </div>

      {/* Rogue Devices List */}
      <div className="space-y-3 relative z-10">
        {rogueDevices.map((device) => {
          const isQuarantined = device.quarantined;
          const isBusyQuarantine = quarantiningId === device.id;
          const isBusyTicket = ticketingId === device.id;
          const feedback = actionMessage?.id === device.id ? actionMessage : null;

          return (
            <div
              key={device.id}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4",
                isQuarantined
                  ? "bg-amber-950/20 border-amber-500/40 text-amber-200"
                  : "bg-card/70 border-rose-500/20 text-foreground hover:border-rose-500/40"
              )}
            >
              {/* Device Info */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-black text-sm text-foreground">{device.ip_address}</span>
                  <span className="font-mono text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-lg border border-border/50">
                    {device.mac_address}
                  </span>
                  <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-lg border border-rose-500/20">
                    {device.vendor || "Unknown Vendor"}
                  </span>
                  {isQuarantined && (
                    <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      QUARANTINED
                    </span>
                  )}
                </div>

                {/* Open Ports */}
                {device.open_ports && device.open_ports.length > 0 ? (
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="font-bold text-slate-400">Open Ports:</span>
                    {device.open_ports.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-muted/40 font-mono text-[10px] text-primary"
                      >
                        {typeof p === "object" ? `${p.service}:${p.port}` : `Port ${p}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Host responding to ICMP ping (Latency: {device.latency_ms || 1.2} ms)
                  </p>
                )}

                {/* Feedback note */}
                {feedback && (
                  <p className="text-xs font-bold text-emerald-500 flex items-center gap-1 mt-1">
                    <Check className="w-3.5 h-3.5" />
                    {feedback.text}
                  </p>
                )}
              </div>

              {/* 1-Click Remediation Actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* Authorize Button */}
                {onAuthorize && (
                  <button
                    onClick={() => onAuthorize(device)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Authorize & Provision</span>
                  </button>
                )}

                {/* Quarantine Toggle Button */}
                <button
                  disabled={isBusyQuarantine}
                  onClick={() => handleQuarantine(device)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-xs disabled:opacity-50",
                    isQuarantined
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40 hover:bg-amber-500/30"
                      : "bg-rose-500/20 text-rose-400 border-rose-500/40 hover:bg-rose-500/30"
                  )}
                >
                  {isBusyQuarantine ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Lock className="w-3.5 h-3.5" />
                  )}
                  <span>{isQuarantined ? "Release Isolation" : "Quarantine Device"}</span>
                </button>

                {/* Auto-Ticket Button */}
                <button
                  disabled={isBusyTicket}
                  onClick={() => handleAutoTicket(device)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isBusyTicket ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <TicketPlus className="w-3.5 h-3.5" />
                  )}
                  <span>File Incident Ticket</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
