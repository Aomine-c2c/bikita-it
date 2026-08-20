"use client";

import React, { useEffect, useState } from "react";
import { Router, Server, Wifi, ShieldAlert, Globe, Activity, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { nocApi, type NOCSummaryData } from "@/lib/api";

export function NetworkHealth() {
  const [summary, setSummary] = useState<NOCSummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchNocSummary = () => {
    nocApi.getNocSummary()
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNocSummary();
    const timer = setInterval(fetchNocSummary, 10000);
    return () => clearInterval(timer);
  }, []);

  const total = summary?.total_managed ?? 0;
  const online = summary?.online_count ?? 0;
  const offline = summary?.offline_count ?? 0;
  const rogues = summary?.rogue_count ?? 0;
  const avgLatency = summary?.average_latency_ms ?? 1.2;
  const healthPct = total > 0 ? ((online / total) * 100).toFixed(1) : "100.0";

  const kpis = [
    {
      label: "Campus Infrastructure Health",
      value: loading ? "…" : `${healthPct}%`,
      sub: `${online}/${total} Hosts Online`,
      icon: Globe,
      color: "text-blue-500",
      active: offline === 0,
    },
    {
      label: "Average Socket Latency",
      value: loading ? "…" : `${avgLatency} ms`,
      sub: "Active Handshake RTT",
      icon: Activity,
      color: "text-emerald-500",
      active: avgLatency < 25,
    },
    {
      label: "Gateway & Core Link",
      value: loading ? "…" : summary?.gateway_status || "ONLINE",
      sub: "BGP / OSPF Active",
      icon: Router,
      color: "text-indigo-500",
      active: summary?.gateway_status === "ONLINE",
    },
    {
      label: "Rogue Threat Detections",
      value: loading ? "…" : String(rogues),
      sub: rogues > 0 ? `${rogues} Rogue MACs Flagged` : "0 Unauthorized Hosts",
      icon: ShieldAlert,
      color: rogues > 0 ? "text-rose-500" : "text-emerald-500",
      active: rogues === 0,
      danger: rogues > 0,
    },
    {
      label: "Quarantined Devices",
      value: loading ? "…" : String(summary?.quarantined_count ?? 0),
      sub: "VLAN Port Isolation",
      icon: Lock,
      color: "text-amber-500",
      active: true,
    },
  ];

  return (
    <div data-tour="network-devices" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className={cn(
            "bg-card/70 backdrop-blur-xl border rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group transition-all",
            kpi.danger ? "border-rose-500/50 bg-rose-950/10" : "border-border/60 hover:border-border"
          )}
        >
          <div
            className={cn(
              "absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity",
              kpi.color.replace("text-", "bg-")
            )}
          />

          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {kpi.label}
            </h3>
            <kpi.icon className={cn("w-4 h-4", kpi.color)} />
          </div>

          <div className="relative z-10">
            <div className="flex items-end gap-2">
              <span
                className={cn(
                  "text-2xl font-black tracking-tight",
                  kpi.danger ? "text-rose-500 animate-pulse" : "text-foreground"
                )}
              >
                {kpi.value}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="relative flex h-2 w-2">
                <span
                  className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    kpi.danger ? "bg-rose-400" : kpi.active ? "bg-emerald-400" : "bg-amber-400"
                  )}
                />
                <span
                  className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    kpi.danger ? "bg-rose-500" : kpi.active ? "bg-emerald-500" : "bg-amber-500"
                  )}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{kpi.sub}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
