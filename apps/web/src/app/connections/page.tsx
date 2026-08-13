"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ConnectionFormModal } from "@/components/network/ConnectionFormModal";
import { apiFetch } from "@/lib/api";
import { motion } from "framer-motion";
import { Waypoints, Plus, Cable, Trash2, ArrowRight } from "lucide-react";

interface Connection {
  id: number;
  source_asset_id: string;
  source_port?: string;
  target_asset_id: string;
  target_port?: string;
  cable_type?: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const refreshConnections = useCallback(async () => {
    try {
      const data = await apiFetch<Connection[]>("/connections");
      setConnections(data);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const initFetch = async () => {
      try {
        const data = await apiFetch<Connection[]>("/connections");
        if (mounted) setConnections(data);
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    initFetch();
    return () => { mounted = false; };
  }, []);

  const deleteConnection = async (id: number) => {
    if (!confirm("Remove this connection?")) return;
    try {
      await apiFetch(`/connections/${id}`, { method: "DELETE" });
      setConnections(c => c.filter(x => x.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10 min-h-[calc(100vh-4rem)]">
        <div className="mb-6 flex justify-between items-end">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2"
            >
              <Waypoints className="h-6 w-6 text-blue-500" />
              Cable Connections
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mt-1"
            >
              Map and manage physical and logical network links.
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Map Cable
            </button>
          </motion.div>
        </div>

        {loading ? (
          <div className="h-[400px] bg-muted animate-pulse rounded-xl" />
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border/50 rounded-xl overflow-hidden"
          >
            {connections.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Cable className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-medium text-foreground">No Connections Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Start mapping cables between devices.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border/50">
                    <tr>
                      <th className="px-6 py-4 font-medium">Source Device</th>
                      <th className="px-6 py-4 font-medium">Source Port</th>
                      <th className="px-6 py-4 font-medium text-center">Link</th>
                      <th className="px-6 py-4 font-medium">Target Device</th>
                      <th className="px-6 py-4 font-medium">Target Port</th>
                      <th className="px-6 py-4 font-medium">Cable Type</th>
                      <th className="px-6 py-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {connections.map((conn) => (
                      <tr key={conn.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{conn.source_asset_id}</td>
                        <td className="px-6 py-4 text-muted-foreground">{conn.source_port}</td>
                        <td className="px-6 py-4 flex justify-center text-muted-foreground/50">
                          <ArrowRight className="h-4 w-4" />
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">{conn.target_asset_id}</td>
                        <td className="px-6 py-4 text-muted-foreground">{conn.target_port}</td>
                        <td className="px-6 py-4">
                          <span className="bg-secondary text-secondary-foreground px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide uppercase">
                            {conn.cable_type || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => deleteConnection(conn.id)}
                            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      <ConnectionFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={refreshConnections}
      />
    </DashboardLayout>
  );
}
