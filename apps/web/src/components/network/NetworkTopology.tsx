"use client";

import React, { useState, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Router, Server, Globe } from "lucide-react";

// ---- Custom Node ----
function NetworkNode({ data }: { data: any }) {
  const statusColor = {
    online: "border-emerald-400 bg-emerald-50",
    degraded: "border-amber-400 bg-amber-50",
    offline: "border-red-400 bg-red-50",
  }[data.status as string] ?? "border-border bg-white";

  const dotColor = {
    online: "bg-emerald-500",
    degraded: "bg-amber-500",
    offline: "bg-red-500",
  }[data.status as string] ?? "bg-slate-400";

  const Icon = data.icon ?? Server;

  return (
    <div className={cn("px-3 py-2.5 rounded-xl border-2 shadow-sm bg-white min-w-[130px] cursor-pointer hover:shadow-md transition-shadow", statusColor)}>
      <Handle type="target" position={Position.Top} className="!bg-slate-300 !border-slate-300 !w-2 !h-2" />
      <div className="flex items-center gap-2">
        <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", {
          "bg-emerald-100": data.status === "online",
          "bg-amber-100": data.status === "degraded",
          "bg-red-100": data.status === "offline",
        })}>
          <Icon className={cn("w-3.5 h-3.5", {
            "text-emerald-600": data.status === "online",
            "text-amber-600": data.status === "degraded",
            "text-red-600": data.status === "offline",
          })} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-foreground truncate leading-tight">{data.label}</p>
          <p className="text-[10px] text-muted-foreground leading-tight">{data.sub}</p>
        </div>
        <span className={cn("w-2 h-2 rounded-full shrink-0", dotColor,
          data.status === "online" ? "shadow-[0_0_0_3px_rgba(34,197,94,0.2)]" : ""
        )} />
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-slate-300 !border-slate-300 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = { networkNode: NetworkNode };

const INIT_NODES: Node[] = [
  { id: "wan",    type: "networkNode", position: { x: 340, y: 20  }, data: { label: "Internet (WAN)",       sub: "Upstream 1Gbps",   status: "online",   icon: Globe   } },
  { id: "fw1",    type: "networkNode", position: { x: 200, y: 130 }, data: { label: "FW-Primary",           sub: "Palo Alto PA-220", status: "online",   icon: Router  } },
  { id: "fw2",    type: "networkNode", position: { x: 480, y: 130 }, data: { label: "FW-Secondary (HA)",    sub: "Standby",          status: "online",   icon: Router  } },
  { id: "core1",  type: "networkNode", position: { x: 340, y: 240 }, data: { label: "Core Switch",          sub: "Cisco Catalyst 9500", status: "online", icon: Router } },
  { id: "dist1",  type: "networkNode", position: { x: 140, y: 350 }, data: { label: "Dist-A (Server Room)", sub: "Cisco 9300",       status: "online",   icon: Server  } },
  { id: "dist2",  type: "networkNode", position: { x: 540, y: 350 }, data: { label: "Dist-B (Office)",      sub: "Cisco 9300",       status: "degraded", icon: Server  } },
  { id: "edge1",  type: "networkNode", position: { x: 40,  y: 460 }, data: { label: "Edge-A1 (VMware)",     sub: "192.168.10.0/24",  status: "online",   icon: Server  } },
  { id: "edge2",  type: "networkNode", position: { x: 240, y: 460 }, data: { label: "Edge-A2 (Storage)",    sub: "192.168.20.0/24",  status: "online",   icon: Server  } },
  { id: "edge3",  type: "networkNode", position: { x: 440, y: 460 }, data: { label: "Edge-B1 (Desktops)",   sub: "192.168.30.0/24",  status: "online",   icon: Router  } },
  { id: "edge4",  type: "networkNode", position: { x: 640, y: 460 }, data: { label: "Edge-B2 (AP Ctrl.)",   sub: "192.168.40.0/24",  status: "offline",  icon: Wifi    } },
];

const INIT_EDGES: Edge[] = [
  { id: "e1",  source: "wan",   target: "fw1",   animated: true,  style: { stroke: "#22c55e", strokeWidth: 2 } },
  { id: "e2",  source: "wan",   target: "fw2",   style: { stroke: "#a1a1aa", strokeDasharray: "5 5" } },
  { id: "e3",  source: "fw1",   target: "core1", animated: true,  style: { stroke: "#22c55e", strokeWidth: 2 } },
  { id: "e4",  source: "fw2",   target: "core1", style: { stroke: "#a1a1aa", strokeDasharray: "5 5" } },
  { id: "e5",  source: "core1", target: "dist1", animated: true,  style: { stroke: "#94a3b8", strokeWidth: 1.5 } },
  { id: "e6",  source: "core1", target: "dist2", animated: true,  style: { stroke: "#f59e0b", strokeWidth: 1.5 } },
  { id: "e7",  source: "dist1", target: "edge1", style: { stroke: "#e4e4e7" } },
  { id: "e8",  source: "dist1", target: "edge2", style: { stroke: "#e4e4e7" } },
  { id: "e9",  source: "dist2", target: "edge3", style: { stroke: "#e4e4e7" } },
  { id: "e10", source: "dist2", target: "edge4", style: { stroke: "#ef4444", strokeDasharray: "4 4" } },
];

export function NetworkTopology() {
  const [nodes, setNodes, onNodesChange] = useNodesState(INIT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INIT_EDGES);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="bg-[#FAFAFA] rounded-2xl border border-border/60 shadow-sm overflow-hidden w-full h-[520px] relative">
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-xs font-bold text-foreground">Live Topology</span>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        proOptions={{ hideAttribution: true }}
      >
        <Controls className="!bg-white !border-border/60 !shadow-sm" />
        <Background gap={16} size={1} color="#e4e4e7" />
      </ReactFlow>
    </div>
  );
}
