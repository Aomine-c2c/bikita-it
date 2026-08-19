"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CameraFormModal } from "@/components/cameras/CameraFormModal";
import { CameraDetailsDrawer } from "@/components/cameras/CameraDetailsDrawer";
import { CameraTable } from "@/components/cameras/CameraTable";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Video, Plus, LayoutGrid, Table, Download, RefreshCw,
  ShieldCheck, AlertTriangle, Eye, Maximize2, Radio
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface Camera {
  id: number;
  name: string;
  ip_address: string;
  mac_address?: string;
  vendor?: string;
  model?: string;
  status: string;
  resolution?: string;
  fps?: number;
  location?: string;
}

const DEFAULT_SURVEILLANCE_CAMERAS: Camera[] = [
  {
    id: 101,
    name: "CAM-01 Main Gate & Weighbridge",
    ip_address: "192.168.20.11",
    vendor: "Hikvision",
    model: "DS-2CD2386G2-ISU",
    status: "Online",
    resolution: "4K (3840x2160)",
    fps: 30,
    location: "Main Gate Complex",
  },
  {
    id: 102,
    name: "CAM-02 Primary Ore Processing Plant",
    ip_address: "192.168.20.12",
    vendor: "Axis Communications",
    model: "P3245-LVE Dome",
    status: "Online",
    resolution: "1080p (60 FPS)",
    fps: 60,
    location: "Processing Floor A",
  },
  {
    id: 103,
    name: "CAM-03 Data Center Alpha Aisle 4",
    ip_address: "192.168.20.13",
    vendor: "Dahua Technology",
    model: "IPC-HFW5842E-Z4E",
    status: "Online",
    resolution: "4K AI Face & Temp",
    fps: 30,
    location: "Server Room DC1",
  },
  {
    id: 104,
    name: "CAM-04 Lithium Warehouse Loading Bay",
    ip_address: "192.168.20.14",
    vendor: "Hikvision",
    model: "DS-2CD2T87G2-L",
    status: "Online",
    resolution: "4K ColorVu",
    fps: 25,
    location: "Warehouse Bay 3",
  },
  {
    id: 105,
    name: "CAM-05 Heavy Equipment Workshop",
    ip_address: "192.168.20.15",
    vendor: "Bosch Security",
    model: "FLEXIDOME IP 5000i",
    status: "Online",
    resolution: "5MP (2592x1944)",
    fps: 30,
    location: "Maintenance Bay",
  },
  {
    id: 106,
    name: "CAM-06 Perimeter Fence North Line",
    ip_address: "192.168.20.16",
    vendor: "Hanwha Vision",
    model: "XNO-8080R Bullet",
    status: "Warning",
    resolution: "4K Thermal / Optical",
    fps: 20,
    location: "Perimeter Sector 01",
  },
];

export default function CamerasPage() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCamera, setActiveCamera] = useState<Camera | null>(null);
  const [viewMode, setViewMode] = useState<"matrix" | "table">("matrix");
  const [filterLocation, setFilterLocation] = useState("ALL");

  const refreshCameras = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Camera[]>("/cameras");
      if (Array.isArray(data) && data.length > 0) {
        setCameras(data);
      } else {
        setCameras(DEFAULT_SURVEILLANCE_CAMERAS);
      }
    } catch {
      setCameras(DEFAULT_SURVEILLANCE_CAMERAS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiFetch<Camera[]>("/cameras")
      .then((data) => {
        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          setCameras(data);
        } else {
          setCameras(DEFAULT_SURVEILLANCE_CAMERAS);
        }
      })
      .catch(() => {
        if (isMounted) setCameras(DEFAULT_SURVEILLANCE_CAMERAS);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const kpis = useMemo(() => {
    const total = cameras.length;
    const online = cameras.filter((c) => c.status === "Online").length;
    const warning = cameras.filter((c) => c.status !== "Online").length;
    const highFps = cameras.filter((c) => (c.fps || 30) >= 30).length;
    return [
      { label: "Configured Channels", value: loading ? "…" : total, icon: Video, color: "text-foreground", bg: "bg-primary/10" },
      { label: "Online Live Feeds", value: loading ? "…" : online, icon: ShieldCheck, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
      { label: "Alert / Degraded", value: loading ? "…" : warning, icon: AlertTriangle, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
      { label: "High-Bandwidth 60FPS", value: loading ? "…" : highFps, icon: Radio, color: "text-foreground", bg: "bg-primary/10" },
    ];
  }, [cameras, loading]);

  const filteredCameras = useMemo(() => {
    if (filterLocation === "ALL") return cameras;
    return cameras.filter((c) => (c.location || "").toLowerCase().includes(filterLocation.toLowerCase()));
  }, [cameras, filterLocation]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-375 mx-auto font-sans">
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Surveillance Operations Center (SOC)
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                NVR RTSP Matrix
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Live CCTV Video Streams, PTZ D-Pad Telemetry, Motion Alerts & Facility Enclosure Feeds
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refreshCameras}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span>Refresh Streams</span>
            </button>

            <button
              onClick={() => exportToCSV("nvr_camera_audit.csv", cameras)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export Audit</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Camera Stream</span>
            </button>
          </div>
        </div>

        {/* Top Telemetry KPIs */}
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

        {/* Layout Mode & Location Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 backdrop-blur-xl border border-border/50 p-2.5 rounded-2xl">
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-bold text-muted-foreground">Location Filter:</span>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="px-3 py-1 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Facility Sectors</option>
              <option value="Gate">Main Gate & Weighbridge</option>
              <option value="Processing">Processing Plant</option>
              <option value="Server Room">Server Room / DC1</option>
              <option value="Warehouse">Warehouse & Loading</option>
              <option value="Perimeter">Perimeter Fence</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-xs self-end sm:self-auto">
            <button
              onClick={() => setViewMode("matrix")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "matrix"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>SOC Video Matrix</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Channel Directory</span>
            </button>
          </div>
        </div>

        {/* Video Matrix Grid */}
        {viewMode === "matrix" ? (
          loading ? (
          <div className="h-64 grid place-items-center">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground">Connecting to IP Camera Subsystem...</p>
            </div>
          </div>
        ) : filteredCameras.length === 0 ? (
          <div className="bg-card border border-dashed border-border/80 rounded-3xl p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-muted grid place-items-center mx-auto text-muted-foreground mb-3">
              <Video className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-foreground">No Camera Feeds Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No matching surveillance devices found in this location category. Add a new IP stream or sync with network controller.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCameras.map((cam) => (
              <motion.div
                key={cam.id}
                onClick={() => setActiveCamera(cam)}
                whileHover={{ y: -3 }}
                className="bg-card/60 backdrop-blur-xl border border-border/60 rounded-3xl overflow-hidden shadow-sm hover:border-primary/50 transition-all cursor-pointer group flex flex-col"
              >
                {/* Simulated CCTV Stream Canvas Viewport */}
                <div className="relative aspect-video bg-neutral-950 flex flex-col justify-between p-3.5 overflow-hidden">
                  {/* Subtle Scan Lines Effect */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-size-[100%_4px] pointer-events-none opacity-40" />

                  {/* Top HUD: Status & Timecode */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 border border-white/10 backdrop-blur-md text-[10px] font-black text-white flex items-center gap-1.5 font-mono">
                        <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", cam.status === "Online" ? "bg-red-500" : "bg-amber-500")} />
                        REC • {cam.status === "Online" ? "LIVE" : "WARN"}
                      </span>
                      <span className="text-[10px] font-mono text-white/80 bg-black/70 border border-white/10 px-2 py-0.5 rounded-md">
                        {cam.resolution || "1080p"}
                      </span>
                    </div>

                    <span className="text-[10px] font-mono text-white/70 bg-black/70 border border-white/10 px-2 py-0.5 rounded-md">
                      {cam.ip_address}
                    </span>
                  </div>

                  {/* Center Watermark Indicator */}
                  <div className="z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="p-3 rounded-2xl bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center gap-2 text-xs font-bold">
                      <Eye className="w-4 h-4" />
                      <span>Inspect Channel</span>
                    </div>
                  </div>

                  {/* Bottom HUD: Channel Label & FPS */}
                  <div className="z-10 flex items-center justify-between bg-linear-to-t from-black/80 via-black/40 to-transparent -mx-3.5 -mb-3.5 p-3.5 pt-6">
                    <div>
                      <p className="text-xs font-black text-white tracking-tight group-hover:text-primary-foreground transition-colors">
                        {cam.name}
                      </p>
                      <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                        {cam.location || "Facility Location"}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-black bg-black/80 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      {cam.fps || 30} FPS
                    </span>
                  </div>
                </div>

                {/* Footer Telemetry */}
                <div className="p-3.5 border-t border-border/40 flex items-center justify-between text-xs bg-muted/20">
                  <span className="text-[11px] font-medium text-muted-foreground font-mono">
                    {cam.vendor || "Hikvision"} • {cam.model || "IP Dome"}
                  </span>
                  <div className="flex items-center gap-1.5 text-primary text-[11px] font-bold group-hover:translate-x-0.5 transition-transform">
                    <span>Inspect</span>
                    <Maximize2 className="w-3 h-3" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )) : (
          <CameraTable cameras={filteredCameras} onSelectCamera={(cam) => setActiveCamera(cam)} />
        )}
      </div>
    </DashboardLayout>
  );
}
