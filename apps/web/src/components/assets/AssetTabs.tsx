"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AssetTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  "Overview",
  "Specifications",
  "History",
  "Repairs",
  "Software",
  "Accessories",
  "Documents",
  "Warranty",
  "Timeline"
];

export function AssetTabs({ activeTab, setActiveTab }: AssetTabsProps) {
  return (
    <div className="px-8 border-b border-border/60 bg-white sticky top-0 z-10">
      <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "py-4 text-sm font-semibold transition-all relative whitespace-nowrap",
              activeTab === tab
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full shadow-[0_-2px_8px_rgba(79,70,229,0.5)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
