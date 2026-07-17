"use client";

import React from "react";
import { AlertCircle, Barcode, Cpu, HardDrive, Laptop, MemoryStick, QrCode, Tag, Wifi } from "lucide-react";
import type { Asset } from "@/lib/api";

function spec(asset: Asset, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = asset.specs?.[key];
    if (value) return String(value);
  }
  return null;
}

export function AssetOverviewTab({ asset }: { asset: Asset }) {
  const details = [
    { title: "Processor", value: spec(asset, "cpu", "processor"), icon: Cpu },
    { title: "Memory", value: spec(asset, "ram", "memory"), icon: MemoryStick },
    { title: "Storage", value: spec(asset, "storage", "disk"), icon: HardDrive },
    { title: "Operating System", value: spec(asset, "os", "operatingSystem"), icon: Laptop },
  ].filter((item) => item.value);

  return (
    <div className="p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="space-y-6">
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="aspect-video bg-slate-100 flex items-center justify-center">
            <Laptop className="w-16 h-16 text-slate-300" aria-hidden="true" />
          </div>
          <div className="p-5 flex justify-around border-t border-border/40">
            <div className="text-center"><QrCode className="w-12 h-12 mx-auto" /><span className="text-[10px] uppercase font-bold text-muted-foreground">QR Code</span></div>
            <div className="text-center"><Barcode className="w-20 h-12 mx-auto" /><span className="text-[10px] uppercase font-bold text-muted-foreground">Barcode</span></div>
          </div>
        </div>
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold flex items-center gap-2 mb-4"><Wifi className="w-4 h-4 text-primary" /> Network Profile</h3>
          <dl className="space-y-4 text-sm">
            <div><dt className="text-[10px] uppercase font-bold text-muted-foreground">MAC Address</dt><dd className="font-mono mt-1">{asset.macAddress ?? "Not recorded"}</dd></div>
            <div><dt className="text-[10px] uppercase font-bold text-muted-foreground">IP Address</dt><dd className="font-mono mt-1">{asset.ipAddress ?? "Not recorded"}</dd></div>
          </dl>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <section className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold mb-4">Recorded hardware details</h3>
          {details.length ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{details.map(({ title, value, icon: Icon }) => <div key={title} className="rounded-xl border p-4"><Icon className="w-5 h-5 text-primary mb-3" /><p className="text-[10px] uppercase font-bold text-muted-foreground">{title}</p><p className="font-semibold mt-1">{value}</p></div>)}</div> : <p className="text-sm text-muted-foreground">No hardware specifications have been recorded for this asset.</p>}
        </section>

        <section className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-[#FAFAFA]"><h3 className="text-xs font-bold flex items-center gap-2"><Tag className="w-4 h-4" /> Related repairs</h3></div>
          {!asset.repairs?.length ? <p className="p-6 text-sm text-muted-foreground">No repairs are linked to this asset.</p> : <div className="divide-y">{asset.repairs.map((repair) => <div key={repair.id} className="p-4 flex gap-3"><AlertCircle className="w-4 h-4 mt-0.5 text-muted-foreground" /><div><p className="text-sm font-semibold">{repair.description}</p><p className="text-xs text-muted-foreground mt-1">{repair.status.replaceAll("_", " ")} · {new Date(repair.createdAt).toLocaleDateString()}</p></div></div>)}</div>}
        </section>
      </div>
    </div>
  );
}
