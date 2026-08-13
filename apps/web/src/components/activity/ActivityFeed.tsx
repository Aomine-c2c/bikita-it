 
 

"use client";

import React, { useState, useEffect } from "react";
import { timelineApi, TimelineEvent } from "@/lib/api";
import { formatDistanceToNow, format } from "date-fns";
import { Box, Users, MapPin, Network, ClipboardList, Wrench, Activity, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const MODULES = [
  { id: "ALL", label: "All Modules" },
  { id: "HARDWARE_ASSET", label: "Assets", icon: Box },
  { id: "EMPLOYEE", label: "Employees", icon: Users },
  { id: "LOCATION", label: "Locations", icon: MapPin },
  { id: "NETWORK_DEVICE", label: "Network", icon: Network },
  { id: "INVENTORY", label: "Inventory", icon: ClipboardList },
  { id: "REPAIR", label: "Repairs", icon: Wrench },
];

const getModuleIcon = (type: string) => {
  const m = MODULES.find(m => m.id === type.toUpperCase());
  const Icon = m?.icon || Activity;
  return <Icon className="w-4 h-4" />;
};

const getModuleColor = (type: string) => {
  const t = type.toUpperCase();
  switch(t) {
    case "HARDWARE_ASSET": return "bg-blue-50 text-blue-700 border-blue-200";
    case "EMPLOYEE": return "bg-purple-50 text-purple-700 border-purple-200";
    case "LOCATION": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "NETWORK_DEVICE": return "bg-cyan-50 text-cyan-700 border-cyan-200";
    case "INVENTORY": return "bg-amber-50 text-amber-700 border-amber-200";
    case "REPAIR": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-slate-50 text-slate-700 border-slate-200";
  }
};

export function ActivityFeed() {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModule, setFilterModule] = useState<string>("ALL");

  const loadEvents = () => {
    setLoading(true);
    timelineApi.getTimeline(filterModule === "ALL" ? undefined : filterModule)
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadEvents();
    // Poll every 10 seconds for live updates
    const interval = setInterval(loadEvents, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterModule]);

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-220px)]">
      {/* Header & Filters */}
      <div className="p-4 border-b border-border/40 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full max-w-full">
          {MODULES.map(m => (
            <button
              key={m.id}
              onClick={() => setFilterModule(m.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors whitespace-nowrap",
                filterModule === m.id
                  ? "bg-primary text-white border-primary shadow-sm"
                  : "bg-white text-muted-foreground border-border/60 hover:bg-slate-50 hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="shrink-0 text-xs text-muted-foreground">
          Auto-updating live
        </div>
      </div>

      {/* Feed List */}
      <div className="flex-1 overflow-y-auto p-0">
        {loading && events.length === 0 ? (
          <div className="text-center text-muted-foreground p-12 text-sm animate-pulse">
            Loading activity stream...
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 border border-slate-100">
              <Search className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="font-bold text-lg text-foreground">No Activity Found</h3>
            <p className="text-muted-foreground max-w-sm mt-1">
              There are no recorded events for {filterModule === "ALL" ? "any module" : "this module"} yet.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {events.map((evt) => (
              <div key={evt.id} className="p-4 hover:bg-slate-50/50 transition-colors flex gap-4">
                {/* Icon */}
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0 border", getModuleColor(evt.module || evt.type || "UNKNOWN"))}>
                  {getModuleIcon(evt.module || evt.type || "UNKNOWN")}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        <span className="font-bold text-slate-900">System Admin</span>
                        <span className="text-muted-foreground mx-1">•</span>
                        {evt.description}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap text-right shrink-0">
                      {formatDistanceToNow(new Date((evt as any).createdAt || evt.created_at), { addSuffix: true })}
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {format(new Date((evt as any).createdAt || evt.created_at), "MMM d, h:mm a")}
                      </div>
                    </div>
                  </div>

                  {/* Metadata Chips */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {evt.module}
                    </span>
                    <span className="inline-flex text-[10px] font-mono bg-slate-50 text-slate-500 px-2 py-0.5 rounded border border-slate-100">
                      ID: {(evt as any).entityId || (evt as any).entity_id || evt.id.substring(0,8)}...
                    </span>
                    <span className={cn("inline-flex text-[10px] font-bold uppercase px-2 py-0.5 rounded border", 
                      evt.action === "CREATED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      evt.action === "DELETED" ? "bg-rose-50 text-rose-700 border-rose-200" :
                      "bg-blue-50 text-blue-700 border-blue-200"
                    )}>
                      {evt.action}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
