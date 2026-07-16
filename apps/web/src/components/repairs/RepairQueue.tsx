"use client";

import React from "react";
import { Laptop, Smartphone, Printer, Search } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Mock Data ---
export interface RepairItem {
  id: string;
  ticketId: string;
  device: string;
  issue: string;
  status: "Diagnosis" | "Waiting Parts" | "Repairing" | "Ready";
  icon: any;
  date: string;
}

const repairQueue: RepairItem[] = [
  { id: "REP-901", ticketId: "TKT-1003", device: "MacBook Pro M2 Max", issue: "Battery Swelling", status: "Repairing", icon: Laptop, date: "Today" },
  { id: "REP-902", ticketId: "TKT-1044", device: "Dell XPS 15", issue: "Display flickering", status: "Waiting Parts", icon: Laptop, date: "Yesterday" },
  { id: "REP-903", ticketId: "TKT-1089", device: "iPhone 14 Pro", issue: "Shattered screen", status: "Diagnosis", icon: Smartphone, date: "Oct 12" },
  { id: "REP-904", ticketId: "TKT-1092", device: "HP LaserJet Pro", issue: "Paper jam error 42", status: "Ready", icon: Printer, date: "Oct 10" },
  { id: "REP-905", ticketId: "TKT-1101", device: "Lenovo ThinkPad X1", issue: "Keyboard sticky", status: "Repairing", icon: Laptop, date: "Oct 09" },
];

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Diagnosis": return "bg-slate-100  text-slate-600  border-slate-200 ";
    case "Waiting Parts": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Repairing": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Ready": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    default: return "bg-slate-100 text-slate-600";
  }
};

interface RepairQueueProps {
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function RepairQueue({ activeId, onSelect }: RepairQueueProps) {
  const [search, setSearch] = React.useState("");

  const filtered = repairQueue.filter((item) =>
    [item.id, item.ticketId, item.device, item.issue, item.status]
      .some((v) => v && typeof v === 'string' && v.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="bg-white border border-border/60 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border/40 bg-[#FAFAFA]">
        <h2 className="text-sm font-bold text-foreground mb-3">Active Repairs</h2>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search repairs..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-border/60 rounded-md text-xs outline-none focus:border-primary shadow-sm"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs text-muted-foreground">
            No repairs match &ldquo;{search}&rdquo;
          </div>
        ) : filtered.map((item) => (
          <div 
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={cn(
              "p-4 cursor-pointer transition-colors relative group",
              activeId === item.id 
                ? "bg-slate-50  border-l-2 border-l-primary" 
                : "hover:bg-slate-50/50  border-l-2 border-l-transparent"
            )}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors">{item.id}</span>
              <span className="text-[10px] font-medium text-muted-foreground">{item.date}</span>
            </div>
            
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <item.icon className="w-4 h-4 text-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{item.device}</p>
                <p className="text-xs text-muted-foreground truncate">{item.issue}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-3">
              <span className={cn("px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border", getStatusStyle(item.status))}>
                {item.status}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Ref: {item.ticketId}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { repairQueue };
