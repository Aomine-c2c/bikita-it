 
 

"use client";

import React from "react";
import { type Asset } from "@/lib/api";
import { Cpu, HardDrive, MemoryStick, Monitor, Network } from "lucide-react";

export function AssetSpecificationsTab({ asset }: { asset: any }) {
  let specs: any = {};
  try {
    if (asset.specs) {
      specs = typeof asset.specs === 'string' ? JSON.parse(asset.specs) : asset.specs;
    }
  } catch (_e) {
    // Ignore parsing errors
  }

  const defaultSpecs = [
    { label: "Processor", value: specs.cpu || "Not specified", icon: Cpu, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Memory (RAM)", value: specs.ram || "Not specified", icon: MemoryStick, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "Storage", value: specs.storage || "Not specified", icon: HardDrive, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Operating System", value: specs.os || "Not specified", icon: Monitor, color: "text-sky-600", bg: "bg-sky-50" },
    { label: "Network Details", value: asset.macAddress ? `MAC: ${asset.macAddress}${asset.ipAddress ? ` | IP: ${asset.ipAddress}` : ''}` : "Not specified", icon: Network, color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Technical Specifications</h3>
        <p className="text-sm text-muted-foreground">Hardware details and configuration.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {defaultSpecs.map((spec, i) => (
          <div key={i} className="flex items-center gap-4 p-5 bg-white border border-border/60 rounded-2xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${spec.bg}`}>
              <spec.icon className={`w-6 h-6 ${spec.color}`} />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">{spec.label}</p>
              <p className="text-sm font-semibold text-foreground">{spec.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
