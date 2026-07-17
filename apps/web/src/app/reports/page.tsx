"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { motion } from "framer-motion";

export default function ReportsPage() {
  return (
    <DashboardLayout>
      <div className="flex flex-col min-h-full pb-8">
        
        {/* Title Area */}
        <div className="mb-6 shrink-0">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Analytics & Reports
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground mt-1"
          >
            Business intelligence, financial tracking, and platform insights.
          </motion.p>
        </div>

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ReportToolbar />
        </motion.div>

        <section className="mt-6 rounded-xl border bg-white p-8 text-center">
          <h2 className="font-bold">No reporting data source configured</h2>
          <p className="mt-2 text-sm text-muted-foreground">Reports will appear when a reporting API is connected. No sample financial figures are shown.</p>
        </section>

      </div>
    </DashboardLayout>
  );
}
