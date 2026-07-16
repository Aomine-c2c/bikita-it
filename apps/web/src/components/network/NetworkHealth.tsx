"use client";

import React from "react";
import { Activity, Router, Server, Wifi, ShieldAlert, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const kpis = [
  { label: "Internet Health", value: "99.99%", sub: "12ms ping", icon: Globe, color: "text-blue-500", active: true },
  { label: "Core Routers", value: "4 / 4", sub: "100% Online", icon: Router, color: "text-emerald-500", active: true },
  { label: "Firewalls", value: "2 / 2", sub: "Active HA", icon: ShieldAlert, color: "text-emerald-500", active: true },
  { label: "Switches", value: "18 / 18", sub: "100% Online", icon: Server, color: "text-emerald-500", active: true },
  { label: "Access Points", value: "41 / 42", sub: "1 Offline", icon: Wifi, color: "text-amber-500", active: false },
];

export function NetworkHealth() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white border border-border/60 rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group"
        >
          {/* Subtle glowing orb in background */}
          <div className={cn("absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity", kpi.color.replace("text-", "bg-"))} />
          
          <div className="flex justify-between items-start mb-2 relative z-10">
            <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{kpi.label}</h3>
            <kpi.icon className={cn("w-4 h-4", kpi.color)} />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold tracking-tight text-foreground">{kpi.value}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="relative flex h-2 w-2">
                <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", kpi.active ? "bg-emerald-400" : "bg-amber-400")}></span>
                <span className={cn("relative inline-flex rounded-full h-2 w-2", kpi.active ? "bg-emerald-500" : "bg-amber-500")}></span>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">{kpi.sub}</span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
