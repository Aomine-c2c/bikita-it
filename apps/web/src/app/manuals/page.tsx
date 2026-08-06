"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KnowledgeDashboard } from "@/components/knowledge/KnowledgeDashboard";
import { BookOpen } from "lucide-react";

export default function ManualsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-7xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
        
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 shrink-0 px-4 md:px-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              Manual Library
            </h1>
            <p className="text-sm font-semibold text-muted-foreground mt-2">
              Hardware and software instruction manuals.
            </p>
          </div>
        </div>

        {/* Dashboard Area */}
        <div className="flex-1 overflow-hidden px-4 md:px-0 pb-8">
          <div className="h-full overflow-y-auto pr-2 custom-scrollbar">
            <KnowledgeDashboard defaultCategory="MANUAL" />
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
