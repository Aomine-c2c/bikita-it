"use client";

import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Cpu, Database, Server, Wifi } from "lucide-react";

interface TelemetryGaugeWidgetProps {
  uptimePercentage?: number;
  dbStatus?: "online" | "degraded" | "offline";
  apiLatencyMs?: number;
}

export function TelemetryGaugeWidget({
  uptimePercentage = 99.8,
  dbStatus = "online",
  apiLatencyMs = 24,
}: TelemetryGaugeWidgetProps) {
  // SVG Circle calculations for radial gauge
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (uptimePercentage / 100) * circumference;

  const latencies = [
    { label: "Django API Gateway", latency: `${apiLatencyMs}ms`, status: "online" },
    { label: "SQLite DB Engine", latency: "4ms", status: dbStatus },
    { label: "Tauri IPC Sidecar", latency: "2ms", status: "online" },
  ];

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-black text-foreground tracking-tight">System Telemetry</h3>
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Real-Time Node Metrics</p>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
          <ShieldCheck className="w-3 h-3" />
          <span>Healthy</span>
        </div>
      </div>

      {/* Main Radial Gauge & Stats */}
      <div className="flex items-center gap-4 py-1">
        {/* Radial SVG Ring */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 90 90">
            {/* Background Track */}
            <circle
              cx="45"
              cy="45"
              r={radius}
              className="stroke-muted/30"
              strokeWidth="7"
              fill="transparent"
            />
            {/* Animated Progress Ring */}
            <motion.circle
              cx="45"
              cy="45"
              r={radius}
              className="stroke-emerald-500"
              strokeWidth="7"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-base font-black tracking-tight text-foreground">{uptimePercentage}%</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Uptime</span>
          </div>
        </div>

        {/* Latency list */}
        <div className="flex-1 space-y-2">
          {latencies.map((node) => (
            <div key={node.label} className="flex items-center justify-between text-xs bg-background/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-border/40">
              <span className="text-[11px] font-medium text-muted-foreground truncate">{node.label}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-mono font-bold text-foreground">{node.latency}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
