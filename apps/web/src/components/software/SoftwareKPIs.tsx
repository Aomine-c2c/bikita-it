"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Box, Users, UserCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { softwareApi } from "@/lib/api";

interface KpiData {
  totalLicenses: number;
  assignedSeats: number;
  availableSeats: number;
  expiredLicenses: number;
  expiringSoon: number;
  appCount: number;
}

export function SoftwareKPIs() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    softwareApi
      .getKpis()
      .then((d) => setData(d as KpiData))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    {
      title: "Total Seats",
      value: loading ? "…" : (data?.totalLicenses ?? 0).toLocaleString(),
      sub: loading ? "" : `Across ${data?.appCount ?? 0} applications`,
      icon: Box,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Assigned",
      value: loading ? "…" : (data?.assignedSeats ?? 0).toLocaleString(),
      sub:
        loading || !data
          ? ""
          : data.totalLicenses > 0
          ? `${Math.round((data.assignedSeats / data.totalLicenses) * 100)}% utilization`
          : "0% utilization",
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Available Seats",
      value: loading ? "…" : (data?.availableSeats ?? 0).toLocaleString(),
      sub: "Ready to deploy",
      icon: UserCheck,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Expired",
      value: loading ? "…" : (data?.expiredLicenses ?? 0).toLocaleString(),
      sub: "Immediate action required",
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Expiring Soon",
      value: loading ? "…" : (data?.expiringSoon ?? 0).toLocaleString(),
      sub: "Within 30 days",
      icon: RefreshCw,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.07 }}
          className="bg-white border border-border/60 rounded-xl p-4 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
                {kpi.title}
              </p>
              <h3
                className={cn(
                  "text-3xl font-bold tracking-tight",
                  loading ? "animate-pulse text-muted-foreground" : "text-foreground"
                )}
              >
                {kpi.value}
              </h3>
            </div>
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", kpi.bg, kpi.color)}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
          <div className="pt-2 border-t border-border/40 mt-2">
            <span className="text-[10px] font-medium text-muted-foreground">{kpi.sub}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
