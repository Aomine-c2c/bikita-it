
"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { AlertCircle, Clock, CheckCircle2, Wrench, MoreHorizontal, User } from "lucide-react";

const COLUMNS = [
  { id: "REPORTED", title: "Triage / Reported", icon: AlertCircle, color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
  { id: "DIAGNOSING", title: "Diagnosing", icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
  { id: "IN_PROGRESS", title: "In Progress", icon: Wrench, color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/20" },
  { id: "WAITING_ON_PARTS", title: "Waiting on Parts", icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  { id: "COMPLETED", title: "Completed", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" }
];

interface KanbanProps {
  repairs: any[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onStatusChange: (repairId: string, newStatus: string) => Promise<void>;
}

export function RepairKanbanBoard({ repairs, activeId, onSelect, onStatusChange }: KanbanProps) {
  const [columns, setColumns] = useState<{ [key: string]: any[] }>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsClient(true);
  }, []);

  useEffect(() => {
    const grouped: { [key: string]: any[] } = {
      REPORTED: [],
      DIAGNOSING: [],
      IN_PROGRESS: [],
      WAITING_ON_PARTS: [],
      COMPLETED: [],
    };
    
    repairs.forEach(repair => {
      const status = repair.status || "REPORTED";
      if (grouped[status]) {
        grouped[status].push(repair);
      } else {
        grouped["REPORTED"].push(repair);
      }
    });
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setColumns(grouped);
  }, [repairs]);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceCol = source.droppableId;
    const destCol = destination.droppableId;

    const sourceItems = [...(columns[sourceCol] || [])];
    const destItems = sourceCol === destCol ? sourceItems : [...(columns[destCol] || [])];
    
    const [movedItem] = sourceItems.splice(source.index, 1);
    movedItem.status = destCol;
    
    destItems.splice(destination.index, 0, movedItem);

    setColumns({
      ...columns,
      [sourceCol]: sourceItems,
      [destCol]: destItems,
    });

    if (sourceCol !== destCol) {
      try {
        await onStatusChange(draggableId, destCol);
      } catch (err) {
        console.error("Failed to update status", err);
      }
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex-1 h-full overflow-x-auto pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 h-full min-w-max px-1">
          {COLUMNS.map((col) => {
            const items = columns[col.id] || [];
            const Icon = col.icon;
            
            return (
              <div key={col.id} className="w-[320px] flex flex-col h-full shrink-0">
                <div className="flex items-center justify-between mb-4 px-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded-md border backdrop-blur-sm", col.bg)}>
                      <Icon className={cn("w-4 h-4", col.color)} />
                    </div>
                    <h3 className="font-bold text-sm text-foreground tracking-tight">{col.title}</h3>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full border border-border/50">
                    {items.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={cn(
                        "flex-1 bg-card/20 backdrop-blur-xl border border-border/40 rounded-2xl p-3 overflow-y-auto transition-colors [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
                        snapshot.isDraggingOver ? "bg-accent/40 border-primary/50" : ""
                      )}
                    >
                      <div className="flex flex-col gap-3 min-h-[50px]">
                        {items.map((repair, index) => (
                          <Draggable key={String(repair.id)} draggableId={String(repair.id)} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                onClick={() => onSelect(String(repair.id))}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                                className={cn(
                                  "bg-background/80 backdrop-blur-xl border border-border/50 rounded-xl p-4 shadow-sm transition-all group hover:bg-accent/80 hover:border-border cursor-grab active:cursor-grabbing",
                                  snapshot.isDragging ? "shadow-2xl scale-105 z-50 ring-2 ring-primary/30" : "",
                                  activeId === String(repair.id) ? "ring-2 ring-primary border-transparent" : ""
                                )}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-primary font-mono tracking-wider bg-primary/10 px-2 py-0.5 rounded-md">
                                    {repair.ticketNumber || `REP-${repair.id}`}
                                  </span>
                                  <button className="text-muted-foreground hover:text-foreground p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); }}>
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </div>
                                
                                <h4 className="font-bold text-sm text-foreground mb-1 leading-tight">{repair.title || (repair.asset ? repair.asset.name : "Unknown Issue")}</h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mb-4 leading-relaxed font-medium">
                                  {repair.description || "No description provided."}
                                </p>
                                
                                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center border border-border/50">
                                      {repair.technician ? (
                                        <span className="text-[9px] font-bold text-foreground">
                                          {repair.technician.name.substring(0, 2).toUpperCase()}
                                        </span>
                                      ) : (
                                        <User className="w-3 h-3 text-muted-foreground" />
                                      )}
                                    </div>
                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                      {repair.technician ? repair.technician.name.split(' ')[0] : "Unassigned"}
                                    </span>
                                  </div>
                                  {repair.priority === "HIGH" && (
                                    <span className="text-[9px] font-black tracking-wider text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-sm uppercase">High Priority</span>
                                  )}
                                  {repair.priority === "CRITICAL" && (
                                    <span className="text-[9px] font-black tracking-wider text-red-600 bg-red-600/20 px-1.5 py-0.5 rounded-sm uppercase animate-pulse">Critical</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
