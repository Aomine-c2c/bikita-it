"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { InventoryKPIs } from "@/components/inventory/InventoryKPIs";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { ReceiveStockFAB } from "@/components/inventory/ReceiveStockFAB";
import { motion } from "framer-motion";

export default function InventoryPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 relative min-h-[calc(100vh-4rem)]">
        
        {/* Title Area */}
        <div className="mb-6">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Inventory Management
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground mt-1"
          >
            Track bulk stock, warehousing, and consumption metrics.
          </motion.p>
        </div>

        {/* Dashboard Elements */}
        <InventoryKPIs />
        
        {/* Mega Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-lg font-bold text-foreground mt-8 mb-2">Stock Directory</h2>
          <InventoryTable />
        </motion.div>

        {/* Floating Action Button */}
        <ReceiveStockFAB />

      </div>
    </DashboardLayout>
  );
}
