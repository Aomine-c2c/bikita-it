"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  Radar, 
  RefreshCcw, 
  MonitorSmartphone, 
  ArrowRight,
  Server,
  Plus
} from "lucide-react";

export function DiscoveryStagingTable() {
  const [stagedDevices, setStagedDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    fetchStagedDevices();
  }, []);

  const fetchStagedDevices = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:3001/network/discovery/staged");
      if (res.ok) {
        const data = await res.json();
        setStagedDevices(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      await fetch("http://localhost:3001/network/discovery/scan", {
        method: "POST"
      });
      // Poll for updates after starting scan
      setTimeout(fetchStagedDevices, 5000);
      setTimeout(fetchStagedDevices, 10000);
      setTimeout(() => {
        fetchStagedDevices();
        setIsScanning(false);
      }, 15000);
    } catch (e) {
      console.error(e);
      setIsScanning(false);
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-premium overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Radar className="w-5 h-5 text-indigo-500" />
          Discovery Staging Queue
        </div>
        <button 
          onClick={handleScan}
          disabled={isScanning}
          className="flex items-center gap-2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 cursor-pointer"
        >
          <RefreshCcw className={`w-3 h-3 ${isScanning ? 'animate-spin' : ''}`} />
          {isScanning ? 'Scanning Network...' : 'Run Ping Sweep'}
        </button>
      </div>

      <div className="p-0 flex-1 overflow-auto min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <RefreshCcw className="w-5 h-5 animate-spin mr-2" /> Loading queue...
          </div>
        ) : stagedDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3">
            <MonitorSmartphone className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium text-foreground">No new devices discovered.</p>
            <p className="text-xs max-w-sm text-center">Run a ping sweep to automatically detect unrecognized IP and MAC addresses on your local subnet.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">MAC Address</th>
                <th className="px-4 py-3 font-medium">Hostname</th>
                <th className="px-4 py-3 font-medium">Last Seen</th>
                <th className="px-4 py-3 font-medium text-right">Action</th>
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
                      {device.ipAddress}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {device.macAddress}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {device.hostname || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(device.lastSeen).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20 px-2.5 py-1.5 rounded-md transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                      onClick={() => alert('Promotion dialog coming soon')}
                    >
                      <Plus className="w-3 h-3" />
                      Promote
                    </button>
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
