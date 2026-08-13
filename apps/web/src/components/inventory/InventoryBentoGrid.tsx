"use client";

import React from "react";
import { motion } from "framer-motion";
import { Plus, Minus, QrCode, ArrowUpRight, AlertTriangle, Package, Warehouse } from "lucide-react";
import { cn } from "@/lib/utils";

interface InventoryBentoGridProps {
  items: any[];
  onAdjustStock: (id: number | string, delta: number) => void;
  onOpenQR: (item: any) => void;
  onPromote: (item: any) => void;
  onEdit: (item: any) => void;
}

export function InventoryBentoGrid({
  items,
  onAdjustStock,
  onOpenQR,
  onPromote,
  onEdit,
}: InventoryBentoGridProps) {
  if (items.length === 0) {
    return (
      <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-12 text-center text-muted-foreground my-6">
        <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
        <h3 className="text-base font-bold text-foreground">No Inventory Items Found</h3>
        <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 my-6">
      {items.map((item) => {
        const isLowStock = item.quantity <= item.reorderLevel;
        const isCritical = item.quantity === 0;
        const stockPct = Math.min(100, Math.round((item.quantity / Math.max(1, item.reorderLevel * 2)) * 100));

        return (
          <motion.div
            key={item.id}
            whileHover={{ scale: 1.01, y: -2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className={cn(
              "bg-card/40 backdrop-blur-xl border rounded-3xl p-5 flex flex-col justify-between shadow-sm transition-all duration-300 relative overflow-hidden group",
              isCritical
                ? "border-red-500/40 bg-red-500/5 hover:border-red-500/60"
                : isLowStock
                ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                : "border-border/50 hover:border-primary/30 hover:bg-card/70"
            )}
          >
            {/* Header */}
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-background/80 border border-border/60 text-muted-foreground shadow-sm">
                    {item.sku}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {item.category}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onOpenQR(item)}
                    className="p-1.5 rounded-xl bg-background/80 hover:bg-muted/80 border border-border/50 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="View QR Label"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onPromote(item)}
                    className="p-1.5 rounded-xl bg-background/80 hover:bg-primary/10 border border-border/50 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                    title="Promote to Tracked Hardware Asset"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Warehouse */}
              <h3
                onClick={() => onEdit(item)}
                className="text-base font-black text-foreground hover:text-primary transition-colors cursor-pointer tracking-tight"
              >
                {item.name}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                <Warehouse className="w-3.5 h-3.5" />
                <span>{item.warehouse || "Main HQ"} • Shelf {item.shelf || "A-1"}</span>
              </div>
            </div>

            {/* Middle: Stock Level Progress & Low Stock Alert */}
            <div className="my-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Current Quantity:</span>
                <span className={cn("font-mono text-base font-black", isCritical ? "text-red-500" : isLowStock ? "text-amber-500" : "text-foreground")}>
                  {item.quantity} <span className="text-[10px] font-normal text-muted-foreground">units</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted/40 h-2 rounded-full overflow-hidden p-0.5 border border-border/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stockPct}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-full rounded-full", isCritical ? "bg-red-500" : isLowStock ? "bg-amber-500" : "bg-emerald-500")}
                />
              </div>

              {/* Low Stock Warning Pill */}
              {isLowStock && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Reorder Level reached ({item.reorderLevel} min threshold)</span>
                </div>
              )}
            </div>

            {/* Bottom: Fast Quantity Adjustment Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-border/40">
              <span className="text-xs font-semibold text-muted-foreground">{item.cost !== "—" ? item.cost : "$0.00"} / unit</span>

              <div className="flex items-center gap-1.5 bg-background/80 border border-border/60 p-1 rounded-xl shadow-sm backdrop-blur-md">
                <button
                  onClick={() => onAdjustStock(item.id, -1)}
                  disabled={item.quantity <= 0}
                  className="w-7 h-7 rounded-lg bg-muted/60 hover:bg-muted text-foreground flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="Issue 1 item"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>

                <span className="px-2 font-mono text-xs font-bold text-foreground">{item.quantity}</span>

                <button
                  onClick={() => onAdjustStock(item.id, 1)}
                  className="w-7 h-7 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-colors cursor-pointer shadow-sm"
                  title="Receive 1 item"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
