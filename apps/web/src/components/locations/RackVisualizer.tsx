"use client";

import React, { useState } from "react";
import { Server, Zap, Thermometer, ShieldCheck, Activity, Cpu, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

interface RackVisualizerProps {
  rackName?: string;
  totalU?: number;
  locationId?: number;
  onMountDevice?: (slotU: number) => void;
}

export function RackVisualizer({ rackName = "RACK-DC1-04", totalU = 42, locationId = 1, onMountDevice }: RackVisualizerProps) {
  const [selectedU, setSelectedU] = useState<number>(38);

  const [mountedEquipment, setMountedEquipment] = useState<Record<number, any>>({});

  React.useEffect(() => {
    const fetchEquipment = async () => {
      try {
        const { apiFetch } = await import('@/lib/api');
        const assignments = await apiFetch(`/locations/${locationId}/rack-map`) as any[];
        const equipmentMap: Record<number, any> = {};
        
        assignments.forEach((assignment: any) => {
          const dev = assignment.device;
          equipmentMap[assignment.u_slot] = {
            name: dev?.name || dev?.hostname || dev?.mac_address || "Unknown Device",
            sizeU: assignment.u_size,
            type: dev?.device_type?.toUpperCase() || 'SERVER',
            status: dev?.status || 'online',
            powerW: 300 // Static until we track power on the device model
          };
        });
        
        setMountedEquipment(equipmentMap);
      } catch (error) {
        console.error("Failed to fetch rack equipment", error);
      }
    };
    
    fetchEquipment();
  }, [locationId]);

  // Build U slot array 42 down to 1
  const uSlots = Array.from({ length: totalU }, (_, i) => totalU - i);

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm space-y-5">
      {/* Rack Telemetry Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">{rackName}</h3>
            <p className="text-[10px] font-mono text-muted-foreground">42U Enclosure • Data Center Alpha (Aisle 3)</p>
          </div>
        </div>

        {/* Environmental Badges */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 text-xs font-bold font-mono">
            <Thermometer className="w-3.5 h-3.5" />
            <span>21.4°C</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs font-bold font-mono">
            <Zap className="w-3.5 h-3.5" />
            <span>3.31 kW</span>
          </div>
        </div>
      </div>

      {/* 42U Vertical Chassis Display */}
      <div data-tour="rack-map" className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: 42U Slot Column */}
        <div className="md:col-span-2 space-y-1 bg-background/80 border border-border/60 p-3 rounded-2xl shadow-inner max-h-[520px] overflow-y-auto">
          {uSlots.map((u) => {
            const equipment = mountedEquipment[u];
            const isSelected = selectedU === u;

            if (equipment) {
              return (
                <button
                  key={u}
                  onClick={() => setSelectedU(u)}
                  className={cn(
                    "w-full h-10 rounded-xl border flex items-center justify-between px-3 text-xs transition-all cursor-pointer relative overflow-hidden",
                    isSelected ? "ring-2 ring-primary border-primary bg-primary/15 shadow-sm" : "border-border/60 bg-card hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2 font-mono font-bold text-muted-foreground text-[10px]">
                    <span className="w-6 text-right">U{u}</span>
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full",
                        equipment.status === "online" && "bg-emerald-500 animate-pulse",
                        equipment.status === "warning" && "bg-amber-500 animate-ping"
                      )}
                    />
                  </div>

                  <div className="flex-1 px-3 text-left">
                    <p className="font-bold text-foreground truncate">{equipment.name}</p>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                    {equipment.sizeU}U • {equipment.type}
                  </span>
                </button>
              );
            }

            return (
              <button
                key={u}
                onClick={() => setSelectedU(u)}
                className={cn(
                  "w-full h-7 rounded-lg border border-dashed flex items-center justify-between px-3 text-[10px] transition-all cursor-pointer",
                  isSelected ? "border-primary bg-primary/5 text-primary" : "border-border/30 hover:border-border/60 text-muted-foreground/60"
                )}
              >
                <span className="font-mono">U{u}</span>
                <span>Unassigned Slot</span>
              </button>
            );
          })}
        </div>

        {/* Right: Slot Details Inspector */}
        <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase text-muted-foreground">Slot U{selectedU} Inspection</h4>

            {mountedEquipment[selectedU] ? (
              <div className="space-y-3">
                <div className="p-3 bg-card border border-border/50 rounded-xl space-y-1">
                  <p className="text-xs font-bold text-foreground">{mountedEquipment[selectedU].name}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">Type: {mountedEquipment[selectedU].type}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-card p-2.5 rounded-xl border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Power Consumption</span>
                    <span className="font-mono font-bold text-foreground">{mountedEquipment[selectedU].powerW} Watts</span>
                  </div>
                  <div className="bg-card p-2.5 rounded-xl border border-border/40">
                    <span className="text-[10px] text-muted-foreground block">Form Factor</span>
                    <span className="font-mono font-bold text-foreground">{mountedEquipment[selectedU].sizeU} Rack Units</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-muted-foreground bg-card border border-border/40 rounded-xl">
                Slot U{selectedU} is empty. Ready for hardware mounting.
              </div>
            )}
          </div>

          <button
            onClick={() => onMountDevice ? onMountDevice(selectedU) : alert(`Mount hardware dialog triggered for Slot U${selectedU}`)}
            className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
          >
            + Mount Hardware to Slot U{selectedU}
          </button>
        </div>
      </div>
    </div>
  );
}
