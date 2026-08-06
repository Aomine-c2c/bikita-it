/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { Laptop, Ticket, Building, Mail, Phone, _MoreHorizontal, X, _Monitor, _Key, _Loader2 } from "lucide-react";
import { cn, exportToCSV } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { EmployeeFilters } from "./EmployeeFilters";
import { EmployeeFormModal } from "./EmployeeFormModal";
import { EmployeeDetailsPanel } from "@/components/employees/EmployeeDetailsPanel";

import { _apiFetch } from "@/lib/api";

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
function deriveStatus(emp: unknown): string {
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

import { employeesApi } from "@/lib/api";

export function EmployeeDirectory() {
  const [employees, setEmployees] = useState<unknown[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [department, setDepartment] = useState("All Departments");
  const [roleType, setRoleType] = useState("All Roles");
  const [status, setStatus] = useState("All Statuses");

  // Filtering logic
  const filteredEmployees = React.useMemo(() => {
    let filtered = employees;

    if (department !== "All Departments") {
      filtered = filtered.filter((emp: any) => emp.department === department);
    }
    if (roleType !== "All Roles") {
      // Basic mock since roleType isn't fully defined on all objects, we just check if it contains the word
      filtered = filtered.filter((emp: any) => emp.role?.includes(roleType) || emp.type === roleType);
    }
    if (status !== "All Statuses") {
      filtered = filtered.filter((emp: any) => emp.status === status || emp.status?.toUpperCase() === status.toUpperCase());
    }

    if (!search) return filtered;
    const q = search.toLowerCase();
    return filtered.filter((emp: any) => 
      emp.name?.toLowerCase().includes(q) || 
      emp.email?.toLowerCase().includes(q) || 
      emp.role?.toLowerCase().includes(q) ||
      emp.department?.toLowerCase().includes(q)
    );
  }, [employees, search, department, roleType, status]);

  const fetchEmployees = async () => {
    try {
      const data = await employeesApi.getAll();
      const items = Array.isArray(data) ? data : (data as unknown).data ?? data ?? [];
      const mapped = items.map((emp: unknown) => ({
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEmployees();
  }, []);

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
      <EmployeeFilters 
        search={search} 
        setSearch={setSearch} 
        department={department}
        setDepartment={setDepartment}
        roleType={roleType}
        setRoleType={setRoleType}
        status={status}
        setStatus={setStatus}
        onExport={() => exportToCSV('employees.csv', filteredEmployees)}
        onAddPerson={() => setIsAddModalOpen(true)}
      />
      <EmployeeFormModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={() => { setIsAddModalOpen(false); fetchEmployees(); }} 
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEmployees.length === 0 && !loading && (
          <div className="col-span-full text-center py-16 text-sm text-muted-foreground">
            No employees found. Add employees through the Employees section.
          </div>
        )}
        {filteredEmployees.map((emp: any) => (
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

      <EmployeeDetailsPanel 
        employee={selectedEmp}
        onClose={() => setSelectedEmp(null)}
      />
    </>
  );
}
