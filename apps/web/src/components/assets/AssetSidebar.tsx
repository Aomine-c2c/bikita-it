"use client";

import React from "react";
import { Laptop, Router, Server, Printer, BatteryCharging, Video, Phone, Headphones, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const categories = [
  { label: "All Assets", icon: LayoutGrid, count: 2450 },
  { label: "Computers", icon: Laptop, count: 1240 },
  { label: "Networking", icon: Router, count: 185 },
  { label: "Servers", icon: Server, count: 42 },
  { label: "Printers", icon: Printer, count: 88 },
  { label: "UPS", icon: BatteryCharging, count: 56 },
  { label: "CCTV", icon: Video, count: 112 },
  { label: "Phones", icon: Phone, count: 450 },
  { label: "Accessories", icon: Headphones, count: 277 },
];

export function AssetSidebar() {
  const [active, setActive] = React.useState("All Assets");

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-border/60 flex flex-col h-full rounded-l-[14px]">
      <div className="p-4 border-b border-border/40">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Categories</h3>
      </div>
      <div className="p-3 space-y-1 overflow-y-auto">
        {categories.map((cat) => (
          <button
            key={cat.label}
            onClick={() => setActive(cat.label)}
            className={cn(
              "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
              active === cat.label
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-slate-50  hover:text-foreground font-medium"
            )}
          >
            <div className="flex items-center gap-2.5">
              <cat.icon className={cn("w-4 h-4", active === cat.label ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              <span>{cat.label}</span>
            </div>
            <span className={cn(
              "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
              active === cat.label ? "bg-primary/20 text-primary" : "bg-slate-100  text-muted-foreground"
            )}>
              {cat.count}
            </span>
          </button>
        ))}
      </div>
      
      {/* Other filter blocks could go here in the future like 'Location' or 'Department' */}
    </aside>
  );
}
