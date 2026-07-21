"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Mail, Phone, Building, UserCircle, DownloadCloud } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";

interface EmployeeHeroProps {
  employeeId: string;
}

export function EmployeeHero({ employeeId }: EmployeeHeroProps) {
  const [emp, setEmp] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    apiFetch<any>(`/users/${employeeId}`)
      .then(data => {
        setEmp({
          id: data.id,
          name: data.name,
          role: data.position ?? data.role ?? 'Employee',
          department: data.department ?? '—',
          email: data.email,
          phone: data.office ?? '—',
          manager: '—', // Or fetch from a manager relation if added later
          avatar: data.name ? data.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?",
          status: 'Active',
          equipmentValue: '$0', // Or calculate from assets if value is tracked
          activeAssets: data.assets ?? 0,
        });
        setLoading(false);
      })
      .catch(e => {
        console.error("Failed to fetch employee:", e);
        setLoading(false);
      });
  }, [employeeId]);

  if (loading || !emp) {
    return (
      <div className="bg-white border-b border-border/60 pb-8 pt-2 animate-pulse">
        <div className="h-8 bg-slate-100 rounded w-1/4 mx-8 mb-8" />
        <div className="px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-3xl bg-slate-100" />
            <div className="space-y-3">
              <div className="h-8 bg-slate-100 rounded w-48" />
              <div className="h-4 bg-slate-100 rounded w-32" />
              <div className="flex gap-2">
                <div className="h-6 bg-slate-100 rounded-full w-20" />
                <div className="h-6 bg-slate-100 rounded-full w-24" />
              </div>
            </div>
          </div>
          <div className="bg-slate-100 rounded-2xl w-64 h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-border/60 pb-8 pt-2">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between mb-8 px-8">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/employees" className="hover:text-foreground transition-colors">Employees</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">{emp.name}</span>
        </div>
        <button className="flex items-center justify-center p-2 bg-slate-50 border border-border/60 rounded-lg text-foreground hover:bg-slate-100 transition-colors shadow-sm">
          <DownloadCloud className="w-4 h-4" />
        </button>
      </div>

      {/* Hero Content */}
      <div className="px-8 flex flex-col md:flex-row md:items-center justify-between gap-8">
        
        {/* Identity */}
        <div className="flex items-center gap-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-24 h-24 rounded-3xl bg-primary text-white flex items-center justify-center text-3xl font-bold shadow-xl border-4 border-white"
          >
            {emp.avatar}
          </motion.div>
          <div>
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 mb-1"
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{emp.name}</h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {emp.status}
              </span>
            </motion.div>
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-base text-muted-foreground font-medium mb-3"
            >
              {emp.role}
            </motion.p>
            
            {/* Quick Contact Pills */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap items-center gap-3"
            >
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-border/60 rounded-full text-xs font-semibold text-foreground">
                <Building className="w-3 h-3 text-muted-foreground" /> {emp.department}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-border/60 rounded-full text-xs font-semibold text-foreground">
                <Mail className="w-3 h-3 text-muted-foreground" /> {emp.email}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-border/60 rounded-full text-xs font-semibold text-foreground">
                <Phone className="w-3 h-3 text-muted-foreground" /> {emp.phone}
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-border/60 rounded-full text-xs font-semibold text-foreground">
                <UserCircle className="w-3 h-3 text-muted-foreground" /> Mgr: {emp.manager}
              </span>
            </motion.div>
          </div>
        </div>

        {/* Financial Summary */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-border/60 rounded-2xl p-6 min-w-[240px] shadow-sm relative overflow-hidden"
        >
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 relative z-10">Total Equipment Value</p>
          <p className="text-4xl font-bold tracking-tight text-foreground relative z-10">{emp.equipmentValue}</p>
          <div className="mt-4 pt-4 border-t border-border/40 flex justify-between items-center text-xs relative z-10">
            <span className="text-muted-foreground font-medium">{emp.activeAssets} Active Assets</span>
            <span className="font-bold text-emerald-600">Good Standing</span>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
