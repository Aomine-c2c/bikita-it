"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { 
  operationsApi, employeesApi, locationsApi, 
  type OperationJob, type OperationPreset, type OperationHistoryRecord, 
  type Employee, type Location 
} from "@/lib/api";
import { 
  Activity, Play, CheckCircle2, AlertCircle, Clock, RefreshCw, 
  Users, MapPin, Tag, Boxes, Cpu, Sparkles, Layers, Search
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function OperationsPage() {
  const [presets, setPresets] = useState<OperationPreset[]>([]);
  const [jobs, setJobs] = useState<OperationJob[]>([]);
  const [history, setHistory] = useState<OperationHistoryRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [executingOp, setExecutingOp] = useState<string | null>(null);
  const [activeModalPreset, setActiveModalPreset] = useState<OperationPreset | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Form params for preset modal
  const [formNotes, setFormNotes] = useState("");
  const [formAssignee, setFormAssignee] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [formQuantity, setFormQuantity] = useState(10);
  const [searchHistory, setSearchHistory] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const [pData, jData, hData, empData, locData] = await Promise.all([
        operationsApi.getPresets().catch(() => []),
        operationsApi.getJobs().catch(() => []),
        operationsApi.getHistory().catch(() => []),
        employeesApi.getAll().catch(() => []),
        locationsApi.getAll().catch(() => []),
      ]);
      setPresets(pData);
      setJobs(jData);
      setHistory(hData);
      setEmployees(empData);
      setLocations(locData);
    } catch (err) {
      console.error("Failed to load operations data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      await fetchData();
    };
    if (!ignore) {
      load();
    }
    // Poll active jobs every 3 seconds if there are running tasks
    const interval = setInterval(() => {
      operationsApi.getJobs().then(j => setJobs(j)).catch(() => {});
    }, 3000);
    return () => {
      ignore = true;
      clearInterval(interval);
    };
  }, [fetchData]);

  const handleLaunchWorkflow = async (preset: OperationPreset) => {
    if (preset.id === "DIAGNOSTIC_SWEEP") {
      setExecutingOp(preset.id);
      try {
        const res = await operationsApi.execute({
          operation_type: preset.id,
          is_async: true,
        });
        setStatusMessage({ text: res.message || "Diagnostic sweep initiated in background.", type: "success" });
        fetchData();
      } catch (err: unknown) {
        setStatusMessage({ text: (err as Error)?.message || "Failed to trigger diagnostic sweep", type: "error" });
      } finally {
        setExecutingOp(null);
      }
    } else {
      setActiveModalPreset(preset);
      setFormNotes("");
    }
  };

  const handleExecuteModalWorkflow = async () => {
    if (!activeModalPreset) return;
    setExecutingOp(activeModalPreset.id);

    const params: Record<string, string | number | boolean> = { notes: formNotes };
    if (activeModalPreset.id === "BULK_REASSIGN_ASSETS" && formAssignee) {
      params.assigneeId = Number(formAssignee);
    }
    if (activeModalPreset.id === "BULK_RELOCATE_ASSETS" && formLocation) {
      params.locationId = Number(formLocation);
    }
    if (activeModalPreset.id === "BULK_STATUS_CHANGE") {
      params.status = formStatus;
    }
    if (activeModalPreset.id === "BULK_RESTOCK") {
      params.quantity = Number(formQuantity);
    }

    try {
      const res = await operationsApi.execute({
        operation_type: activeModalPreset.id,
        params,
        is_async: activeModalPreset.recommended_async,
      });
      setStatusMessage({ text: res.message || "Operation triggered successfully.", type: "success" });
      setActiveModalPreset(null);
      fetchData();
    } catch (err: unknown) {
      setStatusMessage({ text: (err as Error)?.message || "Failed to execute operation", type: "error" });
    } finally {
      setExecutingOp(null);
    }
  };

  const filteredHistory = history.filter(h => {
    if (!searchHistory) return true;
    const q = searchHistory.toLowerCase();
    return (
      (h.action && String(h.action).toLowerCase().includes(q)) ||
      (h.resource_type && String(h.resource_type).toLowerCase().includes(q)) ||
      (h.resource_id && String(h.resource_id).toLowerCase().includes(q))
    );
  });

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20 shadow-inner">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  Operations & Task Center
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Automated background fleet management, bulk workflows, and execution audit trails.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-secondary/80 hover:bg-secondary text-secondary-foreground transition-all duration-150 border border-border/50"
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              <span>Refresh Center</span>
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div className={cn(
            "p-4 rounded-xl border flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 duration-200",
            statusMessage.type === "success" 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
              : "bg-destructive/10 border-destructive/20 text-destructive"
          )}>
            <div className="flex items-center gap-3">
              {statusMessage.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium">{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="text-xs hover:underline opacity-80">
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Launchers Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Fleet Automation Workflows</span>
            </h2>
            <span className="text-xs text-muted-foreground">Click any workflow to configure and run</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presets.map((preset) => {
              const isDiag = preset.id === "DIAGNOSTIC_SWEEP";
              return (
                <div
                  key={preset.id}
                  className="group relative flex flex-col justify-between p-5 rounded-2xl border border-border/60 bg-card/60 hover:bg-card hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-secondary/80 text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                        {preset.icon === "Users" && <Users className="h-5 w-5" />}
                        {preset.icon === "MapPin" && <MapPin className="h-5 w-5" />}
                        {preset.icon === "Tag" && <Tag className="h-5 w-5" />}
                        {preset.icon === "Boxes" && <Boxes className="h-5 w-5" />}
                        {preset.icon === "Activity" && <Activity className="h-5 w-5" />}
                      </div>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border/50">
                        {preset.category}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                        {preset.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {preset.recommended_async ? "Async Job Queue" : "Instant Batch"}
                    </span>
                    <button
                      onClick={() => handleLaunchWorkflow(preset)}
                      disabled={executingOp === preset.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-150 border border-primary/20"
                    >
                      {executingOp === preset.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Play className="h-3.5 w-3.5 fill-current" />
                      )}
                      <span>{isDiag ? "Run Sweep" : "Launch"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Background Jobs Monitor */}
        {jobs.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Active & Recent Task Queue</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => (
                <div
                  key={job.job_id}
                  className="p-5 rounded-2xl border border-border/60 bg-card/80 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        job.status === "RUNNING" && "bg-amber-400 animate-ping",
                        job.status === "COMPLETED" && "bg-emerald-400",
                        job.status === "FAILED" && "bg-destructive"
                      )} />
                      <span className="font-mono text-xs font-bold text-foreground">
                        {job.job_id}
                      </span>
                    </div>
                    <span className={cn(
                      "text-xs px-2.5 py-0.5 rounded-full font-medium border",
                      job.status === "RUNNING" && "bg-amber-500/10 border-amber-500/20 text-amber-400",
                      job.status === "COMPLETED" && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                      job.status === "FAILED" && "bg-destructive/10 border-destructive/20 text-destructive"
                    )}>
                      {job.status}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{job.message}</span>
                      <span className="font-semibold text-foreground">{job.progress_percent}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          job.status === "RUNNING" && "bg-amber-500",
                          job.status === "COMPLETED" && "bg-emerald-500",
                          job.status === "FAILED" && "bg-destructive"
                        )}
                        style={{ width: `${job.progress_percent}%` }}
                      />
                    </div>
                  </div>

                  {job.details && Object.keys(job.details).length > 0 && (
                    <pre className="p-2.5 rounded-lg bg-secondary/50 text-[11px] font-mono text-muted-foreground overflow-x-auto max-h-24">
                      {JSON.stringify(job.details, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Operations Audit Stream */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span>Operations Execution Log</span>
            </h2>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter operations..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg bg-secondary/60 border border-border/50 focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-secondary/40 border-b border-border/40 text-muted-foreground font-medium">
                  <tr>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Target Entity</th>
                    <th className="py-3 px-4">Resource ID</th>
                    <th className="py-3 px-4">Details / Diff</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No operations logged yet. Run a fleet workflow above to generate audit events.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.slice(0, 30).map((log: OperationHistoryRecord) => (
                      <tr key={log.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-mono font-semibold text-primary">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium">
                          {log.resource_type || "System"}
                        </td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">
                          {log.resource_id || "-"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : "-"}
                        </td>
                        <td className="py-3 px-4 text-right text-muted-foreground">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Launcher for Preset Workflows */}
        {activeModalPreset && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <h3 className="font-semibold text-foreground text-lg flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary fill-current" />
                  <span>{activeModalPreset.name}</span>
                </h3>
                <button
                  onClick={() => setActiveModalPreset(null)}
                  className="text-muted-foreground hover:text-foreground text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs">
                {activeModalPreset.id === "BULK_REASSIGN_ASSETS" && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">Target Employee Assignee</label>
                    <select
                      value={formAssignee}
                      onChange={(e) => setFormAssignee(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="">-- Unassigned (Return to Pool) --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || "No Dept"})</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeModalPreset.id === "BULK_RELOCATE_ASSETS" && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">Target Destination Location</label>
                    <select
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="">-- Clear Location --</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>{loc.name} ({loc.type || "Room"})</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeModalPreset.id === "BULK_STATUS_CHANGE" && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">New Lifecycle Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="IN_REPAIR">IN_REPAIR</option>
                      <option value="RESERVED">RESERVED</option>
                      <option value="RETIRED">RETIRED</option>
                    </select>
                  </div>
                )}

                {activeModalPreset.id === "BULK_RESTOCK" && (
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">Quantity to Add</label>
                    <input
                      type="number"
                      min={1}
                      value={formQuantity}
                      onChange={(e) => setFormQuantity(Number(e.target.value))}
                      className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="font-medium text-foreground">Operation Notes & Reason</label>
                  <textarea
                    rows={3}
                    placeholder="Provide operational context or ticket reference..."
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg bg-secondary/60 border border-border focus:outline-none focus:ring-1 focus:ring-primary text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
                <button
                  onClick={() => setActiveModalPreset(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExecuteModalWorkflow}
                  disabled={Boolean(executingOp)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
                >
                  {executingOp ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5 fill-current" />}
                  <span>Execute Operation</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
