 
 

"use client";

import React from "react";
import { type Asset } from "@/lib/api";
import { History, ArrowRightLeft } from "lucide-react";

export function AssetHistoryTab({ asset }: { asset: any }) {
  const history: any[] = (asset as any).movementHistory || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-foreground">Movement History</h3>
        <p className="text-sm text-muted-foreground">Log of location and assignment changes for this asset.</p>
      </div>

      {history.length === 0 ? (
        <div className="p-8 text-center bg-white border border-border/60 rounded-2xl">
          <p className="text-sm text-muted-foreground">No movement history recorded yet.</p>
        </div>
      ) : (
        <div className="bg-white border border-border/60 rounded-2xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#F8FAFC] border-b border-border/60 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {history.map((tx) => (
                
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{new Date(tx.createdAt).toISOString().split('T')[0]}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                      <ArrowRightLeft className="w-3.5 h-3.5" />
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{tx.notes || "System update"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
