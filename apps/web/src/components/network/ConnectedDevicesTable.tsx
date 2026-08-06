/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Search, MonitorSmartphone, Wifi, RefreshCcw, _Edit2, Link } from "lucide-react";
import { networkApi, _NetworkDevice } from "@/lib/api";

import { useQuery } from "@tanstack/react-query";

export function ConnectedDevicesTable() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: devices = [], isLoading, refetch } = useQuery({
    queryKey: ['networkDevices'],
    queryFn: async () => {
      const data = await networkApi.getAll();
      return Array.isArray(data) ? data : (data as unknown).data ?? [];
    }
  });

  const filteredDevices = devices.filter((dev: unknown) => {
    const q = searchQuery.toLowerCase();
    const mac = dev.macAddress?.toLowerCase() || "";
    const ip = dev.ipAddress?.toLowerCase() || "";
    const hostname = dev.hostname?.toLowerCase() || "";
    const employee = (dev as unknown).employeeId?.toLowerCase() || (dev as unknown).employee?.name?.toLowerCase() || "";
    const asset = (dev as unknown).assetId?.toLowerCase() || (dev as unknown).asset?.name?.toLowerCase() || "";
    
    return mac.includes(q) || ip.includes(q) || hostname.includes(q) || employee.includes(q) || asset.includes(q);
  });

  return (
    <div className="bg-card border border-border rounded-xl shadow-premium overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted/30 flex-wrap gap-4">
        <div className="flex items-center gap-2 text-foreground font-semibold">
          <Wifi className="w-5 h-5 text-emerald-500" />
          Active Network Devices
        </div>
        
        <div className="flex items-center gap-4 flex-1 justify-end">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search MAC, IP, Hostname, Employee, Asset..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-background border border-border/60 rounded-full text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <RefreshCcw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="p-0 flex-1 overflow-auto min-h-100">
        {isLoading && devices.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <RefreshCcw className="w-5 h-5 animate-spin mr-2" /> Loading devices...
          </div>
        ) : filteredDevices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-3">
            <MonitorSmartphone className="w-10 h-10 opacity-30" />
            <p className="text-sm font-medium text-foreground">No devices found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-muted-foreground bg-muted/20 border-b border-border sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 font-medium">Hostname</th>
                <th className="px-4 py-3 font-medium">IP Address</th>
                <th className="px-4 py-3 font-medium">MAC Address</th>
                <th className="px-4 py-3 font-medium">Network</th>
                <th className="px-4 py-3 font-medium">OS / Type</th>
                <th className="px-4 py-3 font-medium">Linked Employee</th>
                <th className="px-4 py-3 font-medium">Linked Asset</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredDevices.map((device: unknown, idx: number) => (
                <motion.tr 
                  key={device.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.05, 0.5) }}
                  className="hover:bg-muted/10 transition-colors group"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {device.hostname || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {device.ipAddress}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                    {device.macAddress}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {(device as unknown).networkName || '-'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {(device as unknown).os || '-'} / {(device as unknown).deviceType || '-'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {(device as unknown).employeeId ? (
                      <span className="inline-flex items-center gap-1 text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                        <Link className="w-3 h-3" />
                        {(device as unknown).employeeId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {(device as unknown).assetId ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        <Link className="w-3 h-3" />
                        {(device as unknown).assetId}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      device.connectionStatus === 'CONNECTED' || device.connectionStatus === 'ONLINE'
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : 'bg-zinc-500/10 text-zinc-600'
                    }`}>
                      {device.connectionStatus}
                    </span>
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
