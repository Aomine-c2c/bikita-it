
"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Radar, RefreshCcw, MonitorSmartphone, Server, Plus, Camera } from "lucide-react";
import { apiFetch, networkApi, NetworkDevice } from "@/lib/api";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export function DiscoveryStagingTable() {
  const [stagedDevices, setStagedDevices] = useState<NetworkDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  const stagedDevicesRef = React.useRef<NetworkDevice[]>([]);

  const fetchStagedDevices = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch<NetworkDevice[]>("/devices");
      setStagedDevices(data);
      stagedDevicesRef.current = data;
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStagedDevices();

    let unlistenDiscovered: any;
    let unlistenComplete: any;

    const setupListeners = async () => {
      try {
        unlistenDiscovered = await listen<NetworkDevice>("device_discovered", (event) => {
          setStagedDevices((prev) => {
            const exists = prev.find(d => d.ip_address === event.payload.ip_address);
            if (exists) return prev;
            const newDevices = [...prev, event.payload];
            stagedDevicesRef.current = newDevices;
            return newDevices;
          });
        });

        unlistenComplete = await listen("scan_complete", async () => {
          try {
            // Push discovered devices to the Django API to run the Auto-Link & Offline logic
            const currentDevices = stagedDevicesRef.current;
            if (currentDevices.length > 0) {
              await networkApi.triggerScan(currentDevices);
              await fetchStagedDevices(); // Refresh to get mapped assets
            }
          } catch (e) {
            console.error("Failed to sync scanned devices:", e);
          } finally {
            setIsScanning(false);
          }
        });
      } catch (e) {
        console.error("Failed to set up Tauri listeners:", e);
      }
    };

    setupListeners();

    return () => {
      if (typeof unlistenDiscovered === 'function') unlistenDiscovered();
      if (typeof unlistenComplete === 'function') unlistenComplete();
    };
  }, []);

  const handleScan = async () => {
    setIsScanning(true);
    setStagedDevices([]);
    stagedDevicesRef.current = [];
    
    try {
      await invoke("ping_network");
    } catch (e) {
      console.error("Scan Error:", e);
      alert("Failed to start network scan. Are you running in Tauri?");
      setIsScanning(false);
    }
  };

  const handleCameraScan = async () => {
    setIsScanning(true);
    setStagedDevices([]);
    stagedDevicesRef.current = [];
    
    try {
      await invoke("scan_cameras");
    } catch (e) {
      console.error("Camera Scan Error:", e);
      alert("Failed to start camera scan. Are you running in Tauri?");
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-premium overflow-hidden flex flex-col h-full relative">
      
      {/* Radar Overlay (Blocking UI) */}
      <AnimatePresence>
        {isScanning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center"
          >
            <div className="relative flex items-center justify-center w-32 h-32 mb-6">
              {/* Radar rings */}
              <div className="absolute inset-0 border-2 border-indigo-500/20 rounded-full animate-ping [animation-duration:2s]" />
              <div className="absolute inset-4 border-2 border-indigo-500/30 rounded-full animate-ping [animation-duration:2.5s]" />
              <div className="absolute inset-8 border-2 border-indigo-500/40 rounded-full animate-ping [animation-duration:3s]" />
              <Radar className="w-12 h-12 text-indigo-500 animate-pulse" />
              {/* Radar sweep line */}
              <div className="absolute inset-0 bg-gradient-conic from-indigo-500/0 via-indigo-500/10 to-indigo-500/40 rounded-full animate-spin [animation-duration:2s]" style={{ clipPath: 'polygon(50% 50%, 50% 0, 100% 0, 100% 50%)' }} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">Scanning Local Subnet</h3>
            <p className="text-sm text-muted-foreground max-w-xs text-center">
              The Tauri probe is injecting ARP requests and ICMP pings across the network to discover devices...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Radar className="w-5 h-5 text-indigo-500" />
          Network Devices
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleCameraScan}
            disabled={isScanning}
            className="flex items-center gap-2 text-xs font-medium bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 cursor-pointer z-10"
          >
            <Camera className={`w-3 h-3 ${isScanning ? 'animate-pulse' : ''}`} />
            Discover Cameras
          </button>
          <button 
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer z-10"
          >
            <RefreshCcw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
            Run Ping Sweep
          </button>
        </div>
      </div>

      <div className="p-0 flex-1 overflow-auto min-h-100">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <RefreshCcw className="w-5 h-5 animate-spin mr-2" /> Loading devices...
          </div>
        ) : stagedDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3">
            <MonitorSmartphone className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium text-foreground">No devices found.</p>
            <p className="text-xs max-w-sm text-center">Run a ping sweep to detect devices on your local subnet.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">MAC Address</th>
                <th className="px-4 py-3 font-medium">Hostname</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Last Seen</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Mapped Asset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {stagedDevices.map((device, idx) => (
                <motion.tr 
                  key={device.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-muted/10 transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4 text-indigo-500/70" />
                      {device.ip_address}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {device.mac_address}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device.hostname || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-medium text-xs">
                    {device.vendor || '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(device.last_seen).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${device.status === 'Online' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-medium text-sm">
                    {device.mapped_asset_name ? (
                      <span className="text-indigo-600 dark:text-indigo-400">{device.mapped_asset_name}</span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 italic">Unmapped</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
