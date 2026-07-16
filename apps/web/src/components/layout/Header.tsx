"use client";

import React, { useState, useEffect } from "react";
import { Search, Bell, Settings, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const ROUTE_LABELS: Record<string, string> = {
  "/": "Dashboard",
  "/assets": "Asset Lifecycle",
  "/repairs": "Maintenance",
  "/network": "Network Devices",
  "/locations": "Locations",
  "/inventory": "Inventory",
  "/employees": "Employees",
  "/reports": "Reports",
  "/settings": "Settings",
};

interface HeaderProps {
  onToggleAI?: () => void;
  isAIOpen?: boolean;
}

export function Header({ onToggleAI, isAIOpen }: HeaderProps = {}) {
  const pathname = usePathname();
  const pageLabel = ROUTE_LABELS[pathname] ?? "Xiphos";

  return (
    <header className="h-16 bg-background flex items-center justify-between px-8 z-10 w-full shrink-0 border-b border-border/40">
      <div className="flex items-center gap-2 text-[13px]">
        <span className="text-muted-foreground font-medium">Xiphos</span>
        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
        <span className="text-foreground font-semibold">{pageLabel}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64" id="tour-search">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets, tickets, users..."
            className="w-full pl-9 pr-10 py-1.5 bg-[#F4F4F5] border-none rounded-md text-xs outline-none focus:ring-1 focus:ring-border transition-all placeholder:text-muted-foreground"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center justify-center bg-white rounded text-[9px] font-bold text-muted-foreground h-4 w-4 shadow-sm border border-border/50">
              K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pl-2">
          {/* AI Assistant Toggle */}
          <button
            id="tour-ai"
            onClick={onToggleAI}
            className={cn(
              "p-1.5 rounded-md transition-colors border shadow-sm flex items-center justify-center",
              isAIOpen
                ? "bg-zinc-100 border-border text-foreground"
                : "bg-white hover:bg-zinc-50 border-border/50 text-muted-foreground hover:text-foreground"
            )}
            title="Ask AI Assistant"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          <button className="p-1.5 rounded-md hover:bg-zinc-50 transition-colors text-muted-foreground hover:text-foreground border border-border/50 bg-white shadow-sm relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-primary rounded-full" />
          </button>

          <button className="p-1.5 rounded-md hover:bg-zinc-50 transition-colors text-muted-foreground hover:text-foreground border border-border/50 bg-white shadow-sm">
            <Settings className="w-4 h-4" />
          </button>

          <div className="w-7 h-7 rounded-full ml-2 overflow-hidden bg-slate-100 flex items-center justify-center border border-border/50 shadow-sm shrink-0 cursor-pointer">
            <span className="text-[9px] font-bold text-primary">JD</span>
          </div>
        </div>
      </div>
    </header>
  );
}

