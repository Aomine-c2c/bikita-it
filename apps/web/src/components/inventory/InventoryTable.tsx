/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useState, useMemo } from "react";
import { MoreHorizontal, Box, QrCode, Barcode } from "lucide-react";
import { cn, exportToCSV } from "@/lib/utils";
import { TableSkeleton } from "@/components/skeletons/TableSkeleton";
import { InventoryFormModal } from "./InventoryFormModal";
import { LifecycleTransitionModal } from "./LifecycleTransitionModal";

const getQuantityColor = (quantity: number, reorderLevel: number) => {
  if (quantity === 0) return "bg-destructive/10 text-destructive border-destructive/20";
  if (quantity <= reorderLevel) return "bg-amber-500/10 text-amber-600 border-amber-500/20";
  return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
};

import { useQuery } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";

export function InventoryTable() {
  const [search, setSearch] = useState("");
  const [editItem, setEditItem] = useState<any>(null);
  const [actionItem, setActionItem] = useState<any>(null);

  const { data: inventory = [], isLoading: loading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const rawItems = await inventoryApi.getAll();
      return rawItems.map((item: unknown) => ({
        id: item.sku ?? item.id,
        sku: item.sku ?? item.id,
        item: item.name,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        // inventoryApi normalizes to camelCase, but handle snake_case fallback too
        reorderLevel: item.minStock ?? item.min_stock ?? 0,
        warehouse: (item.binLocation ?? item.bin_location)?.split('-')[0] ?? 'Main HQ',
        shelf: item.binLocation ?? item.bin_location ?? '—',
        supplier: item.supplier ?? '—',
        cost: (item.unitCost ?? item.unit_cost) != null ? `$${Number(item.unitCost ?? item.unit_cost).toFixed(2)}` : '—',
        trackable: item.type ?? 'CONSUMABLE',
      }));
    }
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return inventory;
    return inventory.filter((item: unknown) =>
      [item.id, item.item, item.name, item.category, item.supplier, item.warehouse, item.shelf]
        .some((v) => v && typeof v === 'string' && v.toLowerCase().includes(q))
    );
  }, [inventory, search]);

  if (loading) {
    return (
      <div className="mt-6 h-full flex flex-col">
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden flex flex-col mt-6">
      <div className="p-4 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between gap-4 sticky left-0">
        <div className="flex items-center gap-3">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search inventory"
              className="w-72 px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm"
            />
            <select aria-label="Filter by warehouse" className="text-xs bg-white border border-border/60 rounded-md px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm">
              <option>All Warehouses</option>
              <option>Main HQ</option>
              <option>Processing Plant</option>
            </select>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => exportToCSV('inventory_items.csv', inventory)} className="px-3 py-1.5 bg-white border border-border/60 rounded-md text-xs font-semibold text-foreground hover:bg-slate-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">Export CSV</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-[#FAFAFA]">
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-10 sticky left-0 bg-[#FAFAFA] z-10 backdrop-blur-sm border-r border-border/20">
                <input type="checkbox" aria-label="Select all rows" className="rounded border-muted-foreground/30 text-primary focus-visible:ring-2 focus-visible:ring-primary/20" />
              </th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider sticky left-10 bg-[#FAFAFA] z-10 backdrop-blur-sm border-r border-border/20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">SKU</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Item Name</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Quantity</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Reorder Level</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Warehouse</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Shelf</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Supplier</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-right">Unit Cost</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center">Codes</th>
              <th className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider text-center sticky right-0 bg-[#FAFAFA] z-10 backdrop-blur-sm border-l border-border/20 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={12} className="text-center py-16 text-sm text-muted-foreground">
                  <p>No inventory items found matching &ldquo;{search}&rdquo;</p>
                  {search && (
                    <button 
                      onClick={() => setSearch("")}
                      className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-md text-sm font-semibold hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      Clear Search
                    </button>
                  )}
                </td>
              </tr>
            ) : filtered.map((item: unknown, idx: number) => (
              <tr key={idx} className="border-b border-border/20 last:border-0 hover:bg-slate-50/80 transition-colors group">
                <td className="px-5 py-3 sticky left-0 bg-white group-hover:bg-slate-50/80 z-10 border-r border-border/20 transition-colors">
                  <input type="checkbox" aria-label={`Select row ${item.id}`} className="rounded border-muted-foreground/30 text-primary focus-visible:ring-2 focus-visible:ring-primary/20" />
                </td>
                <td className="px-5 py-3 text-xs font-semibold text-primary sticky left-10 bg-white group-hover:bg-slate-50/80 z-10 border-r border-border/20 shadow-[2px_0_5px_rgba(0,0,0,0.02)] transition-colors">{item.id}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-muted-foreground">
                      <Box className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{item.item}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{item.category}</td>
                <td className="px-5 py-3 text-right">
                  <span className={cn("inline-flex px-2.5 py-1 rounded-md text-xs font-bold border", getQuantityColor(item.quantity, item.reorderLevel))}>
                    {item.quantity}
                  </span>
                </td>
                <td className="px-5 py-3 text-right text-xs font-semibold text-muted-foreground">{item.reorderLevel}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{item.warehouse}</td>
                <td className="px-5 py-3 text-xs font-mono text-muted-foreground bg-slate-50 rounded inline-block mt-2.5">{item.shelf}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">{item.supplier}</td>
                <td className="px-5 py-3 text-right text-xs font-semibold text-foreground">{item.cost}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <button  aria-label="Print QR Code" title="Print QR Code" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded">
                      <QrCode className="w-4 h-4 hover:text-foreground transition-colors" />
                    </button>
                    <button  aria-label="Print Barcode" title="Print Barcode" className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded">
                      <Barcode className="w-4 h-4 hover:text-foreground transition-colors" />
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3 text-center sticky right-0 bg-white group-hover:bg-slate-50/80 z-10 border-l border-border/20 shadow-[-2px_0_5px_rgba(0,0,0,0.02)] transition-colors">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => setActionItem(item)}
                      aria-label={`Action for ${item.item}`} 
                      className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold uppercase tracking-wider rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      {item.trackable === "RETURNABLE" ? "Loan / Return" : item.trackable === "NON_RETURNABLE" ? "Install / Deploy" : item.trackable === "CONSUMABLE" ? "Consume" : "Assign"}
                    </button>
                    <button 
                      onClick={() => setEditItem(item)}
                      aria-label="More actions" 
                      title="More actions" 
                      className="p-1.5 rounded-md text-muted-foreground hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {editItem && (
        <InventoryFormModal
          isOpen={!!editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => {
            setEditItem(null);
            // invalidate queries or refetch would go here
          }}
          itemToEdit={editItem}
        />
      )}

      {actionItem && (
        <LifecycleTransitionModal
          isOpen={!!actionItem}
          onClose={() => setActionItem(null)}
          onSuccess={() => {
            setActionItem(null);
          }}
          item={actionItem}
        />
      )}
    </div>
  );
}
