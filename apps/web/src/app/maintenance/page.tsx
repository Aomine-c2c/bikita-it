"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { maintenanceApi, type MaintenanceTask } from "@/lib/api";
import {
  CalendarCheck2, CheckCircle2, Clock, AlertTriangle, ShieldAlert,
  Search, Download, Plus, X, Trash2, Save, Filter, BookOpen, Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const FREQUENCIES = [
  { key: "Daily", window: "Every shift / each working day", focus: "Operational checks and alert review" },
  { key: "Weekly", window: "Once per week", focus: "Trend review, inspection and sample tests" },
  { key: "Monthly", window: "Approved monthly maintenance window", focus: "Patching, access reviews and configuration backups" },
  { key: "Quarterly", window: "Every 3 months", focus: "Recovery, security and resilience testing" },
  { key: "Semi-annual", window: "Every 6 months", focus: "Specialist infrastructure condition checks" },
  { key: "Annual", window: "Once per year / budget cycle", focus: "Lifecycle, compliance and strategic review" },
  { key: "Event-driven", window: "After an event, change or alert", focus: "Incident response and post-change validation" },
] as const;

const STATUS_OPTIONS = ["Not Started", "In Progress", "Completed", "Deferred", "Overdue"];
const PRIORITY_OPTIONS = ["Critical", "High", "Medium", "Low"];

const MINING_CONTROLS = [
  "Coordinate maintenance windows and any service interruption with the Mine/Plant Operations control room, Security, Engineering and affected departments.",
  "Do not connect IT maintenance tools to PLC, SCADA, DCS, plant control or safety systems unless specifically authorised under the site's OT/ICS change-management and cybersecurity procedures.",
  "Do not reboot, patch, scan, disconnect, reconfigure or power-cycle production-critical systems during operating hours without written approval and a rollback/contingency plan.",
  "Fibre and copper inspections must not create trip hazards or compromise electrical, fire, access-control or process-safety requirements. Treat damaged fibre and electrical infrastructure as a site hazard and escalate.",
  "CCTV footage, user accounts, logs and business data are sensitive. Follow company retention, privacy, evidence-handling and access-control policies.",
  "Electrical work, UPS battery work, rack power work and work at height must be performed only by competent, authorised personnel under site permit-to-work / lockout-tagout requirements where applicable.",
  "Frequencies are suggested baseline intervals. Adjust them to manufacturer recommendations, site risk assessments, asset criticality, regulatory obligations and Bikita Minerals' approved procedures.",
];

const ROLE_MATRIX = [
  { role: "IT Manager / Team Lead", scope: "Owns priorities, approvals, maintenance calendar, risk acceptance and reporting." },
  { role: "Systems Administrator", scope: "Servers, virtualisation, storage, operating systems and infrastructure monitoring." },
  { role: "Network Administrator / Technician", scope: "LAN, WAN, switches, routers, firewalls, Wi-Fi, fibre and copper cabling." },
  { role: "M365 Administrator", scope: "Microsoft 365, Entra ID, mail, collaboration, identity and licensing." },
  { role: "IT Support / Endpoint Administrator", scope: "Workstations, laptops, printers, endpoint security and user support." },
  { role: "CCTV / Security Systems Support", scope: "Cameras, NVR/VMS, recording, video access and coordination with Security." },
  { role: "Facilities / Approved Vendor", scope: "Power, UPS, HVAC and specialist electrical/mechanical services." },
];

const PRIORITY_BADGE: Record<string, string> = {
  Critical: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
  High: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Medium: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  Low: "bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30",
};

const STATUS_BADGE: Record<string, string> = {
  Completed: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  "In Progress": "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  "Not Started": "bg-muted text-muted-foreground border-border",
  Deferred: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Overdue: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
};

export default function MaintenancePage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"schedule" | "controls">("schedule");

  // Filters
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Detail/Edit drawer
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null);
  const [editForm, setEditForm] = useState<Partial<MaintenanceTask>>({});
  const [saving, setSaving] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Omit<MaintenanceTask, "id">>({
    code: "",
    frequency: "Monthly",
    system_asset: "",
    activity: "",
    procedure: "",
    suggested_owner: "",
    assigned_owner: "",
    recommended_timing: "",
    priority: "Medium",
    evidence_record: "",
    status: "Not Started",
    last_completed: null,
    next_due: null,
    work_order: "",
    comments: "",
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await maintenanceApi.getAll();
      setTasks(data);
    } catch (err) {
      setError((err as Error)?.message || "Failed to load maintenance plan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (freqFilter !== "ALL" && t.frequency !== freqFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (q) {
        const hay = `${t.code} ${t.system_asset} ${t.activity} ${t.suggested_owner} ${t.assigned_owner} ${t.work_order}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, search, freqFilter, priorityFilter, statusFilter]);

  const freqCounts = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    for (const f of FREQUENCIES) map[f.key] = { total: 0, completed: 0 };
    for (const t of tasks) {
      if (!map[t.frequency]) map[t.frequency] = { total: 0, completed: 0 };
      map[t.frequency].total += 1;
      if (t.status === "Completed") map[t.frequency].completed += 1;
    }
    return map;
  }, [tasks]);

  const openDrawer = (task: MaintenanceTask) => {
    setSelectedTask(task);
    setEditForm({ ...task });
  };

  const handleComplete = async (task: MaintenanceTask, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const updated = await maintenanceApi.complete(task.id);
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      if (selectedTask?.id === updated.id) {
        setSelectedTask(updated);
        setEditForm({ ...updated });
      }
      toast.success(`${updated.code} marked Completed${updated.next_due ? ` — next due ${updated.next_due}` : ""}`);
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to complete task");
    }
  };

  const handleSaveDrawer = async () => {
    if (!selectedTask) return;
    setSaving(true);
    try {
      const updated = await maintenanceApi.update(selectedTask.id, {
        frequency: editForm.frequency,
        system_asset: editForm.system_asset,
        activity: editForm.activity,
        procedure: editForm.procedure,
        suggested_owner: editForm.suggested_owner,
        assigned_owner: editForm.assigned_owner,
        recommended_timing: editForm.recommended_timing,
        priority: editForm.priority,
        evidence_record: editForm.evidence_record,
        status: editForm.status,
        last_completed: editForm.last_completed || null,
        next_due: editForm.next_due || null,
        work_order: editForm.work_order,
        comments: editForm.comments,
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      setSelectedTask(updated);
      toast.success(`Saved ${updated.code}`);
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (task: MaintenanceTask) => {
    try {
      await maintenanceApi.delete(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      if (selectedTask?.id === task.id) setSelectedTask(null);
      toast.success(`Deleted ${task.code}`);
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to delete task");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.code.trim() || !createForm.activity.trim()) {
      toast.error("Code and Activity are required");
      return;
    }
    setSaving(true);
    try {
      const created = await maintenanceApi.create(createForm);
      setTasks((prev) => [...prev, created]);
      setShowCreate(false);
      setCreateForm({
        code: "", frequency: "Monthly", system_asset: "", activity: "", procedure: "",
        suggested_owner: "", assigned_owner: "", recommended_timing: "", priority: "Medium",
        evidence_record: "", status: "Not Started", last_completed: null, next_due: null,
        work_order: "", comments: "",
      });
      toast.success(`Added ${created.code}`);
    } catch (err) {
      toast.error((err as Error)?.message || "Failed to create task");
    } finally {
      setSaving(false);
    }
  };

  const handleExportCsv = () => {
    const headers = [
      "ID", "Frequency", "System / Asset", "Maintenance Activity", "Checks / Procedure",
      "Suggested Owner", "Assigned Owner", "Recommended Timing", "Priority",
      "Evidence / Record", "Status", "Last Completed", "Next Due", "Work Order / Ticket", "Comments",
    ];
    const esc = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filteredTasks.map((t) => [
      t.code, t.frequency, t.system_asset, t.activity, t.procedure,
      t.suggested_owner, t.assigned_owner, t.recommended_timing, t.priority,
      t.evidence_record, t.status, t.last_completed ?? "", t.next_due ?? "", t.work_order, t.comments,
    ].map(esc).join(","));
    const csv = [headers.map(esc).join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Bikita_IT_Maintenance_Plan_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <CalendarCheck2 className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                IT Preventive Maintenance Plan
              </h1>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Bikita Minerals IT Department — {tasks.length} scheduled preventive-maintenance activities across 7 frequencies
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-border bg-card p-1">
              <button
                onClick={() => setActiveTab("schedule")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                  activeTab === "schedule" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarCheck2 className="w-3.5 h-3.5" />
                Maintenance Schedule
              </button>
              <button
                onClick={() => setActiveTab("controls")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5",
                  activeTab === "controls" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Mining Controls &amp; Roles
              </button>
            </div>

            <button
              onClick={handleExportCsv}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-border bg-card hover:bg-accent text-foreground flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Activity
            </button>
          </div>
        </div>

        {/* Frequency Overview KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {FREQUENCIES.map((f) => {
            const c = freqCounts[f.key] || { total: 0, completed: 0 };
            const active = freqFilter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => {
                  setActiveTab("schedule");
                  setFreqFilter(active ? "ALL" : f.key);
                }}
                className={cn(
                  "text-left p-3.5 rounded-xl border transition-all bg-card hover:border-primary/50",
                  active ? "border-primary ring-2 ring-primary/20" : "border-border"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">{f.key}</span>
                  <span className="text-lg font-bold text-foreground">{c.total}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{f.focus}</p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>{c.completed}/{c.total} done</span>
                </div>
              </button>
            );
          })}
        </div>

        {activeTab === "schedule" ? (
          <div className="space-y-4">
            {/* Filter Toolbar */}
            <div className="flex flex-wrap items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ID, system, activity, owner, or ticket..."
                  className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <select
                  value={freqFilter}
                  onChange={(e) => setFreqFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="ALL">All Frequencies</option>
                  {FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.key}</option>)}
                </select>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="ALL">All Priorities</option>
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground"
                >
                  <option value="ALL">All Statuses</option>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                {(freqFilter !== "ALL" || priorityFilter !== "ALL" || statusFilter !== "ALL" || search) && (
                  <button
                    onClick={() => { setFreqFilter("ALL"); setPriorityFilter("ALL"); setStatusFilter("ALL"); setSearch(""); }}
                    className="text-xs text-primary hover:underline px-2"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {loading ? (
                <div className="p-10 text-center text-sm text-muted-foreground">Loading maintenance schedule...</div>
              ) : error ? (
                <div className="p-10 text-center text-sm text-red-500">{error}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-xs uppercase text-muted-foreground border-b border-border">
                      <tr>
                        <th className="px-4 py-3 font-semibold">ID</th>
                        <th className="px-4 py-3 font-semibold">Frequency</th>
                        <th className="px-4 py-3 font-semibold">System / Asset</th>
                        <th className="px-4 py-3 font-semibold">Maintenance Activity</th>
                        <th className="px-4 py-3 font-semibold">Owner</th>
                        <th className="px-4 py-3 font-semibold">Priority</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-4 py-3 font-semibold">Next Due</th>
                        <th className="px-4 py-3 font-semibold text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredTasks.map((task) => (
                        <tr
                          key={task.id}
                          onClick={() => openDrawer(task)}
                          className="hover:bg-accent/40 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-primary whitespace-nowrap">{task.code}</td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground">{task.frequency}</td>
                          <td className="px-4 py-3 text-xs font-medium text-foreground max-w-[180px] truncate">{task.system_asset}</td>
                          <td className="px-4 py-3 text-xs text-foreground max-w-[280px]">
                            <div className="font-medium">{task.activity}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{task.evidence_record}</div>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {task.assigned_owner || task.suggested_owner}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={cn("px-2 py-0.5 text-[11px] font-medium rounded-full border", PRIORITY_BADGE[task.priority] || PRIORITY_BADGE.Medium)}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={cn("px-2 py-0.5 text-[11px] font-medium rounded-full border", STATUS_BADGE[task.status] || STATUS_BADGE["Not Started"])}>
                              {task.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                            {task.next_due || "—"}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => handleComplete(task, e)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 transition-colors inline-flex items-center gap-1"
                              title="Mark Completed & auto-calculate Next Due"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Complete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredTasks.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-10 text-center text-sm text-muted-foreground">
                            No maintenance activities match your current filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mining-Site Controls & Role Matrix Tab */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg font-bold text-foreground">Mining-Site Controls &amp; Boundaries</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Mandatory safety, OT/ICS isolation, and change-control boundaries for Bikita Minerals IT operations.
              </p>
              <ul className="space-y-3">
                {MINING_CONTROLS.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
                    <span className="mt-1 w-5 h-5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-6 rounded-xl border border-border bg-card space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Users className="w-5 h-5" />
                <h2 className="text-lg font-bold text-foreground">Role Responsibility Matrix</h2>
              </div>
              <p className="text-xs text-muted-foreground">
                Suggested role ownership across IT infrastructure, M365, endpoints, CCTV, and Facilities/Vendors.
              </p>
              <div className="divide-y divide-border">
                {ROLE_MATRIX.map((r) => (
                  <div key={r.role} className="py-3">
                    <div className="text-sm font-semibold text-foreground">{r.role}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{r.scope}</div>
                  </div>
                ))}
              </div>
              <div className="p-3.5 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground flex items-start gap-2">
                <BookOpen className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                <span>
                  Record evidence (logs, screenshots, test results, vendor reports and approvals) in the approved company repository; never store passwords or sensitive configuration secrets in maintenance comments.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail / Edit Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs" onClick={() => setSelectedTask(null)}>
          <div
            className="w-full max-w-xl bg-background border-l border-border h-full overflow-y-auto p-6 space-y-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-primary">{selectedTask.code}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{selectedTask.frequency}</span>
                </div>
                <h2 className="text-lg font-bold text-foreground mt-1">{selectedTask.activity}</h2>
                <p className="text-xs text-muted-foreground">{selectedTask.system_asset}</p>
              </div>
              <button onClick={() => setSelectedTask(null)} className="p-1.5 rounded-lg hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-muted/50 border border-border space-y-1">
              <div className="text-xs font-semibold uppercase text-muted-foreground">Checks / Procedure</div>
              <p className="text-sm text-foreground leading-relaxed">{selectedTask.procedure}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <select
                  value={editForm.status || "Not Started"}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                >
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select
                  value={editForm.priority || "Medium"}
                  onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Suggested Owner</label>
                <input
                  value={editForm.suggested_owner || ""}
                  onChange={(e) => setEditForm({ ...editForm, suggested_owner: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Assigned Technician</label>
                <input
                  value={editForm.assigned_owner || ""}
                  onChange={(e) => setEditForm({ ...editForm, assigned_owner: e.target.value })}
                  placeholder="Named technician..."
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Last Completed</label>
                <input
                  type="date"
                  value={editForm.last_completed || ""}
                  onChange={(e) => setEditForm({ ...editForm, last_completed: e.target.value || null })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Next Due</label>
                <input
                  type="date"
                  value={editForm.next_due || ""}
                  onChange={(e) => setEditForm({ ...editForm, next_due: e.target.value || null })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Evidence / Record</label>
                <input
                  value={editForm.evidence_record || ""}
                  onChange={(e) => setEditForm({ ...editForm, evidence_record: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Work Order / Ticket</label>
                <input
                  value={editForm.work_order || ""}
                  onChange={(e) => setEditForm({ ...editForm, work_order: e.target.value })}
                  placeholder="e.g. TKT-2026-041"
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Comments / Deferral Reason</label>
              <textarea
                rows={3}
                value={editForm.comments || ""}
                onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })}
                placeholder="Notes, deferral justification, approver..."
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <button
                onClick={() => handleDelete(selectedTask)}
                className="px-3 py-2 text-xs font-medium rounded-lg text-red-600 hover:bg-red-500/10 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleComplete(selectedTask)}
                  className="px-3 py-2 text-xs font-medium rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Complete
                </button>
                <button
                  disabled={saving}
                  onClick={handleSaveDrawer}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Activity Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4" onClick={() => setShowCreate(false)}>
          <form
            onSubmit={handleCreate}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-background border border-border p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Add Maintenance Activity</h2>
              <button type="button" onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-accent">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Activity Code *</label>
                <input
                  required
                  value={createForm.code}
                  onChange={(e) => setCreateForm({ ...createForm, code: e.target.value })}
                  placeholder="e.g. M-12"
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Frequency *</label>
                <select
                  value={createForm.frequency}
                  onChange={(e) => setCreateForm({ ...createForm, frequency: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                >
                  {FREQUENCIES.map((f) => <option key={f.key} value={f.key}>{f.key}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">System / Asset *</label>
              <input
                required
                value={createForm.system_asset}
                onChange={(e) => setCreateForm({ ...createForm, system_asset: e.target.value })}
                placeholder="e.g. Core Switch / Server Room"
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Maintenance Activity *</label>
              <input
                required
                value={createForm.activity}
                onChange={(e) => setCreateForm({ ...createForm, activity: e.target.value })}
                placeholder="Short title of the maintenance task"
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground">Checks / Procedure</label>
              <textarea
                rows={3}
                value={createForm.procedure}
                onChange={(e) => setCreateForm({ ...createForm, procedure: e.target.value })}
                className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Suggested Owner</label>
                <input
                  value={createForm.suggested_owner}
                  onChange={(e) => setCreateForm({ ...createForm, suggested_owner: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
                >
                  {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 text-xs font-medium rounded-lg border border-border hover:bg-accent">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {saving ? "Creating..." : "Create Activity"}
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  );
}
