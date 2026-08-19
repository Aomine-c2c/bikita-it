"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { AuditEventDrawer } from "@/components/activity/AuditEventDrawer";
import { AuditTable } from "@/components/activity/AuditTable";
import { apiFetch } from "@/lib/api";
import { exportToCSV } from "@/lib/utils";
import { generateTablePdf } from "@/lib/pdf";
import { ShieldAlert, Download, FileText, RefreshCw, LayoutGrid, Table, AlertTriangle, Key, ShieldCheck, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuditLogItem {
  id?: string | number;
  timestamp?: string;
  created_at?: string;
  createdAt?: string;
  entityId?: string;
  performedBy?: string;
  user?: string;
  actor?: string;
  action?: string;
  description?: string;
  severity?: string;
  ip?: string;
  ip_address?: string;
  location?: string;
  module?: string;
  target?: string;
  before_state?: Record<string, unknown>;
  after_state?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export default function ActivityPage() {
  const [events, setEvents]             = useState<AuditLogItem[]>([]);
  const [loading, setLoading]           = useState(true);
  const [activeEvent, setActiveEvent]   = useState<AuditLogItem | null>(null);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [viewMode, setViewMode]         = useState<"timeline" | "table">("timeline");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      // /timeline is the real endpoint wired in the last sprint
      const data = await apiFetch<AuditLogItem[]>("/timeline?limit=200");
      setEvents(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch activity logs:", e);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    apiFetch<AuditLogItem[]>("/timeline?limit=200")
      .then((data) => {
        if (isMounted) setEvents(Array.isArray(data) ? data : []);
      })
      .catch((e) => {
        console.error("Failed to fetch activity logs:", e);
        if (isMounted) setEvents([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredEvents = events.filter((e) => {
    if (severityFilter === "ALL") return true;
    return (e.severity || "INFO").toUpperCase() === severityFilter;
  });

  // Derive live KPI counts from actual event data
  const totalEvents   = events.length;
  const criticalCount = events.filter((e) => (e.severity || "").toUpperCase() === "CRITICAL").length;
  const warnCount     = events.filter((e) => (e.severity || "").toUpperCase() === "WARNING").length;
  const adminActions  = events.filter((e) =>
    ["DELETE","RETIRE","REASSIGN"].includes((e.action || "").toUpperCase())
  ).length;

  const kpiCards = [
    { label: "Total Logged Events",       value: loading ? "…" : totalEvents,   icon: Activity,     color: "text-blue-500",   bg: "bg-blue-500/10"   },
    { label: "Critical Severity Events",  value: loading ? "…" : criticalCount, icon: ShieldCheck,  color: "text-emerald-500",bg: "bg-emerald-500/10"},
    { label: "Warnings Detected",         value: loading ? "…" : warnCount,     icon: AlertTriangle,color: "text-amber-500",  bg: "bg-amber-500/10"  },
    { label: "Privileged Admin Actions",  value: loading ? "…" : adminActions,  icon: Key,          color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  const handleExportPdf = () => {
    generateTablePdf(
      "SOC2 System Audit Trail Report",
      [
        { header: "Timestamp",    dataKey: "ts"       },
        { header: "Action Event", dataKey: "action"   },
        { header: "Module",       dataKey: "module"   },
        { header: "Entity ID",    dataKey: "entityId" },
        { header: "Performed By", dataKey: "by"       },
        { header: "Severity",     dataKey: "severity" },
      ],
      filteredEvents.map((e) => ({
        ts:       e.createdAt ? new Date(e.createdAt).toLocaleString() : "",
        action:   e.action    || "EVENT",
        module:   e.module    || "",
        entityId: e.entityId  || "",
        by:       e.performedBy || e.user || "System",
        severity: e.severity  || "INFO",
      })),
      "soc2_compliance_audit_report"
    );
  };

  return (
    <DashboardLayout>
      <div data-tour="audit-log" className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-375 mx-auto">
        <AuditEventDrawer isOpen={!!activeEvent} onClose={() => setActiveEvent(null)} event={activeEvent} />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldAlert className="w-5 h-5" />
              </div>
              Security Audit Log & Activity Feed
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Real-time Chronological Audit Trail, Payload State Diffs & SOC2 Compliance Export Engine
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchEvents}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              Refresh
            </button>
            <button
              onClick={() => exportToCSV("security_audit_log.csv", filteredEvents)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              Export CSV
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Export Compliance PDF
            </button>
          </div>
        </div>

        {/* Live KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className={cn("text-2xl font-black tracking-tight", loading ? "animate-pulse text-muted-foreground" : "text-foreground")}>
                    {kpi.value}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} border border-border/40 flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter + View switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 backdrop-blur-xl border border-border/50 p-2 rounded-2xl">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs font-bold text-muted-foreground px-2">Severity:</span>
            {["ALL", "INFO", "WARNING", "CRITICAL"].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  "px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer",
                  severityFilter === sev
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-background/80 border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {sev}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm self-end sm:self-auto">
            {(["timeline", "table"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  viewMode === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {m === "timeline" ? <LayoutGrid className="w-3.5 h-3.5" /> : <Table className="w-3.5 h-3.5" />}
                {m === "timeline" ? "Event Timeline" : "Compliance Table"}
              </button>
            ))}
          </div>
        </div>

        {viewMode === "timeline" ? (
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
            <ActivityFeed />
          </div>
        ) : (
          <AuditTable events={filteredEvents} onSelectEvent={setActiveEvent} />
        )}
      </div>
    </DashboardLayout>
  );
}
