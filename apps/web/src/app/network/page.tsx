"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { NetworkHealth } from "@/components/network/NetworkHealth";
import { NetworkAlerts } from "@/components/network/NetworkAlerts";
import { DiscoveryStagingTable } from "@/components/network/DiscoveryStagingTable";
import { NetworkScannerModal } from "@/components/network/NetworkScannerModal";
import { NetworkTable } from "@/components/network/NetworkTable";
import { motion } from "framer-motion";
import { Radar, RefreshCw, Table, LayoutGrid, FileSpreadsheet, Printer, Activity } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { networkApi, NetworkDevice } from "@/lib/api";
import { exportNetworkDevicesExcel, printNetworkDevicesSheet } from "@/lib/excelExport";

const NetworkTopology = dynamic(
  () => import("@/components/network/NetworkTopology").then((m) => m.NetworkTopology),
  { ssr: false, loading: () => <div className="h-100 animate-pulse bg-muted rounded-xl" /> }
);
const SwitchDetails = dynamic(
  () => import("@/components/network/SwitchDetails").then((m) => m.SwitchDetails),
  { ssr: false, loading: () => <div className="h-75 animate-pulse bg-muted rounded-xl" /> }
);

export default function NetworkOperationsPage() {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"topology" | "table">("topology");
  const [isPolling, setIsPolling] = useState(false);
  const [pollToast, setPollToast] = useState<string | null>(null);

  // Query Network Devices
  const { data: devices = [], refetch } = useQuery<NetworkDevice[]>({
    queryKey: ["network-devices"],
    queryFn: async () => {
      return await networkApi.getAll();
    },
  });

  const handlePollHealthNow = async () => {
    setIsPolling(true);
    setPollToast(null);
    try {
      const res = await networkApi.pollNow();
      setPollToast(res?.message || "Health poll completed.");
      await refetch();
      setTimeout(() => setPollToast(null), 4000);
    } catch (err: unknown) {
      setPollToast(`Polling error: ${(err as Error)?.message}`);
    } finally {
      setIsPolling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-375 mx-auto">
        {/* Subnet Scanner Modal */}
        <NetworkScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onSuccess={() => {
            refetch();
          }}
        />

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Network Operations Center</h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Real-Time Infrastructure Topology, Subnet Discovery & Switch Port Telemetry
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {pollToast && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-fade-in">
                {pollToast}
              </span>
            )}

            <button
              onClick={() => exportNetworkDevicesExcel(devices)}
              title="Export network device roster to Excel spreadsheet"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Excel Export</span>
            </button>

            <button
              onClick={() => printNetworkDevicesSheet(devices)}
              title="Generate printable network infrastructure copy"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={handlePollHealthNow}
              disabled={isPolling}
              title="Trigger active ping/health poll across all managed devices"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 text-emerald-500 ${isPolling ? "animate-pulse" : ""}`} />
              <span>{isPolling ? "Polling..." : "Poll Health Now"}</span>
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Telemetry</span>
            </button>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Radar className="w-4 h-4" />
              <span>Run Subnet Discovery</span>
            </button>
          </div>
        </div>

        {/* Top NOC KPI Row */}
        <NetworkHealth />

        {/* View Switcher Header */}
        <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/50 p-2 rounded-2xl">
          <span className="text-xs font-bold text-muted-foreground px-3">Infrastructure Layout</span>

          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("topology")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "topology"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Canvas Topology</span>
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
              <span>Device Table</span>
            </button>
          </div>
        </div>

        {/* Main Content View */}
        {viewMode === "topology" ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left / Center: Interactive Canvas Topology Map */}
            <motion.div
              className="xl:col-span-2 space-y-6"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <NetworkTopology />
            </motion.div>

            {/* Right Panel: Switch Port Inspector & Alerts */}
            <motion.div
              className="xl:col-span-1 space-y-6 flex flex-col h-full"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex-1 min-h-120">
                <SwitchDetails />
              </div>
              <div className="shrink-0 h-70">
                <NetworkAlerts />
              </div>
            </motion.div>
          </div>
        ) : (
          <NetworkTable devices={devices} />
        )}

        {/* Discovery Staging Queue */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <DiscoveryStagingTable />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
