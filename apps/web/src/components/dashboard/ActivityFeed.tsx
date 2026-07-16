"use client";

import React from "react";
import { motion } from "framer-motion";
import { Laptop, Wrench, ShieldAlert, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const activities = [
  {
    id: 1,
    type: "repair",
    title: "ThinkPad T14 Screen Replaced",
    description: "Ticket #4092 closed by IT-Support-2",
    time: "2 hours ago",
    icon: Wrench,
    color: "text-blue-500 bg-blue-500/10",
  },
  {
    id: 2,
    type: "alert",
    title: "Core Switch Offline",
    description: "Processing Plant SW-04 is unreachable.",
    time: "3 hours ago",
    icon: ShieldAlert,
    color: "text-destructive bg-destructive/10",
  },
  {
    id: 3,
    type: "assignment",
    title: "MacBook Pro Assigned",
    description: "Assigned to Sarah Jenkins (Engineering).",
    time: "5 hours ago",
    icon: Laptop,
    color: "text-emerald-500 bg-emerald-500/10",
  },
  {
    id: 4,
    type: "audit",
    title: "Weekly Stock Count Completed",
    description: "Warehouse B - 100% variance match.",
    time: "Yesterday",
    icon: CheckCircle2,
    color: "text-primary bg-primary/10",
  },
];

export function ActivityFeed() {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-[var(--shadow-premium)] overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="font-semibold text-lg text-foreground tracking-tight">Recent Activity</h3>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {activities.map((activity, index) => (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 300, damping: 30 }}
              key={activity.id}
              className="flex gap-4 relative group"
            >
              {/* Connection Line */}
              {index !== activities.length - 1 && (
                <div className="absolute left-5 top-10 bottom-[-1.5rem] w-px bg-border group-hover:bg-primary/20 transition-colors" />
              )}
              
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm",
                  activity.color
                )}
              >
                <activity.icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1 pb-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                    {activity.time}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
