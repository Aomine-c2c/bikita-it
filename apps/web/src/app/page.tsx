"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Link from "next/link";
import {
  Box, LifeBuoy, ShoppingCart, AlertTriangle, Package,
  CheckCircle2, Clock, ArrowRight, Wifi, WifiOff,
  TrendingUp, TrendingDown, Minus, Activity, Wrench,
  ServerCrash, ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

// --- Data ---
const transactionTrend = [
  { day: "Mon", received: 15, issued: 8 },
  { day: "Tue", received: 0, issued: 12 },
  { day: "Wed", received: 20, issued: 5 },
  { day: "Thu", received: 0, issued: 18 },
  { day: "Fri", received: 50, issued: 10 },
  { day: "Sat", received: 0, issued: 2 },
  { day: "Sun", received: 0, issued: 0 },
];

const CRITICAL_KPIS = [
  {
    label: "Total Hardware Assets",
    value: "142",
    subtext: "125 deployed, 17 in stock",
    icon: Box,
    href: "/assets",
    trend: "up",
    trendVal: "+3 this week",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    dot: "bg-blue-500",
  },
  {
    label: "Assets At Risk",
    value: "7",
    subtext: "Warranty expired / In repair",
    icon: AlertTriangle,
    href: "/assets",
    trend: "warn",
    trendVal: "Action needed",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    dot: "bg-amber-500",
  },
  {
    label: "Low Stock Items",
    value: "12",
    subtext: "Below minimum threshold",
    icon: Package,
    href: "/inventory",
    trend: "warn",
    trendVal: "Reorder required",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    dot: "bg-red-500",
  },
  {
    label: "Active Network Devices",
    value: "86",
    subtext: "2 offline, 1 warning",
    icon: Wifi,
    href: "/network",
    trend: "neutral",
    trendVal: "98% Uptime",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    dot: "bg-emerald-400",
  },
];

const SYSTEM_STATUS = [
  { name: "Core Network", status: "online", uptime: "99.98%", latency: "2ms" },
  { name: "ERP Integration", status: "online", uptime: "99.5%", latency: "45ms" },
  { name: "Backup Service", status: "degraded", uptime: "87.2%", latency: "—" },
  { name: "VPN Gateway", status: "online", uptime: "100%", latency: "8ms" },
  { name: "CCTV System", status: "offline", uptime: "0%", latency: "—" },
  { name: "Email Server", status: "online", uptime: "99.9%", latency: "12ms" },
];

const RECENT_ACTIVITY = [
  { action: "Stock Issued", meta: "2x PTZ Cameras -> Powerhouse", type: "asset", time: "2 min ago" },
  { action: "Asset XIP-4914 check in", meta: "MacBook Air M1 returned from repair", type: "asset", time: "18 min ago" },
  { action: "Network Device Offline", meta: "CCTV Switch 04 — Powerhouse", type: "alert", time: "1 hr ago" },
  { action: "Low stock alert", meta: "Cat6 Cable Rolls — only 3 units left", type: "alert", time: "2 hr ago" },
  { action: "Tool Borrowed", meta: "Drill D-01 borrowed by John Doe", type: "user", time: "3 hr ago" },
  { action: "Asset Reassigned", meta: "ThinkPad T14 -> Emily Chen", type: "asset", time: "4 hr ago" },
  { action: "Repair job completed", meta: "ThinkPad T14 — RAM replaced", type: "repair", time: "5 hr ago" },
];

const ACTIVE_REPAIRS = [
  { id: "REP-091", asset: "HP ProBook 450", issue: "Keyboard failure", tech: "John D.", eta: "Today" },
  { id: "REP-090", asset: "MacBook Air M1", issue: "Battery replacement", tech: "Mike R.", eta: "Tomorrow" },
  { id: "REP-089", asset: "Dell P2419H Monitor", issue: "Dead pixels", tech: "Emily C.", eta: "3 days" },
];

function ActivityIcon({ type }: { type: string }) {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    ticket: { icon: LifeBuoy, color: "text-blue-500 bg-blue-50" },
    asset: { icon: Box, color: "text-slate-600 bg-slate-100" },
    network: { icon: Wifi, color: "text-emerald-600 bg-emerald-50" },
    alert: { icon: AlertTriangle, color: "text-amber-500 bg-amber-50" },
    user: { icon: CheckCircle2, color: "text-purple-500 bg-purple-50" },
    repair: { icon: Wrench, color: "text-orange-500 bg-orange-50" },
  };
  const { icon: Icon, color } = map[type] ?? map.alert;
  return (
    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", color)}>
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

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
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <DashboardLayout>
      <div className="pb-10 space-y-5 max-w-[1500px] mx-auto">

        {/* Page Header */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex items-end justify-between pt-1">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Mission Control</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {time.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-emerald-700">Platform Operational</span>
          </div>
        </motion.div>

        {/* Critical KPI Cards */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {CRITICAL_KPIS.map((kpi, i) => (
            <Link key={kpi.label} href={kpi.href}>
              <motion.div
                whileHover={{ y: -2 }}
                className={cn("bg-white rounded-[14px] border shadow-sm p-5 cursor-pointer hover:shadow-md transition-all", kpi.border)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", kpi.bg)}>
                    <kpi.icon className={cn("w-5 h-5", kpi.color)} />
                  </div>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1",
                    kpi.trend === "up" ? "bg-red-50 text-red-600 border-red-100" :
                    kpi.trend === "warn" ? "bg-amber-50 text-amber-600 border-amber-100" :
                    "bg-slate-50 text-slate-600 border-slate-200"
                  )}>
                    {kpi.trendVal}
                  </span>
                </div>
                <p className="text-3xl font-black text-foreground leading-none">{kpi.value}</p>
                <p className="text-xs font-semibold text-foreground mt-1">{kpi.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{kpi.subtext}</p>
                <div className="flex items-center gap-1 mt-3 text-[11px] font-semibold text-muted-foreground group-hover:text-foreground">
                  View details <ArrowRight className="w-3 h-3" />
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>

        {/* Middle Row: Ticket Chart + System Status */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Inventory Trend Chart */}
          <div className="xl:col-span-2 bg-white border border-border/60 rounded-[14px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-foreground">Inventory Transactions (7-day)</h3>
                <p className="text-xs text-muted-foreground">Received vs Issued this week</p>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-semibold text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded-full bg-slate-800 inline-block" /> Received</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 rounded-full bg-slate-300 inline-block" /> Issued</span>
              </div>
            </div>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={transactionTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#71717a" }} />
                  <Tooltip
                    contentStyle={{ border: "1px solid #e4e4e7", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: "12px" }}
                    labelStyle={{ fontWeight: 700 }}
                  />
                  <Area type="monotone" dataKey="received" stroke="#18181b" strokeWidth={2} fill="url(#openGrad)" name="Received" dot={false} />
                  <Area type="monotone" dataKey="issued" stroke="#a1a1aa" strokeWidth={2} fill="url(#resGrad)" name="Issued" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-white border border-border/60 rounded-[14px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-foreground">System Status</h3>
              <Activity className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-2.5">
              {SYSTEM_STATUS.map((sys) => (
                <div key={sys.name} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                  <StatusDot status={sys.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{sys.name}</p>
                    <p className="text-[10px] text-muted-foreground">{sys.uptime} uptime · {sys.latency}</p>
                  </div>
                  <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded capitalize", {
                    "bg-emerald-50 text-emerald-600": sys.status === "online",
                    "bg-amber-50 text-amber-600": sys.status === "degraded",
                    "bg-red-50 text-red-600": sys.status === "offline",
                  })}>
                    {sys.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Bottom Row: Activity Feed + Active Repairs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Activity Feed */}
          <div className="xl:col-span-2 bg-white border border-border/60 rounded-[14px] shadow-sm p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-foreground">Recent Activity</h3>
              <span className="text-[11px] font-semibold text-primary hover:underline cursor-pointer">View all</span>
            </div>
            <div className="space-y-3">
              {RECENT_ACTIVITY.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0 group cursor-pointer hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors">
                  <ActivityIcon type={item.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{item.action}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.meta}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5 font-medium">{item.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Repairs Widget */}
          <div className="bg-white border border-border/60 rounded-[14px] shadow-sm p-5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-foreground">Active Repairs</h3>
              <Link href="/repairs" className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5">
                All repairs <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3 flex-1">
              {ACTIVE_REPAIRS.map((r) => (
                <div key={r.id} className="border border-border/40 rounded-xl p-3.5 hover:border-border/80 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-foreground">{r.asset}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{r.issue}</p>
                    </div>
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-1.5 py-0.5 rounded font-bold shrink-0">
                      ETA: {r.eta}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2.5">
                    <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600">
                      {r.tech.split(" ").map(n => n[0]).join("")}
                    </div>
                    <span className="text-[11px] text-muted-foreground">{r.tech}</span>
                    <span className="text-[10px] font-mono text-muted-foreground ml-auto">{r.id}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/repairs">
              <button className="w-full mt-4 py-2 border border-border/60 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors flex items-center justify-center gap-2">
                <Wrench className="w-3.5 h-3.5" /> Open Repairs Queue
              </button>
            </Link>
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
