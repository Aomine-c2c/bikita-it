"use client";

import React from "react";
import { motion } from "framer-motion";
import { Inbox, RotateCw, CheckCircle2, AlertOctagon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  { title: "Open Tickets", value: "24", sub: "12 unassigned", icon: Inbox, color: "text-blue-500", bg: "bg-blue-500/10" },
  { title: "In Progress", value: "18", sub: "Currently being worked on", icon: RotateCw, color: "text-amber-500", bg: "bg-amber-500/10" },
  { title: "Resolved (Today)", value: "45", sub: "+12% from yesterday", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { title: "Critical Issues", value: "3", sub: "Immediate attention required", icon: AlertOctagon, color: "text-destructive", bg: "bg-destructive/10" },
  { title: "Avg Resolution", value: "1h 45m", sub: "Within SLA target", icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" },
];

export function ServiceDeskKPIs() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
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
