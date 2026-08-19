"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { racksApi, type PortRecord, type PatchPanelRecord, type CableLinkRecord } from "@/lib/api";
import {
  Cable, Plus, Trash2,
  FileSpreadsheet, Loader2, CheckCircle2, Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PortMatrixVisualizerProps {
  rackId: number;
  rackName: string;
}

const CABLE_COLORS: Record<string, { label: string; bg: string; text: string; hex: string }> = {
  BLUE: { label: "Blue (LAN)", bg: "bg-blue-500", text: "text-blue-500", hex: "#3b82f6" },
  YELLOW: { label: "Yellow (SM Fiber)", bg: "bg-yellow-500", text: "text-yellow-500", hex: "#eab308" },
  ORANGE: { label: "Orange (MM OM2)", bg: "bg-orange-500", text: "text-orange-500", hex: "#f97316" },
  AQUA: { label: "Aqua (MM OM4)", bg: "bg-cyan-400", text: "text-cyan-400", hex: "#22d3ee" },
  PURPLE: { label: "Purple (iDRAC/Mgmt)", bg: "bg-purple-500", text: "text-purple-500", hex: "#a855f7" },
  BLACK: { label: "Black (DAC / Trunk)", bg: "bg-neutral-800", text: "text-neutral-400", hex: "#262626" },
  RED: { label: "Red (CCTV / Sec)", bg: "bg-red-500", text: "text-red-500", hex: "#ef4444" },
};

export function PortMatrixVisualizer({ rackId, rackName }: PortMatrixVisualizerProps) {
  const queryClient = useQueryClient();
  const [selectedPort, setSelectedPort] = useState<PortRecord | null>(null);
  const [isPatchModalOpen, setIsPatchModalOpen] = useState(false);
  const [isNewPanelModalOpen, setIsNewPanelModalOpen] = useState(false);

  // New Link Config
  const [targetPortId, setTargetPortId] = useState<number | null>(null);
  const [cableType, setCableType] = useState("COPPER");
  const [cableColor, setCableColor] = useState("BLUE");
  const [cableLength, setCableLength] = useState(2.0);

  // New Panel Config
  const [newPanelName, setNewPanelName] = useState("");
  const [newPanelSlot, setNewPanelSlot] = useState(42);
  const [newPanelPorts, setNewPanelPorts] = useState(24);
  const [newPanelCategory, setNewPanelCategory] = useState("Cat6A");

  // Fetch Ports & Cabling for this rack
  const { data, isLoading } = useQuery<{ patch_panels: PatchPanelRecord[]; cables: CableLinkRecord[] }>({
    queryKey: ["rack-ports", rackId],
    queryFn: () => racksApi.getPorts(rackId),
    enabled: !!rackId,
  });

  // Link mutation
  const linkMutation = useMutation({
    mutationFn: (payload: { source_port_id: number; target_port_id: number; cable_type: string; color: string; length_meters: number }) =>
      racksApi.linkCable(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rack-ports", rackId] });
      setSelectedPort(null);
      setTargetPortId(null);
      setIsPatchModalOpen(false);
    },
  });

  // Unlink mutation
  const unlinkMutation = useMutation({
    mutationFn: (cableId: number) => racksApi.unlinkCable(cableId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rack-ports", rackId] });
    },
  });

  // Create Panel mutation
  const createPanelMutation = useMutation({
    mutationFn: (payload: { name: string; start_u: number; total_ports: number; category: string }) =>
      racksApi.createPatchPanel(rackId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rack-ports", rackId] });
      setIsNewPanelModalOpen(false);
      setNewPanelName("");
    },
  });

  const handlePortClick = (port: PortRecord) => {
    if (!selectedPort) {
      setSelectedPort(port);
      setIsPatchModalOpen(true);
    } else if (selectedPort.id === port.id) {
      setSelectedPort(null);
      setIsPatchModalOpen(false);
    } else {
      setTargetPortId(port.id);
      setIsPatchModalOpen(true);
    }
  };

  const handleConnectCables = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPort || !targetPortId) return;

    linkMutation.mutate({
      source_port_id: selectedPort.id,
      target_port_id: targetPortId,
      cable_type: cableType,
      color: cableColor,
      length_meters: cableLength,
    });
  };

  const handleExportRunbook = () => {
    if (!data?.cables || data.cables.length === 0) {
      alert("No cable connections logged for this rack to export.");
      return;
    }
    const headers = ["Cable ID", "Source Port", "Destination Port", "Media Type", "Color Code", "Length (m)", "Status"];
    const rows = data.cables.map((c: CableLinkRecord) => [
      `CBL-${c.id}`,
      c.source_port_label,
      c.target_port_label,
      c.cable_type,
      c.color,
      c.length_meters.toString(),
      "ACTIVE_LINK"
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Patch_Schedule_${rackName}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
        <p className="text-xs font-semibold">Loading patch panels and port matrices...</p>
      </div>
    );
  }

  const patchPanels = data?.patch_panels || [];
  const cables = data?.cables || [];

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Cable className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground">Port Matrix & Patch Panels</h3>
            <p className="text-[11px] text-muted-foreground font-mono">
              {patchPanels.length} Faceplates • {cables.length} Active Cable Runs • Cabinet: {rackName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportRunbook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/60 bg-background hover:bg-accent text-xs font-bold text-muted-foreground hover:text-foreground transition-all shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export Runbook CSV</span>
          </button>
          <button
            onClick={() => setIsNewPanelModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patch Panel</span>
          </button>
        </div>
      </div>

      {/* Panels Grid */}
      {patchPanels.length === 0 ? (
        <div className="bg-card/40 backdrop-blur-xl border border-dashed border-border/60 rounded-3xl p-10 text-center space-y-3">
          <Cable className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <h4 className="text-sm font-bold text-foreground">No Patch Panels Installed</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Install a 24 or 48-port high-density patch panel into this rack to start tracing port-to-port cable runs.
          </p>
          <button
            onClick={() => setIsNewPanelModalOpen(true)}
            className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs hover:opacity-90 transition-all"
          >
            + Create First Patch Panel
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {patchPanels.map((panel: PatchPanelRecord) => (
            <div
              key={panel.id}
              className="bg-card/50 backdrop-blur-xl border border-border/60 rounded-2xl p-5 shadow-xs space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-primary px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/20">
                    U{panel.start_u}
                  </span>
                  <h4 className="text-sm font-black text-foreground">{panel.name}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted border border-border/60 text-muted-foreground uppercase">
                    {panel.category} • {panel.total_ports} Ports
                  </span>
                </div>
              </div>

              {/* 24/48-port Faceplate Matrix */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-inner">
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {panel.ports.map((port: PortRecord) => {
                    const isSelected = selectedPort?.id === port.id;
                    const isConnected = !!port.cable;
                    const colorHex = port.cable?.color ? CABLE_COLORS[port.cable.color]?.hex || "#3b82f6" : undefined;

                    return (
                      <button
                        key={port.id}
                        type="button"
                        onClick={() => handlePortClick(port)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 rounded-lg border transition-all cursor-pointer group relative",
                          isSelected
                            ? "border-primary bg-primary/20 ring-2 ring-primary"
                            : isConnected
                            ? "border-neutral-700 bg-neutral-900 hover:border-neutral-500"
                            : "border-neutral-800 bg-neutral-950 hover:border-neutral-700 opacity-70 hover:opacity-100"
                        )}
                      >
                        {/* Status LED */}
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full mb-1 shadow-sm",
                            isConnected ? "bg-emerald-400 animate-pulse" : "bg-neutral-600"
                          )}
                        />
                        {/* Port RJ45 Socket Icon */}
                        <div
                          className="w-5 h-4 rounded-xs border flex items-center justify-center text-[8px] font-mono font-bold"
                          style={{
                            borderColor: colorHex || (isConnected ? "#10b981" : "#525252"),
                            color: colorHex || "#a3a3a3",
                          }}
                        >
                          {port.port_label}
                        </div>

                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                          <div className="bg-popover text-popover-foreground text-[10px] font-semibold px-2 py-1 rounded-md shadow-lg border border-border whitespace-nowrap">
                            {port.port_label}: {isConnected ? `Linked to ${port.cable?.peer_label}` : "Available Port"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Cable Runs Table */}
      {cables.length > 0 && (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-xs space-y-3">
          <h4 className="text-xs font-black uppercase text-foreground">Active Cable Run Schedule ({cables.length})</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border/40 text-[10px] font-black uppercase text-muted-foreground">
                  <th className="py-2 px-3">Run ID</th>
                  <th className="py-2 px-3">Source Port</th>
                  <th className="py-2 px-3">Destination Port</th>
                  <th className="py-2 px-3">Cable Type & Color</th>
                  <th className="py-2 px-3">Length</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {cables.map((c: CableLinkRecord) => {
                  const colorObj = CABLE_COLORS[c.color] || CABLE_COLORS.BLUE;
                  return (
                    <tr key={c.id} className="hover:bg-muted/20">
                      <td className="py-2.5 px-3 font-mono font-bold text-muted-foreground">CBL-{c.id}</td>
                      <td className="py-2.5 px-3 font-black text-foreground">{c.source_port_label}</td>
                      <td className="py-2.5 px-3 font-black text-foreground">{c.target_port_label}</td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border border-border/40 bg-background">
                          <span className={cn("w-2 h-2 rounded-full", colorObj.bg)} />
                          <span>{colorObj.label}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-muted-foreground">{c.length_meters} m</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => unlinkMutation.mutate(c.id)}
                          className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                          title="Disconnect Cable"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Connect Cable Patch Modal */}
      {isPatchModalOpen && selectedPort && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Cable className="w-5 h-5 text-primary" />
                <h3 className="font-black text-sm text-foreground">Patch Port Cable Connection</h3>
              </div>
              <button
                onClick={() => {
                  setIsPatchModalOpen(false);
                  setSelectedPort(null);
                }}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConnectCables} className="space-y-4">
              <div className="bg-muted/30 p-3.5 rounded-2xl border border-border/40 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Source Port</span>
                  <span className="font-black text-primary font-mono">{selectedPort.port_label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-muted-foreground">Destination Port</span>
                  <select
                    value={targetPortId || ""}
                    onChange={(e) => setTargetPortId(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg bg-background border border-border/60 text-xs font-semibold"
                    required
                  >
                    <option value="">Select Destination Port...</option>
                    {patchPanels.flatMap((p: PatchPanelRecord) => p.ports).filter((p: PortRecord) => p.id !== selectedPort.id).map((p: PortRecord) => (
                      <option key={p.id} value={p.id}>
                        {p.port_label} ({p.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Cable Media Type</label>
                  <select
                    value={cableType}
                    onChange={(e) => setCableType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  >
                    <option value="COPPER">Cat6A Copper</option>
                    <option value="FIBER_SINGLE">Single-Mode Fiber (OS2)</option>
                    <option value="FIBER_MULTI">Multi-Mode Fiber (OM4)</option>
                    <option value="DAC">Direct Attach Copper (DAC)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Color Standard</label>
                  <select
                    value={cableColor}
                    onChange={(e) => setCableColor(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  >
                    {Object.entries(CABLE_COLORS).map(([key, c]) => (
                      <option key={key} value={key}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Cable Run Length (Meters)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="50.0"
                  value={cableLength}
                  onChange={(e) => setCableLength(parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsPatchModalOpen(false);
                    setSelectedPort(null);
                  }}
                  className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkMutation.isPending || !targetPortId}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {linkMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Patch Cable</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Patch Panel Modal */}
      {isNewPanelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-50">
          <div className="bg-card border border-border/80 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                <h3 className="font-black text-sm text-foreground">Add Patch Panel to Rack</h3>
              </div>
              <button
                onClick={() => setIsNewPanelModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                createPanelMutation.mutate({
                  name: newPanelName || "Main Patch Panel",
                  start_u: Number(newPanelSlot),
                  total_ports: Number(newPanelPorts),
                  category: newPanelCategory,
                });
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Faceplate Name</label>
                <input
                  type="text"
                  placeholder="e.g. PP-CAT6A-TOP"
                  value={newPanelName}
                  onChange={(e) => setNewPanelName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Mount U-Slot</label>
                  <input
                    type="number"
                    min="1"
                    max="42"
                    value={newPanelSlot}
                    onChange={(e) => setNewPanelSlot(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Port Count</label>
                  <select
                    value={newPanelPorts}
                    onChange={(e) => setNewPanelPorts(Number(e.target.value))}
                    className="w-full px-2 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  >
                    <option value={12}>12 Ports</option>
                    <option value={24}>24 Ports</option>
                    <option value={48}>48 Ports</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase block mb-1">Category</label>
                  <select
                    value={newPanelCategory}
                    onChange={(e) => setNewPanelCategory(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-background border border-border/60 text-xs font-semibold"
                  >
                    <option value="Cat6A">Cat6A</option>
                    <option value="Cat7">Cat7</option>
                    <option value="Fiber LC">Fiber LC</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPanelModalOpen(false)}
                  className="flex-1 py-2.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPanelMutation.isPending}
                  className="flex-1 py-2.5 bg-primary text-primary-foreground font-bold text-xs rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {createPanelMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Install Panel</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
