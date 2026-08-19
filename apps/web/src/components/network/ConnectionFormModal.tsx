"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Search, Waypoints, Cable, Server, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Device {
  id: number;
  hostname?: string;
  ip_address?: string;
  ipAddress?: string;
  vendor?: string;
  status?: string;
}

interface ConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConnectionFormModal({ isOpen, onClose, onSuccess }: ConnectionFormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [sourceDeviceId, setSourceDeviceId] = useState("");
  const [targetDeviceId, setTargetDeviceId] = useState("");
  const [sourcePort, setSourcePort] = useState("");
  const [targetPort, setTargetPort] = useState("");
  const [cableType, setCableType] = useState("Cat6");
  const [linkStatus, setLinkStatus] = useState("Active");

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      apiFetch<Device[] | { data: Device[] }>("/devices")
        .then((res) => {
          const data = Array.isArray(res) ? res : (res as any).data || [];
          setDevices(data);
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!sourceDeviceId || !targetDeviceId) {
      setErrorMessage("Please select both an origin and destination device.");
      return;
    }
    if (sourceDeviceId === targetDeviceId) {
      setErrorMessage("Origin and destination devices cannot be identical.");
      return;
    }

    setSubmitting(true);
    try {
      const sourceDev = devices.find((d) => String(d.id) === sourceDeviceId);
      const targetDev = devices.find((d) => String(d.id) === targetDeviceId);

      const payload = {
        source_device_id: parseInt(sourceDeviceId, 10),
        target_device_id: parseInt(targetDeviceId, 10),
        source_asset_id: sourceDev?.hostname || sourceDev?.ip_address || sourceDev?.ipAddress || String(sourceDeviceId),
        target_asset_id: targetDev?.hostname || targetDev?.ip_address || targetDev?.ipAddress || String(targetDeviceId),
        source_port: sourcePort || "Eth0",
        target_port: targetPort || "Eth0",
        cable_type: cableType || "Cat6",
        port: sourcePort || null,
        speed: cableType || "Cat6",
        status: linkStatus || "Active",
      };

      await apiFetch("/connections", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Failed to persist interconnect link.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSourceSearch("");
    setTargetSearch("");
    setSourceDeviceId("");
    setTargetDeviceId("");
    setSourcePort("");
    setTargetPort("");
    setCableType("Cat6");
    setLinkStatus("Active");
    setErrorMessage(null);
    onClose();
  };

  if (!isOpen) return null;

  const getDisplayName = (device: Device) =>
    device.hostname || device.ip_address || device.ipAddress || `Device #${device.id}`;

  const filteredSourceDevices = devices.filter((d) => {
    const name = getDisplayName(d).toLowerCase();
    const vendor = (d.vendor || "").toLowerCase();
    const q = sourceSearch.toLowerCase();
    return name.includes(q) || vendor.includes(q);
  });

  const filteredTargetDevices = devices.filter((d) => {
    const name = getDisplayName(d).toLowerCase();
    const vendor = (d.vendor || "").toLowerCase();
    const q = targetSearch.toLowerCase();
    return name.includes(q) || vendor.includes(q);
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 font-sans">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-3xl bg-card border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-border/40 flex items-center justify-between bg-muted/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
                <Waypoints className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight text-foreground">Map Cable Interconnect</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Link two network devices with physical or optical medium</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {/* Error banner */}
              {errorMessage && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-2 text-xs font-bold text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source Device Column */}
                <div className="space-y-3 bg-muted/20 border border-border/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <Server className="w-3.5 h-3.5 text-primary" />
                    <span>Source Device (Origin)</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter origin devices..."
                      value={sourceSearch}
                      onChange={(e) => setSourceSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary transition-colors shadow-sm"
                    />
                  </div>

                  <div className="border border-border/50 rounded-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar bg-background/50">
                    {filteredSourceDevices.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground font-medium">No matching devices</div>
                    ) : (
                      filteredSourceDevices.map((device) => {
                        const isSelected = sourceDeviceId === String(device.id);
                        return (
                          <div
                            key={device.id}
                            onClick={() => setSourceDeviceId(String(device.id))}
                            className={cn(
                              "p-2.5 cursor-pointer border-b border-border/30 last:border-0 hover:bg-muted/60 transition-colors flex justify-between items-center",
                              isSelected && "bg-primary/10 border-primary/30"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <div className={cn("text-xs font-bold truncate", isSelected ? "text-primary" : "text-foreground")}>
                                {getDisplayName(device)}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">{device.vendor || "Hardware Node"}</div>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">Source Interface / Port</label>
                    <input
                      type="text"
                      value={sourcePort}
                      onChange={(e) => setSourcePort(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-mono font-semibold outline-none focus:border-primary transition-colors shadow-sm"
                      placeholder="e.g. Gi1/0/24, Eth1, SFP-1"
                    />
                  </div>
                </div>

                {/* Target Device Column */}
                <div className="space-y-3 bg-muted/20 border border-border/40 rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    <Server className="w-3.5 h-3.5 text-primary" />
                    <span>Target Device (Destination)</span>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Filter destination devices..."
                      value={targetSearch}
                      onChange={(e) => setTargetSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary transition-colors shadow-sm"
                    />
                  </div>

                  <div className="border border-border/50 rounded-xl overflow-hidden max-h-40 overflow-y-auto custom-scrollbar bg-background/50">
                    {filteredTargetDevices.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground font-medium">No matching devices</div>
                    ) : (
                      filteredTargetDevices.map((device) => {
                        const isSelected = targetDeviceId === String(device.id);
                        return (
                          <div
                            key={device.id}
                            onClick={() => setTargetDeviceId(String(device.id))}
                            className={cn(
                              "p-2.5 cursor-pointer border-b border-border/30 last:border-0 hover:bg-muted/60 transition-colors flex justify-between items-center",
                              isSelected && "bg-primary/10 border-primary/30"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <div className={cn("text-xs font-bold truncate", isSelected ? "text-primary" : "text-foreground")}>
                                {getDisplayName(device)}
                              </div>
                              <div className="text-[10px] text-muted-foreground truncate">{device.vendor || "Hardware Node"}</div>
                            </div>
                            {isSelected && (
                              <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1">Target Interface / Port</label>
                    <input
                      type="text"
                      value={targetPort}
                      onChange={(e) => setTargetPort(e.target.value)}
                      className="w-full px-3 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-mono font-semibold outline-none focus:border-primary transition-colors shadow-sm"
                      placeholder="e.g. Gi1/0/1, Eth0, Trunk-1"
                    />
                  </div>
                </div>
              </div>

              {/* Cable & Medium Details */}
              <div className="bg-card border border-border/50 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground mb-1.5">
                    <Cable className="w-3.5 h-3.5" />
                    <span>Physical / Optical Medium</span>
                  </label>
                  <select
                    value={cableType}
                    onChange={(e) => setCableType(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-sm cursor-pointer"
                  >
                    <option value="Cat6">Copper Cat6 (1 Gbps / 10 Gbps Short)</option>
                    <option value="Cat6a">Copper Cat6a Shielded (10 Gbps 100m)</option>
                    <option value="Fiber (OM3)">Multi-Mode Fiber OM3 (10/40 Gbps)</option>
                    <option value="Fiber (OS2)">Single-Mode Fiber OS2 (10/40/100 Gbps Long Haul)</option>
                    <option value="DAC (Direct Attach)">Direct Attach Copper (10/25/40 Gbps SFP+)</option>
                    <option value="Patch Cord">Standard Patch Cord</option>
                    <option value="Coax">Coaxial / BNC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5">Link Operational Status</label>
                  <select
                    value={linkStatus}
                    onChange={(e) => setLinkStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-sm cursor-pointer"
                  >
                    <option value="Active">Active (Live Traffic)</option>
                    <option value="Standby">Standby (Failover Trunk)</option>
                    <option value="Degraded">Degraded (High Error Rate)</option>
                    <option value="Disabled">Disabled / Admin Down</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Links are tracked live in the topology map</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 rounded-xl transition-all shadow-md flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Interconnect...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Link Connection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
