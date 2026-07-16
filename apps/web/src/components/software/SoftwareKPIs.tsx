"use client";

import React from "react";
import { motion } from "framer-motion";
import { Box, Users, UserCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  { title: "Total Licenses", value: "3,492", sub: "Across 45 applications", icon: Box, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Assigned", value: "2,841", sub: "81% utilization", icon: Users, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Available Seats", value: "651", sub: "Ready to deploy", icon: UserCheck, color: "text-purple-500", bg: "bg-purple-500/10" },
  { title: "Expired", value: "12", sub: "Immediate action required", icon: AlertTriangle, color: "text-red-500", bg: "bg-red-500/10" },
  { title: "Upcoming Renewals", value: "8", sub: "Within 30 days", icon: RefreshCw, color: "text-amber-500", bg: "bg-amber-500/10" },
];

export function SoftwareKPIs() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white border border-border/60 rounded-xl p-4 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">{kpi.title}</p>
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</h3>
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
