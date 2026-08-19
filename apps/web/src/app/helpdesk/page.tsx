"use client";

import { useState } from "react";
import { Plus, LayoutGrid, Table, RefreshCw, AlertCircle, Clock, CheckCircle2, ShieldAlert, FileSpreadsheet, Printer } from "lucide-react";
import { TicketDetailsDrawer } from "@/components/helpdesk/TicketDetailsDrawer";
import { NewTicketModal } from "@/components/helpdesk/NewTicketModal";
import { KanbanBoard } from "@/components/service-desk/KanbanBoard";
import { TicketTable } from "@/components/helpdesk/TicketTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useQuery } from "@tanstack/react-query";
import { ticketsApi, type Ticket } from "@/lib/api";
import { exportTicketsExcel, printTicketsSheet } from "@/lib/excelExport";

export default function HelpDeskPage() {
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");

  // Query Tickets
  const { data: tickets = [], refetch } = useQuery<Ticket[]>({
    queryKey: ["tickets"],
    queryFn: async () => {
      return await ticketsApi.getAll();
    },
  });

  const totalTickets = tickets.length;
  const inProgress = tickets.filter((t: Ticket) => t.status === "In Progress" || t.status === "Open" || t.status === "NEW" || t.status === "IN_PROGRESS").length;
  const criticalCount = tickets.filter((t: Ticket) => t.priority === "Critical" || t.priority === "High").length;
  const resolvedCount = tickets.filter((t: Ticket) => t.status === "Resolved" || t.status === "Closed" || t.status === "RESOLVED" || t.status === "CLOSED").length;

  const kpis = [
    { label: "Total Active Tickets", value: totalTickets, icon: AlertCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "In Progress", value: inProgress, icon: Clock, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { label: "High / Critical SLA", value: criticalCount, icon: ShieldAlert, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Resolved Today", value: resolvedCount, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <DashboardLayout>
      <div data-tour="helpdesk-tickets" className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-375 mx-auto">
        {/* Modals & Slide-over Drawer */}
        <TicketDetailsDrawer
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          onSuccess={() => {
            refetch();
          }}
        />

        <NewTicketModal
          isOpen={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          onSuccess={() => {
            setIsNewTicketModalOpen(false);
            refetch();
          }}
        />

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">IT Helpdesk & Support</h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Manage Service Requests, SLA Escalations & Incident Ticketing
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => exportTicketsExcel(tickets)}
              title="Export tickets roster to Excel spreadsheet"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/40 transition-all cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Excel Export</span>
            </button>

            <button
              onClick={() => printTicketsSheet(tickets)}
              title="Generate printable support tickets copy"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Sheet</span>
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsNewTicketModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Support Ticket</span>
            </button>
          </div>
        </div>

        {/* SLA KPI Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className="text-2xl font-black tracking-tight text-foreground">{kpi.value}</p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} border border-border/40 flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* View Switcher Header */}
        <div className="flex items-center justify-between bg-card/40 backdrop-blur-xl border border-border/50 p-2 rounded-2xl">
          <span className="text-xs font-bold text-muted-foreground px-3">Service Desk View</span>

          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>

            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Ticket Table</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === "kanban" ? (
          <div className="flex-1 overflow-hidden min-h-125">
            <KanbanBoard onTicketClick={(id) => setSelectedTicketId(id)} />
          </div>
        ) : (
          <TicketTable tickets={tickets} onSelectTicket={(id) => setSelectedTicketId(id)} />
        )}
      </div>
    </DashboardLayout>
  );
}
