"use client";

import React, { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryKPIs } from "@/components/inventory/InventoryKPIs";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { InventoryBentoGrid } from "@/components/inventory/InventoryBentoGrid";
import { BarcodeQRModal } from "@/components/inventory/BarcodeQRModal";
import { LifecycleTransitionModal } from "@/components/inventory/LifecycleTransitionModal";
import { InventoryFormModal } from "@/components/inventory/InventoryFormModal";
import { ReceiveStockFAB } from "@/components/inventory/ReceiveStockFAB";
import { motion } from "framer-motion";
import { LayoutGrid, Table, Search, AlertTriangle, Plus, RefreshCw, Filter } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryApi } from "@/lib/api";

export default function InventoryPage() {
  const queryClient = useQueryClient();

  // State
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);

  // Modals
  const [qrItem, setQrItem] = useState<any>(null);
  const [promoteItem, setPromoteItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Query Real Data
  const { data: rawInventory = [], isLoading, refetch } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const items = await inventoryApi.getAll();
      return items.map((item: any) => ({
        id: item.id,
        sku: item.sku ?? `SKU-${item.id}`,
        name: item.name,
        category: item.category || "General",
        quantity: item.quantity || 0,
        reorderLevel: item.minStock ?? item.min_stock ?? 5,
        warehouse: (item.binLocation ?? item.bin_location)?.split("-")[0] ?? "Main HQ",
        shelf: item.binLocation ?? item.bin_location ?? "A-1",
        supplier: item.supplier ?? "Vendor Inc",
        cost: item.unitCost != null ? `$${Number(item.unitCost).toFixed(2)}` : "$0.00",
        trackable: item.type ?? "CONSUMABLE",
      }));
    },
  });

  // Fast Stock Adjustment Mutation
  const adjustMutation = useMutation({
    mutationFn: async ({ id, delta }: { id: number | string; delta: number }) => {
      const current = rawInventory.find((i: any) => i.id === id);
      if (!current) return;
      const newQty = Math.max(0, current.quantity + delta);
      await inventoryApi.update(String(id), { quantity: newQty });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  // Extract Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    rawInventory.forEach((item: any) => set.add(item.category));
    return ["ALL", ...Array.from(set)];
  }, [rawInventory]);

  // Filtered Inventory
  const filtered = useMemo(() => {
    return rawInventory.filter((item: any) => {
      // Search
      const matchesSearch =
        !search ||
        [item.name, item.sku, item.category, item.warehouse, item.shelf]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()));

      // Category
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;

      // Low Stock
      const matchesLowStock = !onlyLowStock || item.quantity <= item.reorderLevel;

      return matchesSearch && matchesCategory && matchesLowStock;
    });
  }, [rawInventory, search, selectedCategory, onlyLowStock]);

  const lowStockCount = useMemo(() => {
    return rawInventory.filter((i: any) => i.quantity <= i.reorderLevel).length;
  }, [rawInventory]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Modals */}
        <BarcodeQRModal isOpen={!!qrItem} onClose={() => setQrItem(null)} item={qrItem} />

        <LifecycleTransitionModal
          isOpen={!!promoteItem}
          onClose={() => setPromoteItem(null)}
          onSuccess={() => {
            setPromoteItem(null);
            refetch();
          }}
          item={promoteItem}
        />

        <InventoryFormModal
          isOpen={isAddOpen || !!editItem}
          onClose={() => {
            setIsAddOpen(false);
            setEditItem(null);
          }}
          onSuccess={() => {
            setIsAddOpen(false);
            setEditItem(null);
            refetch();
          }}
          itemToEdit={editItem}
        />

        {/* Title Area */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-black tracking-tight text-foreground"
            >
              Inventory Management
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xs font-medium text-muted-foreground mt-1"
            >
              Bulk Stock Control, Warehouse Bin Locations & Asset Promotion
            </motion.p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync</span>
            </button>

            <button
              onClick={() => setIsAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stock Item</span>
            </button>
          </div>
        </div>

        {/* KPIs Overview */}
        <InventoryKPIs />

        {/* Search, Filter Bar & View Switcher */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-3 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          {/* Left: Search & Filter Pills */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Search Box */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search SKU, item name, shelf..."
                className="w-full pl-9 pr-3 py-1.5 bg-background/80 border border-border/50 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
              />
            </div>

            {/* Low Stock Alerts Pill */}
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                onlyLowStock
                  ? "bg-amber-500 text-white border-amber-600 shadow-sm"
                  : "bg-background/80 border-border/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Low Stock Alerts ({lowStockCount})</span>
            </button>
          </div>

          {/* Right: View Switcher */}
          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bento Grid</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Data Table</span>
            </button>
          </div>
        </div>

        {/* Content Body: Bento Grid or Mega Table */}
        {viewMode === "grid" ? (
          <InventoryBentoGrid
            items={filtered}
            onAdjustStock={(id, delta) => adjustMutation.mutate({ id, delta })}
            onOpenQR={(item) => setQrItem(item)}
            onPromote={(item) => setPromoteItem(item)}
            onEdit={(item) => setEditItem(item)}
          />
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <InventoryTable />
          </motion.div>
        )}

        {/* Floating Action Button */}
        <ReceiveStockFAB />
      </div>
    </DashboardLayout>
  );
}
