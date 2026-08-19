"use client";

import React, { useState } from "react";
import { Server, MapPin, Building, Thermometer, Zap, Activity, Plus, Loader2 } from "lucide-react";
import { RackVisualizer } from "./RackVisualizer";
import { AddAssetModal } from "@/components/assets/AddAssetModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { racksApi, type RackRecord, type Location } from "@/lib/api";
import { cn } from "@/lib/utils";

interface LocationDetailsProps {
  location?: Location | null;
}

export function LocationDetails({ location }: LocationDetailsProps) {
  const queryClient = useQueryClient();
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [isNewRackModalOpen, setIsNewRackModalOpen] = useState(false);
  const [selectedRackId, setSelectedRackId] = useState<number | null>(null);

  // New Rack Form
  const [newRackName, setNewRackName] = useState("");
  const [newRackTotalU, setNewRackTotalU] = useState(42);
  const [newRackPowerWatts, setNewRackPowerWatts] = useState(5000);

  // Query racks inside this location
  const { data: racks = [], isLoading: isRacksLoading } = useQuery<RackRecord[]>({
    queryKey: ["racks", location?.id],
    queryFn: () => racksApi.getAll(location?.id ? Number(location.id) : undefined),
    enabled: !!location?.id,
  });

  const createRackMutation = useMutation({
    mutationFn: (payload: { location_id: number; name: string; total_u: number; max_power_watts: number }) =>
      racksApi.create(payload),
    onSuccess: (newRack) => {
      queryClient.invalidateQueries({ queryKey: ["racks", location?.id] });
      setSelectedRackId(newRack.id);
      setIsNewRackModalOpen(false);
      setNewRackName("");
    },
  });

  if (!location) {
    return (
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center text-muted-foreground space-y-3 h-full flex flex-col items-center justify-center">
        <MapPin className="w-10 h-10 text-muted-foreground/40 animate-bounce" />
        <div>
          <h3 className="text-sm font-bold text-foreground">No Location Selected</h3>
          <p className="text-xs text-muted-foreground mt-1">Select a site node or server room from the left location tree.</p>
        </div>
      </div>
    );
  }

  const effectiveRackId = selectedRackId || (racks.length > 0 ? racks[0].id : null);
  const selectedRack = racks.find((r: RackRecord) => r.id === effectiveRackId) || racks[0];

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header Info */}
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-foreground tracking-tight">{location.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-mono font-bold text-muted-foreground">{location.type || "FACILITY"}</span>
                <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {location.status || "Active Node"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewRackModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-card border border-border/60 hover:bg-accent text-xs font-bold text-foreground transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Add Rack Enclosure</span>
            </button>
            <button
              onClick={() => setIsAddAssetModalOpen(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              + Assign Asset
            </button>
          </div>
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
              <p className="text-[10px] font-bold text-muted-foreground">Location Power</p>
              <p className="text-sm font-black text-blue-500 mt-0.5">
                {racks.length > 0 ? `${(racks.reduce((acc: number, r: RackRecord) => acc + (r.total_power_draw_watts || 0), 0) / 1000).toFixed(2)} kW` : "0.00 kW"}
              </p>
            </div>
            <Zap className="w-5 h-5 text-blue-500" />
          </div>

          <div className="bg-muted/30 border border-border/40 p-3 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground">Rack Cabinets</p>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{racks.length} Enclosures</p>
            </div>
            <Activity className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Rack Selector Tabs if multiple racks exist */}
      {racks.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {racks.map((r: RackRecord) => (
            <button
              key={r.id}
              onClick={() => setSelectedRackId(r.id)}
              className={cn(
                "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer",
                selectedRack?.id === r.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card/60 border border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              <Server className="w-3.5 h-3.5" />
              <span>{r.name}</span>
              <span className="text-[10px] font-mono opacity-80">({r.occupied_u}/{r.total_u}U)</span>
            </button>
          ))}
        </div>
      )}

      {/* 42U Rack Visualizer */}
      {isRacksLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
          <p className="text-xs font-semibold">Loading rack layouts for {location.name}...</p>
        </div>
      ) : effectiveRackId ? (
        <RackVisualizer rackId={effectiveRackId} rackName={selectedRack?.name} />
      ) : (
        <div className="bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-3xl p-10 text-center space-y-3">
          <Server className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h3 className="text-sm font-bold text-foreground">No Server Racks in this Location</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Create a 42U rack cabinet enclosure to design vertical elevations, track electrical power draw, and map patch panel cabling.
          </p>
          <button
            onClick={() => setIsNewRackModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-sm hover:opacity-90 transition-all cursor-pointer"
          >
            + Create First Server Rack
          </button>
        </div>
      )}

      {/* Add Asset Modal */}
      <AddAssetModal
        isOpen={isAddAssetModalOpen}
        onClose={() => setIsAddAssetModalOpen(false)}
        onSuccess={() => setIsAddAssetModalOpen(false)}
      />

      {/* Create Rack Modal */}
      {isNewRackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-primary" />
                <h3 className="font-black text-sm text-foreground">Add Server Rack Enclosure</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewRackModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRackMutation.mutate({
                  location_id: Number(location.id),
                  name: newRackName || `Rack-${location.name}-01`,
                  total_u: Number(newRackTotalU),
                  max_power_watts: Number(newRackPowerWatts),
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Cabinet Name / Tag</label>
                <input
                  type="text"
                  placeholder="e.g. RACK-DC1-01"
                  value={newRackName}
                  onChange={(e) => setNewRackName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Total Height (U)</label>
                  <select
                    value={newRackTotalU}
                    onChange={(e) => setNewRackTotalU(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  >
                    <option value={42}>42U Standard Rack</option>
                    <option value={48}>48U Tall Rack</option>
                    <option value={24}>24U Half Rack</option>
                    <option value={12}>12U Wall Mount</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Max Power Draw (W)</label>
                  <input
                    type="number"
                    min="1000"
                    max="30000"
                    step="500"
                    value={newRackPowerWatts}
                    onChange={(e) => setNewRackPowerWatts(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewRackModalOpen(false)}
                  className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createRackMutation.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {createRackMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Cabinet</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
