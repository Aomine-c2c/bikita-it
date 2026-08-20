"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Edge,
  type Node,
  Handle,
  Position,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  RefreshCw,
  Server,
  Router,
  Radio,
  Camera,
  Printer,
  Laptop,
  ShieldAlert,
  Lock,
  Activity,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import { SwitchDetails } from "./SwitchDetails";
import { nocApi, type TopologyNode, type TopologyLink, type ProbeResultData } from "@/lib/api";

// ─── Custom Canvas Node ──────────────────────────────────────────────────────

function TopologyNodeCard({ data }: { data: TopologyNode & { onSelect?: (node: TopologyNode) => void } }) {
  const isRogue = data.is_rogue;
  const isQuarantined = data.quarantined;
  const status = (data.status || "ONLINE").toUpperCase();
  const isOnline = status === "ONLINE" && !isQuarantined;

  const clusterConfig: Record<string, { icon: any; color: string; bg: string; badge: string }> = {
    GATEWAY: { icon: Router, color: "text-indigo-400", bg: "bg-indigo-500/10 border-indigo-500/30", badge: "Gateway / Core" },
    CORE_SWITCH: { icon: Server, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30", badge: "Core Switch" },
    ACCESS_POINT: { icon: Radio, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/30", badge: "Access Point" },
    SERVER: { icon: Server, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", badge: "Server Host" },
    CAMERA: { icon: Camera, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/30", badge: "RTSP Camera" },
    PRINTER: { icon: Printer, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30", badge: "Network Print" },
    ENDPOINT: { icon: Laptop, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30", badge: "Workstation" },
  };

  const cfg = clusterConfig[data.cluster] || clusterConfig.ENDPOINT;
  const Icon = cfg.icon;

  return (
    <div
      onClick={() => data.onSelect && data.onSelect(data)}
      className={cn(
        "p-3 rounded-2xl border-2 shadow-lg backdrop-blur-xl min-w-[170px] max-w-[210px] transition-all cursor-pointer select-none",
        isRogue
          ? "bg-rose-950/80 border-rose-500 text-rose-100 ring-2 ring-rose-500/50 animate-pulse"
          : isQuarantined
          ? "bg-amber-950/80 border-amber-500 text-amber-100"
          : isOnline
          ? "bg-card/90 border-border/80 hover:border-primary/80 hover:shadow-primary/10 text-foreground"
          : "bg-destructive/10 border-destructive/40 text-muted-foreground"
      )}
    >
      <Handle type="target" position={Position.Top} className="!bg-primary !border-border !w-2.5 !h-2.5" />
      
      {/* Node Header */}
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border",
            isRogue ? "bg-rose-500/20 border-rose-500/40 text-rose-400" : cfg.bg
          )}
        >
          {isRogue ? (
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          ) : isQuarantined ? (
            <Lock className="w-4 h-4 text-amber-400" />
          ) : (
            <Icon className={cn("w-4 h-4", cfg.color)} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p className="text-xs font-black truncate leading-tight">{data.label || data.ip_address}</p>
          </div>
          <p className="text-[10px] font-mono text-muted-foreground truncate">{data.ip_address}</p>
        </div>

        {/* Live Status LED */}
        <span
          className={cn(
            "w-2 h-2 rounded-full shrink-0 shadow-sm",
            isRogue
              ? "bg-rose-500 animate-ping"
              : isQuarantined
              ? "bg-amber-500"
              : isOnline
              ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"
              : "bg-rose-500"
          )}
        />
      </div>

      {/* Badges and Telemetry */}
      <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[10px]">
        <span
          className={cn(
            "font-mono px-1.5 py-0.5 rounded-md font-semibold text-[9px]",
            isRogue
              ? "bg-rose-500/20 text-rose-300"
              : "bg-muted/60 text-muted-foreground"
          )}
        >
          {isRogue ? "ROGUE MAC" : isQuarantined ? "ISOLATED" : cfg.badge}
        </span>

        <span className="font-mono text-muted-foreground font-semibold flex items-center gap-0.5">
          <Activity className="w-2.5 h-2.5 text-primary" />
          {data.latency_ms ? `${data.latency_ms}ms` : "1.0ms"}
        </span>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-primary !border-border !w-2.5 !h-2.5" />
    </div>
  );
}

const nodeTypes = { topologyNode: TopologyNodeCard };

// ─── Layout Engine: Hierarchical Clusters ────────────────────────────────────

function layoutTopologyHierarchy(nodes: TopologyNode[], onSelectNode: (node: TopologyNode) => void): Node[] {
  const clusters: Record<string, TopologyNode[]> = {
    GATEWAY: [],
    CORE_SWITCH: [],
    ACCESS_POINT: [],
    SERVER: [],
    ENDPOINT: [],
  };

  nodes.forEach((n) => {
    const c = n.cluster === "GATEWAY" ? "GATEWAY" :
              n.cluster === "CORE_SWITCH" ? "CORE_SWITCH" :
              n.cluster === "ACCESS_POINT" ? "ACCESS_POINT" :
              n.cluster === "SERVER" ? "SERVER" : "ENDPOINT";
    clusters[c].push(n);
  });

  const flowNodes: Node[] = [];
  const startX = 350;

  // Level 0: Gateways
  clusters.GATEWAY.forEach((n, idx) => {
    flowNodes.push({
      id: String(n.id),
      type: "topologyNode",
      position: { x: startX + idx * 240, y: 30 },
      data: { ...n, onSelect: onSelectNode } as any,
    });
  });

  // Level 1: Core Switches
  const swOffset = Math.max(0, (clusters.CORE_SWITCH.length * 240 - 240) / 2);
  clusters.CORE_SWITCH.forEach((n, idx) => {
    flowNodes.push({
      id: String(n.id),
      type: "topologyNode",
      position: { x: startX - swOffset + idx * 240, y: 170 },
      data: { ...n, onSelect: onSelectNode } as any,
    });
  });

  // Level 2: APs & Servers
  const midNodes = [...clusters.ACCESS_POINT, ...clusters.SERVER];
  const midOffset = Math.max(0, (midNodes.length * 220 - 220) / 2);
  midNodes.forEach((n, idx) => {
    flowNodes.push({
      id: String(n.id),
      type: "topologyNode",
      position: { x: startX - midOffset + idx * 220, y: 320 },
      data: { ...n, onSelect: onSelectNode } as any,
    });
  });

  // Level 3: Endpoints / Printers / Cameras / Rogues
  const endCols = Math.max(3, Math.ceil(Math.sqrt(clusters.ENDPOINT.length * 2)));
  const H_GAP = 220;
  const V_GAP = 120;
  const endOffset = ((Math.min(clusters.ENDPOINT.length, endCols) * H_GAP) / 2) - 100;

  clusters.ENDPOINT.forEach((n, idx) => {
    const col = idx % endCols;
    const row = Math.floor(idx / endCols);
    flowNodes.push({
      id: String(n.id),
      type: "topologyNode",
      position: { x: startX - endOffset + col * H_GAP, y: 470 + row * V_GAP },
      data: { ...n, onSelect: onSelectNode } as any,
    });
  });

  return flowNodes;
}

function buildTopologyEdges(links: TopologyLink[]): Edge[] {
  return links.map((l) => {
    const isFiber = l.link_type === "FIBER";
    const isWireless = l.link_type === "WIRELESS";
    const isDegraded = l.status === "DEGRADED" || l.status === "DOWN";

    const strokeColor = isDegraded
      ? "#f43f5e"
      : isFiber
      ? "#a855f7"
      : isWireless
      ? "#06b6d4"
      : "#10b981";

    return {
      id: l.id,
      source: String(typeof l.source === "object" ? l.source.id : l.source),
      target: String(typeof l.target === "object" ? l.target.id : l.target),
      animated: !isDegraded,
      label: l.port_source_label ? `${l.port_source_label} (${l.speed_mbps ? `${l.speed_mbps / 1000}G` : "1G"})` : undefined,
      labelStyle: { fill: "#94a3b8", fontSize: 9, fontWeight: 700, fontFamily: "monospace" },
      labelBgStyle: { fill: "#0f172a", fillOpacity: 0.8, rx: 4, ry: 4 },
      style: {
        stroke: strokeColor,
        strokeWidth: isFiber ? 3 : isDegraded ? 1.5 : 2,
        strokeDasharray: isWireless ? "5 5" : isDegraded ? "3 3" : undefined,
      },
    };
  });
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface NetworkTopologyProps {
  onSelectDevice?: (device: TopologyNode) => void;
}

export function NetworkTopology({ onSelectDevice }: NetworkTopologyProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rawNodes, setRawNodes] = useState<TopologyNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [loading, setLoading] = useState(true);
  const [probingId, setProbingId] = useState<number | null>(null);
  const [probeResult, setProbeResult] = useState<ProbeResultData | null>(null);
  const [filterCluster, setFilterCluster] = useState<string>("ALL");

  const handleSelectNode = useCallback((node: TopologyNode) => {
    setSelectedNode(node);
    setProbeResult(null);
    if (onSelectDevice) onSelectDevice(node);
  }, [onSelectDevice]);

  const loadTopology = useCallback(async () => {
    setLoading(true);
    try {
      const data = await nocApi.getTopologyGraph();
      setRawNodes(data.nodes);
      
      const filtered = filterCluster === "ALL"
        ? data.nodes
        : data.nodes.filter((n) => n.cluster === filterCluster || (filterCluster === "ROGUE" && n.is_rogue));

      setNodes(layoutTopologyHierarchy(filtered, handleSelectNode));
      setEdges(buildTopologyEdges(data.links));
    } catch (_err) {
      setNodes([]);
      setEdges([]);
    } finally {
      setLoading(false);
    }
  }, [filterCluster, handleSelectNode, setNodes, setEdges]);

  useEffect(() => {
    loadTopology();
  }, [loadTopology]);

  const handleInstantProbe = async (node: TopologyNode) => {
    setProbingId(node.id);
    try {
      const res = await nocApi.probeDevice(node.id);
      setProbeResult(res);
      loadTopology();
    } catch (_err) {
      // Ignore
    } finally {
      setProbingId(null);
    }
  };

  const rogueCount = useMemo(() => rawNodes.filter((n) => n.is_rogue).length, [rawNodes]);
  const onlineCount = useMemo(() => rawNodes.filter((n) => n.status === "ONLINE").length, [rawNodes]);

  return (
    <div className="bg-[#0B0F19] text-foreground rounded-3xl border border-slate-800 shadow-2xl overflow-hidden w-full h-[620px] relative flex flex-col">
      {/* Top HUD Controls Bar */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70 backdrop-blur-md z-10 flex flex-wrap items-center justify-between gap-3">
        {/* Left Telemetry KPIs */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-xs font-black text-white tracking-wide">
              CAMPUS NOC TOPOLOGY
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400 bg-slate-900/90 px-3 py-1 rounded-xl border border-slate-800">
            <span>Nodes: <strong className="text-emerald-400">{rawNodes.length}</strong></span>
            <span>•</span>
            <span>Online: <strong className="text-emerald-400">{onlineCount}</strong></span>
            {rogueCount > 0 && (
              <>
                <span>•</span>
                <span className="text-rose-400 font-bold animate-pulse">
                  Rogues: <strong>{rogueCount}</strong>
                </span>
              </>
            )}
          </div>
        </div>

        {/* Cluster Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-2xl border border-slate-800 text-[11px]">
          {[
            { id: "ALL", label: "All Nodes" },
            { id: "GATEWAY", label: "Core / Routers" },
            { id: "CORE_SWITCH", label: "Switches" },
            { id: "ACCESS_POINT", label: "Wi-Fi" },
            { id: "ROGUE", label: `Rogues (${rogueCount})`, danger: rogueCount > 0 },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterCluster(f.id)}
              className={cn(
                "px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer",
                filterCluster === f.id
                  ? f.danger
                    ? "bg-rose-500 text-white shadow-xs"
                    : "bg-primary text-primary-foreground shadow-xs"
                  : f.danger
                  ? "text-rose-400 hover:bg-rose-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              {f.label}
            </button>
          ))}

          <button
            onClick={loadTopology}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors disabled:opacity-50 cursor-pointer ml-1"
            title="Refresh Topology"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative">
        {nodes.length === 0 && !loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Globe className="w-12 h-12 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-bold text-slate-400">No topology nodes matched current filter.</p>
              <p className="text-xs text-slate-600 mt-1">Select "All Nodes" or run a subnet sweep.</p>
            </div>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            proOptions={{ hideAttribution: true }}
          >
            <Controls className="!bg-slate-900 !border-slate-800 !text-slate-300 !shadow-lg" />
            <MiniMap
              nodeColor={(n) => (n.data?.is_rogue ? "#f43f5e" : "#3b82f6")}
              className="!bg-slate-950/80 !border-slate-800 rounded-xl"
            />
            <Background gap={20} size={1} color="#1e293b" />
          </ReactFlow>
        )}
      </div>

      {/* Selected Node Slide-Over Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 h-full w-[380px] sm:w-[420px] z-30 shadow-2xl bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800 flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{selectedNode.label}</h3>
                  <p className="text-[11px] font-mono text-slate-400">{selectedNode.ip_address}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedNode(null)}
                className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Node Details Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Status & Telemetry Card */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Status:</span>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-lg font-mono font-bold text-[10px]",
                      selectedNode.status === "ONLINE" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                    )}
                  >
                    {selectedNode.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">MAC Address:</span>
                  <span className="font-mono text-slate-300 font-bold">{selectedNode.mac_address}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Hardware Vendor:</span>
                  <span className="text-slate-300 font-semibold">{selectedNode.vendor || "Generic"}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">VLAN Assignment:</span>
                  <span className="font-mono text-primary font-bold">VLAN {selectedNode.vlan_id || 1}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold">Latency:</span>
                  <span className="font-mono text-emerald-400 font-bold">{selectedNode.latency_ms || 1.2} ms</span>
                </div>
              </div>

              {/* Instant Probe Action */}
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Instant Live Socket Probe
                  </span>
                  <button
                    disabled={probingId === selectedNode.id}
                    onClick={() => handleInstantProbe(selectedNode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Zap className={cn("w-3.5 h-3.5", probingId === selectedNode.id && "animate-spin")} />
                    <span>{probingId === selectedNode.id ? "Probing..." : "Probe Now"}</span>
                  </button>
                </div>

                {probeResult && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs space-y-1">
                    <p className="text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Host Responded in {probeResult.latency_ms} ms
                    </p>
                    {probeResult.open_ports && probeResult.open_ports.length > 0 ? (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {probeResult.open_ports.map((p, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-cyan-300">
                            {typeof p === "object" ? `${p.service}:${p.port}` : `Port ${p}`}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-500">ICMP echo alive. No standard signature ports open.</p>
                    )}
                  </div>
                )}
              </div>

              {/* If it's a switch, embed switch port faceplate */}
              {selectedNode.device_type === "SWITCH" && (
                <div className="border-t border-slate-800 pt-3">
                  <SwitchDetails deviceId={selectedNode.id} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
