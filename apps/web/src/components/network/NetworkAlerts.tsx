"use client";

import React from "react";
import { AlertTriangle, Info, BellRing, Download, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

const alerts = [
  { id: 1, type: "critical", title: "Access Point Offline", desc: "AP-Floor-3-West has lost connection.", time: "2m ago", icon: WifiOff, color: "text-red-500", bg: "bg-red-500/10" },
  { id: 2, type: "warning", title: "High Traffic Anomaly", desc: "Unusual outbound traffic detected on Dist-B.", time: "15m ago", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: 3, type: "info", title: "Firmware Update Available", desc: "Core Switch 9500 has a new firmware (17.3.5).", time: "2h ago", icon: Download, color: "text-blue-500", bg: "bg-blue-500/10" },
];

export function NetworkAlerts() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm overflow-hidden h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <BellRing className="w-4 h-4 text-amber-500" /> Active Alerts
        </h3>
        <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md font-medium">3 New</span>
      </div>
      
      <div className="flex-1 space-y-3 overflow-y-auto">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-start gap-4 p-3 rounded-xl hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50 cursor-pointer group">
            <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", alert.bg, alert.color)}>
              <alert.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-semibold text-white truncate">{alert.title}</p>
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-2">{alert.time}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2">{alert.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors border border-slate-700">
        View All Logs
      </button>
    </div>
  );
}
