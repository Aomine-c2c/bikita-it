"use client";

import React, { useState, useEffect } from "react";
import { Search, Download, MoreHorizontal, RefreshCw } from "lucide-react";
import { cn, exportToCSV } from "@/lib/utils";
import { softwareApi, type SoftwareLicense } from "@/lib/api";

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Active":   return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
    case "Expiring": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "Expired":  return "bg-destructive/10 text-destructive border-destructive/20";
    default:         return "bg-muted text-muted-foreground border-border";
  }
};

interface SoftwareTableProps {
  onEdit?: (item: SoftwareLicense) => void;
  activeFilter?: string;
}

export function SoftwareTable({ onEdit, activeFilter }: SoftwareTableProps) {
  const [software, setSoftware] = useState<SoftwareLicense[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");

  const refresh = () => {
    setLoading(true);
    softwareApi
      .getAll()
      .then(setSoftware)
      .catch(() => setSoftware([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let ignore = false;
    softwareApi
      .getAll()
      .then((data) => {
        if (!ignore) {
          setSoftware(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setSoftware([]);
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, []);

  const filtered = software.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      s.name.toLowerCase().includes(q) ||
      (s.vendor || "").toLowerCase().includes(q) ||
      (s.version || "").toLowerCase().includes(q);

    let matchesFilter = true;
    if (activeFilter === "unassigned") {
      matchesFilter = s.totalSeats - s.assignedSeats > 0;
    } else if (activeFilter === "duplicates") {
      matchesFilter = s.name.toLowerCase().includes("365") || s.name.toLowerCase().includes("adobe");
    } else if (activeFilter === "expiring") {
      matchesFilter = s.status === "Expiring" || s.status === "Expired";
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl shadow-sm flex flex-col h-full overflow-hidden font-sans">
      {/* Toolbar */}
      <div className="p-4 border-b border-border/40 bg-muted/20 flex flex-wrap gap-4 items-center justify-between shrink-0">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search licenses by title, vendor, version…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary shadow-xs transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          {activeFilter && (
            <span className="text-[10px] font-bold font-mono px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              Filter: {activeFilter}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border/60 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => exportToCSV("software_licenses.csv", filtered)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-card border border-border/60 rounded-xl text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-primary" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto custom-scrollbar">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground font-black tracking-wider sticky top-0 z-10 border-b border-border/40 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4">Software Application</th>
              <th className="px-6 py-4">Version</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4 text-center">Seat Allocation (Used / Total)</th>
              <th className="px-6 py-4 text-right">Cost / Seat</th>
              <th className="px-6 py-4">Renewal / Expiry</th>
              <th className="px-6 py-4">License Status</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {loading && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-xs text-muted-foreground animate-pulse">
                  Loading software license catalog…
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center text-xs text-muted-foreground">
                  No software licenses match your search criteria.
                </td>
              </tr>
            )}
            {filtered.map((item) => {
              const available   = item.totalSeats - item.assignedSeats;
              const utilization = item.totalSeats > 0 ? (item.assignedSeats / item.totalSeats) * 100 : 0;
              return (
                <tr key={item.id} className="hover:bg-muted/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{item.name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground mt-0.5">ID: {item.id}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{item.version || "vLatest"}</td>
                  <td className="px-6 py-4 font-semibold text-foreground">{item.vendor || "Enterprise SaaS"}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center">
                      <div className="flex items-baseline gap-1 mb-1 font-mono">
                        <span className="font-bold text-foreground">{item.assignedSeats}</span>
                        <span className="text-[10px] text-muted-foreground">/ {item.totalSeats}</span>
                      </div>
                      <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden border border-border/40">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            utilization > 95 ? "bg-destructive" : utilization < 50 ? "bg-amber-500" : "bg-primary"
                          )}
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                      {available === 0 && (
                        <span className="text-[9px] text-destructive font-black mt-1">Full Capacity</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-foreground">
                    ${(item.costPerSeat ?? 0).toFixed(2)}/mo
                  </td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">
                    {item.expiryDate || "Continuous"}
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full border inline-flex items-center gap-1", getStatusBadge(item.status))}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onEdit?.(item)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    >
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
