"use client";

import React, { useState, useMemo } from "react";
import { Video, ChevronRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CameraTableProps {
  cameras: any[];
  onSelectCamera: (cam: any) => void;
}

export function CameraTable({ cameras, onSelectCamera }: CameraTableProps) {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return cameras.filter((c) => {
      return (
        !search ||
        [c.name, c.ip_address, c.mac_address, c.vendor, c.status]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [cameras, search]);

  const handleCopyIp = (e: React.MouseEvent, ip: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedId(ip);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm my-4">
      {/* Search Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search camera name, IP address, vendor, MAC..."
          className="w-full sm:w-80 px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
        />
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} Configured Streams</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Camera Name</th>
              <th className="px-5 py-3">IP Address</th>
              <th className="px-5 py-3">Vendor / Model</th>
              <th className="px-5 py-3">Resolution</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No surveillance camera feeds found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectCamera(c)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    <Video className="w-4 h-4 text-emerald-500" />
                    <span>{c.name || "NVR Camera"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(e) => handleCopyIp(e, c.ip_address || "192.168.1.100")}
                      className="font-mono text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{c.ip_address || "192.168.1.100"}</span>
                      {copiedId === (c.ip_address || "192.168.1.100") ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">{c.vendor || "Hikvision"} ({c.model || "DS-2CD2143G0"})</td>
                  <td className="px-5 py-3.5 font-mono text-muted-foreground">{c.resolution || "4K UHD (3840x2160)"}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      ONLINE
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors inline-block" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
