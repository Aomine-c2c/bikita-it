/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { operationsApi, OperationHistoryRecord } from "@/lib/api";
import { Clock, Wrench, ArrowRightLeft, UserCheck, HardDriveDownload, AlertCircle, MapPin } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getOpIcon = (type?: string) => {
  if (!type) return <AlertCircle className="w-4 h-4 text-slate-500" />;
  if (type.includes("Install") || type.includes("Issue")) return <HardDriveDownload className="w-4 h-4 text-emerald-500" />;
  if (type.includes("Assign")) return <UserCheck className="w-4 h-4 text-blue-500" />;
  if (type.includes("Transfer") || type.includes("Relocation") || type.includes("Return")) return <ArrowRightLeft className="w-4 h-4 text-purple-500" />;
  if (type.includes("Repair") || type.includes("Maintenance")) return <Wrench className="w-4 h-4 text-amber-500" />;
  return <AlertCircle className="w-4 h-4 text-slate-500" />;
};

export function OperationsHistory() {
  const [history, setHistory] = useState<OperationHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    operationsApi.getHistory()
      .then(setHistory)
      .catch((err: unknown) => {
        console.warn("Failed to load operations history:", err);
        setError("Could not connect to the API.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-180px)]">
      <div className="p-4 border-b border-border/40 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          Global Timeline
        </h3>
        <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
          {history.length} records
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-muted-foreground p-8 text-sm animate-pulse">
            Loading timeline...
          </div>
        ) : error ? (
          <div className="text-center text-red-500 p-8 text-sm">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-muted-foreground p-8 text-sm">
            No operations recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map(op => (
              <div key={op.id} className="flex gap-4 p-4 rounded-xl border border-border/40 hover:border-border/80 hover:bg-slate-50/50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  {getOpIcon(op.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-sm text-foreground">{op.type}</h4>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {op.date && !isNaN(new Date(op.date).getTime()) 
                        ? formatDistanceToNow(new Date(op.date), { addSuffix: true }) 
                        : "Unknown date"}
                    </span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-2">
                    {op.assetName ? (
                      <span className="font-medium text-foreground">{op.assetTag} - {op.assetName}</span>
                    ) : op.itemName ? (
                      <span className="font-medium text-foreground">{op.quantity}x {op.itemName}</span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {op.employeeName && (
                      <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md font-medium border border-blue-100">
                        <UserCheck className="w-3 h-3" />
                        {op.employeeName}
                      </span>
                    )}
                    {op.locationName && (
                      <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-100">
                        <MapPin className="w-3 h-3" />
                        {op.locationName}
                      </span>
                    )}
                  </div>
                  
                  {op.notes && (
                    <p className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 italic">
                      &quot;{op.notes}&quot;
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}