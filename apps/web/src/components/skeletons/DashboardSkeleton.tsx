import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function DashboardSkeleton() {
  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col gap-6"
    >
      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <motion.div key={i} variants={staggerItem} className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border/40">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="w-24 h-4 rounded" />
              <Skeleton className="w-8 h-8 rounded-full" />
            </div>
            <Skeleton className="w-32 h-8 rounded mb-2" />
            <Skeleton className="w-40 h-3 rounded" />
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts/Tables Area */}
        <motion.div variants={staggerItem} className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border/40">
          <Skeleton className="w-48 h-6 rounded mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="flex-1 h-4 rounded" />
                <Skeleton className="w-24 h-4 rounded" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Sidebar/Activity Area */}
        <motion.div variants={staggerItem} className="p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-border/40">
          <Skeleton className="w-32 h-6 rounded mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="w-2 h-2 rounded-full mt-2" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-full h-4 rounded" />
                  <Skeleton className="w-2/3 h-3 rounded" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
