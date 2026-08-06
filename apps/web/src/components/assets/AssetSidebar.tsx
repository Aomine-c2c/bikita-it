/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useMemo } from "react";
import { Laptop, Router, Server, Printer, BatteryCharging, Video, Phone, Headphones, LayoutGrid, Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { assetApi, type Asset } from "@/lib/api";

const ICON_MAP: Record<string, React.ElementType> = {
  "computer": Laptop,
  "laptop": Laptop,
  "workstation": Laptop,
  "desktop": Laptop,
  "macbook": Laptop,
  "network": Router,
  "router": Router,
  "switch": Router,
  "firewall": Router,
  "server": Server,
  "printer": Printer,
  "ups": BatteryCharging,
  "battery": BatteryCharging,
  "cctv": Video,
  "camera": Video,
  "phone": Phone,
  "mobile": Phone,
  "accessory": Headphones,
  "headphone": Headphones,
  "monitor": LayoutGrid,
};

const getIconForCategory = (catName: string) => {
  const lower = catName.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) {
      return icon;
    }
  }
  return Box; // Default fallback icon
};

export function AssetSidebar({ activeCategory, onSelectCategory }: { activeCategory: string; onSelectCategory: (cat: string) => void }) {

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const data = await assetApi.getAll();
      return Array.isArray(data) ? data : (data as unknown as { data: Asset[] })?.data ?? [];
    }
  });

  const categories = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((asset: unknown) => {
      const cat = asset.category || 'Uncategorized';
      counts[cat] = (counts[cat] || 0) + 1;
    });

    const dynamicCats = Object.entries(counts)
      .map(([label, count]) => ({
        label,
        icon: getIconForCategory(label),
        count
      }))
      .sort((a, b) => b.count - a.count);

    return [
      { label: "All Assets", icon: LayoutGrid, count: assets.length },
      ...dynamicCats
    ];
  }, [assets]);

  return (
    <aside className="w-56 shrink-0 bg-white border-r border-border/60 flex flex-col h-full rounded-l-[14px]">
      <div className="p-4 border-b border-border/40">
        <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Categories</h3>
      </div>
      <div className="p-3 space-y-1 overflow-y-auto">
        {isLoading ? (
          <div className="text-xs text-muted-foreground px-3 py-2">Loading categories...</div>
        ) : (
          categories.map((cat) => (
            <button
              key={cat.label}
              onClick={() => onSelectCategory(cat.label)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors group",
                activeCategory === cat.label
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-slate-50 hover:text-foreground font-medium"
              )}
            >
              <div className="flex items-center gap-2.5">
                <cat.icon className={cn("w-4 h-4", activeCategory === cat.label ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                <span className="truncate text-left">{cat.label}</span>
              </div>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeCategory === cat.label ? "bg-primary/20 text-primary" : "bg-slate-100 text-muted-foreground"
              )}>
                {cat.count}
              </span>
            </button>
          ))
        )}
      </div>
      
      {/* Other filter blocks could go here in the future like 'Location' or 'Department' */}
    </aside>
  );
}
