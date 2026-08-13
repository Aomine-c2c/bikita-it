"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Search, Filter, Download, MoreHorizontal, ArrowUpDown, Plus, RefreshCw } from "lucide-react";
import { cn, exportToCSV } from "@/lib/utils";
import { softwareApi, type SoftwareLicense } from "@/lib/api";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":   return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "Expiring": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Expired":  return "bg-red-500/10 text-red-600 border-red-500/20";
    default:         return "bg-slate-100 text-slate-600";
  }
};

export function SoftwareTable() {
  const [software, setSoftware] = useState<SoftwareLicense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  const load = useCallback(() => {
    setLoading(true);
    softwareApi
      .getAll()
      .then(setSoftware)
      .catch(() => setSoftware([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = software.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.vendor || "").toLowerCase().includes(q) ||
      (s.version || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-white border border-border/60 rounded-xl shadow-sm flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="p-4 border-b border-border/40 bg-[#FAFAFA] flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, vendor, version…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-border/60 rounded-lg text-sm outline-none focus:border-primary shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 border border-border/60 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => exportToCSV("software_licenses.csv", filtered)}
            className="flex items-center gap-2 px-3 py-2 border border-border/60 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#FAFAFA] text-xs uppercase text-muted-foreground font-bold tracking-wider sticky top-0 z-10 border-b border-border/40 shadow-sm">
            <tr>
              <th className="px-6 py-4">Software</th>
              <th className="px-6 py-4">Version</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4 text-center">Seats (Used / Total)</th>
              <th className="px-6 py-4 text-right">Cost/Seat</th>
              <th className="px-6 py-4">Expiry</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {loading && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground animate-pulse">
                  Loading licenses…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  No software licenses found. Add one to get started.
                </td>
              </tr>
            )}
            {filtered.map((item) => {
              const available   = item.totalSeats - item.assignedSeats;
              const utilization = item.totalSeats > 0 ? (item.assignedSeats / item.totalSeats) * 100 : 0;
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-foreground">{item.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {item.id}</div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{item.version || "—"}</td>
                  <td className="px-6 py-4 text-foreground">{item.vendor || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="font-bold text-foreground">{item.assignedSeats}</span>
                        <span className="text-xs text-muted-foreground">/ {item.totalSeats}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            utilization > 95 ? "bg-red-500" : utilization < 50 ? "bg-amber-500" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      {available === 0 && (
                        <span className="text-[9px] text-red-500 font-bold mt-1">No Seats Left</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-foreground">
                    ${(item.costPerSeat ?? 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    {item.expiryDate || "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded border", getStatusBadge(item.status))}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-slate-200 transition-colors opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
