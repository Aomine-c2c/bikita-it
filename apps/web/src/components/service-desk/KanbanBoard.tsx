"use client";

import React, { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MoreHorizontal, MessageSquare, Paperclip, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// --- Types ---
type Priority = "Low" | "Medium" | "High" | "Critical";

interface Ticket {
  id: string;
  title: string;
  priority: Priority;
  assignee: string;
  assigneeAvatar: string;
  reporter: string;
  comments: number;
  attachments: number;
  columnId: string;
  slaHours: number; // hours until SLA breach
  category: string;
}

interface Column {
  id: string;
  title: string;
}

// --- Mock Data ---
const initialColumns: Column[] = [
  { id: "new", title: "New" },
  { id: "assigned", title: "Assigned" },
  { id: "working", title: "Working" },
  { id: "testing", title: "Testing" },
  { id: "closed", title: "Closed" },
];

// --- Helpers ---
const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "Critical": return "bg-red-500 text-white";
    case "High": return "bg-amber-500 text-white";
    case "Medium": return "bg-blue-500 text-white";
    case "Low": return "bg-slate-400 text-white";
  }
};

const getSLALabel = (hours: number) => {
  if (hours === 0) return { label: "SLA Breached",   color: "text-red-600 bg-red-50 border-red-200" };
  if (hours <= 2)  return { label: `${hours}h left`,  color: "text-red-600 bg-red-50 border-red-200" };
  if (hours <= 8)  return { label: `${hours}h left`,  color: "text-amber-600 bg-amber-50 border-amber-200" };
  return           { label: `${hours}h left`,          color: "text-slate-500 bg-slate-50 border-slate-200" };
};

// --- Sortable Ticket Card Component ---
function SortableTicket({ ticket, onClick }: { ticket: Ticket; onClick?: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: ticket.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const sla = getSLALabel(ticket.slaHours);
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing mb-3 group",
        isDragging ? "ring-2 ring-primary border-primary" : "border-border/60",
        ticket.priority === "Critical" && "border-l-2 border-l-red-400",
        ticket.priority === "High" && "border-l-2 border-l-amber-400",
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground group-hover:text-primary transition-colors">{ticket.id}</span>
          <span className="text-[10px] text-muted-foreground/60">·</span>
          <span className="text-[10px] text-muted-foreground">{ticket.category}</span>
        </div>
        <button className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-slate-100 transition-colors">
          <MoreHorizontal className="w-3 h-3" />
        </button>
      </div>
      <p className="text-sm font-semibold text-foreground mb-3 leading-snug">{ticket.title}</p>

      {/* SLA Timer */}
      <div className={cn("flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded border w-fit mb-3", sla.color)}>
        <Clock className="w-3 h-3" /> {sla.label}
      </div>

      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/40">
        <div className="flex items-center gap-2">
          <span className={cn("px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded", getPriorityColor(ticket.priority))}>
            {ticket.priority}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(ticket.comments > 0 || ticket.attachments > 0) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              {ticket.comments > 0 && <span className="flex items-center gap-1 text-[10px] font-semibold"><MessageSquare className="w-3 h-3"/> {ticket.comments}</span>}
              {ticket.attachments > 0 && <span className="flex items-center gap-1 text-[10px] font-semibold"><Paperclip className="w-3 h-3"/> {ticket.attachments}</span>}
            </div>
          )}
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white shadow-sm" title={ticket.assignee}>
            {ticket.assigneeAvatar}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Board Component ---
export function KanbanBoard({ onTicketClick }: { onTicketClick: (ticketId: string) => void }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTicket = active.data.current?.type === "Ticket";
    const isOverTicket = over.data.current?.type === "Ticket";
    const isOverColumn = over.data.current?.type === "Column";

    // Scenario 1: Dragging over another ticket
    if (isActiveTicket && isOverTicket) {
      setTickets((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const overIndex = prev.findIndex((t) => t.id === overId);
        
        if (prev[activeIndex].columnId !== prev[overIndex].columnId) {
          const updated = [...prev];
          updated[activeIndex].columnId = prev[overIndex].columnId;
          return arrayMove(updated, activeIndex, overIndex);
        }
        return arrayMove(prev, activeIndex, overIndex);
      });
    }

    // Scenario 2: Dragging over an empty column area
    if (isActiveTicket && isOverColumn) {
      setTickets((prev) => {
        const activeIndex = prev.findIndex((t) => t.id === activeId);
        const updated = [...prev];
        updated[activeIndex].columnId = overId as string;
        return arrayMove(updated, activeIndex, activeIndex);
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    setTickets((prev) => {
      const activeIndex = prev.findIndex((t) => t.id === activeId);
      const overIndex = prev.findIndex((t) => t.id === overId);
      
      // If we dropped over a column (overIndex might be -1 if overId is a columnId)
      if (overIndex === -1) {
        const updated = [...prev];
        updated[activeIndex].columnId = overId as string;
        return updated;
      }

      return arrayMove(prev, activeIndex, overIndex);
    });
  };

  const activeTicket = tickets.find((t) => t.id === activeId);

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 -mx-4 px-4 sm:-mx-8 sm:px-8 mt-6">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 h-full min-h-[600px]">
          {initialColumns.map((col) => {
            const columnTickets = tickets.filter((t) => t.columnId === col.id);
            return (
              <div key={col.id} className="flex flex-col min-w-[320px] max-w-[320px] bg-[#F8FAFC] -[#0F172A] rounded-2xl p-4 border border-border/40">
                <div className="flex items-center justify-between mb-4 px-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    {col.title}
                    <span className="bg-slate-200 text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {columnTickets.length}
                    </span>
                  </h3>
                </div>
                
                <SortableContext
                  id={col.id}
                  items={columnTickets.map(t => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex-1 overflow-y-auto">
                    {columnTickets.map((ticket) => (
                      <SortableTicket key={ticket.id} ticket={ticket} onClick={() => onTicketClick(ticket.id)} />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTicket ? <SortableTicket ticket={activeTicket} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
