"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AssetSidebar } from "@/components/assets/AssetSidebar";
import { AssetTable } from "@/components/assets/AssetTable";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";

export default function AssetsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-4 h-[calc(100vh-6rem)] flex flex-col">
        
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-2xl font-bold tracking-tight text-foreground"
            >
              Asset Directory
            </motion.h1>
          </div>
          
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <button 
              onClick={() => alert('Add Asset functionality - Would open asset creation modal')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground border border-primary hover:bg-primary/90 rounded-md text-xs font-semibold transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Asset
            </button>
          </motion.div>
        </div>

        {/* Dual Pane Layout */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex-1 flex gap-6 overflow-hidden"
        >
          {/* Left Sidebar */}
          <AssetSidebar />
          
          {/* Main Table Area */}
          <div className="flex-1 overflow-hidden min-w-0">
            <AssetTable />
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
