"use client";

import React, { useState, useMemo } from "react";
import { Package, Send, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessoryTableProps {
  items: any[];
  onDispatch: (item: any) => void;
  onAdjustStock: (id: string, delta: number) => void;
}

export function AccessoryTable({
  items,
  onDispatch,
  onAdjustStock,
}: AccessoryTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return items.filter((i) => {
      return (
        !search ||
        [i.name, i.sku, i.category, i.location]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [items, search]);

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm my-4">
      {/* Search Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search accessory name, SKU tag, category, location..."
          className="w-full sm:w-80 px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
        />
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} Consumable SKUs</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Accessory SKU</th>
              <th className="px-5 py-3">Category</th>
              <th className="px-5 py-3">Stock Level</th>
              <th className="px-5 py-3">Unit Cost</th>
              <th className="px-5 py-3">Bin Location</th>
              <th className="px-5 py-3 text-right">Quick Dispatch</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No peripheral accessories found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isLow = item.stock <= (item.reorderLevel || 10);
                return (
                  <tr key={item.id} className="hover:bg-muted/40 transition-colors group">
                    <td className="px-5 py-3.5 font-bold text-foreground flex items-center gap-2">
                      <Package className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-bold">{item.name}</p>
                        <p className="text-[10px] font-mono text-muted-foreground">SKU: #{item.sku || "ACC-881"}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                        {item.category || "PERIPHERAL"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-background border border-border/60 rounded-xl px-2 py-0.5">
                          <button
                            onClick={() => onAdjustStock(item.id, -1)}
                            className="p-1 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className={cn("font-mono font-bold px-1.5", isLow ? "text-amber-500" : "text-foreground")}>
                            {item.stock}
                          </span>
                          <button
                            onClick={() => onAdjustStock(item.id, 1)}
                            className="p-1 hover:text-primary transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        {isLow && (
                          <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                            LOW STOCK
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      ${(item.unitCost || 29.99).toFixed(2)}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-muted-foreground">{item.location || "Shelf B4-12"}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => onDispatch(item)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer ml-auto"
                      >
                        <Send className="w-3 h-3" />
                        <span>Dispatch</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
