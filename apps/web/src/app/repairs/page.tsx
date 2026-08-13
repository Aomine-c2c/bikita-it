"use client";

import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { RepairKanbanBoard } from "@/components/repairs/RepairKanbanBoard";
import { RepairDetailsDrawer } from "@/components/repairs/RepairDetailsDrawer";
import { RepairTable } from "@/components/repairs/RepairTable";
import { UpdateRepairStatusModal } from "@/components/repairs/UpdateRepairStatusModal";
import { motion } from "framer-motion";
import { Wrench, Plus, RefreshCw, LayoutGrid, Table, Clock, CheckCircle2, DollarSign, AlertCircle, FileText } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/utils";

export default function RepairsPage() {
  const [activeRepairId, setActiveRepairId] = useState<string | null>(null);
  const [repairItems, setRepairItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  const fetchRepairs = async () => {
    try {
      const data = await apiFetch<any>("/repairs");
      const items = Array.isArray(data) ? data : [];
      setRepairItems(items);
    } catch (e) {
      console.error("Failed to fetch repairs:", e);
    }
  };

  useEffect(() => {
    fetchRepairs();
  }, []);

  const handleStatusChange = async (repairId: string, newStatus: string) => {
    try {
      await apiFetch(`/repairs/${repairId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchRepairs();
    } catch (e) {
      console.error("Failed to update status", e);
      fetchRepairs();
    }
  };

  const activeRepair = activeRepairId ? repairItems.find((r: any) => String(r.id) === activeRepairId) : null;

  const queuedCount = repairItems.filter((r) => r.status === "QUEUED").length;
  const waitingParts = repairItems.filter((r) => r.status === "WAITING_PARTS").length;
  const inProgress = repairItems.filter((r) => r.status === "IN_PROGRESS").length;
  const completed = repairItems.filter((r) => r.status === "COMPLETED").length;

  const kpis = [
    { label: "Active Diagnostics", value: queuedCount, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Waiting Parts", value: waitingParts, icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "In Repairing", value: inProgress, icon: Wrench, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Completed & Ready", value: completed, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Modals & Slide-over Drawer */}
        <RepairDetailsDrawer
          isOpen={!!activeRepairId}
          onClose={() => setActiveRepairId(null)}
          repair={activeRepair}
          onStatusChange={handleStatusChange}
        />

        <UpdateRepairStatusModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          repairId="1"
          currentStatus="QUEUED"
          onSuccess={() => {
            setIsModalOpen(false);
            fetchRepairs();
          }}
        />

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Hardware Repairs & RMAs</h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Manage Hardware Fixes, Vendor Warranty Claims & Maintenance Expense Ledgers
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchRepairs()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => exportToCSV("repair_expenses.csv", repairItems)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>Export Expense Report</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule New Repair</span>
            </button>
          </div>
        </div>

        {/* Repair KPI Summary Bar */}
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

        {/* View Switcher Header */}
        <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/50 p-2 rounded-2xl">
          <span className="text-xs font-bold text-muted-foreground px-3">Service Desk Layout</span>

          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Service Cost Table</span>
            </button>
          </div>
        </div>

        {/* Main Content View */}
        {viewMode === "kanban" ? (
          <div className="flex-1 overflow-hidden min-h-[500px]">
            <RepairKanbanBoard
              repairs={repairItems}
              activeId={activeRepairId}
              onSelect={setActiveRepairId}
              onStatusChange={handleStatusChange}
            />
          </div>
        ) : (
          <RepairTable repairs={repairItems} onSelectRepair={(id) => setActiveRepairId(id)} />
        )}
      </div>
    </DashboardLayout>
  );
}
