"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, PackageSearch, Truck, Wrench } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Repair = { status: string; createdAt: string };

export function RepairKPIs() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => { fetch("/api/repairs").then(async (res) => { if (!res.ok) throw new Error(); const body = await res.json(); setRepairs(body.data ?? body); }).catch(() => setUnavailable(true)); }, []);
  const stats = useMemo(() => {
    const now = new Date();
    return ({
    today: repairs.filter((r) => new Date(r.createdAt).toDateString() === now.toDateString()).length,
    waiting: repairs.filter((r) => r.status === "WAITING_PARTS").length,
    active: repairs.filter((r) => r.status !== "COMPLETED").length,
    completed: repairs.filter((r) => r.status === "COMPLETED" && new Date(r.createdAt).getMonth() === now.getMonth() && new Date(r.createdAt).getFullYear() === now.getFullYear()).length,
    });
  }, [repairs]);
  if (unavailable) return <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Repair metrics are unavailable because the API could not be reached.</div>;
  const kpis = [
    { title: "Created Today", value: stats.today, sub: "New repair records", icon: Wrench, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Waiting Parts", value: stats.waiting, sub: "Current queue", icon: PackageSearch, color: "text-amber-500", bg: "bg-amber-500/10" },
    { title: "Active Repairs", value: stats.active, sub: "Not completed", icon: Truck, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Completed (MTD)", value: stats.completed, sub: "Completed this month", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];
  return <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{kpis.map((kpi, idx) => <motion.div key={kpi.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * .05 }} className="bg-white border rounded-xl p-4 shadow-sm"><div className="flex justify-between"><div><p className="text-[10px] font-bold text-muted-foreground uppercase">{kpi.title}</p><h3 className="text-3xl font-bold">{kpi.value}</h3></div><div className={cn("w-10 h-10 rounded-lg grid place-items-center", kpi.bg, kpi.color)}><kpi.icon className="w-5 h-5" /></div></div><p className="text-[10px] text-muted-foreground border-t mt-2 pt-2">{kpi.sub}</p></motion.div>)}</div>;
}
