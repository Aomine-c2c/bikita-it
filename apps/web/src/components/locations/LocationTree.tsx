"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Map, Building, DoorOpen, Server, Hash } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock Data representing the self-referential Prisma Location table
const mockLocations = [
  {
    id: "LOC-01",
    name: "Bikita Minerals HQ",
    type: "MINE",
    children: [
      {
        id: "LOC-02",
        name: "Main Office Block",
        type: "BUILDING",
        children: [
          {
            id: "LOC-03",
            name: "Server Room A",
            type: "ROOM",
            children: [
              { id: "LOC-04", name: "Rack 01 - Core", type: "RACK", assetCount: 12 },
              { id: "LOC-05", name: "Rack 02 - Storage", type: "RACK", assetCount: 8 }
            ]
          },
          { id: "LOC-06", name: "IT Workshop", type: "ROOM", assetCount: 45 }
        ]
      },
      {
        id: "LOC-07",
        name: "Petalite Plant",
        type: "BUILDING",
        children: [
          { id: "LOC-08", name: "Control Room", type: "ROOM", assetCount: 15 },
          { id: "LOC-09", name: "Network Cabinet 1", type: "RACK", assetCount: 3 }
        ]
      },
      {
        id: "LOC-10",
        name: "Powerhouse",
        type: "BUILDING",
        children: [
          { id: "LOC-11", name: "Main Substation", type: "ROOM", assetCount: 5 }
        ]
      }
    ]
  }
];

const LocationIcon = ({ type, className }: { type: string, className?: string }) => {
  switch (type) {
    case "MINE": return <Map className={cn("w-4 h-4 text-primary", className)} />;
    case "BUILDING": return <Building className={cn("w-4 h-4 text-muted-foreground", className)} />;
    case "ROOM": return <DoorOpen className={cn("w-4 h-4 text-muted-foreground", className)} />;
    case "RACK": return <Server className={cn("w-4 h-4 text-muted-foreground", className)} />;
    default: return <Hash className={cn("w-4 h-4 text-muted-foreground", className)} />;
  }
};

const TreeNode = ({ node, level = 0, selectedId, onSelect }: any) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 py-2 px-2 hover:bg-slate-50 cursor-pointer rounded-md transition-colors",
          isSelected && "bg-slate-100"
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={() => onSelect(node)}
      >
        <div 
          className="w-5 h-5 flex items-center justify-center hover:bg-slate-200 rounded text-muted-foreground"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsExpanded(!isExpanded);
          }}
        >
          {hasChildren ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <div className="w-4 h-4" />
          )}
        </div>
        
        <LocationIcon type={node.type} />
        
        <span className={cn("text-sm font-medium", isSelected ? "text-foreground" : "text-muted-foreground")}>
          {node.name}
        </span>
        
        {node.assetCount !== undefined && (
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-muted-foreground rounded-full">
            {node.assetCount} assets
          </span>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="flex flex-col">
          {node.children.map((child: any) => (
            <TreeNode 
              key={child.id} 
              node={child} 
              level={level + 1} 
              selectedId={selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function LocationTree({ onSelectLocation }: { onSelectLocation: (loc: any) => void }) {
  const [selectedId, setSelectedId] = useState<string | null>("LOC-01");

  const handleSelect = (node: any) => {
    setSelectedId(node.id);
    onSelectLocation(node);
  };

  return (
    <div className="bg-white border border-border/60 rounded-[14px] shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-border/40 bg-[#FAFAFA]">
        <h3 className="text-sm font-bold text-foreground">Digital Twin Explorer</h3>
        <p className="text-xs text-muted-foreground mt-1">Navigate the physical location hierarchy</p>
      </div>
      
      <div className="p-2 flex-1 overflow-y-auto">
        {mockLocations.map(root => (
          <TreeNode 
            key={root.id} 
            node={root} 
            selectedId={selectedId} 
            onSelect={handleSelect} 
          />
        ))}
      </div>
    </div>
  );
}
