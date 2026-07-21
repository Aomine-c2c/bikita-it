"use client";

import React from "react";
import { motion } from "framer-motion";
import { Laptop, Wrench, ShieldAlert, CheckCircle2, Box, LifeBuoy, Wifi, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ActivityItem {
  action: string;
  meta: string;
  type: string;
  time: string;
}

const TYPE_MAP: Record<string, { icon: React.ElementType; color: string }> = {
  ticket: { icon: LifeBuoy, color: "text-blue-500 bg-blue-500/10" },
  asset: { icon: Box, color: "text-slate-600 bg-slate-500/10" },
  network: { icon: Wifi, color: "text-emerald-600 bg-emerald-500/10" },
  alert: { icon: AlertTriangle, color: "text-amber-500 bg-amber-500/10" },
  user: { icon: CheckCircle2, color: "text-purple-500 bg-purple-500/10" },
  repair: { icon: Wrench, color: "text-orange-500 bg-orange-500/10" },
  inventory: { icon: Laptop, color: "text-indigo-500 bg-indigo-500/10" },
};

export function ActivityFeed({ data }: { data: ActivityItem[] }) {
  return (
    <div className="bg-white rounded-[18px] border border-border/60 shadow-premium overflow-hidden h-full">
      <div className="p-6 border-b border-border/40 flex items-center justify-between bg-slate-50/50">
        <h3 className="font-black text-sm text-foreground tracking-tight">Recent Activity</h3>
        <span className="text-[11px] font-bold text-primary hover:underline cursor-pointer">View audit log</span>
      </div>
      <div className="p-6">
        <div className="space-y-6 relative">
          {data && data.length > 0 ? data.map((item, index) => {
            const config = TYPE_MAP[item.type] ?? TYPE_MAP.alert;
            const Icon = config.icon;

            return (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                key={index}
                className="flex gap-4 relative group"
              >
                {/* Connection Line */}
                {index !== data.length - 1 && (
                  <div className="absolute left-[17px] top-9 bottom-[-1.75rem] w-px bg-border/60 group-hover:bg-primary/30 transition-colors" />
                )}
                
                <div
                  className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 z-10 shadow-xs border border-border/10",
                    config.color
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>
                
                <div className="flex-1 pb-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-black text-foreground leading-tight group-hover:text-primary transition-colors">{item.action}</h4>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2 font-bold tracking-tight">
                      {item.time}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-muted-foreground mt-1 truncate max-w-[280px]">{item.meta}</p>
                </div>
              </motion.div>
            );
          }) : (
            <p className="text-xs font-bold text-muted-foreground py-6 text-center">No activity records found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
