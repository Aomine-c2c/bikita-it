"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Server, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetworkTableProps {
  devices: any[];
}

export function NetworkTable({ devices }: NetworkTableProps) {
  const [search, setSearch] = useState("");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      return (
        !search ||
        [d.hostname, d.ip_address, d.mac_address, d.device_type, d.vendor, d.location]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [devices, search]);

  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm my-4">
      {/* Header Search */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search hostname, IP address, MAC, location..."
          className="w-full sm:w-80 px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
        />
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} Network Nodes</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Hostname</th>
              <th className="px-5 py-3">IP Address</th>
              <th className="px-5 py-3">MAC Address</th>
              <th className="px-5 py-3">Device Type</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Location</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No network devices found.
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.id || d.hostname} className="hover:bg-muted/40 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-foreground">{d.hostname || "Core-Switch-01"}</td>
                  <td className="px-5 py-3.5 font-mono">
                    <button
                      onClick={() => handleCopyIp(d.ip_address || "192.168.1.1")}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background border border-border/50 hover:border-primary transition-colors text-primary font-bold text-xs cursor-pointer shadow-sm"
                    >
                      <span>{d.ip_address || "192.168.1.1"}</span>
                      {copiedIp === (d.ip_address || "192.168.1.1") ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">{d.mac_address || "00:1A:2B:3C:4D:5E"}</td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{d.device_type || "Switch"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      Online
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{d.location || "Server Room A"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
