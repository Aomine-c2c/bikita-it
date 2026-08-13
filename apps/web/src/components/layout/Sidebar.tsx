"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { LayoutDashboard, Box, ClipboardList, Network, Server, Wrench, BarChart3, ShieldAlert, Users, Settings, Book, Activity, X, Video, Waypoints, Monitor, Package, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_SIDEBAR_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard",         labelKey: "dashboard",       href: "/" },
  { icon: Box,             label: "Asset Lifecycle",   labelKey: "assetLifecycle",  href: "/assets" },
  { icon: ClipboardList,   label: "Inventory",         labelKey: "inventory",       href: "/inventory" },
  { icon: Package,         label: "Accessories",       labelKey: "accessories",     href: "/accessories" },
  { icon: Wrench,          label: "Repair Queue",      labelKey: "repairQueue",     href: "/repairs" },
  { icon: Activity,        label: "Helpdesk",          labelKey: "helpdesk",        href: "/helpdesk" },
  { icon: Network,         label: "Network Devices",   labelKey: "networkDevices",  href: "/network" },
  { icon: Video,           label: "Cameras",           labelKey: "cameras",         href: "/cameras" },
  { icon: Waypoints,       label: "Connections",       labelKey: "connections",     href: "/connections" },
  { icon: Server,          label: "Locations",         labelKey: "locations",       href: "/locations" },
  { icon: Users,           label: "Employees",         labelKey: "employees",       href: "/employees" },
  { icon: Monitor,         label: "Software",          labelKey: "software",        href: "/software" },
  { icon: Book,            label: "Knowledge Base",    labelKey: "knowledgeBase",   href: "/docs" },
  { icon: ShieldCheck,     label: "Audit Log",         labelKey: "auditLog",        href: "/activity" },
  { icon: BarChart3,       label: "Reports",           labelKey: "reports",         href: "/reports" },
  { icon: Settings,        label: "Settings",          labelKey: "settings",        href: "/settings" },
];

export function Sidebar({ isMobileOpen, onMobileClose }: { isMobileOpen?: boolean; onMobileClose?: () => void }) {
  const pathname = usePathname();
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const { t } = useTranslation('common');
  const [orgName, setOrgName] = useState<string>("PULSE Enterprise");

  const { data: badgesData } = useQuery({
    queryKey: ['sidebar-badges'],
    queryFn: () => apiFetch<any>('/system/sidebar-badges'),
    refetchInterval: 30000,
  });

  const badges = badgesData?.badges || {};

  React.useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch<any>('/settings');
        if (data?.settings?.general?.orgName) {
          setOrgName(data.settings.general.orgName);
        }
      } catch (err) {
        console.warn("Settings API not implemented or inaccessible, ignoring:", err);
      }
    })();
  }, []);

  const userInitials = user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U";

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={onMobileClose}
        />
      )}

      {/* Spacer for desktop layout so fixed sidebar doesn't cover content */}
      <div className="hidden md:block w-[72px] h-full shrink-0" />
      
    <motion.aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: isHovered ? 280 : 72 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "h-full bg-background flex flex-col z-50 shrink-0 overflow-hidden border-r border-border md:fixed absolute top-0 left-0",
        isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
      )}
    >
      {/* Mobile Close Button */}
      <button 
        onClick={onMobileClose}
        className="md:hidden absolute right-4 top-6 p-2 rounded-full hover:bg-slate-200 z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
      >
        <X className="w-4 h-4 text-muted-foreground" />
      </button>
      {/* Brand Header */}
      <div className={cn("flex items-center shrink-0 overflow-hidden transition-all duration-300", !isHovered ? "p-4 justify-center" : "p-6 pb-2 gap-3.5")}>
        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-premium border border-border/20">
          <ShieldAlert className="w-5.5 h-5.5 text-white" />
        </div>
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden whitespace-nowrap"
            >
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider leading-tight">{orgName}</span>
              <span className="font-black text-lg text-foreground tracking-tighter leading-tight">IT Operations <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 rounded-md ml-1 align-middle">v2.0</span></span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation - Note the scrollbar-hide class (or use standard css scrollbar hiding) */}
      <nav id="tour-sidebar-nav" className={cn("flex-1 overflow-y-auto overflow-x-hidden py-6 transition-all duration-300 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden", !isHovered ? "px-3" : "px-4")}>
        <motion.ul 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="space-y-1.5"
        >
        {ALL_SIDEBAR_ITEMS.map((item) => {
          // Determine if active. If active, DO NOT render to save space as requested.
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + "/"));

          const translatedLabel = t(`sidebar.items.${item.labelKey}`, item.label);
          const badge = badges[item.labelKey];
          
          return (
            <motion.li key={item.label} variants={staggerItem}>
              <Link href={item.href} aria-label={translatedLabel} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-xl block">
              <motion.span
                whileHover={isActive ? {} : { x: 4 }}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group relative",
                  !isHovered ? "justify-center w-12 h-12 mx-auto" : "gap-3 px-4 py-2.5",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground font-semibold"
                )}
              >
                <div className="relative">
                  <item.icon
                    className={cn(
                      "shrink-0 transition-colors duration-200",
                      !isHovered ? "w-5 h-5" : "w-4.5 h-4.5",
                      isActive ? "text-primary-foreground" : "text-muted-foreground/60 group-hover:text-foreground"
                    )}
                  />
                  {/* Subdued dot if badge has no text but has variant */}
                  {badge && !badge.text && (
                     <span className={cn(
                       "absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-background animate-pulse",
                       badge.variant === "destructive" ? "bg-red-500" : badge.variant === "warning" ? "bg-yellow-500" : "bg-primary"
                     )} />
                  )}
                </div>

                {/* Label (expanded) */}
                <AnimatePresence>
                  {isHovered && (
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

                {/* Badge Text (expanded) */}
                {isHovered && badge && badge.text && (
                   <span className={cn(
                     "ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                     badge.variant === "destructive" ? "bg-red-500/10 text-red-500" : "bg-primary/10 text-primary"
                   )}>
                     {badge.text}
                   </span>
                )}

                {/* Active indicator dot (expanded only) */}
                {isActive && isHovered && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-foreground opacity-60" />
                )}

                {/* Tooltip (collapsed only) */}
                {!isHovered && (
                  <span className="absolute left-full ml-4 px-3 py-2 bg-foreground text-background text-xs font-black rounded-lg shadow-xl whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
                    <div className="flex items-center gap-2">
                      {translatedLabel}
                      {badge && badge.text && (
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.5 rounded-full font-bold",
                          badge.variant === "destructive" ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"
                        )}>
                          {badge.text}
                        </span>
                      )}
                    </div>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-2.5 h-2.5 bg-foreground rotate-45" />
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
