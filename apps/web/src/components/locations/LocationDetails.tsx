"use client";

import React, { useState } from "react";
import { Server, Monitor, HardDrive, Shield, MapPin, Building, Thermometer, Zap, Layers, Activity } from "lucide-react";
import { RackVisualizer } from "./RackVisualizer";
import { AddAssetModal } from "@/components/assets/AddAssetModal";

interface LocationDetailsProps {
  location?: any;
}

export function LocationDetails({ location }: LocationDetailsProps) {
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);

  if (!location) {
    return (
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center text-muted-foreground space-y-3 h-full flex flex-col items-center justify-center">
        <MapPin className="w-10 h-10 text-muted-foreground/40 animate-bounce" />
        <div>
          <h3 className="text-sm font-bold text-foreground">No Location Selected</h3>
          <p className="text-xs text-muted-foreground mt-1">Select a site node or server rack from the left location tree.</p>
        </div>
      </div>
    );
  }

  const isServerRack = location.type === "RACK" || location.name?.toLowerCase().includes("rack") || location.type === "SERVER_ROOM";

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header Info */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
              {isServerRack ? <Server className="w-6 h-6" /> : <Building className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">{location.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono font-bold text-muted-foreground">{location.code || "LOC-NODE"}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {location.status || "Operational"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsAddAssetModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
          >
            + Assign Hardware to Location
          </button>
        </div>

        {/* Environmental Telemetry Bar */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/40">
          <div className="bg-muted/30 border border-border/40 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground">Ambient Temp</p>
              <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-0.5">21.8°C</p>
            </div>
            <Thermometer className="w-5 h-5 text-amber-500" />
          </div>

          <div className="bg-muted/30 border border-border/40 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground">Total Power Draw</p>
              <p className="text-sm font-black text-blue-500 mt-0.5">4.82 kW</p>
            </div>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>

          <div className="bg-muted/30 border border-border/40 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground">Relative Humidity</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">45.2%</p>
            </div>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* 42U Rack Visualizer if Rack Node Selected */}
      {isServerRack ? (
        <RackVisualizer rackName={location.name} />
      ) : (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-black uppercase text-muted-foreground">Location Node Assets & Racks</h3>
          <p className="text-xs text-muted-foreground">Select a specific 42U Server Rack node to inspect mounted equipment chassis and port connections.</p>
        </div>
      )}

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSuccess={() => setIsAddAssetModalOpen(false)}
      />
    </div>
  );
}
