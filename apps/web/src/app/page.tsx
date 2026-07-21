"use client";

import { GuidedTour } from "@/components/tutorial/GuidedTour";
import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import Link from "next/link";
import {
  Box, AlertTriangle, Package,
  ArrowRight, Wifi, 
  Activity, Wrench,
  ChevronRight, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, Variants } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { apiFetch } from "@/lib/api";

function StatusDot({ status }: { status: string }) {
  return (
    <span className="relative flex h-2 w-2 shrink-0">
      {status === "online" && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
      )}
      <span className={cn("relative inline-flex rounded-full h-2 w-2", {
        "bg-emerald-500": status === "online",
        "bg-amber-500": status === "degraded",
        "bg-red-500": status === "offline",
      })} />
    </span>
  );
}

export default function MissionControl() {
  const [time, setTime] = useState(new Date());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const json = await apiFetch<any>('/dashboard');
        setData(json);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 260,
        damping: 20,
      },
    },
  };

  if (loading) {
    return (
      <DashboardLayout>
      <GuidedTour />
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const CRITICAL_KPIS = data ? [
    {
      label: "Total Hardware Assets",
      value: data.kpis.totalHardware.toLocaleString(),
      subtext: "Tracked in inventory",
      icon: Box,
      href: "/assets",
      trend: "up",
      trendVal: "Live",
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Assets At Risk",
      value: data.kpis.atRiskHardware.toLocaleString(),
      subtext: "Under repair or maintenance",
      icon: AlertTriangle,
      href: "/repairs",
      trend: data.kpis.atRiskHardware > 0 ? "warn" : "neutral",
      trendVal: data.kpis.atRiskHardware > 0 ? "Action needed" : "Healthy",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Low Stock Items",
      value: data.kpis.lowStockItems.toLocaleString(),
      subtext: "Below minimum threshold",
      icon: Package,
      href: "/inventory",
      trend: data.kpis.lowStockItems > 0 ? "warn" : "neutral",
      trendVal: data.kpis.lowStockItems > 0 ? "Reorder required" : "Healthy",
      color: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-100",
    },
    {
      label: "Active Network Devices",
      value: data.kpis.activeNetworkDevices.toLocaleString(),
      subtext: "Connected to platform",
      icon: Wifi,
      href: "/network",
      trend: "neutral",
      trendVal: "Online",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
  ] : [];

  return (
    <DashboardLayout>
      <GuidedTour />
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pb-10 space-y-6 max-w-[1500px] mx-auto"
      >

        {/* Page Header */}
        <motion.div variants={itemVariants} className="flex items-end justify-between pt-1">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Mission Control</h1>
            <p className="text-[13px] font-medium text-muted-foreground mt-1">
              {time.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-white border border-border/60 px-4 py-2 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-bold text-foreground">Platform Status: <span className="text-emerald-600">Operational</span></span>
          </div>
        </motion.div>

        {/* Critical KPI Cards */}
        {data && (
          <motion.div id="tour-dashboard-kpis" variants={itemVariants} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            {CRITICAL_KPIS.map((kpi) => (
              <Link key={kpi.label} href={kpi.href} className="group">
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  className={cn(
                    "bg-white rounded-[18px] border border-border/60 shadow-premium p-6 cursor-pointer transition-all duration-300 hover:shadow-premium-hover",
                    kpi.border
                  )}
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs", kpi.bg)}>
                      <kpi.icon className={cn("w-6 h-6", kpi.color)} />
                    </div>
                    <span className={cn("text-[10px] font-black px-2.5 py-1 rounded-full border shadow-xs flex items-center gap-1",
                      kpi.trend === "up" ? "bg-blue-50 text-blue-700 border-blue-100" :
                      kpi.trend === "warn" ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-slate-50 text-slate-700 border-slate-200"
                    )}>
                      {kpi.trendVal}
                    </span>
                  </div>
                  <p className="text-4xl font-black text-foreground tracking-tighter leading-none">{kpi.value}</p>
                  <p className="text-xs font-bold text-foreground mt-2">{kpi.label}</p>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5">{kpi.subtext}</p>
                  <div className="flex items-center gap-1 mt-4 text-[11px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    View intelligence <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </motion.div>
        )}

        {/* Middle Row: Ticket Chart + System Status */}
        {data && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Inventory Trend Chart */}
            <div id="tour-inventory-trend" className="xl:col-span-2 bg-white border border-border/60 rounded-[18px] shadow-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Inventory Transactions</h3>
                  <p className="text-[11px] font-medium text-muted-foreground">Flow analysis (7-day historical)</p>
                </div>
                <div className="flex items-center gap-5 text-[11px] font-bold text-muted-foreground">
                  <span className="flex items-center gap-2"><span className="w-3 h-1 rounded-full bg-slate-900 inline-block" /> Received</span>
                  <span className="flex items-center gap-2"><span className="w-3 h-1 rounded-full bg-slate-300 inline-block" /> Issued</span>
                </div>
              </div>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.transactionTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="openGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#18181b" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="resGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#a1a1aa" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#a1a1aa" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: "#a1a1aa" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: "#a1a1aa" }} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ border: "none", borderRadius: "12px", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", fontSize: "12px", fontWeight: 700 }}
                      labelStyle={{ color: "#71717a", marginBottom: "4px" }}
                    />
                    <Area type="monotone" dataKey="received" stroke="#18181b" strokeWidth={2.5} fill="url(#openGrad)" name="Received" dot={{ r: 3, fill: "#18181b" }} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Area type="monotone" dataKey="issued" stroke="#a1a1aa" strokeWidth={2.5} fill="url(#resGrad)" name="Issued" dot={{ r: 3, fill: "#a1a1aa" }} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Status */}
            <div id="tour-system-status" className="bg-white border border-border/60 rounded-[18px] shadow-premium p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-foreground">Operational Integrity</h3>
                <Activity className="w-4 h-4 text-muted-foreground/60" />
              </div>
              <div className="space-y-1">
                {data.systemStatus.map((sys: any) => (
                  <motion.div 
                    whileHover={{ x: 4 }}
                    key={sys.name} 
                    className="flex items-center gap-4 py-3 border-b border-border/10 last:border-0 transition-colors"
                  >
                    <StatusDot status={sys.status} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{sys.name}</p>
                      <p className="text-[10px] font-medium text-muted-foreground">{sys.uptime} uptime · {sys.latency}</p>
                    </div>
                    <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full capitalize border shadow-xs", {
                      "bg-emerald-50 text-emerald-700 border-emerald-100": sys.status === "online",
                      "bg-amber-50 text-amber-700 border-amber-100": sys.status === "degraded",
                      "bg-red-50 text-red-700 border-red-100": sys.status === "offline",
                    })}>
                      {sys.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Bottom Row: Activity Feed + Active Repairs */}
        {data && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Activity Feed */}
            <div id="tour-recent-activity" className="xl:col-span-2">
              <ActivityFeed data={data.recentActivity} />
            </div>

            {/* Active Repairs Widget */}
            <div id="tour-active-repairs" className="bg-white border border-border/60 rounded-[18px] shadow-premium p-6 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-bold text-foreground">Maintenance Pipeline</h3>
                <Link href="/repairs" className="text-[11px] font-bold text-primary hover:underline flex items-center gap-0.5">
                  View queue <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="space-y-4 flex-1">
                {data.activeRepairs.length > 0 ? data.activeRepairs.map((r: any) => (
                  <motion.div 
                    whileHover={{ y: -2 }}
                    key={r.id} 
                    className="border border-border/40 rounded-2xl p-4 hover:border-border/80 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-foreground group-hover:text-primary transition-colors">{r.asset}</p>
                        <p className="text-[11px] font-medium text-muted-foreground mt-1 line-clamp-1">{r.issue}</p>
                      </div>
                      <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100 px-2 py-0.5 rounded-lg font-black shrink-0 shadow-xs">
                        ETA: {r.eta}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-600 border border-border/40">
                        {r.tech && r.tech !== "Unassigned" ? r.tech.split(" ").map((n: string) => n[0]).join("") : "?"}
                      </div>
                      <span className="text-[11px] font-bold text-muted-foreground">{r.tech}</span>
                      <span className="text-[10px] font-mono font-bold text-muted-foreground/40 ml-auto tracking-tighter">{r.id}</span>
                    </div>
                  </motion.div>
                )) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">No active repair tickets.</p>
                )}
              </div>
              <Link href="/repairs">
                <button className="w-full mt-6 py-3 border border-border/60 rounded-2xl text-xs font-bold text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-all flex items-center justify-center gap-2 shadow-sm">
                  <Wrench className="w-3.5 h-3.5" /> Open Maintenance Console
                </button>
              </Link>
            </div>
          </motion.div>
        )}

      </motion.div>
    </DashboardLayout>
  );
}
