 
 

"use client";

import React, { useMemo, useState } from "react";
import { MoreHorizontal, RefreshCw, AlertCircle } from "lucide-react";
import { cn, exportToCSV } from "@/lib/utils";
import { AssetProfileDrawer } from "./AssetProfileDrawer";
import { AssetFormModal } from "./AssetFormModal";
import { ReassignAssetModal } from "./ReassignAssetModal";
import { RetireAssetDialog } from "./RetireAssetDialog";
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

import { useQuery } from "@tanstack/react-query";

export function AssetTable({ activeCategory }: { activeCategory: string }) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [search, setSearch] = useState("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [activeDropdownId, setActiveDropdownId] = useState<number | string | null>(null);

  // Modal states
  const [modalActionAsset, setModalActionAsset] = useState<Asset | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = () => setActiveDropdownId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const { data: assets = [], isLoading: loading, error, refetch: fetchAssets } = useQuery({
    queryKey: ['assets'],
    queryFn: async () => {
      const data = await assetApi.getAll();
      return Array.isArray(data) ? data : (data as any as { data: Asset[] })?.data ?? [];
    }
  });

  const filtered = useMemo(() => {
    let filteredAssets = assets;
    
    // 1. Filter by active category
    if (activeCategory !== "All Assets") {
      filteredAssets = filteredAssets.filter((a: any) => (a.category || 'Uncategorized') === activeCategory);
    }

    // 2. Filter by search text
    const q = search.toLowerCase();
    if (!q) return filteredAssets;
    
    return filteredAssets.filter((a: any) =>
      [a.id, a.name, a.manufacturer, a.model, a.serialNumber, a.assignedUser?.name, a.location?.name]
        .some((v) => v && typeof v === 'string' && v.toLowerCase().includes(q))
    );
  }, [assets, search, activeCategory]);

  return (
    <>
      <div data-tour="assets-table" className="bg-card/40 backdrop-blur-xl rounded-2xl border border-border/50 shadow-sm overflow-hidden flex flex-col h-full relative z-10">
        {/* Top Action Bar */}
        <div className="p-4 border-b border-border/50 bg-background/60 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky top-0 left-0 z-20">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-72 px-3 py-1.5 bg-background/80 border border-border/50 rounded-md text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-sm transition-all"
            />
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-3 py-1.5 bg-background/80 border border-border/50 rounded-md text-xs font-semibold text-foreground hover:bg-accent/50 shadow-sm transition-all cursor-pointer"
            >
              {showAdvancedFilters ? "Hide Filters" : "Advanced Filters"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <span className="flex items-center gap-1.5 text-[10px] text-amber-600 font-semibold">
                <AlertCircle className="w-3 h-3" /> {(error as Error).message}
              </span>
            )}
            <button
              onClick={() => fetchAssets()}
              className="p-1.5 rounded-md text-muted-foreground hover:bg-slate-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            </button>
            <div className="w-px h-5 bg-border/50 mx-1" />
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.csv';
                input.onchange = (e: any) => {
                  const file = e.target.files?.[0];
                  if (file) alert(`Importing ${file.name}...`);
                };
                input.click();
              }}
              className="px-3 py-1.5 bg-background/80 border border-border/50 rounded-md text-xs font-semibold text-foreground hover:bg-accent/50 shadow-sm transition-all cursor-pointer"
            >
              Import
            </button>
            <button onClick={() => exportToCSV('assets.csv', assets)} className="px-3 py-1.5 bg-background/80 border border-border/50 rounded-md text-xs font-semibold text-foreground hover:bg-accent/50 shadow-sm transition-all">Export</button>
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
          <div className="overflow-x-auto flex-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1600px]">
              <thead>
                <tr className="border-b border-border/50 bg-background/80 backdrop-blur-md">
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky left-0 bg-background/90 backdrop-blur-md z-30 w-10 border-r border-border/30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                    <input type="checkbox" className="rounded border-border/50 bg-background/50 accent-primary" />
                  </th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky left-10 bg-background/90 backdrop-blur-md z-30 border-r border-border/30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">Asset ID</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Asset Name</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Category</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Manufacturer</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Model</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Serial Number</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Asset Tag</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Assigned User</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Location</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Status</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Condition</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest sticky top-0 z-20">Purchase Date</th>
                  <th className="px-5 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-center sticky right-0 bg-background/90 backdrop-blur-md z-30 border-l border-border/30 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="p-0">
                      <div className="sticky left-0 w-full flex justify-center py-16 text-sm text-muted-foreground">
                        No assets found matching &quot;{search}&quot;
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((asset: any) => (
                    <tr
                      key={(asset as any).id}
                      onClick={() => setSelectedAsset(asset)}
                      className="border-b border-border/30 hover:bg-accent/40 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3 sticky left-0 bg-background/80 backdrop-blur-md group-hover:bg-accent/80 z-10 border-r border-border/30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-colors" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="rounded border-border/50 bg-background/50 accent-primary" />
                      </td>
                      <td className="px-5 py-3 text-[11px] font-bold text-primary sticky left-10 bg-background/80 backdrop-blur-md group-hover:bg-accent/80 z-10 border-r border-border/30 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] transition-colors font-mono">{asset.id}</td>
                      <td className="px-5 py-3 text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">{asset.name}</td>
                      <td className="px-5 py-3 text-[11px] font-medium text-muted-foreground capitalize tracking-wide">{asset.category.toLowerCase().replace("_", " ")}</td>
                      <td className="px-5 py-3 text-[11px] font-medium text-muted-foreground">{asset.manufacturer ?? "—"}</td>
                      <td className="px-5 py-3 text-xs font-semibold text-foreground">{asset.model ?? "—"}</td>
                      <td className="px-5 py-3 text-[11px] font-mono font-medium text-muted-foreground bg-accent/30 rounded-md px-2 py-1 mx-5 my-2 inline-block border border-border/50">{asset.serialNumber ?? "—"}</td>
                      <td className="px-5 py-3 text-[11px] font-mono font-medium text-muted-foreground">{asset.assetTag ?? "—"}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-sm ring-1 ring-border/50", asset.assignedUser ? "bg-primary" : "bg-muted-foreground/30")}>
                            {initials(asset.assignedUser?.name)}
                          </div>
                          <span className="text-xs font-semibold text-foreground">{asset.assignedUser?.name ?? "Unassigned"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[11px] font-medium text-muted-foreground">{asset.location?.name ?? "—"}</td>
                      <td className="px-5 py-3"><StatusBadge status={asset.status} /></td>
                      <td className="px-5 py-3 text-[11px] font-medium text-muted-foreground">{asset.condition ?? "—"}</td>
                      <td className="px-5 py-3 text-[11px] font-medium text-muted-foreground font-mono">
                        {asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : "—"}
                      </td>
                      <td className="px-5 py-3 text-center sticky right-0 bg-background/80 backdrop-blur-md group-hover:bg-accent/80 z-10 border-l border-border/30 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)] transition-colors" onClick={(e) => e.stopPropagation()}>
                        <div className="relative inline-block text-left">
                          <button 
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors border border-transparent hover:border-border/50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownId(activeDropdownId === asset.id ? null : asset.id);
                            }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          
                          {activeDropdownId === asset.id && (
                            <div className="absolute right-0 mt-2 w-40 rounded-xl shadow-2xl bg-card/90 backdrop-blur-2xl ring-1 ring-border/50 z-50 overflow-hidden transform origin-top-right transition-all animate-in fade-in zoom-in-95 duration-100">
                              <div className="py-1" role="menu" aria-orientation="vertical">
                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); setModalActionAsset(asset); setIsEditModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 flex items-center gap-2 transition-colors" role="menuitem">
                                  Edit
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); setModalActionAsset(asset); setIsReassignModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent/80 flex items-center gap-2 transition-colors" role="menuitem">
                                  Reassign
                                </button>
                                <div className="h-px w-full bg-border/50 my-1" />
                                <button onClick={(e) => { e.stopPropagation(); setActiveDropdownId(null); setModalActionAsset(asset); setIsRetireModalOpen(true); }} className="w-full text-left px-4 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 hover:text-red-600 flex items-center gap-2 transition-colors" role="menuitem">
                                  Retire
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
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
          <div className="px-5 py-3 border-t border-border/50 bg-background/60 backdrop-blur-md flex items-center justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-bold text-foreground">{assets.length}</span> assets
            </span>
            {assets.length > 0 && (
              <div className="flex items-center gap-1.5">
                {["1"].map((p) => (
                  <button key={p} onClick={() => {}} className={cn("w-7 h-7 rounded-md text-[11px] font-bold transition-all bg-primary text-primary-foreground shadow-sm cursor-pointer")}>{p}</button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <AssetProfileDrawer
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
      />
      
      {/* Action Modals */}
      <AssetFormModal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setModalActionAsset(null); }} 
        onSuccess={() => { setIsEditModalOpen(false); setModalActionAsset(null); fetchAssets(); }}
        assetToEdit={modalActionAsset}
      />
      <ReassignAssetModal
        isOpen={isReassignModalOpen}
        onClose={() => { setIsReassignModalOpen(false); setModalActionAsset(null); }}
        onSuccess={() => { setIsReassignModalOpen(false); setModalActionAsset(null); fetchAssets(); }}
        assetId={modalActionAsset?.id as string}
        currentAssigneeId={modalActionAsset?.assigneeId || modalActionAsset?.assignedUser?.id}
      />
      <RetireAssetDialog
        isOpen={isRetireModalOpen}
        onClose={() => { setIsRetireModalOpen(false); setModalActionAsset(null); }}
        onSuccess={() => { setIsRetireModalOpen(false); setModalActionAsset(null); fetchAssets(); }}
        assetId={modalActionAsset?.id as string}
        assetName={modalActionAsset?.name || "Asset"}
      />
    </>
  );
}
