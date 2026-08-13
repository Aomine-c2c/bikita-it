"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AIAssistantSidebar } from "./AIAssistantSidebar";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { GuidedTour } from "@/components/tutorial/GuidedTour";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const handleStartTour = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pulse_tour_completed");
    }
    setIsTourOpen(true);
  };

  return (
    <AuthGuard>
      <div className="flex h-screen w-full bg-mesh overflow-hidden font-sans relative">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-3">Skip to main content</a>
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Header
            onToggleAI={() => setIsAIOpen(!isAIOpen)}
            isAIOpen={isAIOpen}
            onMenuToggle={() => setIsSidebarOpen(true)}
            onStartTour={handleStartTour}
          />
          <main id="main-content" className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-8 pt-4">
            <div className="mx-auto w-full max-w-[1600px]">
              {children}
            </div>
          </main>
        </div>
        
        {/* AI Assistant Sidebar sliding in from the right */}
        <AIAssistantSidebar isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />

        {/* Guided Tour Engine */}
        <GuidedTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
      </div>
    </AuthGuard>
  );
}
