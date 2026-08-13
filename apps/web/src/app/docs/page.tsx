"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KnowledgeDashboard } from "@/components/knowledge/KnowledgeDashboard";
import { DocEditorModal } from "@/components/knowledge/DocEditorModal";
import { Book, Plus, FileText, Download, Settings, Network, Layers, ShieldCheck } from "lucide-react";
import { generateTablePdf } from "@/lib/pdf";

export default function DocsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const kpis = [
    { label: "Total Articles & SOPs", value: "38", icon: Book, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Published SOPs", value: "18", icon: Settings, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Network Diagrams", value: "12", icon: Network, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Equipment Manuals", value: "8", icon: FileText, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  const handleExportAllPdf = () => {
    generateTablePdf(
      "Knowledge Base Master Directory",
      [
        { header: "Doc ID", dataKey: "id" },
        { header: "Title", dataKey: "title" },
        { header: "Category", dataKey: "category" },
        { header: "Author", dataKey: "author" },
      ],
      [
        { id: "DOC-101", title: "Cisco Catalyst 9300 VLAN Setup Runbook", category: "NETWORK_DOC", author: "NOC Team" },
        { id: "DOC-102", title: "Employee Hardware Onboarding SOP", category: "SOP", author: "IT Support" },
        { id: "DOC-103", title: "Dell PowerEdge Server Chassis Maintenance", category: "MANUAL", author: "SysAdmin" },
      ],
      "knowledge_base_master_directory"
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {isCreateOpen && (
          <DocEditorModal
            doc={null}
            onClose={() => setIsCreateOpen(false)}
            onSaved={() => setIsCreateOpen(false)}
          />
        )}

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Book className="w-5 h-5" />
              </div>
              Knowledge Base & Runbooks
            </h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Standard Operating Procedures, Hardware Manuals & Network Infrastructure Runbooks
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportAllPdf}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-primary" />
              <span>Export All Docs PDF</span>
            </button>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Document / SOP</span>
            </button>
          </div>
        </div>

        {/* Knowledge KPI Summary Bar */}
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

        {/* Knowledge Dashboard Body */}
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-6 shadow-sm">
          <KnowledgeDashboard defaultCategory="ALL" />
        </div>
      </div>
    </DashboardLayout>
  );
}
