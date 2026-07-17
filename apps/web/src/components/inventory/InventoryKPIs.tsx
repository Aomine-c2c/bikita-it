"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Clock, PackageSearch, XOctagon } from "lucide-react";
import { motion } from "framer-motion";
import { inventoryApi, type InventoryItem } from "@/lib/api";
import { cn } from "@/lib/utils";

export function InventoryKPIs() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => { inventoryApi.getAll().then(setItems).catch(() => setUnavailable(true)); }, []);

  const values = useMemo(() => ({
    total: items.reduce((sum, item) => sum + item.quantity, 0),
    low: items.filter((item) => item.quantity > 0 && item.quantity <= item.minStock).length,
    out: items.filter((item) => item.quantity === 0).length,
  }), [items]);

  const kpis = [
    { title: "Total Units", value: values.total, subtitle: `${items.length} inventory records`, icon: PackageSearch, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Low Stock", value: values.low, subtitle: "At or below reorder level", icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Out of Stock", value: values.out, subtitle: "Zero quantity records", icon: XOctagon, color: "text-destructive", bg: "bg-destructive/10" },
    { title: "Active Loans", value: "—", subtitle: "Not tracked by the current API", icon: Clock, color: "text-slate-500", bg: "bg-slate-500/10" },
  ];

  if (unavailable) return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Inventory metrics are unavailable because the API could not be reached.</div>;
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">{kpis.map((kpi, idx) => <motion.div key={kpi.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * .05 }} className="bg-white border rounded-2xl p-6 shadow-sm"><div className="flex justify-between"><div><p className="text-xs font-bold text-muted-foreground uppercase">{kpi.title}</p><h3 className="text-3xl font-bold mt-1">{kpi.value}</h3></div><div className={cn("w-12 h-12 rounded-xl grid place-items-center", kpi.bg, kpi.color)}><kpi.icon className="w-6 h-6" /></div></div><p className="text-xs text-muted-foreground border-t mt-4 pt-4">{kpi.subtitle}</p></motion.div>)}</div>;
}
