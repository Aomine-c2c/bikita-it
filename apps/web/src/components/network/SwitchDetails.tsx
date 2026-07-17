"use client";

import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Server, Activity, ArrowUpRight, ArrowDownRight, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

const bandwidthData = [
  { time: "10:00", in: 120, out: 80 },
  { time: "10:05", in: 250, out: 150 },
  { time: "10:10", in: 180, out: 200 },
  { time: "10:15", in: 400, out: 300 },
  { time: "10:20", in: 350, out: 250 },
  { time: "10:25", in: 200, out: 180 },
  { time: "10:30", in: 280, out: 220 },
];

export function SwitchDetails() {
  // No ports retrieved yet
  const ports: string[] = [];

  const getPortColor = (status: string) => {
    switch (status) {
      case "uplink": return "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]";
      case "active": return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]";
      case "poe": return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]";
      case "down": return "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]";
      default: return "bg-slate-700"; // Inactive
    }
  };

  return (
    <div className="bg-slate-950 border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col h-full text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
        <Server className="w-48 h-48" />
      </div>

      {/* Header */}
      <div className="mb-6 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <h2 className="text-xl font-bold tracking-tight">Core Switch (Cisco 9500)</h2>
        </div>
        <p className="text-sm text-slate-400 font-mono">10.0.1.254 • MAC: 00:1A:2B:3C:4D:5E</p>
      </div>

      {/* Physical Port Map */}
      <div className="mb-8 relative z-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Front Panel Status</h3>
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 grid grid-cols-12 gap-y-3 gap-x-2">
          {ports.map((status, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className={cn("w-4 h-4 rounded-[3px] transition-all", getPortColor(status))} />
              <span className="text-[8px] text-slate-500 font-mono">{idx + 1}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-3 px-2">
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-sm bg-blue-500"></div> Uplink</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-sm bg-emerald-500"></div> Active</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-sm bg-amber-500"></div> PoE</span>
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><div className="w-2 h-2 rounded-sm bg-red-500"></div> Error</span>
        </div>
      </div>

      {/* Bandwidth Chart */}
      <div className="flex-1 min-h-[200px] mb-6 relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" /> Live Traffic
          </h3>
          <div className="flex gap-3">
            <span className="text-xs font-mono text-emerald-400 flex items-center gap-1"><ArrowDownRight className="w-3 h-3"/> 280 Mbps</span>
            <span className="text-xs font-mono text-blue-400 flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> 220 Mbps</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={bandwidthData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Area type="monotone" dataKey="in" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" />
            <Area type="monotone" dataKey="out" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOut)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Hardware Specs & Terminal */}
      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Location</p>
          <p className="text-sm font-semibold text-white">MDF-1 (Rack A, U12)</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-3 mb-1">Firmware</p>
          <p className="text-sm font-semibold text-white">IOS XE 17.3.4</p>
        </div>
        <button className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:bg-slate-800 hover:border-slate-700 transition-colors group cursor-pointer text-slate-400 hover:text-white">
          <Terminal className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-bold uppercase tracking-wider">Open Console</span>
        </button>
      </div>
    </div>
  );
}
