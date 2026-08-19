"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard, Box, ClipboardList, Network, Server,
  Wrench, BarChart3, ShieldAlert, Users, Settings, Book,
  Activity, X, Video, Monitor, Package, ShieldCheck, Cpu
} from "lucide-react";
import { cn } from "@/lib/utils";

// Sidebar items
const ALL_SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",       labelKey: "dashboard",      href: "/" },
  { icon: Box,             label: "Assets",          labelKey: "assetLifecycle", href: "/assets" },
  { icon: ClipboardList,   label: "Inventory",       labelKey: "inventory",      href: "/inventory" },
  { icon: Package,         label: "Accessories",     labelKey: "accessories",    href: "/accessories" },
  { icon: Wrench,          label: "Repairs",         labelKey: "repairQueue",    href: "/repairs" },
  { icon: Activity,        label: "Helpdesk",        labelKey: "helpdesk",       href: "/helpdesk" },
  { icon: Network,         label: "Network",         labelKey: "networkDevices", href: "/network" },
  { icon: Video,           label: "Cameras",         labelKey: "cameras",        href: "/cameras" },
  { icon: Server,          label: "Locations",       labelKey: "locations",      href: "/locations" },
  { icon: Users,           label: "Employees",       labelKey: "employees",      href: "/employees" },
  { icon: Monitor,         label: "Software",        labelKey: "software",       href: "/software" },
  { icon: Book,            label: "Knowledge",       labelKey: "knowledgeBase",  href: "/docs" },
  { icon: Cpu,             label: "Operations",      labelKey: "operations",     href: "/operations" },
  { icon: ShieldCheck,     label: "Audit Log",       labelKey: "auditLog",       href: "/activity" },
  { icon: BarChart3,       label: "Reports",         labelKey: "reports",        href: "/reports" },
  { icon: Settings,        label: "Settings",        labelKey: "settings",       href: "/settings" },
];

function getUserRole(): string {
  if (typeof window === "undefined") return "SUPER_ADMIN";
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("pulse_access_token");
    if (token) {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.role) return payload.role;
      }
    }
  } catch {}
  return localStorage.getItem("user_role") || "SUPER_ADMIN";
}

export function Sidebar({ isMobileOpen, onMobileClose }: { isMobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation("common");
  const [orgName, setOrgName] = useState<string>("PULSE Enterprise");
  const [userRole] = useState<string>(() => (typeof window !== "undefined" ? getUserRole() : "SUPER_ADMIN"));

  const { data: badgesData } = useQuery({
    queryKey: ["sidebar-badges"],
    queryFn: () => apiFetch<{ badges?: Record<string, { text?: string; variant?: string }> }>("/system/sidebar-badges"),
    refetchInterval: 30000,
  });

  const badges = badgesData?.badges || {};

  React.useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<{ settings?: { general?: { orgName?: string } } }>("/settings");
        if (data?.settings?.general?.orgName) {
          setOrgName(data.settings.general.orgName);
        }
      } catch {
        // Settings API not yet implemented
      }
    })();
  }, []);

  const visibleItems = ALL_SIDEBAR_ITEMS.filter((item) => {
    if (userRole === "SUPER_ADMIN" || userRole === "ADMIN") return true;
    if (userRole === "HOD") {
      return ["/", "/assets", "/inventory", "/helpdesk", "/employees", "/locations", "/docs", "/operations", "/reports", "/activity"].includes(item.href);
    }
    if (userRole === "TECHNICIAN" || userRole === "TECH") {
      return ["/", "/assets", "/inventory", "/accessories", "/repairs", "/helpdesk", "/network", "/cameras", "/locations", "/software", "/docs", "/operations", "/activity"].includes(item.href);
    }
    if (userRole === "EMPLOYEE") {
      return ["/", "/assets", "/helpdesk", "/docs", "/activity"].includes(item.href);
    }
    if (userRole === "STUDENT") {
      return ["/helpdesk", "/docs", "/assets", "/activity"].includes(item.href);
    }
    return true;
  });

  const isExpanded = isMobileOpen || isHovered;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Desktop spacer so fixed sidebar doesn't cover content */}
      <div className="hidden md:block w-16 h-full shrink-0" />

      <motion.aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ width: isExpanded ? 264 : 64 }}
        transition={{ duration: 0.28, ease: [0.23, 1, 0.32, 1] }}
        className={cn(
          "h-full bg-background flex flex-col z-50 shrink-0 overflow-hidden border-r border-border md:fixed absolute top-0 left-0",
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Mobile Close Button */}
        <button
          onClick={onMobileClose}
          aria-label="Close navigation menu"
          className="md:hidden absolute right-4 top-5 p-1.5 rounded-full hover:bg-slate-200 z-50 focus-visible:outline-none cursor-pointer"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        {/* Brand Header — compact */}
        <div className={cn(
          "flex items-center shrink-0 overflow-hidden transition-all duration-300",
          isExpanded ? "px-4 pt-4 pb-3 gap-3" : "px-3 pt-4 pb-3 justify-center"
        )}>
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-sm border border-border/20">
            <ShieldAlert className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-wider leading-tight">{orgName}</span>
                <span className="font-black text-sm text-foreground tracking-tight leading-tight">
                  IT Operations{" "}
                  <span className="text-[9px] font-black bg-primary text-primary-foreground px-1 py-0.5 rounded ml-0.5 align-middle">v2.0</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation — no scroll, fills remaining space with justify-between spacing */}
        <nav className="flex-1 flex flex-col justify-between overflow-hidden px-2 pb-3">
          <motion.ul
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col flex-1 justify-evenly"
          >
            {visibleItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href + "/"));
              const translatedLabel = t(`sidebar.items.${item.labelKey}`, item.label);
              const badge = badges[item.labelKey];

              return (
                <motion.li key={item.label} variants={staggerItem}>
                  <Link
                    onClick={onMobileClose}
                    href={item.href}
                    aria-label={translatedLabel}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-lg block"
                  >
                    <motion.span
                      whileHover={isActive ? {} : { x: 3 }}
                      className={cn(
                        "flex items-center rounded-lg transition-all duration-200 group relative",
                        !isExpanded ? "justify-center w-10 h-9 mx-auto" : "gap-2.5 px-3 py-1.5",
                        isActive
                          ? "bg-primary text-primary-foreground font-bold shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground font-semibold"
                      )}
                    >
                      {/* Icon wrapper */}
                      <div className="relative shrink-0">
                        <item.icon
                          className={cn(
                            "transition-colors duration-200",
                            !isExpanded ? "w-4.5 h-4.5" : "w-4 h-4",
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        {/* Dot badge (no text) */}
                        {badge && !badge.text && (
                          <span
                            className={cn(
                              "absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ring-2 ring-background animate-pulse",
                              badge.variant === "destructive"
                                ? "bg-red-500"
                                : badge.variant === "warning"
                                ? "bg-yellow-500"
                                : "bg-primary"
                            )}
                          />
                        )}
                      </div>

                      {/* Label */}
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            className="text-xs whitespace-nowrap overflow-hidden flex-1"
                          >
                            {translatedLabel}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Badge text */}
                      {isExpanded && badge?.text && (
                        <span
                          className={cn(
                            "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                            badge.variant === "destructive"
                              ? "bg-red-500/10 text-red-500"
                              : "bg-primary/10 text-primary"
                          )}
                        >
                          {badge.text}
                        </span>
                      )}

                      {/* Active dot */}
                      {isActive && isExpanded && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground opacity-60 shrink-0" />
                      )}

                      {/* Tooltip (collapsed only) */}
                      {!isHovered && (
                        <span className="absolute left-full ml-3 px-2.5 py-1.5 bg-foreground text-background text-xs font-black rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                          <div className="flex items-center gap-1.5">
                            {translatedLabel}
                            {badge?.text && (
                              <span
                                className={cn(
                                  "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                                  badge.variant === "destructive"
                                    ? "bg-red-500 text-white"
                                    : "bg-primary text-primary-foreground"
                                )}
                              >
                                {badge.text}
                              </span>
                            )}
                          </div>
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-2 bg-foreground rotate-45" />
                        </span>
                      )}
                    </motion.span>
                  </Link>
                </motion.li>
              );
            })}
          </motion.ul>
        </nav>
      </motion.aside>
    </>
  );
}
