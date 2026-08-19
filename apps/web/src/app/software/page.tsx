"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SoftwareKPIs } from "@/components/software/SoftwareKPIs";
import { SoftwareTable } from "@/components/software/SoftwareTable";
import { SoftwareAIOptimizer } from "@/components/software/SoftwareAIOptimizer";
import { motion } from "framer-motion";
import { Monitor, Plus } from "lucide-react";

export default function SoftwarePage() {
  const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16 min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto font-sans">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Software & SaaS License Studio
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                SaaS Fleet
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Subscription seat provisioning, compliance audits, AI license reclamation & co-term renewals
            </p>
          </div>
        </motion.div>

        {/* Live KPI strip */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SoftwareKPIs />
        </motion.div>

        {/* AI Cost Optimizer Engine */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <SoftwareAIOptimizer onSelectFilter={setActiveFilter} />
        </motion.div>

        {/* Main Software Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="min-h-[480px]"
        >
          <SoftwareTable activeFilter={activeFilter} />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
