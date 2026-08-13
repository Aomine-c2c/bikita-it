"use client";

import React, { useState, useMemo } from "react";
import { Wrench, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface RepairTableProps {
  repairs: any[];
  onSelectRepair: (id: string) => void;
}

export function RepairTable({ repairs, onSelectRepair }: RepairTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return repairs.filter((r) => {
      return (
        !search ||
        [r.device, r.name, r.id, r.issue, r.status]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [repairs, search]);

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "COMPLETED":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "IN_PROGRESS":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "WAITING_PARTS":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm my-4">
      {/* Search Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search device name, repair ID, issue description..."
          className="w-full sm:w-80 px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
        />
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} Repair Records</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Repair ID</th>
              <th className="px-5 py-3">Device / Hardware</th>
              <th className="px-5 py-3">Reported Failure</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Repair Cost</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No hardware repair records found.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => onSelectRepair(String(r.id))}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-primary">#{r.id}</td>
                  <td className="px-5 py-3.5 font-bold text-foreground group-hover:text-primary transition-colors">
                    {r.device || r.name || "Hardware Asset"}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground truncate max-w-xs">{r.issue || "General maintenance"}</td>
                  <td className="px-5 py-3.5">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border", getStatusStyle(r.status))}>
                      {r.status || "QUEUED"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">$188.50</td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors inline-block" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
