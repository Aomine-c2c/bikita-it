"use client";

import React, { useEffect, useState } from "react";
import { Laptop, Ticket, Building, Mail, Phone, MoreHorizontal, X, Monitor, Key, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

import { apiFetch } from "@/lib/api";

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "Onboarding": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Offboarding": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Leave": return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }
};

// Mapping from Prisma Employee role/status to display-friendly labels
function deriveStatus(emp: any): string {
  if (!emp) return "Active";
  // Use the role field as a proxy since status doesn't exist in DB
  const statusMap: Record<string, string> = {
    ADMIN: "Active",
    IT_SUPPORT: "Active",
    MANAGER: "Active",
    STOREKEEPER: "Active",
    EMPLOYEE: "Active",
  };
  return statusMap[emp.role] ?? "Active";
}

export function EmployeeDirectory() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const data = await apiFetch<any>('/users');
      const items = Array.isArray(data) ? data : data.data ?? data ?? [];
      const mapped = items.map((emp: any) => ({
        id: emp.id?.substring(0, 8) ?? emp.id,
        name: emp.name,
        role: emp.position ?? emp.role ?? 'Employee',
        department: emp.department ?? '—',
        email: emp.email,
        phone: emp.office ?? '—',
        status: deriveStatus(emp),
        avatar: emp.name ? emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?",
        assets: emp.assets ?? 0,
        value: "$0",
        tickets: emp.tickets ?? 0,
      }));
      setEmployees(mapped);
    } catch (e) {
      console.error('Failed to fetch employees:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden animate-pulse">
            <div className="h-16 bg-slate-100" />
            <div className="px-5 pb-5">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 -mt-8 mb-3 border-4 border-white" />
              <div className="h-4 bg-slate-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-4" />
              <div className="space-y-2 mb-5">
                <div className="h-3 bg-slate-100 rounded w-full" />
                <div className="h-3 bg-slate-100 rounded w-5/6" />
                <div className="h-3 bg-slate-100 rounded w-2/3" />
              </div>
              <div className="h-8 bg-slate-100 rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {employees.length === 0 && (
          <div className="col-span-full text-center py-16 text-sm text-muted-foreground">
            No employees found. Add employees through the Employees section.
          </div>
        )}
        {employees.map((emp) => (
          <div key={emp.id} onClick={() => setSelectedEmp(emp)} className="block group cursor-pointer">
            <div className="bg-white border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group-hover:border-primary/30">
              <div className="h-16 bg-gradient-to-r from-slate-100 to-slate-50" />
              <div className="px-5 -mt-8 flex justify-between items-end mb-3">
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold shadow-lg border-4 border-white transition-transform group-hover:scale-105">
                  {emp.avatar}
                </div>
                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getStatusColor(emp.status))}>
                  {emp.status}
                </div>
              </div>
              <div className="px-5 pb-5">
                <h3 className="text-base font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors">{emp.name}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-4">{emp.role}</p>
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <Laptop className="w-3 h-3 text-primary" /> {emp.assets}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <Ticket className="w-3 h-3 text-amber-500" /> {emp.tickets}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-foreground bg-slate-50 px-2 py-1 rounded border border-border/40">
                    {emp.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedEmp && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmp(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
              animate={{ x: 0, boxShadow: "-20px 0 40px rgba(0,0,0,0.1)" }}
              exit={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-[#FAFAFA] h-full border-l border-border/60 flex flex-col z-10"
            >
              <div className="bg-white px-6 py-8 border-b border-border/40 relative">
                <button onClick={() => setSelectedEmp(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="flex gap-5 items-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                    {selectedEmp.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">{selectedEmp.name}</h2>
                    <p className="text-sm font-medium text-muted-foreground">{selectedEmp.role}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getStatusColor(selectedEmp.status))}>
                        {selectedEmp.status}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground border border-border/60 px-2 py-0.5 rounded bg-slate-50">{selectedEmp.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
                  <div className="bg-white border border-border/60 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Email</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{selectedEmp.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Phone</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{selectedEmp.phone}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Department</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{selectedEmp.department}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Assigned Assets & Equipment</h3>
                  <div className="p-8 text-center text-sm text-muted-foreground bg-white border border-border/60 rounded-xl">
                    <p>Asset assignment tracking coming soon.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Tickets</h3>
                  <div className="p-8 text-center text-sm text-muted-foreground bg-white border border-border/60 rounded-xl">
                    <p>No tickets found for this employee.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
