"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RepairKPIs } from "@/components/repairs/RepairKPIs";
import { RepairQueue, repairQueue } from "@/components/repairs/RepairQueue";
import { RepairDetails } from "@/components/repairs/RepairDetails";
import { motion, AnimatePresence } from "framer-motion";

export default function RepairsPage() {
  const [activeRepairId, setActiveRepairId] = useState<string | null>(repairQueue[0].id);

  const activeRepair = repairQueue.find((r) => r.id === activeRepairId) || repairQueue[0];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-4rem)] pb-4">
        
        {/* Title Area */}
        <div className="mb-6 shrink-0">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Hardware Repairs
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground mt-1"
          >
            Manage active fixes, RMAs, and warranty claims.
          </motion.p>
        </div>

        {/* Dashboard Elements */}
        <div className="shrink-0 mb-6">
          <RepairKPIs />
        </div>

        {/* Dual-Pane Layout */}
        <div className="flex-1 min-h-0 flex gap-6">
          
          {/* Left Pane: Queue */}
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="w-1/3 min-w-[320px] max-w-[400px] h-full"
          >
            <RepairQueue activeId={activeRepairId} onSelect={setActiveRepairId} />
          </motion.div>

          {/* Right Pane: Workspace */}
          <motion.div 
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex-1 h-full min-w-0"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRepairId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <RepairDetails repair={activeRepair} />
              </motion.div>
            </AnimatePresence>
          </motion.div>

        </div>

      </div>
    </DashboardLayout>
  );
}
