"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  ReactFlow, Controls, Background, useNodesState, useEdgesState,
  addEdge, type Connection, type Edge, type Node, Handle, Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { X, RefreshCw, Wifi, WifiOff, Server, Router, Globe } from "lucide-react";
import { SwitchDetails } from "./SwitchDetails";
import { networkApi, type NetworkDevice } from "@/lib/api";

// ─── Custom node ─────────────────────────────────────────────────────────────

function NetworkNode({ data }: { data: any }) {
  const status = (data.status ?? "").toLowerCase();
  const statusBorder = status.includes("online") || status.includes("active")
    ? "border-emerald-400 bg-emerald-50"
    : status.includes("offline") || status.includes("disconnect")
    ? "border-red-400 bg-red-50"
    : "border-amber-400 bg-amber-50";

  const dotColor = status.includes("online") || status.includes("active")
    ? "bg-emerald-500"
    : status.includes("offline") || status.includes("disconnect")
    ? "bg-red-500"
    : "bg-amber-500";

  const Icon = data.icon ?? Server;
  const isOnline = status.includes("online") || status.includes("active");

  return (
    <div className={cn("px-3 py-2.5 rounded-xl border-2 shadow-sm bg-white min-w-[140px] cursor-pointer hover:shadow-md transition-shadow", statusBorder)}>
      <Handle type="target" position={Position.Top} className="!bg-slate-300 !border-slate-300 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", isOnline ? "bg-emerald-100" : "bg-red-100")}>
          <Icon className={cn("w-3.5 h-3.5", isOnline ? "text-emerald-600" : "text-red-600")} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-foreground truncate leading-tight">{data.label}</p>
          <p className="text-[10px] text-muted-foreground leading-tight truncate">{data.sub}</p>
        </div>
        <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor, isOnline ? "shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" : "")} />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !border-slate-300 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { networkNode: NetworkNode };

// ─── Layout helper — simple force-free grid arrangement ───────────────────────

function layoutDevices(devices: NetworkDevice[]): Node[] {
  const COLS = 4;
  const H_GAP = 200;
  const V_GAP = 120;
  return devices.map((d, i) => ({
    id: String(d.id),
    type: "networkNode",
    position: {
      x: (i % COLS) * H_GAP + 40,
      y: Math.floor(i / COLS) * V_GAP + 40,
    },
    data: {
      label: d.hostname || d.ip_address || `Device ${d.id}`,
      sub: d.ip_address,
      status: (d.status ?? "").toLowerCase(),
      icon: (d.vendor ?? "").toLowerCase().includes("cisco") ? Router
        : (d.status ?? "").toLowerCase().includes("offline") ? WifiOff
        : Server,
      raw: d,
    },
  }));
}

// Build edges from /connections if available, else connect sequentially
function buildEdges(devices: NetworkDevice[]): Edge[] {
  if (devices.length < 2) return [];
  // Connect first device to all others as a simple star topology fallback
  return devices.slice(1).map((d, i) => {
    const isOnline = (d.status ?? "").toLowerCase().includes("online");
    return {
      id: `e-${devices[0].id}-${d.id}`,
      source: String(devices[0].id),
      target: String(d.id),
      animated: isOnline,
      style: {
        stroke: isOnline ? "#22c55e" : "#ef4444",
        strokeWidth: isOnline ? 2 : 1,
        strokeDasharray: isOnline ? undefined : "4 4",
      },
    };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export function NetworkTopology() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const devices = await networkApi.getAll();
      if (devices.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }
      setNodes(layoutDevices(devices));
      setEdges(buildEdges(devices));
    } catch {
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [setNodes, setEdges]);

  useEffect(() => { loadDevices(); }, [loadDevices]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedDevice(node.data);
  }, []);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="bg-[#FAFAFA] rounded-2xl border border-border/60 shadow-sm overflow-hidden w-full h-[520px] relative">
      {/* Status bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {loading ? (
            <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-foreground">Live Topology — {nodes.length} devices</span>
            </>
          )}
        </div>
        <button
          onClick={loadDevices}
          disabled={loading}
          className="p-1.5 rounded-lg bg-white border border-border/60 shadow-sm hover:bg-slate-50 transition-colors disabled:opacity-40"
          title="Refresh topology"
        >
          <RefreshCw className={cn("w-3 h-3 text-muted-foreground", loading && "animate-spin")} />
        </button>
      </div>

      {nodes.length === 0 && !loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Globe className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-muted-foreground">No network devices found.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Scan the network or add devices manually.</p>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onNodeClick={onNodeClick}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          proOptions={{ hideAttribution: true }}
        >
          <Controls className="!bg-white !border-border/60 !shadow-sm" />
          <Background gap={16} size={1} color="#e4e4e7" />
        </ReactFlow>
      )}

      {/* Device detail slide-over */}
      <AnimatePresence>
        {selectedDevice && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[400px] z-20 shadow-2xl bg-slate-950 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">{selectedDevice.label}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{selectedDevice.sub}</p>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Pass real device data into SwitchDetails */}
            <div className="flex-1 overflow-y-auto">
              <SwitchDetails />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
