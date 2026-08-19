"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  racksApi,
  type ElevationData,
  type SlotOccupation,
  type UnmountedHardware,
} from "@/lib/api";
import {
  Server, Zap, Thermometer,
  Layers, Plus, Trash2, Loader2, Cable, AlertTriangle, ArrowUpDown,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PortMatrixVisualizer } from "./PortMatrixVisualizer";

interface RackVisualizerProps {
  rackId?: number;
  rackName?: string;
  locationId?: number;
}

export function RackVisualizer({
  rackId = 1,
  rackName = "Primary Server Cabinet",
}: RackVisualizerProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"ELEVATION" | "PORTS">("ELEVATION");
  const [orientation, setOrientation] = useState<"FRONT" | "REAR">("FRONT");
  const [isMountModalOpen, setIsMountModalOpen] = useState(false);
  const [selectedHardware, setSelectedHardware] = useState<UnmountedHardware | null>(null);

  // Mount form state
  const [mountName, setMountName] = useState("");
  const [mountSlot, setMountSlot] = useState<number>(38);
  const [mountHeight, setMountHeight] = useState<number>(2);
  const [mountWatts, setMountWatts] = useState<number>(350);
  const [mountNotes, setMountNotes] = useState("");
  const [mountError, setMountError] = useState<string | null>(null);

  // Fetch real elevation data from API
  const {
    data: elevationData,
    isLoading,
    isError,
    refetch: _refetch,
  } = useQuery<ElevationData>({
    queryKey: ["rack-elevation", rackId],
    queryFn: () => racksApi.getElevation(rackId),
    enabled: !!rackId,
  });

  // Mount Hardware Mutation
  const mountMutation = useMutation({
    mutationFn: (payload: {
      name: string;
      start_u: number;
      u_height: number;
      orientation: string;
      power_draw_watts: number;
      asset_id?: number;
      device_id?: number;
      notes?: string;
    }) => racksApi.mount(rackId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rack-elevation", rackId] });
      queryClient.invalidateQueries({ queryKey: ["racks"] });
      setIsMountModalOpen(false);
      setSelectedHardware(null);
      setMountError(null);
    },
    onError: (err: Error) => {
      setMountError(err.message || "Failed to mount equipment.");
    },
  });

  // Unmount Hardware Mutation
  const unmountMutation = useMutation({
    mutationFn: (mountId: number) => racksApi.unmount(rackId, mountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rack-elevation", rackId] });
      queryClient.invalidateQueries({ queryKey: ["racks"] });
    },
  });

  const handleOpenMountModal = (hardware?: UnmountedHardware, slot?: number) => {
    setMountError(null);
    if (hardware) {
      setSelectedHardware(hardware);
      setMountName(hardware.name);
      setMountHeight(hardware.suggested_u || 1);
      setMountWatts(hardware.suggested_watts || 150);
    } else {
      setSelectedHardware(null);
      setMountName("");
      setMountHeight(1);
      setMountWatts(150);
    }

    if (slot) {
      setMountSlot(slot);
    } else {
      setMountSlot(1);
    }

    setIsMountModalOpen(true);
  };

  const handleMountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMountError(null);

    mountMutation.mutate({
      name: mountName,
      start_u: Number(mountSlot),
      u_height: Number(mountHeight),
      orientation: orientation,
      power_draw_watts: Number(mountWatts),
      asset_id: selectedHardware?.type === "ASSET" ? selectedHardware.id : undefined,
      device_id: selectedHardware?.type === "DEVICE" ? selectedHardware.id : undefined,
      notes: mountNotes,
    });
  };

  if (isLoading) {
    return (
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-16 flex flex-col items-center justify-center text-muted-foreground shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
        <p className="text-xs font-semibold">Loading rack chassis & power telemetry...</p>
      </div>
    );
  }

  if (isError || !elevationData) {
    return (
      <div className="bg-card/40 backdrop-blur-xl border border-destructive/30 rounded-3xl p-8 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
        <h3 className="text-sm font-bold text-foreground">Cabinet Telemetry Unavailable</h3>
        <p className="text-xs text-muted-foreground">Unable to fetch rack elevation data for cabinet ID #{rackId}.</p>
        <button
          onClick={() => _refetch()}
          className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-all cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { rack, slots, unmounted_hardware } = elevationData;

  const totalWatts = rack.total_power_draw_watts;
  const maxWatts = rack.max_power_watts;
  const powerPct = rack.power_utilization_pct;
  const spacePct = rack.u_utilization_pct;

  const isPowerCritical = powerPct >= 95;
  const isPowerWarning = powerPct >= 80 && !isPowerCritical;

  return (
    <div className="space-y-6">
      {/* View Switcher & Cabinet Header */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-foreground tracking-tight">{rack.name || rackName}</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {rack.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {rack.location_name} • {rack.total_u}U Standard 19&quot; Frame • Capacity: {maxWatts}W Circuit
              </p>
            </div>
          </div>

          {/* Tab & Orientation Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-muted/40 p-1 rounded-xl border border-border/50">
              <button
                type="button"
                onClick={() => setActiveTab("ELEVATION")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === "ELEVATION"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>42U Elevation</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("PORTS")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  activeTab === "PORTS"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Cable className="w-3.5 h-3.5" />
                <span>Port Matrix</span>
              </button>
            </div>

            {activeTab === "ELEVATION" && (
              <button
                type="button"
                onClick={() => setOrientation(prev => (prev === "FRONT" ? "REAR" : "FRONT"))}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border/60 bg-background hover:bg-accent text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-xs cursor-pointer"
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                <span>{orientation === "FRONT" ? "Front View" : "Rear View"}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleOpenMountModal()}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Mount Hardware</span>
            </button>
          </div>
        </div>

        {/* Live Power & Space Capacity Telemetry */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/40 text-xs">
          {/* Electrical Load Meter */}
          <div className="bg-muted/30 border border-border/40 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Circuit Power Load</span>
              </span>
              <span
                className={cn(
                  "font-black font-mono",
                  isPowerCritical ? "text-destructive" : isPowerWarning ? "text-amber-500" : "text-foreground"
                )}
              >
                {(totalWatts / 1000).toFixed(2)} kW / {(maxWatts / 1000).toFixed(1)} kW
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-background border border-border/40 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isPowerCritical ? "bg-destructive" : isPowerWarning ? "bg-amber-500" : "bg-primary"
                )}
                style={{ width: `${Math.min(powerPct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Utilization: {powerPct}%</span>
              {isPowerCritical && <span className="font-bold text-destructive">OVERLOAD RISK</span>}
              {isPowerWarning && <span className="font-bold text-amber-500">HIGH LOAD</span>}
            </div>
          </div>

          {/* U-Slot Space Utilization */}
          <div className="bg-muted/30 border border-border/40 p-4 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-muted-foreground flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-500" />
                <span>Vertical U Capacity</span>
              </span>
              <span className="font-black font-mono text-foreground">
                {rack.occupied_u}U / {rack.total_u}U Used
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-background border border-border/40 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(spacePct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{rack.total_u - rack.occupied_u}U Slots Available</span>
              <span className="font-mono">{spacePct}% Density</span>
            </div>
          </div>

          {/* Thermal & Telemetry Status */}
          <div className="bg-muted/30 border border-border/40 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Thermal Environment</p>
              <p className="text-base font-black text-emerald-500 mt-0.5">22.4°C / 44% RH</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Intake delta: +1.2°C</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <Thermometer className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Elevation or Ports */}
      {activeTab === "PORTS" ? (
        <PortMatrixVisualizer rackId={rack.id} rackName={rack.name} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 42U Vertical Rack Elevation Column */}
          <div className="lg:col-span-8 bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <h4 className="text-xs font-black uppercase text-foreground">
                Cabinet Frame Elevation ({orientation} Face)
              </h4>
              <span className="text-[11px] font-mono text-muted-foreground">
                Standard 19-inch Rails • EIA-310-E Compliant
              </span>
            </div>

            {/* 42U Rack Frame Canvas */}
            <div className="bg-neutral-950 p-4 sm:p-6 rounded-2xl border-4 border-neutral-800 shadow-2xl relative overflow-hidden">
              <div className="space-y-1">
                {slots.map((slotObj: SlotOccupation) => {
                  const u = slotObj.u_slot;
                  const mount = slotObj.mount;
                  const isTopSlotOfMount = mount && mount.start_u + mount.u_height - 1 === u;

                  // If this is a multi-U equipment and not the top slot, we skip rendering header
                  if (mount && !isTopSlotOfMount) {
                    return null;
                  }

                  if (mount && isTopSlotOfMount) {
                    const uHeight = mount.u_height;
                    const heightPx = Math.max(uHeight * 36, 36);

                    return (
                      <div
                        key={u}
                        className="relative group rounded-xl border border-neutral-700 bg-neutral-900 p-2.5 flex items-center justify-between shadow-md transition-all hover:border-primary/80"
                        style={{ minHeight: `${heightPx}px` }}
                      >
                        {/* Left Rail U Number */}
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-black text-neutral-400 w-6">
                            U{mount.start_u}
                            {uHeight > 1 && `-${u}`}
                          </span>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          <div>
                            <p className="text-xs font-black text-neutral-100 flex items-center gap-1.5">
                              <span>{mount.name}</span>
                              {mount.asset_tag && (
                                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400">
                                  {mount.asset_tag}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                              {uHeight}U Chassis • {mount.power_draw_watts}W Draw • {mount.orientation}
                            </p>
                          </div>
                        </div>

                        {/* Right Quick Controls */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => unmountMutation.mutate(mount.id)}
                            className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Unmount from Cabinet"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  }

                  // Empty U-Slot
                  return (
                    <div
                      key={u}
                      onClick={() => handleOpenMountModal(undefined, u)}
                      className="group h-8 rounded-lg border border-dashed border-neutral-800 hover:border-primary/60 hover:bg-primary/5 transition-all flex items-center justify-between px-3 cursor-pointer"
                    >
                      <span className="font-mono text-[10px] font-bold text-neutral-600 group-hover:text-primary">
                        U{u}
                      </span>
                      <span className="text-[10px] font-semibold text-neutral-700 group-hover:text-primary/80 opacity-0 group-hover:opacity-100 transition-opacity">
                        + Mount Device at U{u}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Staging & Unmounted Hardware Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                <h4 className="text-xs font-black uppercase text-foreground">
                  Unmounted Hardware Pool ({unmounted_hardware.length})
                </h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Click any available hardware asset or network device to mount it into an open U-slot.
              </p>

              {unmounted_hardware.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-2xl">
                  All active assets are currently assigned or mounted.
                </div>
              ) : (
                <div className="space-y-2 max-h-130 overflow-y-auto pr-1">
                  {unmounted_hardware.map((hw: UnmountedHardware) => (
                    <div
                      key={`${hw.type}-${hw.id}`}
                      onClick={() => handleOpenMountModal(hw)}
                      className="p-3 rounded-2xl bg-card border border-border/60 hover:border-primary/80 hover:bg-accent/40 transition-all cursor-pointer shadow-xs group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                            {hw.name}
                          </p>
                          <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                            {hw.asset_tag} • {hw.suggested_u}U Chassis • ~{hw.suggested_watts}W
                          </p>
                        </div>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-muted border border-border/60 text-muted-foreground">
                          {hw.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mount Equipment Modal */}
      {isMountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <h3 className="font-black text-sm text-foreground">Mount Hardware Chassis</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMountModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {mountError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs font-semibold text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{mountError}</span>
              </div>
            )}

            <form onSubmit={handleMountSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Equipment Name</label>
                <input
                  type="text"
                  value={mountName}
                  onChange={(e) => setMountName(e.target.value)}
                  placeholder="e.g. Dell PowerEdge R750 Database Host"
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Start U-Slot (Bottom U)</label>
                  <input
                    type="number"
                    min="1"
                    max={rack.total_u}
                    value={mountSlot}
                    onChange={(e) => setMountSlot(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Chassis Height (U)</label>
                  <select
                    value={mountHeight}
                    onChange={(e) => setMountHeight(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  >
                    <option value={1}>1U (Switch, Patch Panel, 1U Server)</option>
                    <option value={2}>2U (Standard 2U Server / SAN)</option>
                    <option value={3}>3U (UPS Battery Pack, Heavy Server)</option>
                    <option value={4}>4U (Blade Enclosure / Storage)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Power Draw (Watts)</label>
                  <input
                    type="number"
                    min="10"
                    max="3000"
                    value={mountWatts}
                    onChange={(e) => setMountWatts(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Faceplate Orientation</label>
                  <select
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value as "FRONT" | "REAR")}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  >
                    <option value="FRONT">Front Faceplate</option>
                    <option value="REAR">Rear Faceplate</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Mount Notes / Patch Info</label>
                <input
                  type="text"
                  placeholder="e.g. Primary production app server"
                  value={mountNotes}
                  onChange={(e) => setMountNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMountModalOpen(false)}
                  className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mountMutation.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {mountMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Confirm Mount</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
