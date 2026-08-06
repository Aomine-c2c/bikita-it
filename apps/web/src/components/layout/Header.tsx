"use client";

import React from "react";
import { Search, Bell, Settings, ChevronRight, Sparkles, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
  "/operations": "Operations Center",
  "/knowledge": "Knowledge Base",
  "/documentation": "Documentation",
  "/sops": "Standard Operating Procedures",
  "/manuals": "Manual Library",
};

interface HeaderProps {
  onToggleAI?: () => void;
  isAIOpen?: boolean;
  onMenuToggle?: () => void;
}

export function Header({ onToggleAI, isAIOpen, onMenuToggle }: HeaderProps = {}) {
  const pathname = usePathname();
  const pageLabel = ROUTE_LABELS[pathname] ?? "Pulse";

  return (
    <header className="h-18 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 z-30 w-full shrink-0 border-b border-border/40 sticky top-0">
      <div className="flex items-center gap-2 md:gap-3 text-[13px]">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 text-muted-foreground"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-border/40 shadow-xs">
           <span className="text-muted-foreground font-bold tracking-tight">PULSE</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        <span className="text-foreground font-black tracking-tight text-sm">{pageLabel}</span>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <motion.div 
          initial={false}
          animate={{ width: "auto" }}
          className="relative group hidden md:block" 
          id="tour-search"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Search assets, tickets, users..."
            className="w-full pl-11 pr-12 py-2.5 bg-[#F4F4F5]/60 border border-transparent rounded-xl text-[13px] font-medium outline-none focus:bg-white focus:border-border focus:shadow-premium transition-all placeholder:text-muted-foreground/50"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="hidden sm:inline-flex items-center justify-center bg-white rounded-lg text-[10px] font-black text-muted-foreground/40 h-5 px-1.5 shadow-sm border border-border/50">
              ⌘ K
            </kbd>
          </div>
        </motion.div>

        <div className="flex items-center gap-2">
          {/* AI Assistant Toggle */}
          <button
            id="tour-ai"
            onClick={onToggleAI}
            className={cn(
              "h-10 px-3 rounded-xl transition-all border shadow-sm flex items-center gap-2 font-bold text-xs",
              isAIOpen
                ? "bg-primary text-white border-primary shadow-premium"
                : "bg-white hover:bg-zinc-50 border-border/50 text-muted-foreground hover:text-foreground shadow-xs"
            )}
            title="Ask AI Assistant"
            aria-label="Ask AI Assistant"
          >
            <Sparkles className={cn("w-4 h-4 shrink-0", isAIOpen ? "animate-pulse" : "")} />
            <span className="hidden sm:inline">{!isAIOpen ? "Ask AI" : "Assistant Active"}</span>
          </button>

          <div className="h-8 w-px bg-border/20 mx-0.5 md:mx-1" />

          <button 
            onClick={() => window.location.href = '/settings'}
            className="p-2.5 rounded-xl hover:bg-zinc-50 transition-all text-muted-foreground hover:text-foreground border border-border/40 bg-white shadow-xs relative group hidden sm:block"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-white" />
          </button>

          <button 
            onClick={() => window.location.href = '/settings'}
            className="p-2.5 rounded-xl hover:bg-zinc-50 transition-all text-muted-foreground hover:text-foreground border border-border/40 bg-white shadow-xs hidden sm:block"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>

          <div className="ml-1 md:ml-2 pl-2 md:pl-4 border-l border-border/20">
            <button  
              aria-label="User profile"
              className="w-9 h-9 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center border border-border/50 shadow-sm shrink-0 cursor-pointer hover:border-primary/30 transition-colors"
            >
              <span className="text-[10px] font-black text-primary">JD</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
