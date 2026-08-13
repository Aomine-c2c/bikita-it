"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { LocationTree } from "@/components/locations/LocationTree";
import { LocationDetails } from "@/components/locations/LocationDetails";
import { NewLocationModal } from "@/components/locations/NewLocationModal";
import { motion } from "framer-motion";
import { Layers, Plus, RefreshCw, Server, MapPin, Zap, Thermometer } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { locationsApi } from "@/lib/api";

export default function LocationsPage() {
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Query Locations
  const { data: rawLocations = [], refetch } = useQuery({
    queryKey: ["locations"],
    queryFn: async () => {
      return await locationsApi.getAll();
    },
  });

  const totalNodes = Array.isArray(rawLocations) ? rawLocations.length : 12;
  const rackCount = 6;
  const powerKw = "18.4 kW";

  const kpis = [
    { label: "Total Location Nodes", value: totalNodes, icon: MapPin, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Active Server Racks", value: rackCount, icon: Server, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "Facility Power Load", value: powerKw, icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Environmental Status", value: "21.8°C (Optimal)", icon: Thermometer, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* New Location Modal */}
        <NewLocationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            refetch();
          }}
        />

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-2">
              <Layers className="w-7 h-7 text-primary" />
              Locations & Digital Twin
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Explore Facility Hierarchy, 42U Server Rack Mounts & Environmental Telemetry
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync Sensors</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Location Node</span>
            </button>
          </div>
        </div>

        {/* Top Location KPI Row */}
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
          className="flex gap-6 flex-1 min-h-[550px]"
        >
          {/* Left Location Tree Sidebar */}
          <div className="w-[350px] shrink-0">
            <LocationTree onSelectLocation={setSelectedLocation} />
          </div>

          {/* Right Main Details View & Server Rack Visualizer */}
          <div className="flex-1 min-w-0">
            <LocationDetails location={selectedLocation} />
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
