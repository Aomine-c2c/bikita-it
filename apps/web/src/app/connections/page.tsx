"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConnectionFormModal } from "@/components/network/ConnectionFormModal";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Waypoints, Plus, Cable, Trash2, ArrowRight, Search, RefreshCw,
  Server, ShieldCheck, Activity, Wifi, Layers, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Connection {
  id: number;
  source_asset_id: string;
  source_port?: string;
  target_asset_id: string;
  target_port?: string;
  cable_type?: string;
  speed?: string;
  status?: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [testingLinkId, setTestingLinkId] = useState<number | null>(null);

  const fetchConnections = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Connection[]>("/connections");
      setConnections(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to fetch connections", e);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const deleteConnection = async (id: number) => {
    if (!confirm("Are you sure you want to remove this cable interconnect?")) return;
    try {
      await apiFetch(`/connections/${id}`, { method: "DELETE" });
      setConnections((c) => c.filter((x) => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestLink = (id: number) => {
    setTestingLinkId(id);
    setTimeout(() => {
      setTestingLinkId(null);
    }, 1200);
  };

  // KPIs
  const stats = useMemo(() => {
    const total = connections.length;
    const fiber = connections.filter((c) => (c.cable_type || "").toLowerCase().includes("fiber")).length;
    const copper = connections.filter((c) => (c.cable_type || "").toLowerCase().includes("cat") || (c.cable_type || "").toLowerCase().includes("copper")).length;
    const active = connections.filter((c) => (c.status || "Active").toLowerCase() === "active").length;
    return { total, fiber, copper, active };
  }, [connections]);

  // Filtered List
  const filteredConnections = useMemo(() => {
    return connections.filter((conn) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !q ||
        (conn.source_asset_id || "").toLowerCase().includes(q) ||
        (conn.target_asset_id || "").toLowerCase().includes(q) ||
        (conn.source_port || "").toLowerCase().includes(q) ||
        (conn.target_port || "").toLowerCase().includes(q) ||
        (conn.cable_type || "").toLowerCase().includes(q);

      const matchType =
        selectedType === "all" ||
        (selectedType === "fiber" && (conn.cable_type || "").toLowerCase().includes("fiber")) ||
        (selectedType === "copper" && ((conn.cable_type || "").toLowerCase().includes("cat") || (conn.cable_type || "").toLowerCase().includes("copper"))) ||
        (selectedType === "other" && !(conn.cable_type || "").toLowerCase().includes("fiber") && !(conn.cable_type || "").toLowerCase().includes("cat"));

      return matchSearch && matchType;
    });
  }, [connections, searchQuery, selectedType]);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-16 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Cable & Interconnect Topology
              </h1>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                Layer 1/2
              </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Physical patch interconnects, fiber trunks, and device uplink maps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/network"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>NOC Dashboard</span>
            </Link>

            <button
              onClick={() => fetchConnections()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Map New Cable Link</span>
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm shrink-0">
              <Waypoints className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Links</p>
              <p className="text-xl font-black text-foreground">{stats.total}</p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-sm shrink-0 border border-primary/20">
              <Cable className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Copper Patch (Cat6/6a)</p>
              <p className="text-xl font-black text-foreground">{stats.copper}</p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shadow-sm shrink-0 border border-primary/20">
              <Wifi className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Optical Fiber (OM3/OS2)</p>
              <p className="text-xl font-black text-foreground">{stats.fiber}</p>
            </div>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black shadow-sm shrink-0 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Operational Links</p>
              <p className="text-xl font-black text-foreground">{stats.active}</p>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search source, target, port, or cable..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm self-stretch sm:self-auto justify-center">
            {[
              { id: "all", label: "All Media" },
              { id: "copper", label: "Copper (Cat6)" },
              { id: "fiber", label: "Optical Fiber" },
              { id: "other", label: "Other Medium" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  selectedType === t.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Table */}
        {loading ? (
          <div className="h-72 bg-card/30 animate-pulse rounded-2xl border border-border/40" />
        ) : filteredConnections.length === 0 ? (
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-16 text-center shadow-sm flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-4">
              <Cable className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black text-foreground">No Interconnects Found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {searchQuery
                ? "No connections match your active search filter. Try clearing query."
                : "No physical links mapped yet. Click 'Map New Cable Link' to connect two network devices."}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-5 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Map First Connection</span>
            </button>
          </div>
        ) : (
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 border-b border-border/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-3.5 px-5">Source Device (Origin)</th>
                    <th className="py-3.5 px-4 text-center">Interconnect Link</th>
                    <th className="py-3.5 px-5">Target Device (Destination)</th>
                    <th className="py-3.5 px-4">Medium / Spec</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredConnections.map((conn) => {
                    const isTesting = testingLinkId === conn.id;
                    const isFiber = (conn.cable_type || "").toLowerCase().includes("fiber");
                    return (
                      <tr key={conn.id} className="hover:bg-muted/30 transition-colors group">
                        {/* Source */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted border border-border/50 flex items-center justify-center text-foreground font-black shrink-0">
                              <Server className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{conn.source_asset_id}</p>
                              <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                Port: {conn.source_port || "Eth0"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Link Bridge Indicator */}
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
                              {conn.source_port || "P1"}
                            </span>
                            <div className="relative flex items-center">
                              <div
                                className={cn(
                                  "w-12 sm:w-20 h-0.5 transition-all",
                                  isTesting
                                    ? "bg-emerald-500 shadow-sm animate-pulse"
                                    : isFiber
                                    ? "bg-primary/80"
                                    : "bg-border"
                                )}
                              />
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground -ml-1" />
                            </div>
                            <span className="font-mono text-[9px] font-bold text-muted-foreground px-1.5 py-0.5 rounded bg-muted/60 border border-border/40">
                              {conn.target_port || "P2"}
                            </span>
                          </div>
                        </td>

                        {/* Target */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-muted border border-border/50 flex items-center justify-center text-foreground font-black shrink-0">
                              <Server className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate">{conn.target_asset_id}</p>
                              <span className="font-mono text-[10px] text-muted-foreground font-semibold">
                                Port: {conn.target_port || "Eth0"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Cable Type */}
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-xl text-[10px] font-bold border inline-flex items-center gap-1.5",
                              isFiber
                                ? "bg-primary/10 text-primary border-primary/20"
                                : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            <Cable className="w-3 h-3" />
                            <span>{conn.cable_type || "Cat6"}</span>
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {conn.status || "Active"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleTestLink(conn.id)}
                              disabled={isTesting}
                              title="Test link loopback"
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-muted hover:bg-muted/80 text-foreground border border-border/40 transition-colors cursor-pointer"
                            >
                              {isTesting ? "Pinging..." : "Test Link"}
                            </button>
                            <button
                              onClick={() => deleteConnection(conn.id)}
                              title="Remove connection"
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <ConnectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchConnections}
      />
    </DashboardLayout>
  );
}
