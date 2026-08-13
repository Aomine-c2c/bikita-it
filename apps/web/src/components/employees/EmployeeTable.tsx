"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, User, Laptop, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeTableProps {
  employees: any[];
  onSelectEmployee: (emp: any) => void;
}

export function EmployeeTable({ employees, onSelectEmployee }: EmployeeTableProps) {
  const [search, setSearch] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      return (
        !search ||
        [e.name, e.email, e.department, e.role, e.location]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [employees, search]);

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm my-4">
      {/* Search Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search personnel by name, email, department..."
          className="w-full sm:w-80 px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
        />
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} Personnel Records</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Employee Name</th>
              <th className="px-5 py-3">Corporate Email</th>
              <th className="px-5 py-3">Department</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Assigned Assets</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No employee records found.
                </td>
              </tr>
            ) : (
              filtered.map((e) => (
                <tr
                  key={e.id || e.email}
                  onClick={() => onSelectEmployee(e)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-bold text-foreground">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center shadow-sm">
                        {e.name ? e.name.slice(0, 2).toUpperCase() : "EP"}
                      </div>
                      <span className="group-hover:text-primary transition-colors">{e.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 font-mono">
                    <button
                      onClick={(evt) => {
                        evt.stopPropagation();
                        handleCopyEmail(e.email);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background border border-border/50 hover:border-primary transition-colors text-foreground text-xs cursor-pointer shadow-sm"
                    >
                      <span>{e.email}</span>
                      {copiedEmail === e.email ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-foreground">{e.department || "General"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{e.role || "Staff"}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                      <Laptop className="w-3 h-3" />
                      <span>{e.assetsCount || 2} Items</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors inline-block" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
