"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Box,
  ClipboardList,
  Network,
  Server,
  Wrench,
  BarChart3,
  ShieldAlert,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarSections = [
  {
    title: "Core Operations",
    items: [
      { icon: LayoutDashboard, label: "Dashboard",       href: "/" },
      { icon: Box,             label: "Asset Lifecycle", href: "/assets" },
      { icon: ClipboardList,   label: "Inventory",       href: "/inventory" },
      { icon: Wrench,          label: "Maintenance",     href: "/repairs" },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { icon: Network,       label: "Network Devices",  href: "/network" },
      { icon: Server,        label: "Locations",        href: "/locations" },
      { icon: Users,         label: "Employees",        href: "/employees" },
    ],
  },
  {
    title: "Governance",
    items: [
      { icon: BarChart3,   label: "Reports",  href: "/reports" },
      { icon: Settings,    label: "Settings", href: "/settings" },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="hidden md:flex h-full bg-[#F8F9FA] flex flex-col z-20 shrink-0 relative overflow-hidden border-r border-border/40"
    >
      {/* Brand Header */}
      <div className={cn("flex items-center shrink-0 overflow-hidden", collapsed ? "p-4 justify-center" : "p-6 pb-2 gap-3.5")}>
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-premium border border-border/20">
          <ShieldAlert className="w-5.5 h-5.5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-tight">XIPHOS Enterprise</span>
              <span className="font-black text-lg text-foreground tracking-tighter leading-tight">Operations</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav id="tour-sidebar-nav" className={cn("flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-7", collapsed ? "px-3" : "px-4")}>
        {sidebarSections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {/* Section Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.h4
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="px-4 text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.15em] mb-3"
                >
                  {section.title}
                </motion.h4>
              )}
            </AnimatePresence>

            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.label} href={item.href}>
                  <motion.span
                    whileHover={{ x: isActive ? 0 : 4 }}
                    className={cn(
                      "flex items-center rounded-xl transition-all duration-200 group relative",
                      collapsed ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-2.5",
                      isActive
                        ? "bg-white text-foreground shadow-premium font-bold border border-border/20"
                        : "text-muted-foreground hover:bg-white/80 hover:text-foreground hover:shadow-sm font-semibold"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "shrink-0 transition-colors",
                        collapsed ? "w-5 h-5" : "w-4.5 h-4.5",
                        isActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-foreground"
                      )}
                    />

                    {/* Label (expanded) */}
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          className="text-xs whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Active Indicator */}
                    {isActive && !collapsed && (
                      <motion.div 
                        layoutId="active-nav"
                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary" 
                      />
                    )}

                    {/* Tooltip (collapsed only) */}
                    {collapsed && (
                      <span className="absolute left-full ml-4 px-3 py-2 bg-foreground text-background text-xs font-black rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {item.label}
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 bg-foreground rotate-45" />
                      </span>
                    )}
                  </motion.span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className={cn("px-4 py-4 border-t border-border/10", collapsed ? "flex justify-center" : "flex justify-between items-center")}>
         {!collapsed && <span className="text-[10px] font-bold text-muted-foreground/40">v1.0.4-stable</span>}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 rounded-lg bg-white border border-border/40 shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:shadow-md transition-all"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* User Profile */}
      <div className={cn("shrink-0 p-4 bg-white/40", collapsed ? "flex justify-center" : "")}>
        {collapsed ? (
          <div
            onClick={() => window.location.href = '/settings'}
            title="John Doe — IT Administrator"
            className="w-11 h-11 rounded-xl bg-white border border-border/40 flex items-center justify-center cursor-pointer hover:bg-slate-50 shadow-sm transition-all"
          >
            <span className="text-xs font-black text-primary">JD</span>
          </div>
        ) : (
          <div 
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-3 bg-white p-3.5 rounded-2xl shadow-premium border border-border/30 cursor-pointer hover:bg-slate-50 transition-all group"
          >
            <div className="w-9 h-9 rounded-xl shrink-0 bg-slate-100 flex items-center justify-center border border-border/40 group-hover:border-primary/20">
              <span className="text-xs font-black text-primary">JD</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-black text-foreground truncate leading-tight">John Doe</span>
              <span className="text-[11px] font-bold text-muted-foreground truncate leading-tight mt-0.5">Systems Architect</span>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
