"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssetSidebar } from "@/components/assets/AssetSidebar";
import { AssetTable } from "@/components/assets/AssetTable";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { motion } from "framer-motion";
import { Plus, Box, ShieldCheck, Wrench, Archive, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { assetApi } from "@/lib/api";

export default function AssetsPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All Assets");

  // Query Real Assets Stats
  const { data: rawAssets = [], refetch } = useQuery({
    queryKey: ["assets"],
    queryFn: async () => {
      return await assetApi.getAll();
    },
  });

  const totalAssets = rawAssets.length;
  const activeAssets = rawAssets.filter((a: any) => a.status === "Active" || a.status === "In Use").length;
  const inRepair = rawAssets.filter((a: any) => a.status === "In Maintenance" || a.status === "Repair").length;
  const retired = rawAssets.filter((a: any) => a.status === "Retired" || a.status === "Disposed").length;

  const kpis = [
    { label: "Total Hardware", value: totalAssets, icon: Box, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active & In-Use", value: activeAssets, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Under Maintenance", value: inRepair, icon: Wrench, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Retired / Disposed", value: retired, icon: Archive, color: "text-muted-foreground", bg: "bg-muted/40" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Modals */}
        <AssetFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            refetch();
          }}
        />

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-black tracking-tight text-foreground"
            >
              Hardware Asset Directory
            </motion.h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Track, Provision & Audit Hardware Lifecycle Assets
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Hardware Asset</span>
            </button>
          </div>
        </div>

        {/* Top Metric Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="text-2xl font-black tracking-tight text-foreground">{kpi.value}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} border border-border/40 flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Dual Pane Layout */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex gap-6 overflow-hidden min-h-[500px]"
        >
          {/* Left Sidebar Category Tree */}
          <AssetSidebar activeCategory={activeCategory} onSelectCategory={setActiveCategory} />

          {/* Main Hardware Catalog Area */}
          <div className="flex-1 overflow-hidden min-w-0">
            <AssetTable activeCategory={activeCategory} />
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
