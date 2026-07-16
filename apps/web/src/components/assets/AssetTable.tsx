"use client";

import React, { useEffect, useState } from "react";
import { MoreHorizontal, Laptop, Monitor, Server, Router, HardDrive, Shield, RefreshCw, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetProfileDrawer } from "./AssetProfileDrawer";
import { assetApi, type Asset } from "@/lib/api";



const STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  ACTIVE:    { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", label: "Active" },
  IN_REPAIR: { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-700 border-amber-500/20",     label: "In Repair" },
  IN_STOCK:  { dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-700 border-blue-500/20",         label: "In Stock" },
  RETIRED:   { dot: "bg-slate-400",   badge: "bg-slate-100 text-slate-600 border-slate-200",            label: "Retired" },
  ASSIGNED:  { dot: "bg-purple-500",  badge: "bg-purple-500/10 text-purple-700 border-purple-500/20",   label: "Assigned" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["RETIRED"];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", s.badge)}>
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", s.dot)} />
      {s.label}
    </span>
  );
}

function initials(name?: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function AssetTable() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [search, setSearch] = useState("");

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await assetApi.getAll();
      // API returns { data: assets[], pagination: {...} }
      const assetsArray = Array.isArray(data) ? data : (data as any)?.data ?? [];
      setAssets(assetsArray);
    } catch (e: any) {
      console.error("API unavailable:", e.message);
      setError("API offline — unable to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssets(); }, []);

  const filtered = assets.filter((a) =>
    [a.id, a.name, a.manufacturer, a.model, a.serialNumber, a.assignedUser?.name, a.location?.name]
      .some((v) => v?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <div className="bg-white rounded-[14px] border border-border/60 shadow-sm overflow-hidden flex flex-col h-full">
        {/* Top Action Bar */}
        <div className="p-4 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between gap-4 sticky left-0">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-72 px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs outline-none focus:border-primary shadow-sm"
            />
            <button className="px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs font-semibold text-foreground hover:bg-slate-50 shadow-sm">
              Advanced Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="flex items-center gap-1.5 text-[10px] text-amber-600 font-semibold">
                <AlertCircle className="w-3 h-3" /> {error}
              </span>
            )}
            <button
              onClick={fetchAssets}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-slate-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
            <div className="w-px h-5 bg-border mx-1" />
            <button className="px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs font-semibold text-foreground hover:bg-slate-50 shadow-sm">Import</button>
            <button className="px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs font-semibold text-foreground hover:bg-slate-50 shadow-sm">Export</button>
          </div>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="flex-1 flex flex-col divide-y divide-border/20">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                <div className="w-4 h-4 rounded bg-slate-100" />
                <div className="w-20 h-3 rounded bg-slate-100" />
                <div className="w-40 h-3 rounded bg-slate-100" />
                <div className="w-24 h-3 rounded bg-slate-100" />
                <div className="w-32 h-3 rounded bg-slate-100" />
                <div className="ml-auto w-16 h-5 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1600px]">
              <thead>
                <tr className="border-b border-border/40 bg-[#FAFAFA]">
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky left-0 bg-[#FAFAFA] z-10 w-10 border-r border-border/20">
                    <input type="checkbox" className="rounded border-muted-foreground/30" />
                  </th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky left-10 bg-[#FAFAFA] z-10 border-r border-border/20">Asset ID</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset Name</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Manufacturer</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Model</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Serial Number</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Asset Tag</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Assigned User</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Location</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Condition</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Purchase Date</th>
                  <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center sticky right-0 bg-[#FAFAFA] z-10 border-l border-border/20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="text-center py-16 text-sm text-muted-foreground">
                      No assets found matching &quot;{search}&quot;
                    </td>
                  </tr>
                ) : (
                  filtered.map((asset) => (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAsset(asset)}
                      className="border-b border-border/20 hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-border/20 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-muted-foreground/30" />
                      </td>
                      <td className="px-5 py-3 text-xs font-semibold text-primary sticky left-10 bg-white group-hover:bg-slate-50/80 z-10 border-r border-border/20 transition-colors font-mono">{asset.id}</td>
                      <td className="px-5 py-3 text-sm font-semibold text-foreground">{asset.name}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground capitalize">{asset.category.toLowerCase().replace("_", " ")}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{asset.manufacturer ?? "—"}</td>
                      <td className="px-5 py-3 text-sm text-foreground">{asset.model ?? "—"}</td>
                      <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{asset.serialNumber ?? "—"}</td>
                      <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{asset.assetTag ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm", asset.assignedUser ? "bg-primary" : "bg-slate-300")}>
                            {initials(asset.assignedUser?.name)}
                          </div>
                          <span className="text-sm font-medium text-foreground">{asset.assignedUser?.name ?? "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{asset.location?.name ?? "—"}</td>
                      <td className="px-5 py-3"><StatusBadge status={asset.status} /></td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">{asset.condition ?? "—"}</td>
                      <td className="px-5 py-3 text-xs text-muted-foreground">
                        {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-3 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l border-border/20 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <button className="p-1 rounded-md text-muted-foreground hover:bg-slate-200 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="px-5 py-3 border-t border-border/40 bg-[#FAFAFA] flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-semibold text-foreground">{assets.length}</span> assets
            </span>
            <div className="flex items-center gap-1">
              {["1","2","3","...","12"].map((p) => (
                <button key={p} className={cn("w-7 h-7 rounded text-xs font-medium", p === "1" ? "bg-primary text-white" : "text-muted-foreground hover:bg-slate-100")}>{p}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      <AssetProfileDrawer
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
      />
    </>
  );
}
