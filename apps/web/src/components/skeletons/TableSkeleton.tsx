import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";

export function TableSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-lg border border-border/40 overflow-hidden shadow-sm">
      {/* Header Skeleton */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border/40 bg-slate-50 dark:bg-slate-800/50">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-20 h-4 rounded" />
        <Skeleton className="w-32 h-4 rounded" />
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-24 h-4 rounded" />
        <Skeleton className="w-32 h-4 rounded" />
        <Skeleton className="ml-auto w-16 h-4 rounded" />
      </div>

      {/* Rows Skeleton */}
      <motion.div 
        variants={staggerContainer} 
        initial="hidden" 
        animate="visible"
        className="flex-1 flex flex-col divide-y divide-border/20"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <motion.div key={i} variants={staggerItem} className="flex items-center gap-4 px-5 py-4 bg-white dark:bg-slate-900">
            <Skeleton className="w-4 h-4 rounded" />
            <Skeleton className="w-20 h-4 rounded" />
            <Skeleton className="w-32 h-4 rounded" />
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-32 h-4 rounded" />
            <Skeleton className="ml-auto w-16 h-4 rounded" />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
