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
  DownloadCloud,
  Wrench,
  LifeBuoy,
  BarChart3,
  ShieldAlert,
  Users,
  Settings,
  CreditCard,
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
      animate={{ width: collapsed ? 64 : 260 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="hidden md:flex h-full bg-[#F4F4F5] flex flex-col z-20 shrink-0 relative overflow-hidden"
    >
      {/* Brand Header */}
      <div className={cn("flex items-center shrink-0 overflow-hidden", collapsed ? "p-3 justify-center" : "p-5 pb-2 gap-3")}>
        <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm border border-border/50">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <span className="text-[11px] font-semibold text-muted-foreground leading-tight">Bikita Minerals</span>
              <span className="font-bold text-sm text-foreground leading-tight">IT</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Collapse Toggle */}
      <div className={cn("px-3 py-2 shrink-0", collapsed ? "flex justify-center" : "flex justify-end")}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-7 h-7 rounded-lg bg-white border border-border/50 shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-slate-50 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav id="tour-sidebar-nav" className={cn("flex-1 overflow-y-auto overflow-x-hidden py-2 space-y-5", collapsed ? "px-2" : "px-3")}>
        {sidebarSections.map((section, idx) => (
          <div key={idx} className="space-y-0.5">
            {/* Section Label */}
            <AnimatePresence>
              {!collapsed && (
                <motion.h4
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="px-3 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2"
                >
                  {section.title}
                </motion.h4>
              )}
            </AnimatePresence>

            {!collapsed && <div className="h-px bg-border/30 mb-2 mx-1" />}

            {section.items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.label} href={item.href}>
                  <span
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "flex items-center rounded-lg transition-all duration-150 group relative",
                      collapsed ? "justify-center w-10 h-10 mx-auto" : "gap-3 px-3 py-2.5",
                      isActive
                        ? "bg-white text-foreground shadow-sm font-semibold"
                        : "text-muted-foreground hover:bg-zinc-200/60 hover:text-foreground font-medium"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "shrink-0 transition-colors",
                        collapsed ? "w-[18px] h-[18px]" : "w-4 h-4",
                        isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />

                    {/* Label (expanded) */}
                    <AnimatePresence>
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.15 }}
                          className="text-xs whitespace-nowrap overflow-hidden"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Tooltip (collapsed only) */}
                    {collapsed && (
                      <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-foreground text-background text-xs font-semibold rounded-md shadow-lg whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                        {item.label}
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-foreground rotate-45" />
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className={cn("shrink-0 p-3", collapsed ? "flex justify-center" : "")}>
        {collapsed ? (
          <div
            onClick={() => window.location.href = '/settings'}
            title="John Doe — IT Administrator"
            className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-300 transition-colors"
          >
            <span className="text-xs font-bold text-primary">JD</span>
          </div>
        ) : (
          <div 
            onClick={() => window.location.href = '/settings'}
            className="flex items-center gap-3 bg-white p-3 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] border border-border/50 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full shrink-0 bg-slate-100 flex items-center justify-center border border-border/40">
              <span className="text-xs font-bold text-primary">JD</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[13px] font-bold text-foreground truncate leading-tight">John Doe</span>
              <span className="text-[11px] font-medium text-muted-foreground truncate leading-tight mt-0.5">IT Administrator</span>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
