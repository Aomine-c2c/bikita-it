"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardSkeleton } from "@/components/skeletons/DashboardSkeleton";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { QuickActionDock } from "@/components/dashboard/QuickActionDock";
import { TelemetryGaugeWidget } from "@/components/dashboard/TelemetryGaugeWidget";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { NewTicketModal } from "@/components/helpdesk/NewTicketModal";
import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";
import { GuidedTour } from "@/components/tutorial/GuidedTour";

import Link from "next/link";
import { Box, AlertTriangle, Package, Wifi, Activity, Wrench, ChevronRight, RefreshCw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, Variants, useMotionValue, useSpring, useTransform, useInView } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,  } from "recharts";
import { apiFetch } from "@/lib/api";

function AnimatedCounter({ value }: { value: number | string }) {
  const numValue = typeof value === "string" ? parseInt(value.replace(/,/g, ""), 10) : value;
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10px" });

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 40,
    stiffness: 150,
  });
  const rounded = useTransform(springValue, (latest) => Math.round(latest).toLocaleString());

  React.useEffect(() => {
    if (inView) {
      motionValue.set(numValue);
    }
  }, [inView, motionValue, numValue]);

  if (isNaN(numValue)) return <span>{value}</span>;

  return <motion.span ref={ref}>{rounded}</motion.span>;
}

interface DashboardData {
  kpis: {
    totalHardware: number;
    atRiskHardware: number;
    lowStockItems: number;
    activeNetworkDevices: number;
  };
  transactionTrend: Array<{ day: string; received: number; issued: number }>;
  systemStatus: Array<{ name: string; uptime: string; latency: string; status: string }>;
  recentActivity: Array<{ action: string; meta: string; type: string; time: string }>;
  activeRepairs: Array<{ id: string; asset: string; issue: string; eta: string; tech: string }>;
}

export default function MissionControl() {
  const [time, setTime] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState<"connecting" | "ready" | "error">("connecting");
  const [retryCount, setRetryCount] = useState(0);

  // Modal Overlay States
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setBackendStatus("connecting");
    try {
      const json = await apiFetch<DashboardData>("/dashboard/stats");
      setData(json);
      setBackendStatus("ready");
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
      setBackendStatus("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [retryCount]);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
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
        <div className="flex-1 mt-6">
          <DashboardSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (backendStatus === "error") {
    return (
      <DashboardLayout>
        <div className="flex-1 flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 p-8 bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl max-w-md shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-2xl">
              ⚙️
            </div>
            <h2 className="text-xl font-bold text-foreground">Backend Unreachable</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              The API server on port 3001 could not be reached. Ensure the backend is active.
            </p>
            <button
              onClick={() => setRetryCount((c) => c + 1)}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const CRITICAL_KPIS = data
    ? [
        {
          label: "Total Hardware Assets",
          value: data.kpis.totalHardware,
          subtext: "Tracked across nodes",
          icon: Box,
          href: "/assets",
          trendVal: "Live Sync",
          color: "text-blue-500",
          bg: "from-blue-500/10 to-indigo-500/10",
        },
        {
          label: "Assets At Risk",
          value: data.kpis.atRiskHardware,
          subtext: "In repair queue",
          icon: AlertTriangle,
          href: "/repairs",
          trendVal: data.kpis.atRiskHardware > 0 ? "Attention" : "Optimal",
          color: data.kpis.atRiskHardware > 0 ? "text-amber-500" : "text-emerald-500",
          bg: "from-amber-500/10 to-orange-500/10",
        },
        {
          label: "Low Stock Items",
          value: data.kpis.lowStockItems,
          subtext: "Below safety threshold",
          icon: Package,
          href: "/inventory",
          trendVal: data.kpis.lowStockItems > 0 ? "Reorder" : "Stocked",
          color: data.kpis.lowStockItems > 0 ? "text-red-500" : "text-emerald-500",
          bg: "from-red-500/10 to-pink-500/10",
        },
        {
          label: "Active Network Devices",
          value: data.kpis.activeNetworkDevices,
          subtext: "Online endpoints",
          icon: Wifi,
          href: "/network",
          trendVal: "Online",
          color: "text-emerald-500",
          bg: "from-emerald-500/10 to-teal-500/10",
        },
      ]
    : [];

  return (
    <DashboardLayout>
      <GuidedTour />

      {/* Quick Action Modals */}
      <AssetFormModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSuccess={() => {
          setIsAssetModalOpen(false);
          fetchDashboard();
        }}
      />

      <NewTicketModal
        isOpen={isTicketModalOpen}
        onClose={() => setIsTicketModalOpen(false)}
        onSuccess={() => {
          setIsTicketModalOpen(false);
          fetchDashboard();
        }}
      />

      <InventoryFormModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        onSuccess={() => {
          setIsStockModalOpen(false);
          fetchDashboard();
        }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="pb-10 space-y-6 max-w-[1500px] mx-auto"
      >
        {/* Top Mission Control Bar */}
        <motion.div data-tour="mission-control" variants={itemVariants} className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 pt-1">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Mission Control</h1>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">
              Live Operations & System Overview • {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchDashboard}
              className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-card/60 border border-border/50 px-3.5 py-2 rounded-xl backdrop-blur-md hover:text-foreground hover:bg-card/80 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-card/60 border border-border/50 px-3.5 py-2 rounded-xl backdrop-blur-md shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-bold text-foreground">
                Engine Status: <span className="text-emerald-500">Active</span>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Asymmetric 6-Card Cyber Bento Grid */}
        {data && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            {/* Background ambient radial glow */}
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent blur-3xl rounded-full pointer-events-none" />

            {/* 4 Glassmorphic KPI Cards (Row 1) */}
            {CRITICAL_KPIS.map((kpi) => (
              <Link key={kpi.label} href={kpi.href} className="group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-3xl">
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-card/40 backdrop-blur-xl h-full rounded-3xl border border-border/50 p-5 cursor-pointer transition-all duration-300 group-hover:bg-card/80 group-hover:border-primary/30 group-hover:shadow-xl flex flex-col justify-between relative overflow-hidden"
                >
                  <div className={`absolute -top-12 -right-12 w-28 h-28 bg-gradient-to-br ${kpi.bg} rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />

                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className="flex items-center justify-center p-2.5 rounded-2xl bg-background/80 border border-border/60 shadow-sm group-hover:scale-110 transition-transform">
                      <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                    </div>
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border bg-background/80 border-border/50 text-muted-foreground backdrop-blur-md shadow-sm">
                      {kpi.trendVal}
                    </span>
                  </div>

                  <div className="relative z-10">
                    <p className="text-3xl font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">
                      <AnimatedCounter value={kpi.value} />
                    </p>
                    <p className="text-xs font-bold text-muted-foreground mt-1">{kpi.label}</p>
                    <p className="text-[10px] font-medium text-muted-foreground/70 mt-0.5">{kpi.subtext}</p>
                  </div>
                </motion.div>
              </Link>
            ))}

            {/* Recharts 7-Day Asset Flow Area Chart (Span 2x2) */}
            <motion.div
              whileHover={{ scale: 1.005 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="xl:col-span-2 xl:row-span-2 bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-all min-h-[320px]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-foreground tracking-tight">Asset Lifecycle Flow</h3>
                  <p className="text-[11px] font-medium text-muted-foreground mt-0.5 uppercase tracking-widest">7-Day Operations</p>
                </div>
                <div className="flex items-center gap-4 text-[11px] font-bold text-muted-foreground bg-background/60 border border-border/50 px-3 py-1.5 rounded-full backdrop-blur-md">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Registered
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" /> Issued
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.transactionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorIss" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: "currentColor" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "currentColor" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "rgba(15, 23, 42, 0.9)",
                        borderColor: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "16px",
                        fontSize: "12px",
                        backdropFilter: "blur(12px)",
                        color: "#fff",
                      }}
                    />
                    <Area type="monotone" dataKey="received" stroke="var(--color-primary, #3b82f6)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRec)" />
                    <Area type="monotone" dataKey="issued" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIss)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Rapid Action Dock (Span 1x2) */}
            <motion.div className="xl:col-span-1 xl:row-span-2">
              <QuickActionDock
                onNewAsset={() => setIsAssetModalOpen(true)}
                onNewTicket={() => setIsTicketModalOpen(true)}
                onNewRepair={() => setIsAssetModalOpen(true)}
                onNewStock={() => setIsStockModalOpen(true)}
              />
            </motion.div>

            {/* Telemetry Gauge Widget (Span 1x2) */}
            <motion.div className="xl:col-span-1 xl:row-span-2">
              <TelemetryGaugeWidget />
            </motion.div>
          </motion.div>
        )}

        {/* Live Activity Feed Row */}
        {data && (
          <motion.div variants={itemVariants} className="pt-2">
            <ActivityFeed data={data.recentActivity as any} />
          </motion.div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
