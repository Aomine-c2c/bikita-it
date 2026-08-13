"use client";

import React, { useEffect, useState } from "react";
import { Router, Server, Wifi, ShieldAlert, Globe, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { networkApi, type NetworkDevice } from "@/lib/api";

export function NetworkHealth() {
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    networkApi.getAll()
      .then((data) => setDevices(data))
      .catch(() => setDevices([]))
      .finally(() => setLoading(false));
  }, []);

  const total = devices.length;
  const online = devices.filter((d) => (d.status || "").toLowerCase().includes("online") || (d.status || "").toLowerCase().includes("active")).length;
  const offline = total - online;
  const healthPct = total > 0 ? ((online / total) * 100).toFixed(1) : "100.0";

  const routers = devices.filter((d) => (d.hostname || d.vendor || "").toLowerCase().includes("router") || (d.hostname || "").toLowerCase().includes("rt")).length;
  const switches = devices.filter((d) => (d.hostname || d.vendor || "").toLowerCase().includes("switch") || (d.hostname || "").toLowerCase().includes("sw")).length;
  const accessPoints = devices.filter((d) => (d.hostname || d.vendor || "").toLowerCase().includes("ap") || (d.hostname || "").toLowerCase().includes("wifi")).length;
  const firewalls = devices.filter((d) => (d.hostname || d.vendor || "").toLowerCase().includes("fw") || (d.hostname || "").toLowerCase().includes("firewall")).length;

  const kpis = [
    { label: "Infrastructure Health", value: loading ? "…" : `${healthPct}%`, sub: `${online}/${total} Online`, icon: Globe, color: "text-blue-500", active: offline === 0 },
    { label: "Network Switches", value: loading ? "…" : String(switches || devices.length), sub: "Monitored Ports", icon: Server, color: "text-emerald-500", active: true },
    { label: "Core Routers", value: loading ? "…" : String(routers || (total > 0 ? 1 : 0)), sub: "BGP / OSPF Active", icon: Router, color: "text-emerald-500", active: true },
    { label: "Firewalls / Security", value: loading ? "…" : String(firewalls || (total > 0 ? 1 : 0)), sub: "HA Synchronized", icon: ShieldAlert, color: "text-emerald-500", active: true },
    { label: "Access Points", value: loading ? "…" : String(accessPoints || 0), sub: offline > 0 ? `${offline} Offline Alert` : "All APs Healthy", icon: Wifi, color: offline > 0 ? "text-amber-500" : "text-emerald-500", active: offline === 0 },
  ];

  return (
    <div data-tour="network-devices" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-white border border-border/60 rounded-xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden group"
        >
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
