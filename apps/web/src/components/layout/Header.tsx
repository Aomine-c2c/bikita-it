"use client";

import React, { useState } from "react";
import { Search, Bell, Settings, ChevronRight, Sparkles, Menu, Globe, LayoutDashboard, Box, ClipboardList, Wrench, Activity, Network, Video, Waypoints, Server, Users, Book, BarChart3, FileText, FileBadge, Library, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { GlobalSearch } from "./GlobalSearch";
import { useAuth } from "@/components/auth/AuthProvider";
import { useTranslation } from "react-i18next";

const ROUTE_CONFIG: Record<string, { label: string, labelKey: string, icon: React.ElementType }> = {
  "/": { label: "Dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  "/assets": { label: "Asset Lifecycle", labelKey: "assetLifecycle", icon: Box },
  "/repairs": { label: "Repair Queue", labelKey: "repairQueue", icon: Wrench },
  "/network": { label: "Network Devices", labelKey: "networkDevices", icon: Network },
  "/cameras": { label: "Cameras", labelKey: "cameras", icon: Video },
  "/connections": { label: "Connections", labelKey: "connections", icon: Waypoints },
  "/locations": { label: "Locations", labelKey: "locations", icon: Server },
  "/inventory": { label: "Inventory", labelKey: "inventory", icon: ClipboardList },
  "/employees": { label: "Employees", labelKey: "employees", icon: Users },
  "/helpdesk": { label: "Helpdesk", labelKey: "helpdesk", icon: Activity },
  "/reports": { label: "Reports", labelKey: "reports", icon: BarChart3 },
  "/settings": { label: "Settings", labelKey: "settings", icon: Settings },
  "/docs/all": { label: "Knowledge Base", labelKey: "knowledgeBase", icon: Book },
  "/docs/network": { label: "Documentation", labelKey: "knowledgeBase", icon: FileText },
  "/docs/sops": { label: "Standard Operating Procedures", labelKey: "knowledgeBase", icon: FileBadge },
  "/docs/manuals": { label: "Manual Library", labelKey: "knowledgeBase", icon: Library },
};

interface HeaderProps {
  onToggleAI?: () => void;
  isAIOpen?: boolean;
  onMenuToggle?: () => void;
  onStartTour?: () => void;
}

export function Header({ onToggleAI, isAIOpen, onMenuToggle, onStartTour }: HeaderProps = {}) {
  const pathname = usePathname();
  const routeMatch = ROUTE_CONFIG[pathname];
  const pageLabel = routeMatch?.label ?? "Pulse";
  const PageIcon = routeMatch?.icon ?? LayoutDashboard;
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { user } = useAuth();
  const { t, i18n } = useTranslation('common');
  
  const userInitials = user?.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U";

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'zh' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <header className="h-18 glass border-b border-white/20 flex items-center justify-between px-4 md:px-8 z-30 w-full shrink-0 sticky top-0 shadow-sm">
      <div className="flex items-center gap-2 md:gap-3 text-[13px]">
        <button 
          onClick={onMenuToggle}
          className="md:hidden p-2 -ml-2 rounded-lg hover:bg-white/50 text-muted-foreground backdrop-blur-md transition-all"
          aria-label="Toggle Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-lg border border-border/40 shadow-xs">
           <span className="text-muted-foreground font-bold tracking-tight">PULSE</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
        <div 
          className="flex items-center justify-center w-7 h-7 bg-muted/50 rounded-lg border border-border/40"
          title={routeMatch ? t(`sidebar.items.${routeMatch.labelKey}`, pageLabel) : pageLabel}
        >
          <PageIcon className="w-4 h-4 text-primary" />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-6">
        <motion.div 
          initial={false}
          animate={{ width: "auto" }}
          className="relative group w-32 sm:w-60 md:w-72" 
          id="tour-search"
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full text-left pl-11 pr-12 py-2.5 bg-muted border border-transparent rounded-xl text-[13px] font-medium outline-none hover:bg-background hover:border-border hover:shadow-sm transition-all text-muted-foreground/60"
          >
            {t('header.searchPlaceholder', 'Search assets, tickets, employees...')}
          </button>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="hidden sm:inline-flex items-center justify-center bg-background rounded-lg text-[10px] font-black text-muted-foreground/60 h-5 px-1.5 shadow-sm border border-border/50">
              ⌘ K
            </kbd>
          </div>
        </motion.div>
        
        <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        <div className="flex items-center gap-2">
          {/* AI Assistant Toggle */}
          <button
            id="tour-ai"
            onClick={onToggleAI}
            className={cn(
              "h-10 px-3 rounded-xl transition-all border shadow-sm flex items-center gap-2 font-bold text-xs",
              isAIOpen
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card hover:bg-muted/60 border-border/50 text-muted-foreground hover:text-foreground shadow-xs"
            )}
            title="Ask AI Assistant"
            aria-label="Ask AI Assistant"
          >
            <Sparkles className={cn("w-4 h-4 shrink-0", isAIOpen ? "animate-pulse" : "")} />
            <span className="hidden sm:inline">{!isAIOpen ? t('header.askAi', 'Ask AI') : t('header.assistantActive', 'Assistant Active')}</span>
          </button>

          {/* Take Tour Button */}
          <button
            onClick={() => {
              if (onStartTour) {
                onStartTour();
              } else {
                localStorage.removeItem("pulse_tour_completed");
                window.location.reload();
              }
            }}
            className="h-10 px-3 rounded-xl transition-all border border-border bg-muted/50 hover:bg-muted text-foreground shadow-xs flex items-center gap-1.5 font-bold text-xs cursor-pointer"
            title="Start Guided Tour"
            aria-label="Start Guided Tour"
          >
            <HelpCircle className="w-4 h-4 text-foreground shrink-0" />
            <span className="hidden md:inline">Take Tour</span>
          </button>

          <div className="h-8 w-px bg-border/20 mx-0.5 md:mx-1" />

          {/* Language Switcher */}
          <button 
            onClick={toggleLanguage}
            className="p-2.5 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground border border-border bg-background shadow-sm hidden sm:flex items-center justify-center gap-1.5 hover:shadow-premium"
            title="Toggle Language"
            aria-label="Toggle Language"
          >
            <Globe className="w-4.5 h-4.5" />
            <span className="text-[10px] font-bold uppercase">{i18n.language === 'zh' ? 'ZH' : 'EN'}</span>
          </button>

          <button 
            onClick={() => window.location.href = '/settings'}
            className="p-2.5 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground border border-border bg-background shadow-sm relative group hidden sm:block hover:shadow-premium"
            title={t('header.notifications', 'Notifications')}
            aria-label={t('header.notifications', 'Notifications')}
          >
            <Bell className="w-4.5 h-4.5 group-hover:rotate-12 transition-transform" />
            <span className="absolute top-2.5 right-2.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive border border-background"></span>
            </span>
          </button>

          <button 
            onClick={() => window.location.href = '/settings'}
            className="p-2.5 rounded-xl hover:bg-muted transition-all text-muted-foreground hover:text-foreground border border-border bg-background shadow-sm hidden sm:block hover:shadow-premium"
            title={t('header.settings', 'Settings')}
            aria-label={t('header.settings', 'Settings')}
          >
            <Settings className="w-4.5 h-4.5" />
          </button>

          <div className="ml-1 md:ml-2 pl-2 md:pl-4 border-l border-border/20">
            <button
              onClick={() => window.location.href = '/settings'}
              title={`${user?.name || 'User'} — ${user?.role === 'divine_general' ? '⚡ Divine General' : user?.role === 'ADMIN' ? 'System Administrator' : (user?.role || 'User')}`}
              aria-label="User profile"
              className="w-10 h-10 rounded-xl overflow-hidden bg-muted flex items-center justify-center border border-border shadow-sm shrink-0 cursor-pointer hover:bg-primary group transition-all"
            >
              <span className="text-[11px] font-black text-primary group-hover:text-primary-foreground transition-colors">{userInitials}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
