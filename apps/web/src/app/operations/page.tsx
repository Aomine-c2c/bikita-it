"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { OperationsWizard } from "@/components/operations/OperationsWizard";
import { OperationsHistory } from "@/components/operations/OperationsHistory";
import { motion } from "framer-motion";
import { Activity, Zap, Clock, CheckCircle2 } from "lucide-react";

export default function OperationsPage() {
  return (
    <DashboardLayout>
      <div className="pb-8 space-y-6 max-w-[1500px] mx-auto">

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-end justify-between pt-1"
        >
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Operations Center</h1>
            <p className="text-[13px] font-medium text-muted-foreground mt-1">
              Execute asset assignments, tool issuances, relocations, and maintenance. Every action is atomically recorded.
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-full shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Engine Online
          </div>
        </motion.div>

        {/* KPI strip */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: "Operations Today",  icon: Zap,          color: "text-indigo-600", bg: "bg-indigo-50",   border: "border-indigo-100", value: "—" },
            { label: "Pending Actions",   icon: Clock,        color: "text-amber-600",  bg: "bg-amber-50",    border: "border-amber-100",  value: "—" },
            { label: "Completed",         icon: CheckCircle2, color: "text-emerald-600",bg: "bg-emerald-50",  border: "border-emerald-100",value: "—" },
            { label: "Active Operations", icon: Activity,     color: "text-blue-600",   bg: "bg-blue-50",     border: "border-blue-100",   value: "—" },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className={`bg-white border ${kpi.border} rounded-2xl p-5 shadow-sm flex items-center gap-4`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Main Pane: Wizard + History */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <div className="lg:col-span-1">
            <OperationsWizard />
          </div>
          <div className="lg:col-span-2">
            <OperationsHistory />
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
