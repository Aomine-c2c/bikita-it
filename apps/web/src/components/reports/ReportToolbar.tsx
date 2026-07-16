"use client";

import React from "react";
import { Download, FileText, Calendar, Mail, Settings2, LayoutDashboard } from "lucide-react";

export function ReportToolbar() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-border/60 rounded-xl p-3 shadow-sm mb-6">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Date Range Picker (Mock UI) */}
        <div className="flex items-center bg-white border border-border/60 rounded-lg p-1 shadow-sm">
          <button className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 rounded-md transition-colors">7D</button>
          <button className="px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground rounded-md shadow-sm">30D</button>
          <button className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 rounded-md transition-colors">3M</button>
          <button className="px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 rounded-md transition-colors">YTD</button>
          <div className="w-px h-4 bg-border/60 mx-1" />
          <button className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-slate-50 rounded-md transition-colors">
            <Calendar className="w-3.5 h-3.5" />
            Custom
          </button>
        </div>

        <div className="hidden sm:block w-px h-6 bg-border/60" />

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-foreground border border-border/60 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
            <LayoutDashboard className="w-4 h-4 text-muted-foreground" /> Dashboard Builder
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center bg-slate-50 border border-border/60 rounded-lg p-1">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white rounded-md transition-all">
            <FileText className="w-4 h-4" /> PDF
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white rounded-md transition-all">
            <Download className="w-4 h-4" /> Excel
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white rounded-md transition-all">
            <Download className="w-4 h-4" /> CSV
          </button>
        </div>
        
        <div className="w-px h-6 bg-border/60 mx-1" />

        <button className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors" title="Schedule Reports">
          <Calendar className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors" title="Email Report">
          <Mail className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
