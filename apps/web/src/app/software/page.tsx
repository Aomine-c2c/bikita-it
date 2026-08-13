"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SoftwareKPIs } from "@/components/software/SoftwareKPIs";
import { SoftwareTable } from "@/components/software/SoftwareTable";
import { motion } from "framer-motion";
import { Monitor } from "lucide-react";

export default function SoftwarePage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Monitor className="w-5 h-5" />
              </div>
              Software License Management
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              SaaS subscriptions, seat utilization, renewal tracking &amp; cost analysis
            </p>
          </div>
        </motion.div>

        {/* Live KPI strip */}
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <SoftwareKPIs />
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="h-[calc(100vh-22rem)]"
        >
          <SoftwareTable />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
