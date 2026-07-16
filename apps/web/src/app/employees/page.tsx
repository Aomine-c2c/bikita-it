"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { EmployeeDirectory } from "@/components/employees/EmployeeDirectory";
import { motion } from "framer-motion";

export default function EmployeesPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Employee Directory
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground mt-1"
            >
              Manage personnel and their assigned equipment.
            </motion.p>
          </div>
        </div>

        {/* Filters and Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col"
        >
          <EmployeeFilters />
          <EmployeeDirectory />
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
