"use client";

import React from "react";
import { motion } from "framer-motion";
import { DollarSign, Laptop, Cloud, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  { title: "Total IT Spend (YTD)", value: "$1.24M", sub: "+4% vs last year", icon: DollarSign, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { title: "Active Asset Value", value: "$892K", sub: "Depreciated value", icon: Laptop, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "SaaS Run Rate", value: "$42K/mo", sub: "Optimized by 12%", icon: Cloud, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "Hardware Repair Costs", value: "$18.5K", sub: "YTD Total", icon: Wrench, color: "text-amber-500", bg: "bg-amber-500/10" },
];

export function ReportKPIs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white border border-border/60 rounded-xl p-5 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-transparent to-black/5 rounded-full blur-2xl -z-10 group-hover:scale-110 transition-transform" />
          
          <div className="flex justify-between items-start mb-4">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/40", kpi.bg, kpi.color)}>
              <kpi.icon className="w-5 h-5" />
            </div>
          </div>
          
          <div>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{kpi.title}</p>
            <h3 className="text-3xl font-black tracking-tight text-foreground">{kpi.value}</h3>
          </div>
          
          <div className="pt-3 border-t border-border/40 mt-3">
            <span className="text-[11px] font-medium text-muted-foreground">{kpi.sub}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
