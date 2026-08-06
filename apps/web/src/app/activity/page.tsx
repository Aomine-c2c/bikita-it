"use client";

import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { motion } from "framer-motion";

export default function ActivityPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10 min-h-[calc(100vh-4rem)]">
        <div className="mb-6">
          <motion.h1 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-bold tracking-tight text-foreground"
          >
            Activity & Operations Log
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm text-muted-foreground mt-1"
          >
            A chronological audit trail of all actions across the platform.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <ActivityFeed />
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
