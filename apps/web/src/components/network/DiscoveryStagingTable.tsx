"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Radar,
  RefreshCcw,
  Server,
  Plus,
  Zap,
  CheckCircle2,
  X,
  Activity,
} from "lucide-react";
import { apiFetch, networkApi, NetworkDevice } from "@/lib/api";

interface LocationOption {
  id: number;
  name: string;
}

interface DepartmentOption {
  id: number;
  name: string;
}

export function DiscoveryStagingTable({ onDevicePromoted }: { onDevicePromoted?: () => void }) {
  const [stagedDevices, setStagedDevices] = useState<NetworkDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<NetworkDevice | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isPromoting, setIsPromoting] = useState(false);

  // Promotion Form State
  const [assetName, setAssetName] = useState("");
  const [assetCategory, setAssetCategory] = useState("Network Switch");
  const [assetTag, setAssetTag] = useState("");
  const [locationId, setLocationId] = useState<number | "">("");
  const [departmentId, setDepartmentId] = useState<number | "">("");
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);

  const fetchStagedDevices = async () => {
    try {
      setIsLoading(true);
      const data = await networkApi.getStaged();
      setStagedDevices(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load staged devices:", e);
      setStagedDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      try {
        const [staged, locs, depts] = await Promise.all([
          networkApi.getStaged().catch(() => []),
          apiFetch<LocationOption[]>("/locations").catch(() => []),
          apiFetch<DepartmentOption[]>("/system/departments").catch(() => []),
        ]);
        if (!ignore) {
          setStagedDevices(Array.isArray(staged) ? staged : []);
          setLocations(Array.isArray(locs) ? locs : []);
          setDepartments(Array.isArray(depts) ? depts : []);
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenPromote = (device: NetworkDevice) => {
    setSelectedDevice(device);
    const suggestedCategory =
      device.device_type === "SWITCH"
        ? "Network Switch"
        : device.device_type === "ROUTER"
        ? "Router"
        : device.device_type === "SERVER"
        ? "Server"
        : device.device_type === "PRINTER"
        ? "Printer"
        : "Hardware Asset";

    setAssetName(device.hostname || `${device.vendor || "Network"} ${suggestedCategory}`);
    setAssetCategory(suggestedCategory);
    setAssetTag(`AST-NET-${String(device.id).padStart(4, "0")}`);
    setLocationId("");
    setDepartmentId("");
    setIsPromoteModalOpen(true);
  };

  const handleConfirmPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice) return;

    setIsPromoting(true);
    try {
      await networkApi.promoteDevice(selectedDevice.id, {
        asset_category: assetCategory,
        asset_name: assetName,
        asset_tag: assetTag,
        location_id: locationId ? Number(locationId) : undefined,
        department_id: departmentId ? Number(departmentId) : undefined,
      });

      setIsPromoteModalOpen(false);
      setSelectedDevice(null);
      await fetchStagedDevices();
      if (onDevicePromoted) onDevicePromoted();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to promote device.");
    } finally {
      setIsPromoting(false);
    }
  };

  return (
    <div className="bg-card border border-border/60 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full relative">
      {/* Table Header */}
      <div className="p-4 border-b border-border/40 flex justify-between items-center bg-muted/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Radar className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-foreground">Discovery Staging Queue</h4>
            <p className="text-[11px] text-muted-foreground">Unmanaged subnet discoveries awaiting hardware asset promotion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchStagedDevices}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border/60 text-foreground hover:bg-muted/60 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Queue
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2 text-xs font-bold">
          <RefreshCcw className="w-4 h-4 animate-spin text-primary" />
          Loading discovery queue...
        </div>
      ) : stagedDevices.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto text-muted-foreground">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <p className="text-xs font-bold text-foreground">Discovery Queue is Clear</p>
          <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
            All discovered network endpoints have been promoted to managed hardware assets. Click &quot;Scan Subnet&quot; to sweep the CIDR range.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground font-black border-b border-border/40">
              <tr>
                <th className="px-4 py-3">Discovered Host</th>
                <th className="px-4 py-3">MAC / Vendor</th>
                <th className="px-4 py-3">Type & Ports</th>
                <th className="px-4 py-3">Latency</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {stagedDevices.map((device) => (
                <motion.tr
                  key={device.id || device.mac_address}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-foreground font-bold shrink-0">
                        <Server className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{device.ip_address}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">
                          {device.hostname || "unresolved-dns"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-mono text-[11px] text-foreground font-bold">{device.mac_address}</div>
                    <div className="text-[10px] text-muted-foreground">{device.vendor || "Generic Vendor"}</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider">
                        {device.device_type || "WORKSTATION"}
                      </span>
                      {Array.isArray(device.open_ports) && device.open_ports.length > 0 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground text-[10px] font-mono">
                          Ports: {device.open_ports.slice(0, 3).join(", ")}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      <Activity className="w-3 h-3" />
                      {device.latency_ms ? `${device.latency_ms} ms` : "0.8 ms"}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleOpenPromote(device)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Promote to Asset
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Guided Promotion Modal */}
      <AnimatePresence>
        {isPromoteModalOpen && selectedDevice && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsPromoteModalOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card border border-border/60 rounded-3xl shadow-2xl p-6 overflow-hidden"
            >
              <div className="flex items-start justify-between pb-4 border-b border-border/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">Promote to Hardware Asset</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Register {selectedDevice.ip_address} into Permanent Asset Inventory
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPromoteModalOpen(false)}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmPromote} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Asset Name</label>
                    <input
                      type="text"
                      value={assetName}
                      onChange={(e) => setAssetName(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:border-primary"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Asset Tag</label>
                    <input
                      type="text"
                      value={assetTag}
                      onChange={(e) => setAssetTag(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-mono font-bold outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-1 block">Asset Category</label>
                  <select
                    value={assetCategory}
                    onChange={(e) => setAssetCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Network Switch">Network Switch</option>
                    <option value="Router">Router</option>
                    <option value="Server">Server</option>
                    <option value="Access Point">Wireless Access Point</option>
                    <option value="Printer">Network Printer</option>
                    <option value="Workstation">Desktop Workstation</option>
                    <option value="Hardware Asset">Other Hardware</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Location</label>
                    <select
                      value={locationId}
                      onChange={(e) => setLocationId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">Select Location...</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground mb-1 block">Department</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value ? Number(e.target.value) : "")}
                      className="w-full px-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="">Select Department...</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-muted/40 border border-border/40 rounded-2xl text-[11px] text-muted-foreground space-y-1">
                  <div>IP Address: <span className="font-mono font-bold text-foreground">{selectedDevice.ip_address}</span></div>
                  <div>MAC Address: <span className="font-mono font-bold text-foreground">{selectedDevice.mac_address}</span></div>
                  <div>Vendor: <span className="font-bold text-foreground">{selectedDevice.vendor || "Generic"}</span></div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={() => setIsPromoteModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold border border-border/60 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPromoting}
                    className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isPromoting ? (
                      <>
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                        <span>Promoting...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm & Register Asset</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
