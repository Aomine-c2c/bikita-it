"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Box, LifeBuoy, Wrench, Package } from "lucide-react";
import { cn } from "@/lib/utils";

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
      desc: "Register hardware SKU",
    },
    {
      label: "Log Ticket",
      icon: LifeBuoy,
      onClick: onNewTicket,
      desc: "Dispatch IT helpdesk",
    },
    {
      label: "Schedule Repair",
      icon: Wrench,
      onClick: onNewRepair,
      desc: "Queue RMA diagnostics",
    },
    {
      label: "Provision Stock",
      icon: Package,
      onClick: onNewStock,
      desc: "Receive consumable stock",
    },
  ];

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col justify-between h-full font-sans">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-black text-foreground tracking-tight">Rapid Operations</h3>
          <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Direct Trigger Dock</p>
        </div>
        <div className="w-7 h-7 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-xs">
          <Plus className="w-3.5 h-3.5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5 flex-1">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <motion.button
              key={act.label}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={act.onClick}
              className="flex flex-col items-center justify-center p-3 rounded-2xl border border-border/50 bg-card/70 hover:bg-muted/40 hover:border-primary/40 transition-all duration-200 shadow-xs cursor-pointer group text-center"
            >
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center mb-1.5 shadow-2xs group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                {act.label}
              </span>
              <span className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">
                {act.desc}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
