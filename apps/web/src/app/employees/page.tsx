"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployeeDirectory } from "@/components/employees/EmployeeDirectory";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeProfileDrawer } from "@/components/employees/EmployeeProfileDrawer";
import { EmployeeFormModal } from "@/components/employees/EmployeeFormModal";
import { ReassignAssetModal } from "@/components/assets/ReassignAssetModal";
import { motion } from "framer-motion";
import { Users, Plus, RefreshCw, Laptop, Shield, Building, LayoutGrid, Table, Repeat } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { employeesApi } from "@/lib/api";

export default function EmployeesPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"bento" | "table">("bento");

  // Query Employees
  const { data: rawEmployees = [], refetch } = useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      return await employeesApi.getAll();
    },
  });

  const employees = Array.isArray(rawEmployees) ? rawEmployees : [];
  const totalStaff = employees.length || 18;
  const provisionedCount = 34;
  const adminCount = 4;

  const kpis = [
    { label: "Total Active Staff", value: totalStaff, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Hardware Provisioned", value: `${provisionedCount} Units`, icon: Laptop, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "IT System Admins", value: adminCount, icon: Shield, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Active Departments", value: 6, icon: Building, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-[1500px] mx-auto">
        {/* Profile Drawer */}
        <EmployeeProfileDrawer
          isOpen={!!selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          employee={selectedEmployee}
        />

        {/* Add Employee Modal */}
        <EmployeeFormModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false);
            refetch();
          }}
        />

        {/* Quick Reassign Modal */}
        <ReassignAssetModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          onSuccess={() => {
            setIsAssignModalOpen(false);
            refetch();
          }}
          assetId="1"
        />

        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Employee & Staff Directory</h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Manage Corporate Personnel, Assigned Hardware Equipment & Access Roles
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card/60 border border-border/50 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <Repeat className="w-3.5 h-3.5 text-primary" />
              <span>Assign Hardware</span>
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          </div>
        </div>

        {/* Staff KPI Summary Bar */}
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
          <span className="text-xs font-bold text-muted-foreground px-3">Personnel Directory View</span>

          <div className="flex items-center gap-1 bg-background/80 border border-border/50 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setViewMode("bento")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === "bento"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bento Cards</span>
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
              <span>Employee Table</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        {viewMode === "bento" ? (
          <EmployeeDirectory onSelectEmployee={(emp) => setSelectedEmployee(emp)} />
        ) : (
          <EmployeeTable employees={employees} onSelectEmployee={(emp) => setSelectedEmployee(emp)} />
        )}
      </div>
    </DashboardLayout>
  );
}
