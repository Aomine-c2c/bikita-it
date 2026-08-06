/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React from "react";
import { type _Asset } from "@/lib/api";
import { Wrench, Clock, ShieldCheck, Cpu, HardDrive, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const getTypeIcon = (type: string) => {
  if (type === "Maintenance") return <Clock className="w-3.5 h-3.5" />;
  if (type === "Inspection") return <ShieldCheck className="w-3.5 h-3.5" />;
  if (type === "Firmware Update") return <Cpu className="w-3.5 h-3.5" />;
  if (type === "Component Replacement") return <HardDrive className="w-3.5 h-3.5" />;
  if (type === "Repair") return <Wrench className="w-3.5 h-3.5" />;
  return <AlertCircle className="w-3.5 h-3.5" />;
};

export function AssetMaintenanceTab({ asset }: { asset: unknown }) {
  const repairs = asset.repairs || [];

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h3 className="text-lg font-bold text-foreground">Maintenance & Repairs</h3>
          <p className="text-sm text-muted-foreground">Log of all maintenance, inspections, and repairs for this asset.</p>
        </div>
      </div>

      {repairs.length === 0 ? (
        <div className="p-8 text-center bg-white border border-border/60 rounded-2xl">
          <p className="text-sm text-muted-foreground">No maintenance records found.</p>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] border-b border-border/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Technician</th>
                <th className="px-6 py-4">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {repairs.map((rp: unknown) => (
                <tr key={rp.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground whitespace-nowrap">
                    <div className="flex flex-col">
                      <span>{rp.scheduledDate ? new Date(rp.scheduledDate).toLocaleDateString() : new Date(rp.createdAt).toLocaleDateString()}</span>
                      {rp.completedDate && (
                        <span className="text-xs text-muted-foreground">Completed {new Date(rp.completedDate).toLocaleDateString()}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      {getTypeIcon(rp.type || "Repair")}
                      {rp.type || "Repair"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider",
                      rp.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" :
                      rp.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-700" :
                      rp.status === "QUEUED" ? "bg-amber-50 text-amber-700" :
                      "bg-slate-50 text-slate-600"
                    )}>
                      {rp.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {rp.technician?.name ? (
                      <span className="font-medium text-foreground">{rp.technician.name}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground font-medium">{rp.description}</p>
                    {rp.remarks && (
                      <p className="text-xs text-muted-foreground mt-1 bg-slate-50 p-2 rounded italic">&quot;{rp.remarks}&quot;</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}