"use client";

import React, { useState, useMemo } from "react";
import { Clock, ShieldAlert, CheckCircle2, User, ChevronRight, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketTableProps {
  tickets: any[];
  onSelectTicket: (id: string) => void;
}

export function TicketTable({ tickets, onSelectTicket }: TicketTableProps) {
  const [search, setSearch] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("ALL");

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        !search ||
        [t.title, t.id, t.requesterName, t.requester_name, t.category, t.status]
          .some((v) => v && String(v).toLowerCase().includes(search.toLowerCase()));

      const matchesPriority = selectedPriority === "ALL" || t.priority === selectedPriority;

      return matchesSearch && matchesPriority;
    });
  }, [tickets, search, selectedPriority]);

  const getPriorityStyle = (p: string) => {
    switch (p) {
      case "Critical":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "High":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "Medium":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "bg-muted border-border/50 text-muted-foreground";
    }
  };

  const getStatusStyle = (s: string) => {
    switch (s) {
      case "Resolved":
      case "Closed":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "In Progress":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      case "Waiting":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
    }
  };

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm my-4">
      {/* Header Filters */}
      <div className="p-4 border-b border-border/40 flex flex-wrap items-center justify-between gap-3 bg-card/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search ticket title, requester, ID..."
          className="w-full sm:w-72 px-3.5 py-1.5 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
        />

        <div className="flex items-center gap-2">
          {["ALL", "Critical", "High", "Medium", "Low"].map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPriority(p)}
              className={cn(
                "px-3 py-1 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                selectedPriority === p
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-border/40 bg-muted/20 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <th className="px-5 py-3">Ticket ID</th>
              <th className="px-5 py-3">Title & Category</th>
              <th className="px-5 py-3">Requester</th>
              <th className="px-5 py-3">Priority</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">SLA Due</th>
              <th className="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30 text-xs">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-muted-foreground">
                  No support tickets found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onSelectTicket(t.id)}
                  className="hover:bg-muted/40 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 font-mono font-bold text-primary">{t.id}</td>
                  <td className="px-5 py-3.5">
                    <div>
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors">{t.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{t.category || "General Support"}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                        {(t.requester_name || t.requesterName || "U")[0]}
                      </div>
                      <span className="font-semibold text-foreground">{t.requester_name || t.requesterName || "Employee"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border", getPriorityStyle(t.priority))}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border", getStatusStyle(t.status))}>
                      {t.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-muted-foreground">
                    {t.due_date ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "In 4h"}
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
