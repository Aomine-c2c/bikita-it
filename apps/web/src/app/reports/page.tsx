"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ReportToolbar } from "@/components/reports/ReportToolbar";
import { ReportKPIs } from "@/components/reports/ReportKPIs";
import { ReportCharts } from "@/components/reports/ReportCharts";
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

        {/* Financial KPIs */}
        <div className="shrink-0">
          <ReportKPIs />
        </div>

        {/* Chart Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex-1"
        >
          <ReportCharts />
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
