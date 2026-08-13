"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Box, Activity, Wrench, Package } from "lucide-react";

interface QuickActionDockProps {
  onNewAsset: () => void;
  onNewTicket: () => void;
  onNewRepair: () => void;
  onNewStock: () => void;
}

export function QuickActionDock({
  onNewAsset,
  onNewTicket,
  onNewRepair,
  onNewStock,
}: QuickActionDockProps) {
  const actions = [
    {
      label: "New Asset",
      icon: Box,
      onClick: onNewAsset,
      color: "from-blue-500/10 to-indigo-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400",
      hoverBg: "hover:bg-blue-500/20",
    },
    {
      label: "Log Ticket",
      icon: Activity,
      onClick: onNewTicket,
      color: "from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
      hoverBg: "hover:bg-amber-500/20",
    },
    {
      label: "Schedule Repair",
      icon: Wrench,
      onClick: onNewRepair,
      color: "from-purple-500/10 to-pink-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400",
      hoverBg: "hover:bg-purple-500/20",
    },
    {
      label: "Provision Stock",
      icon: Package,
      onClick: onNewStock,
      color: "from-emerald-500/10 to-teal-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
      hoverBg: "hover:bg-emerald-500/20",
    },
  ];

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-black text-foreground tracking-tight">Rapid Operations</h3>
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Direct Trigger Dock</p>
        </div>
        <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Plus className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <motion.button
              key={act.label}
              whileHover={{ scale: 1.03, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={act.onClick}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border bg-gradient-to-br ${act.color} ${act.hoverBg} transition-all duration-300 shadow-sm cursor-pointer group text-center`}
            >
              <div className="w-8 h-8 rounded-xl bg-background/80 backdrop-blur-md flex items-center justify-center mb-2 shadow-sm group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                {act.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
