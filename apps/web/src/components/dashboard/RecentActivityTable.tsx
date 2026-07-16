"use client";

import React from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const transactions = [
  {
    id: "#T-4910",
    user: "Sarah Jenkins",
    asset: "MacBook Pro M2",
    status: "Active",
    department: "Engineering",
    value: "$2,450",
  },
  {
    id: "#T-4911",
    user: "Mike Ross",
    asset: "Dell UltraSharp 32\"",
    status: "Active",
    department: "Design",
    value: "$890",
  },
  {
    id: "#T-4912",
    user: "IT Support",
    asset: "Cisco Meraki Switch",
    status: "Pending",
    department: "Infrastructure",
    value: "$1,750",
  },
  {
    id: "#T-4913",
    user: "System",
    asset: "Adobe CC License",
    status: "Expired",
    department: "Marketing",
    value: "$120/mo",
  },
];

export function RecentActivityTable() {
  return (
    <div className="bg-white rounded-[14px] border border-border/60 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-border/40 flex items-center justify-between bg-[#FAFAFA]">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Recent Allocations</h3>
          <div className="w-4 h-4 rounded-full bg-muted/20 flex items-center justify-center">
            <span className="text-[10px] text-muted-foreground/70 font-medium">?</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-48">
            <input
              type="text"
              placeholder="Search allocations..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-border/60 rounded-md text-xs outline-none"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">🔍</span>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs font-semibold text-foreground hover:bg-slate-50 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" />
            Add Asset
          </button>
        </div>
      </div>
      
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/40">
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-10">
                <input type="checkbox" className="rounded border-muted-foreground/30 text-primary" />
              </th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">User</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Department</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Value</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t, idx) => (
              <tr key={idx} className="border-b border-border/20 last:border-0 hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <input type="checkbox" className="rounded border-muted-foreground/30 text-primary" />
                </td>
                <td className="px-5 py-4 text-xs font-medium text-muted-foreground">{t.id}</td>
                <td className="px-5 py-4 text-sm font-semibold text-foreground">{t.user}</td>
                <td className="px-5 py-4 text-sm text-foreground">{t.asset}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full",
                        t.status === "Active" ? "bg-emerald-500" :
                        t.status === "Pending" ? "bg-amber-500" :
                        "bg-destructive"
                      )}
                    />
                    <span className="text-xs font-semibold text-muted-foreground">{t.status}</span>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-foreground">{t.department}</td>
                <td className="px-5 py-4 text-sm font-semibold text-foreground text-right">{t.value}</td>
                <td className="px-5 py-4 text-center">
                  <button className="p-1 rounded-md text-muted-foreground hover:bg-slate-100 transition-colors border border-transparent hover:border-border/50">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
