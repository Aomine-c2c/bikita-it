"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  trend?: {
    value: number | string;
    isPositive?: boolean;
    label?: string;
  };
  subtitle?: string;
  className?: string;
  index?: number;
}

export function StatCard({ title, value, trend, subtitle, className, index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "bg-white  rounded-[14px] border border-border/60 shadow-sm flex flex-col overflow-hidden min-w-[200px]",
        className
      )}
    >
      <div className="p-4 flex-1 flex flex-col justify-between relative">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider truncate mr-2">{title}</p>
          <div className="w-1 h-3 bg-muted/30 rounded-full shrink-0" />
        </div>
        
        <div className="flex items-end justify-between">
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold tracking-tight text-foreground leading-none mb-1">{value}</h3>
            {subtitle && <span className="text-xs font-medium text-muted-foreground">{subtitle}</span>}
          </div>
          
          {/* Simple static sparkline placeholder */}
          <div className="flex items-end gap-0.5 h-6 opacity-20 shrink-0">
            {[40, 70, 45, 90, 65].map((h, i) => (
              <div key={i} className="w-1 bg-foreground rounded-t-sm" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </div>
      
      {/* Footer Area separated by very light border */}
      <div className="px-4 py-2 border-t border-border/40 bg-[#FAFAFA] flex items-center justify-between">
        <div className="w-3 h-3 rounded bg-muted/20 flex items-center justify-center shrink-0">
          <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
        </div>
        
        {trend && (
          <div className="flex items-center gap-1 truncate">
            <span
              className={cn(
                "text-[11px] font-bold",
                trend.isPositive === true ? "text-emerald-500" : 
                trend.isPositive === false ? "text-destructive" : "text-muted-foreground"
              )}
            >
              {trend.isPositive === true ? "+" : trend.isPositive === false ? "-" : ""}{Math.abs(Number(trend.value)) || trend.value}
            </span>
            <span className="text-[10px] font-medium text-muted-foreground truncate">
              {trend.label || "last year"}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
