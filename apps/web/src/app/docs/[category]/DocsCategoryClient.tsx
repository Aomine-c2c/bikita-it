"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KnowledgeDashboard } from "@/components/knowledge/KnowledgeDashboard";
import { Book, FileText, ListChecks, BookOpen } from "lucide-react";

const CATEGORY_MAP: Record<string, { title: string; icon: React.ElementType; desc: string; category?: string }> = {
  all: {
    title: "Knowledge Base",
    icon: Book,
    desc: "Standard Operating Procedures, Manuals, and Network Documentation.",
    category: undefined,
  },
  network: {
    title: "Documentation",
    icon: FileText,
    desc: "General and network documentation.",
    category: "NETWORK_DOC",
  },
  sops: {
    title: "SOPs",
    icon: ListChecks,
    desc: "Standard Operating Procedures and organizational guidelines.",
    category: "SOP",
  },
  manuals: {
    title: "Manual Library",
    icon: BookOpen,
    desc: "Hardware and software instruction manuals.",
    category: "MANUAL",
  },
};

export function DocsCategoryClient({ categoryParam }: { categoryParam: string }) {
  const config = CATEGORY_MAP[categoryParam] || CATEGORY_MAP["all"];
  const Icon = config.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0 px-4 md:px-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              {config.title}
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-2">
              {config.desc}
            </p>
          </div>
        </div>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-hidden px-4 md:px-0 pb-8">
          <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
            <KnowledgeDashboard key={config.category || 'all'} defaultCategory={config.category as "SOP" | "MANUAL" | "NETWORK_DOC" | undefined} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
