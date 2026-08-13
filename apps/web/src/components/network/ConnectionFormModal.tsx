"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Search, Waypoints } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Device {
  id: number;
  hostname?: string;
  ip_address?: string;
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

  // Form State
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");
  const [sourceDeviceId, setSourceDeviceId] = useState("");
  const [targetDeviceId, setTargetDeviceId] = useState("");
  const [sourcePort, setSourcePort] = useState("");
  const [cableType, setCableType] = useState("Cat6");

  useEffect(() => {
    if (isOpen) {
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
    if (!sourceDeviceId || !targetDeviceId) {
      alert("Please select both a source and target device.");
      return;
    }
    if (sourceDeviceId === targetDeviceId) {
      alert("Source and target devices cannot be the same.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        source_device_id: parseInt(sourceDeviceId, 10),
        target_device_id: parseInt(targetDeviceId, 10),
        port: sourcePort || null,
        speed: cableType || "Cat6",
        status: "Active",
      };

      await apiFetch("/connections", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save connection.");
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
    setCableType("Cat6");
    onClose();
  };

  if (!isOpen) return null;

  const getDisplayName = (device: Device) =>
    device.hostname || device.ip_address || String(device.id);

  const filteredSourceDevices = devices.filter((d) => {
    const name = getDisplayName(d).toLowerCase();
    return name.includes(sourceSearch.toLowerCase());
  });

  const filteredTargetDevices = devices.filter((d) => {
    const name = getDisplayName(d).toLowerCase();
    return name.includes(targetSearch.toLowerCase());
  });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
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
          className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-border/50 flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Waypoints className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Map Connection</h2>
                <p className="text-sm text-muted-foreground">Link two network devices together</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
            <div className="p-6 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* Source Device Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border/50 pb-2">Source Device</h3>

                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search source device..."
                        value={sourceSearch}
                        onChange={(e) => setSourceSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredSourceDevices.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No devices found</div>
                      ) : (
                        filteredSourceDevices.map((device) => (
                          <div
                            key={device.id}
                            onClick={() => setSourceDeviceId(String(device.id))}
                            className={`p-2 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center ${sourceDeviceId === String(device.id) ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground">{getDisplayName(device)}</div>
                              <div className="text-xs text-muted-foreground">{device.vendor || "Unknown vendor"}</div>
                            </div>
                            {sourceDeviceId === String(device.id) && (
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Port</label>
                    <input
                      type="text"
                      value={sourcePort}
                      onChange={(e) => setSourcePort(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Eth1, Gi1/0/1"
                    />
                  </div>
                </div>

                {/* Target Device Column */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground border-b border-border/50 pb-2">Target Device</h3>

                  <div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search target device..."
                        value={targetSearch}
                        onChange={(e) => setTargetSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="mt-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredTargetDevices.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">No devices found</div>
                      ) : (
                        filteredTargetDevices.map((device) => (
                          <div
                            key={device.id}
                            onClick={() => setTargetDeviceId(String(device.id))}
                            className={`p-2 cursor-pointer border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex justify-between items-center ${targetDeviceId === String(device.id) ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}`}
                          >
                            <div>
                              <div className="text-sm font-medium text-foreground">{getDisplayName(device)}</div>
                              <div className="text-xs text-muted-foreground">{device.vendor || "Unknown vendor"}</div>
                            </div>
                            {targetDeviceId === String(device.id) && (
                              <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Speed / Cable Details */}
              <div className="mt-8 pt-6 border-t border-border/50">
                <div className="max-w-xs mx-auto">
                  <label className="block text-sm font-medium text-foreground mb-1.5 text-center">Speed / Cable Type</label>
                  <select
                    value={cableType}
                    onChange={(e) => setCableType(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-center"
                  >
                    <option value="Cat5e">Cat5e</option>
                    <option value="Cat6">Cat6</option>
                    <option value="Cat6a">Cat6a</option>
                    <option value="Fiber (OM3)">Fiber (OM3)</option>
                    <option value="Fiber (OS2)">Fiber (OS2)</option>
                    <option value="Coax">Coax</option>
                    <option value="Power">Power</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/40 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? "Saving..." : (
                  <>
                    <Save className="w-4 h-4" /> Save Connection
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
