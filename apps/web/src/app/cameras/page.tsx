"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CameraFormModal } from "@/components/cameras/CameraFormModal";
import { CameraDetailsDrawer } from "@/components/cameras/CameraDetailsDrawer";
import { CameraTable } from "@/components/cameras/CameraTable";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/utils";
import { motion } from "framer-motion";
import { Video, Plus, HardDrive, LayoutGrid, Table, Download, RefreshCw, ShieldCheck, Activity, AlertTriangle } from "lucide-react";

interface Camera {
  id: number;
  name: string;
  ip_address: string;
  mac_address?: string;
  vendor?: string;
  model?: string;
  status: string;
  resolution?: string;
}

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);
  const [viewMode, setViewMode] = useState<"matrix" | "table">("matrix");

  const refreshCameras = useCallback(async () => {
    try {
      const data = await apiFetch<Camera[]>("/cameras");
      setCameras(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initFetch = async () => {
      try {
        const data = await apiFetch<Camera[]>("/cameras");
        if (mounted) setCameras(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initFetch();
    return () => {
      mounted = false;
    };
  }, []);

  const kpis = [
    { label: "Configured Cameras", value: loading ? "…" : cameras.length, icon: Video, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Online Streams", value: loading ? "…" : cameras.filter(c => c.status === "Online").length, icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Offline Cameras", value: loading ? "…" : cameras.filter(c => c.status !== "Online").length, icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Total SKUs", value: loading ? "…" : cameras.length, icon: Activity, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Drawers & Modals */}
        <CameraDetailsDrawer
          isOpen={!!activeCamera}
          onClose={() => setActiveCamera(null)}
          camera={activeCamera}
          onRefresh={refreshCameras}
        />

        <CameraFormModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            refreshCameras();
          }}
        />

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Video className="w-5 h-5" />
              </div>
              Surveillance Operations Center
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Live NVR RTSP Video Streams, PTZ D-Pad Controls & Storage Telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refreshCameras()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => exportToCSV("nvr_camera_audit.csv", cameras)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export Audit Report</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Camera Stream</span>
            </button>
          </div>
        </div>

        {/* Camera Telemetry Bar */}
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

        {/* Layout Mode Switcher */}
        <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/50 p-2 rounded-2xl">
          <span className="text-xs font-bold text-muted-foreground px-3">Video Wall Layout</span>

          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("matrix")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "matrix"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>SOC Video Matrix</span>
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
              <span>Camera Directory</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        {viewMode === "matrix" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cameras.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20 border border-dashed border-border/50 rounded-3xl text-center gap-3">
                <Video className="w-10 h-10 text-muted-foreground/30" />
                <p className="text-sm font-semibold text-muted-foreground">No cameras configured</p>
                <p className="text-xs text-muted-foreground/60">Add a camera stream using the button above.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add First Camera
                </button>
              </div>
            ) : cameras.map((cam) => (
              <motion.div
                key={cam.id}
                onClick={() => setActiveCamera(cam)}
                whileHover={{ y: -3 }}
                className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:border-emerald-500/40 transition-all cursor-pointer group"
              >
                {/* Simulated Stream Feed Header */}
                <div className="relative aspect-video bg-black flex flex-col justify-between p-3.5">
                  <div className="flex items-center justify-between z-10">
                    <span className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[10px] font-extrabold text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE
                    </span>
                    <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-0.5 rounded">
                      {cam.ip_address || "192.168.1.100"}
                    </span>
                  </div>

                  <div className="z-10 flex items-center justify-between">
                    <span className="text-xs font-black text-white group-hover:text-emerald-400 transition-colors">
                      {cam.name}
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 font-bold bg-black/60 px-1.5 py-0.5 rounded">
                      30 FPS
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <CameraTable cameras={cameras} onSelectCamera={(cam) => setActiveCamera(cam)} />
        )}
      </div>
    </DashboardLayout>
  );
}
