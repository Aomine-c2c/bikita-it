"use client";

import React from "react";
import { motion } from "framer-motion";
import { Wrench, PackageSearch, Truck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  { title: "Repairs Today", value: "12", sub: "3 completed", icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Waiting Parts", value: "8", sub: "ETA next week", icon: PackageSearch, color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "Vendor RMAs", value: "4", sub: "Out for repair", icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
  { title: "Completed (MTD)", value: "145", sub: "98% Success Rate", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

export function RepairKPIs() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
