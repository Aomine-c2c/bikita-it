"use client";

import React from "react";
import { QrCode, Barcode, Sparkles, Battery, HardDrive, Cpu, MemoryStick, Wifi, Tag, AlertCircle, Laptop } from "lucide-react";

export function AssetOverviewTab() {
  return (
    <div className="p-8 grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      
      {/* Column 1: Visual Identity & Network */}
      <div className="space-y-6 lg:col-span-1 xl:col-span-1">
        {/* Photo & Codes */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="aspect-video bg-slate-100 flex items-center justify-center relative group">
            <Laptop className="w-16 h-16 text-slate-300" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button className="px-4 py-2 bg-white text-black text-xs font-bold rounded-lg shadow-xl">Update Photo</button>
            </div>
          </div>
          <div className="p-5 flex justify-between items-center border-t border-border/40">
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-lg border border-border/40">
                <QrCode className="w-12 h-12 text-foreground" />
              </div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">QR Code</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-slate-50 rounded-lg border border-border/40 flex items-center justify-center h-[66px] w-[120px]">
                <Barcode className="w-20 h-10 text-foreground" />
              </div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Barcode</span>
            </div>
          </div>
        </div>

        {/* Network Profile */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm p-5">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-2 mb-4">
            <Wifi className="w-4 h-4 text-primary" /> Network Profile
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">MAC Address (Wi-Fi)</p>
              <p className="text-sm font-mono text-foreground bg-slate-50 px-3 py-1.5 rounded-md border border-border/40 inline-block">F4:0F:24:1A:3B:5C</p>
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">IP Address</p>
              <p className="text-sm font-mono text-foreground bg-slate-50 px-3 py-1.5 rounded-md border border-border/40 inline-block">10.0.45.102</p>
            </div>
          </div>
        </div>
      </div>

      {/* Column 2 & 3: Insights & Hardware Vitals */}
      <div className="lg:col-span-2 xl:col-span-3 space-y-6">
        
        {/* AI Insights Panel */}
        <div className="bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles className="w-24 h-24 text-indigo-500" />
          </div>
          <h3 className="text-sm font-bold text-indigo-700 flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4" /> AI Operations Insight
          </h3>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl">
            Asset is performing optimally. However, <strong>Battery Health has degraded to 78%</strong>. Based on usage patterns from Sarah Jenkins, we recommend procuring a replacement battery before Q3 to prevent unexpected downtime. No abnormal software installations detected.
          </p>
          <div className="mt-4 flex gap-3">
            <button className="px-4 py-1.5 bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-600 transition-colors">
              Schedule Battery Swap
            </button>
            <button className="px-4 py-1.5 bg-white text-foreground border border-border text-xs font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors">
              Dismiss
            </button>
          </div>
        </div>

        {/* Hardware Vitals Grid */}
        <h3 className="text-sm font-bold text-foreground mt-8 mb-4">Hardware Vitals</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Battery */}
          <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Battery className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-foreground">78%</span>
            </div>
            <p className="text-xs font-bold text-foreground mb-1">Battery Health</p>
            <p className="text-[10px] text-muted-foreground">Cycle Count: 412</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-amber-500 h-full rounded-full" style={{ width: '78%' }} />
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-foreground">412 GB</span>
            </div>
            <p className="text-xs font-bold text-foreground mb-1">Storage Used</p>
            <p className="text-[10px] text-muted-foreground">Out of 1 TB NVMe</p>
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '41%' }} />
            </div>
          </div>

          {/* CPU */}
          <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Cpu className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-foreground">12-Core</span>
            </div>
            <p className="text-xs font-bold text-foreground mb-1">M2 Max Processor</p>
            <p className="text-[10px] text-muted-foreground">3.48 GHz Base</p>
          </div>

          {/* RAM */}
          <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <MemoryStick className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-foreground">32 GB</span>
            </div>
            <p className="text-xs font-bold text-foreground mb-1">Unified Memory</p>
            <p className="text-[10px] text-muted-foreground">LPDDR5-6400</p>
          </div>

        </div>

        {/* Related Tickets Mini List */}
        <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden mt-6">
          <div className="p-4 border-b border-border/40 flex justify-between items-center bg-[#FAFAFA]">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" /> Related Tickets
            </h3>
            <button className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline">View All</button>
          </div>
          <div className="divide-y divide-border/40">
            {[1, 2].map((i) => (
              <div key={i} className="p-4 flex items-start gap-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">Battery not holding charge as long</p>
                  <p className="text-xs text-muted-foreground mt-0.5">TKT-8902 • Opened 2 days ago by Sarah Jenkins</p>
                </div>
                <div className="px-2 py-1 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                  Open
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
