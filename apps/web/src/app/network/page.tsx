"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NetworkHealth } from "@/components/network/NetworkHealth";
import { NetworkTopology } from "@/components/network/NetworkTopology";
import { SwitchDetails } from "@/components/network/SwitchDetails";
import { NetworkAlerts } from "@/components/network/NetworkAlerts";
import { motion } from "framer-motion";

export default function NetworkOperationsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10 min-h-[calc(100vh-4rem)]">
        
        {/* Title Area */}
        <div className="mb-6 flex justify-between items-end">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Network Operations Center
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mt-1"
            >
              Real-time infrastructure topology, bandwidth monitoring, and device health.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-3 py-1.5 rounded-full"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider">Live Sync Active</span>
          </motion.div>
        </div>

        {/* Top KPI Row */}
        <NetworkHealth />

        {/* Main Grid: Topology + Right Panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* Left / Center: Interactive Map */}
          <motion.div 
            className="xl:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <NetworkTopology />
          </motion.div>

          {/* Right Panel: Switch Details & Alerts */}
          <motion.div 
            className="xl:col-span-1 space-y-6 flex flex-col h-full"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex-1 min-h-[500px]">
              <SwitchDetails />
            </div>
            <div className="shrink-0 h-[300px]">
              <NetworkAlerts />
            </div>
          </motion.div>

        </div>

      </div>
    </DashboardLayout>
  );
}
