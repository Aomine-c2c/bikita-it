"use client";

import React, { useMemo, useState } from "react";
import { RefreshCw, AlertCircle, Edit2, Repeat, Archive, Eye, CheckSquare, Square, Users, MapPin, Tag, X, Play } from "lucide-react";
import { cn, exportToCSV } from "@/lib/utils";
import { AssetProfileDrawer } from "./AssetProfileDrawer";
import { AssetFormModal } from "./AssetFormModal";
import { ReassignAssetModal } from "./ReassignAssetModal";
import { RetireAssetDialog } from "./RetireAssetDialog";
import { assetApi, operationsApi, employeesApi, locationsApi, type Asset, type Employee, type Location } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

const STATUS_STYLES: Record<string, { dot: string; badge: string; label: string }> = {
  ACTIVE:    { dot: "bg-emerald-500", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20", label: "Active" },
  IN_REPAIR: { dot: "bg-amber-500",   badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",     label: "In Repair" },
  IN_STOCK:  { dot: "bg-blue-500",    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",         label: "In Stock" },
  RETIRED:   { dot: "bg-slate-400",   badge: "bg-muted text-muted-foreground border-border",            label: "Retired" },
  ASSIGNED:  { dot: "bg-purple-500",  badge: "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20",   label: "Assigned" },
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

export function AssetTable({ activeCategory }: { activeCategory: string }) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [search, setSearch] = useState("");

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkModalType, setBulkModalType] = useState<"reassign" | "relocate" | "status" | null>(null);
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkLocation, setBulkLocation] = useState("");
  const [bulkStatus, setBulkStatus] = useState("ACTIVE");
  const [bulkNotes, setBulkNotes] = useState("");
  const [bulkExecuting, setBulkExecuting] = useState(false);

  // Modal states for single row actions
  const [modalActionAsset, setModalActionAsset] = useState<Asset | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);

  const { data: assets = [], isLoading: loading, isError: error, refetch } = useQuery<Asset[]>({
    queryKey: ["assets"],
    queryFn: assetApi.getAll,
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: employeesApi.getAll,
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["locations"],
    queryFn: locationsApi.getAll,
  });

  const filtered = useMemo(() => {
    let result = assets;
    if (
      activeCategory &&
      activeCategory.toUpperCase() !== "ALL" &&
      activeCategory.toLowerCase() !== "all assets"
    ) {
      result = result.filter(
        (a: Asset) => a.category?.toUpperCase() === activeCategory.toUpperCase()
      );
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (a: Asset) =>
          (a.name ?? "").toLowerCase().includes(q) ||
          (a.serialNumber ?? "").toLowerCase().includes(q) ||
          (a.assetTag ?? "").toLowerCase().includes(q) ||
          (a.assignedUser?.name ?? "").toLowerCase().includes(q) ||
          (a.location?.name ?? "").toLowerCase().includes(q) ||
          (a.category ?? "").toLowerCase().includes(q) ||
          (a.manufacturer ?? "").toLowerCase().includes(q) ||
          (a.model ?? "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [assets, activeCategory, search]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((a: Asset) => Number(a.id)).filter((id: number) => !isNaN(id)));
    }
  };

  const toggleSelectRow = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkAction = async () => {
    if (!bulkModalType || selectedIds.length === 0) return;
    setBulkExecuting(true);

    try {
      if (bulkModalType === "reassign") {
        await operationsApi.execute({
          operation_type: "BULK_REASSIGN_ASSETS",
          target_ids: selectedIds,
          params: { assigneeId: bulkAssignee ? Number(bulkAssignee) : null, notes: bulkNotes },
        });
      } else if (bulkModalType === "relocate") {
        await operationsApi.execute({
          operation_type: "BULK_RELOCATE_ASSETS",
          target_ids: selectedIds,
          params: { locationId: bulkLocation ? Number(bulkLocation) : null, notes: bulkNotes },
        });
      } else if (bulkModalType === "status") {
        await operationsApi.execute({
          operation_type: "BULK_STATUS_CHANGE",
          target_ids: selectedIds,
          params: { status: bulkStatus, reason: bulkNotes },
        });
      }
      setSelectedIds([]);
      setBulkModalType(null);
      refetch();
    } catch (err) {
      console.error("Bulk operation error:", err);
    } finally {
      setBulkExecuting(false);
    }
  };

  return (
    <>
      {/* Profile Drawer */}
      <AssetProfileDrawer
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        asset={selectedAsset}
      />

      {/* Edit Modal */}
      {modalActionAsset && (
        <AssetFormModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setModalActionAsset(null);
          }}
          onSuccess={() => {
            setIsEditModalOpen(false);
            setModalActionAsset(null);
            refetch();
          }}
          assetToEdit={modalActionAsset}
        />
      )}

      {/* Reassign Modal */}
      {modalActionAsset && (
        <ReassignAssetModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setIsReassignModalOpen(false);
            setModalActionAsset(null);
          }}
          onSuccess={() => {
            setIsReassignModalOpen(false);
            setModalActionAsset(null);
            refetch();
          }}
          assetId={String(modalActionAsset.id)}
          currentAssigneeId={modalActionAsset.assignedUser?.id ? String(modalActionAsset.assignedUser.id) : null}
        />
      )}

      {/* Retire Modal */}
      {modalActionAsset && (
        <RetireAssetDialog
          isOpen={isRetireModalOpen}
          onClose={() => {
            setIsRetireModalOpen(false);
            setModalActionAsset(null);
          }}
          onSuccess={() => {
            setIsRetireModalOpen(false);
            setModalActionAsset(null);
            refetch();
          }}
          assetId={String(modalActionAsset.id)}
          assetName={modalActionAsset.name}
        />
      )}

      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full font-sans relative">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-border/40 bg-muted/20 flex flex-wrap gap-4 items-center justify-between shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-60 max-w-md">
            <input
              type="text"
              placeholder="Filter by name, serial number, tag, assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary shadow-xs transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border/60 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => exportToCSV("hardware_assets_audit.csv", filtered)}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border/60 rounded-xl text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-xs"
            >
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Main Table Scroll Container */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Loading asset catalog from database...</span>
          </div>
        ) : error ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-6 h-6" />
            <span>Failed to load assets from server.</span>
          </div>
        ) : (
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-muted/40 text-[10px] uppercase text-muted-foreground font-black tracking-wider sticky top-0 z-20 border-b border-border/40 backdrop-blur-md">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <button
                      onClick={toggleSelectAll}
                      className="text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {selectedIds.length > 0 && selectedIds.length === filtered.length ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="px-5 py-3.5">Asset ID</th>
                  <th className="px-5 py-3.5">Device Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Vendor</th>
                  <th className="px-5 py-3.5">Model</th>
                  <th className="px-5 py-3.5">Serial Number</th>
                  <th className="px-5 py-3.5">Asset Tag</th>
                  <th className="px-5 py-3.5">Assigned User</th>
                  <th className="px-5 py-3.5">Location</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Condition</th>
                  <th className="px-5 py-3.5 text-center sticky right-0 bg-muted/60 backdrop-blur-md z-30 border-l border-border/40 shadow-xs">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="py-16 text-center text-xs text-muted-foreground">
                      No assets found matching &quot;{search}&quot;
                    </td>
                  </tr>
                ) : (
                  filtered.map((asset: Asset) => {
                    const isSelected = selectedIds.includes(Number(asset.id));
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => setSelectedAsset(asset)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          isSelected ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                        )}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => toggleSelectRow(Number(asset.id), e)}>
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary mx-auto" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground/60 group-hover:text-muted-foreground mx-auto" />
                          )}
                        </td>
                        <td className="px-5 py-3 font-mono font-bold text-primary">{asset.id}</td>
                        <td className="px-5 py-3 font-bold text-foreground group-hover:text-primary transition-colors">
                          {asset.name}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground capitalize">
                          {(asset.category || "Hardware").toLowerCase().replace("_", " ")}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{asset.manufacturer ?? "—"}</td>
                        <td className="px-5 py-3 font-semibold text-foreground">{asset.model ?? "—"}</td>
                        <td className="px-5 py-3">
                          <span className="font-mono text-muted-foreground bg-muted/40 rounded-md px-2 py-0.5 inline-block border border-border/40">
                            {asset.serialNumber ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-3 font-mono text-muted-foreground">{asset.assetTag ?? "—"}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shadow-xs",
                                asset.assignedUser ? "bg-primary" : "bg-muted-foreground/40"
                              )}
                            >
                              {initials(asset.assignedUser?.name)}
                            </div>
                            <span className="text-xs font-semibold text-foreground">
                              {asset.assignedUser?.name ?? "Unassigned"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{asset.location?.name ?? "—"}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={asset.status} />
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">{asset.condition ?? "Good"}</td>
                        <td
                          className="px-5 py-3 text-center sticky right-0 bg-background/90 backdrop-blur-md group-hover:bg-muted/80 z-20 border-l border-border/30 shadow-xs transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedAsset(asset)}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Inspect Profile"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setModalActionAsset(asset);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                              title="Edit Asset"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setModalActionAsset(asset);
                                setIsReassignModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Reassign Asset"
                            >
                              <Repeat className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setModalActionAsset(asset);
                                setIsRetireModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                              title="Retire Asset"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-2xl p-3 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border/60">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black flex items-center justify-center">
                {selectedIds.length}
              </span>
              <span className="text-xs font-bold text-foreground">Selected</span>
            </div>

            <button
              onClick={() => setBulkModalType("reassign")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>Bulk Reassign</span>
            </button>

            <button
              onClick={() => setBulkModalType("relocate")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Bulk Relocate</span>
            </button>

            <button
              onClick={() => setBulkModalType("status")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
            >
              <Tag className="w-3.5 h-3.5 text-primary" />
              <span>Change Status</span>
            </button>

            <button
              onClick={() => setSelectedIds([])}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Clear selection"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer */}
        {!loading && (
          <div className="px-5 py-3 border-t border-border/40 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing <span className="font-bold text-foreground">{filtered.length}</span> of{" "}
              <span className="font-bold text-foreground">{assets.length}</span> assets
            </span>
          </div>
        )}
      </div>

      {/* Bulk Operation Action Modal */}
      {bulkModalType && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                <Play className="h-4 w-4 text-primary fill-current" />
                <span>
                  {bulkModalType === "reassign" && `Bulk Reassign ${selectedIds.length} Assets`}
                  {bulkModalType === "relocate" && `Bulk Relocate ${selectedIds.length} Assets`}
                  {bulkModalType === "status" && `Update Status for ${selectedIds.length} Assets`}
                </span>
              </h3>
              <button
                onClick={() => setBulkModalType(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {bulkModalType === "reassign" && (
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Target Employee Custodian</label>
                  <select
                    value={bulkAssignee}
                    onChange={(e) => setBulkAssignee(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="">-- Unassigned (Return to Pool) --</option>
                    {employees.map((emp: Employee) => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || "No Dept"})</option>
                    ))}
                  </select>
                </div>
              )}

              {bulkModalType === "relocate" && (
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Target Destination Location</label>
                  <select
                    value={bulkLocation}
                    onChange={(e) => setBulkLocation(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="">-- Clear Location --</option>
                    {locations.map((loc: Location) => (
                      <option key={loc.id} value={loc.id}>{loc.name} ({loc.type || "Room"})</option>
                    ))}
                  </select>
                </div>
              )}

              {bulkModalType === "status" && (
                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">New Lifecycle Status</label>
                  <select
                    value={bulkStatus}
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="IN_REPAIR">IN_REPAIR</option>
                    <option value="IN_STOCK">IN_STOCK</option>
                    <option value="RESERVED">RESERVED</option>
                    <option value="RETIRED">RETIRED</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="font-medium text-foreground">Operation Notes & Reason</label>
                <textarea
                  rows={3}
                  placeholder="Provide operational reason or ticket code..."
                  value={bulkNotes}
                  onChange={(e) => setBulkNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <button
                onClick={() => setBulkModalType(null)}
                className="px-4 py-2 text-xs font-medium rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteBulkAction}
                disabled={bulkExecuting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                {bulkExecuting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                <span>Apply to {selectedIds.length} Assets</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
