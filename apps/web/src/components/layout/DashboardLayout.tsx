"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AIAssistantSidebar } from "./AIAssistantSidebar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAIOpen, setIsAIOpen] = useState(false);

  return (
    <div className="flex h-screen w-full bg-white overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <Header onToggleAI={() => setIsAIOpen(!isAIOpen)} isAIOpen={isAIOpen} />
        <main className="flex-1 overflow-y-auto px-8 pb-8 pt-4">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
      
      {/* AI Assistant Sidebar sliding in from the right */}
      <AIAssistantSidebar isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
    </div>
  );
}
