"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, BellRing, WifiOff, Activity, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { networkApi, timelineApi, type NetworkDevice, type TimelineEvent } from "@/lib/api";

interface AlertItem {
  id: string | number;
  type: "critical" | "warning" | "info";
  title: string;
  desc: string;
  time: string;
  icon: React.ElementType;
  color: string;
  bg: string;
}

export function NetworkAlerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const devices = await networkApi.getAll();
        const timeline = await timelineApi.getTimeline("network");

        const dynamicAlerts: AlertItem[] = [];

        // Generate alerts from offline or maintenance devices in the database
        devices.forEach((d) => {
          const st = (d.status || "").toLowerCase();
          if (st.includes("offline") || st.includes("disconnect")) {
            dynamicAlerts.push({
              id: `dev-${d.id}`,
              type: "critical",
              title: `Device Offline: ${d.hostname || d.ip_address}`,
              desc: `Network device at ${d.ip_address} is currently unreachable.`,
              time: "Active",
              icon: WifiOff,
              color: "text-red-500",
              bg: "bg-red-500/10",
            });
          } else if (st.includes("maintenance")) {
            dynamicAlerts.push({
              id: `maint-${d.id}`,
              type: "warning",
              title: `Maintenance Mode: ${d.hostname || d.ip_address}`,
              desc: `Device is under scheduled maintenance.`,
              time: "Active",
              icon: AlertTriangle,
              color: "text-amber-500",
              bg: "bg-amber-500/10",
            });
          }
        });

        // Add recent network events from OperationLog timeline
        timeline.slice(0, 5).forEach((evt, idx) => {
          dynamicAlerts.push({
            id: `evt-${idx}`,
            type: "info",
            title: `Operation: ${evt.action || "Network Log"}`,
            desc: typeof evt.details === "object" && evt.details !== null
              ? JSON.stringify(evt.details)
              : String(evt.details || `Resource #${evt.resourceId}`),
            time: evt.timestamp ? new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Recent",
            icon: Activity,
            color: "text-blue-500",
            bg: "bg-blue-500/10",
          });
        });

        setAlerts(dynamicAlerts);
      } catch (err) {
        console.error("Failed to load network alerts", err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BellRing className="w-4 h-4 text-amber-500" /> Active Network Telemetry & Alerts
        </h3>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md font-medium">
          {loading ? "…" : `${alerts.length} Events`}
        </span>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto min-h-[160px]">
        {loading ? (
          <p className="text-xs text-slate-400 py-6 text-center animate-pulse">Loading telemetry alerts…</p>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 cursor-pointer group">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", alert.bg, alert.color)}>
                <alert.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                  <p className="text-xs font-bold text-white truncate">{alert.title}</p>
                  <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-2">{alert.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2">{alert.desc}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-400">All network nodes nominal.</p>
            <p className="text-[10px] text-slate-500 mt-0.5">No critical alerts or outages logged.</p>
          </div>
        )}
      </div>
    </div>
  );
}
