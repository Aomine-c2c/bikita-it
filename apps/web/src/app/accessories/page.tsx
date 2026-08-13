"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DispatchAccessoryModal } from "@/components/accessories/DispatchAccessoryModal";
import { AccessoryTable } from "@/components/accessories/AccessoryTable";
import { exportToCSV } from "@/lib/utils";
import { motion } from "framer-motion";
import { accessoriesApi, type AccessoryItem } from "@/lib/api";
import {
  Package, Plus, Minus, Send, Download, RefreshCw, LayoutGrid, Table,
  AlertTriangle, DollarSign, Layers, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { id: "ALL",            label: "All Accessories" },
  { id: "KEYBOARDS_MICE", label: "Keyboards & Mice" },
  { id: "DOCKS_ADAPTERS", label: "Docks & Adapters" },
  { id: "POWER_ADAPTERS", label: "Power Adapters" },
  { id: "AUDIO_HEADSETS", label: "Audio & Headsets" },
  { id: "CABLES",         label: "Display & Cables" },
  { id: "GENERAL",        label: "General" },
];

export default function AccessoriesPage() {
  const [accessories, setAccessories] = useState<AccessoryItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("ALL");
  const [viewMode, setViewMode]       = useState<"cards" | "table">("table");
  const [dispatchItem, setDispatchItem] = useState<AccessoryItem | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    accessoriesApi
      .getAll()
      .then(setAccessories)
      .catch(() => setAccessories([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdjustStock = async (id: string, delta: number) => {
    try {
      if (delta < 0) {
        const updated = await accessoriesApi.dispatch(id, Math.abs(delta));
        setAccessories((prev) => prev.map((a) => (a.id === id ? (updated as AccessoryItem) : a)));
      } else {
        const updated = await accessoriesApi.restock(id, delta);
        setAccessories((prev) => prev.map((a) => (a.id === id ? (updated as AccessoryItem) : a)));
      }
    } catch {
      // Optimistic fallback
      setAccessories((prev) =>
        prev.map((a) => (a.id === id ? { ...a, stock: Math.max(0, a.stock + delta) } : a))
      );
    }
  };

  const handleDispatchSuccess = async (id: string, qty: number) => {
    try {
      const updated = await accessoriesApi.dispatch(id, qty);
      setAccessories((prev) => prev.map((a) => (a.id === id ? (updated as AccessoryItem) : a)));
    } catch {
      setAccessories((prev) =>
        prev.map((a) => (a.id === id ? { ...a, stock: Math.max(0, a.stock - qty) } : a))
      );
    }
    setDispatchItem(null);
  };

  const filtered = accessories.filter(
    (item) => activeTab === "ALL" || item.category === activeTab
  );

  const totalStock   = accessories.reduce((s, i) => s + i.stock, 0);
  const lowCount     = accessories.filter((i) => i.stock <= i.reorderLevel).length;
  const totalValue   = accessories.reduce((s, i) => s + i.stock * i.unitCost, 0);

  const kpiCards = [
    { label: "Total Peripheral Units",    value: loading ? "…" : totalStock, icon: Package,      color: "text-blue-500",   bg: "bg-blue-500/10"   },
    { label: "Low-Stock Reorder Alerts",  value: loading ? "…" : lowCount,   icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-500/10"  },
    { label: "Consumables Inventory Value",value: loading ? "…" : `$${totalValue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Total SKUs Tracked",        value: loading ? "…" : accessories.length, icon: Layers, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {dispatchItem && (
          <DispatchAccessoryModal
            isOpen={!!dispatchItem}
            onClose={() => setDispatchItem(null)}
            accessory={dispatchItem}
            onSuccess={handleDispatchSuccess}
          />
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Package className="w-5 h-5" />
              </div>
              Consumables & Peripheral Accessories
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Stock Tracking, Low-Stock Reorder Triggers & Employee Dispatch Roster
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={load}
              disabled={loading}
              className="p-2 rounded-xl border border-border/60 bg-card hover:bg-muted/60 text-muted-foreground disabled:opacity-50 transition-all"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <button
              onClick={() => exportToCSV("accessories_inventory.csv", accessories)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-primary" /> Export CSV
            </button>
          </div>
        </div>

        {/* KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className={cn("text-2xl font-black tracking-tight", loading ? "animate-pulse text-muted-foreground" : "text-foreground")}>
                    {kpi.value}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} border border-border/40 flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Category + View switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl border border-border/50 p-2 rounded-2xl">
          <div className="flex items-center gap-2 overflow-x-auto">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap",
                  activeTab === cat.id
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/80 border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm self-end sm:self-auto">
            {(["cards", "table"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "cards" ? <LayoutGrid className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
                {m === "cards" ? "Stock Cards" : "Data Table"}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loading && (
              <div className="col-span-full text-center py-12 text-xs text-muted-foreground animate-pulse">
                Loading accessories…
              </div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="col-span-full text-center py-12 text-xs text-muted-foreground border border-dashed border-border/60 rounded-3xl">
                No accessories found. Add some via the backend or sync from inventory.
              </div>
            )}
            {filtered.map((item) => {
              const isLow = item.stock <= item.reorderLevel;
              return (
                <motion.div
                  key={item.id}
                  whileHover={{ y: -3 }}
                  className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">SKU: {item.sku}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                        {item.category}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-foreground">{item.name}</h3>
                    {item.location && <p className="text-xs text-muted-foreground mt-0.5">📍 {item.location}</p>}
                  </div>
                  <div className="pt-3 border-t border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 bg-background border border-border/60 rounded-xl px-2 py-1 shadow-inner">
                        <button onClick={() => handleAdjustStock(item.id, -1)} className="p-1 hover:text-primary transition-colors cursor-pointer">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className={cn("font-mono font-bold text-xs px-2", isLow ? "text-amber-500" : "text-foreground")}>
                          {item.stock}
                        </span>
                        <button onClick={() => handleAdjustStock(item.id, 1)} className="p-1 hover:text-primary transition-colors cursor-pointer">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      {isLow && (
                        <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">LOW</span>
                      )}
                    </div>
                    <button
                      onClick={() => setDispatchItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-sm cursor-pointer"
                    >
                      <Send className="w-3 h-3" /> Dispatch
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <AccessoryTable items={filtered} onDispatch={setDispatchItem} onAdjustStock={handleAdjustStock} />
        )}
      </div>
    </DashboardLayout>
  );
}
