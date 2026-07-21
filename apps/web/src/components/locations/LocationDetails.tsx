"use client";

import React, { useState } from "react";
import { Server, Monitor, HardDrive, Shield, Plus, MoreHorizontal, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import { AddAssetModal } from "@/components/assets/AddAssetModal";

// Mock assets for the Rack
const initialRackAssets: any[] = [];

const unassignedAssets: any[] = [];

const getIcon = (category: string) => {
  switch (category) {
    case "Servers": return <Server className="w-4 h-4" />;
    case "Networking": return <Monitor className="w-4 h-4" />;
    case "Storage": return <HardDrive className="w-4 h-4" />;
    case "Security": return <Shield className="w-4 h-4" />;
    default: return <Server className="w-4 h-4" />;
  }
};

// --- DND Components ---

function DraggableAsset({ asset }: { asset: any }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: asset.id,
    data: asset,
  });

  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "bg-white border border-border/60 rounded-lg p-3 flex items-center gap-3 cursor-grab hover:shadow-sm active:cursor-grabbing",
        isDragging ? "opacity-50" : "opacity-100"
      )}
    >
      <GripVertical className="w-4 h-4 text-muted-foreground/50" />
      <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
        {getIcon(asset.category)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground truncate">{asset.name}</p>
        <p className="text-[10px] text-muted-foreground truncate">{asset.model} • {asset.uSize}U</p>
      </div>
    </div>
  );
}

function RackSlot({ u, asset, isOver }: { u: number; asset?: any; isOver: boolean }) {
  const { setNodeRef } = useDroppable({
    id: `rack-slot-${u}`,
    data: { u },
  });

  if (asset) {
    // Determine color based on category
    let colorClass = "bg-slate-800 border-slate-700 text-slate-200";
    if (asset.category === "Networking") colorClass = "bg-blue-900 border-blue-800 text-blue-200";
    if (asset.category === "Security") colorClass = "bg-emerald-900 border-emerald-800 text-emerald-200";
    if (asset.category === "Storage") colorClass = "bg-purple-900 border-purple-800 text-purple-200";

    return (
      <div
        className="flex border-b border-border/40 relative z-10"
        style={{ height: `${asset.uSize * 24}px` }} // 24px per U
      >
        <div className="w-8 shrink-0 bg-slate-100 flex items-start justify-center border-r border-border/60 pt-1 text-[9px] font-bold text-muted-foreground">
          {u}
        </div>
        <div className="flex-1 p-0.5">
          <div className={cn("w-full h-full rounded border flex items-center justify-between px-3 shadow-inner", colorClass)}>
            <div className="flex items-center gap-2">
              <span className="opacity-70">{getIcon(asset.category)}</span>
              <span className="text-xs font-mono font-bold">{asset.id}</span>
              <span className="text-xs font-medium border-l border-white/20 pl-2 ml-1">{asset.name}</span>
            </div>
            <span className="text-[10px] font-medium opacity-60 bg-black/20 px-1.5 py-0.5 rounded">{asset.model}</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty slot
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-[24px] border-b border-border/20 transition-colors",
        isOver ? "bg-primary/10" : "bg-white"
      )}
    >
      <div className="w-8 shrink-0 bg-slate-50 flex items-center justify-center border-r border-border/40 text-[9px] font-bold text-muted-foreground/50">
        {u}
      </div>
      <div className="flex-1 flex items-center">
        {/* Render horizontal rack mounting holes */}
        <div className="flex justify-between w-full px-2 opacity-20">
          <div className="w-1.5 h-1.5 rounded-sm bg-slate-400" />
          <div className="w-1.5 h-1.5 rounded-sm bg-slate-400" />
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

export function LocationDetails({ location }: { location: any }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [mountedAssets, setMountedAssets] = useState(initialRackAssets);
  const [unmountedAssets, setUnmountedAssets] = useState(unassignedAssets);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const slotId = over.id as string;
    if (slotId.startsWith("rack-slot-")) {
      const u = over.data.current?.u;
      
      const assetToMount = unmountedAssets.find(a => a.id === active.id);
      if (assetToMount && u) {
        // Check if the target position is already occupied
        const isOccupied = mountedAssets.some(a => {
          const assetEnd = a.position + a.uSize - 1;
          const newAssetEnd = u + assetToMount.uSize - 1;
          return (u >= a.position && u <= assetEnd) || 
                 (a.position >= u && a.position <= newAssetEnd);
        });

        if (isOccupied) {
          console.warn('Cannot mount asset: space already occupied');
          return;
        }

        // Check if there's enough space from the target position
        const spaceAvailable = u - assetToMount.uSize >= 0;
        if (!spaceAvailable) {
          console.warn('Cannot mount asset: insufficient space in rack');
          return;
        }

        setMountedAssets([...mountedAssets, { ...assetToMount, position: u }]);
        setUnmountedAssets(unmountedAssets.filter(a => a.id !== active.id));
      }
    }
  };

  if (!location) {
    return (
      <div className="bg-white border border-border/60 rounded-[14px] shadow-sm flex flex-col h-full items-center justify-center p-8">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
          <Server className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-sm font-bold text-foreground">Select a Location</h3>
        <p className="text-xs text-muted-foreground mt-1 text-center max-w-[250px]">
          Click on a node in the Digital Twin Explorer to view its assets and details.
        </p>
      </div>
    );
  }

  // Rack Layout Generation (42U)
  const renderRack = () => {
    const slots = [];
    let currentU = 42; // Top down

    while (currentU > 0) {
      const mountedAsset = mountedAssets.find(a => a.position === currentU);
      
      if (mountedAsset) {
        slots.push(<RackSlot key={`slot-${currentU}`} u={currentU} asset={mountedAsset} isOver={false} />);
        currentU -= mountedAsset.uSize; // Skip the U's taken by this asset
      } else {
        slots.push(<RackSlot key={`slot-${currentU}`} u={currentU} isOver={false} />);
        currentU -= 1;
      }
    }
    return slots;
  };

  return (
    <div className="bg-white border border-border/60 rounded-[14px] shadow-sm flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border/40 bg-[#FAFAFA]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-slate-200/50 px-2 py-0.5 rounded">
                {location.type}
              </span>
              <span className="text-xs text-muted-foreground font-mono">{location.id}</span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{location.name}</h2>
          </div>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-md hover:bg-primary/90 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add Asset
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {location.type === "RACK" ? (
          <DndContext onDragEnd={handleDragEnd}>
            {/* Left: Unassigned Assets Pool */}
            <div className="w-[300px] border-r border-border/40 bg-slate-50/50 flex flex-col">
              <div className="p-4 border-b border-border/40">
                <h3 className="text-sm font-bold text-foreground">Available Assets</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">Drag to mount in rack</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {unmountedAssets.map(asset => (
                  <DraggableAsset key={asset.id} asset={asset} />
                ))}
                {unmountedAssets.length === 0 && (
                  <div className="text-center py-8 text-xs text-muted-foreground">
                    All assets mounted
                  </div>
                )}
              </div>
            </div>

            {/* Right: Interactive Rack Elevation Diagram */}
            <div className="flex-1 overflow-y-auto bg-slate-100 p-8 flex justify-center">
              <div className="w-full max-w-[500px]">
                <div className="bg-slate-800 text-slate-300 text-center py-2 text-xs font-bold uppercase tracking-widest rounded-t-lg border-b border-slate-900 shadow-sm">
                  {location.name} (42U)
                </div>
                <div className="bg-white border-x-4 border-b-4 border-slate-800 shadow-xl rounded-b-lg flex flex-col">
                  {renderRack()}
                </div>
              </div>
            </div>
          </DndContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 w-full">
            <p className="text-sm text-muted-foreground text-center">
              Select a Room or Rack to view its contained assets. <br/>
              Buildings and Mines contain child locations, not direct assets.
            </p>
          </div>
        )}
      </div>
      <AddAssetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => {}} />
    </div>
  );
}
