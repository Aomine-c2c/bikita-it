"use client";

import React, { useState, useMemo } from "react";
import { ShieldAlert, ChevronRight, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuditTableProps {
  events: any[];
  onSelectEvent: (evt: any) => void;
}

export function AuditTable({ events, onSelectEvent }: AuditTableProps) {
  const [search, setSearch] = useState("");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      return (
        !search ||
        [e.action, e.user, e.ip, e.description, e.severity]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [events, search]);

  const handleCopyIp = (ev: React.MouseEvent, ip: string) => {
    ev.stopPropagation();
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const getSeverityStyle = (s: string) => {
    switch (s?.toUpperCase()) {
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "WARNING":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm my-4">
      {/* Search Header */}
      <div className="p-4 border-b border-border/40 flex items-center justify-between bg-card/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search action type, actor email, IP address, description..."
          className="w-full sm:w-80 px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
        />
        <span className="text-xs font-mono text-muted-foreground">{filtered.length} Audit Entries</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Timestamp</th>
              <th className="px-5 py-3">Action Event</th>
              <th className="px-5 py-3">Actor Account</th>
              <th className="px-5 py-3">IP Address</th>
              <th className="px-5 py-3">Severity</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                  No security audit log entries found.
                </td>
              </tr>
            ) : (
              filtered.map((e, idx) => (
                <tr
                  key={e.id || idx}
                  onClick={() => onSelectEvent(e)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-mono text-muted-foreground">
                    {e.timestamp ? new Date(e.timestamp).toLocaleString() : "Recent"}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-primary" />
                    <span>{e.action || e.title || "PLATFORM_EVENT"}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-muted-foreground">{e.user || e.actor || "admin@bikita.io"}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={(ev) => handleCopyIp(ev, e.ip || "192.168.1.45")}
                      className="font-mono text-xs text-primary font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{e.ip || "192.168.1.45"}</span>
                      {copiedIp === (e.ip || "192.168.1.45") ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3 text-muted-foreground" />
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border", getSeverityStyle(e.severity))}>
                      {e.severity || "INFO"}
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
