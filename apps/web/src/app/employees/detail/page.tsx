"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployeeHero } from "@/components/employees/EmployeeHero";
import { EmployeeEquipment, EmployeeSoftware, EmployeeTickets, EmployeeTimeline } from "@/components/employees/EmployeeWidgets";
import { Loader2 } from "lucide-react";

function EmployeeDetailsContent() {
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("id") || "EMP-001";

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 sm:-m-8">
        
        {/* Top Hero Section */}
        <div className="shrink-0 bg-white sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)]">
          <EmployeeHero employeeId={employeeId} />
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFC] -[#0B0F19] p-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-[1600px] mx-auto">
            {/* Left Column: Equipment & Software */}
            <div className="lg:col-span-2 space-y-6">
              <div className="h-[400px]">
                <EmployeeEquipment />
              </div>
              <div className="h-[300px]">
                <EmployeeSoftware />
              </div>
            </div>

            {/* Right Column: Tickets & Timeline */}
            <div className="lg:col-span-1 space-y-6">
              <EmployeeTickets />
              <EmployeeTimeline />
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}

export default function EmployeeDetailsPage() {
  return (
    <Suspense fallback={<div className="h-[60vh] grid place-items-center"><Loader2 className="w-7 h-7 animate-spin" /></div>}>
      <EmployeeDetailsContent />
    </Suspense>
  );
}
