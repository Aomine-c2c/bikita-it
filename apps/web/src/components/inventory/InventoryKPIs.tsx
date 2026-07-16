"use client";

import React from "react";
import { motion } from "framer-motion";
import { PackageSearch, AlertTriangle, XOctagon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const kpis = [
  { 
    title: "Total Items", 
    value: "14,295", 
    subtitle: "Across 4 warehouses", 
    icon: PackageSearch, 
    color: "text-blue-500", 
    bg: "bg-blue-500/10",
    border: "border-blue-500/20"
  },
  { 
    title: "Low Stock", 
    value: "142", 
    subtitle: "Below reorder level", 
    icon: AlertTriangle, 
    color: "text-amber-500", 
    bg: "bg-amber-500/10",
    border: "border-amber-500/20"
  },
  { 
    title: "Out of Stock", 
    value: "18", 
    subtitle: "Critical shortage", 
    icon: XOctagon, 
    color: "text-destructive", 
    bg: "bg-destructive/10",
    border: "border-destructive/20"
  },
  { 
    title: "Active Loans", 
    value: "45", 
    subtitle: "Tools / Items checked out", 
    icon: Clock, 
    color: "text-emerald-500", 
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20"
  },
];

export function InventoryKPIs() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, idx) => (
        <motion.div
          key={kpi.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
          className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col justify-between"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{kpi.title}</p>
              <h3 className="text-3xl font-bold tracking-tight text-foreground">{kpi.value}</h3>
            </div>
            <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center border", kpi.bg, kpi.color, kpi.border)}>
              <kpi.icon className="w-6 h-6" />
            </div>
          </div>
          <div className="pt-4 border-t border-border/40">
            <span className="text-xs font-medium text-muted-foreground">{kpi.subtitle}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
