"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Command } from "cmdk";
import {
  Search, Monitor, LifeBuoy, Users, FileText, ArrowRight, LayoutDashboard,
  Box, Server, Waypoints, Network, Video, Sparkles, Package, Wrench,
  Activity, BarChart3, Settings, Book, Plus, Download, Moon, Sun, HelpCircle,
  Command as CommandIcon, ArrowUpRight
} from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";

interface SearchResult {
  id: string | number;
  name?: string;
  title?: string;
  type: "Asset" | "Ticket" | "Employee" | "Camera" | "Device";
}

interface NavCommand {
  label: string;
  href: string;
  icon: React.ElementType;
  category: "Navigation" | "Hardware & Racks" | "Operations" | "Governance";
  badge?: string;
}

const NAV_COMMANDS: NavCommand[] = [
  { label: "Mission Control Dashboard", href: "/", icon: LayoutDashboard, category: "Navigation" },
  { label: "Hardware Asset Lifecycle", href: "/assets", icon: Box, category: "Hardware & Racks", badge: "19 Tools" },
  { label: "42U Server Rack Studio & Locations", href: "/locations", icon: Server, category: "Hardware & Racks", badge: "Digital Twin" },
  { label: "Cable Interconnect Topology Hub", href: "/connections", icon: Waypoints, category: "Hardware & Racks", badge: "Topology" },
  { label: "Network Operations Center (NOC)", href: "/network", icon: Network, category: "Operations", badge: "Canvas" },
  { label: "Surveillance Video Matrix (SOC)", href: "/cameras", icon: Video, category: "Operations", badge: "RTSP" },
  { label: "Software & SaaS AI Cost Optimizer", href: "/software", icon: Sparkles, category: "Operations", badge: "AI Engine" },
  { label: "Consumable Stock & QR Inventory", href: "/inventory", icon: Package, category: "Operations", badge: "Safety Min" },
  { label: "Equipment Repairs & RMA Queue", href: "/repairs", icon: Wrench, category: "Operations", badge: "Kanban" },
  { label: "IT Helpdesk & Incident Tickets", href: "/helpdesk", icon: LifeBuoy, category: "Operations", badge: "SLA Matrix" },
  { label: "Staff & Employee Directory", href: "/employees", icon: Users, category: "Governance" },
  { label: "Security & SOC2 Audit Timeline", href: "/activity", icon: Activity, category: "Governance", badge: "Immutable" },
  { label: "Executive Reports & Analytics", href: "/reports", icon: BarChart3, category: "Governance", badge: "PDF/CSV" },
  { label: "Knowledge Base & SOP Manuals", href: "/docs", icon: Book, category: "Governance" },
  { label: "System Administration Settings", href: "/settings", icon: Settings, category: "Governance", badge: "7 Tabs" },
];

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    assets: SearchResult[];
    tickets: SearchResult[];
    employees: SearchResult[];
  }>({ assets: [], tickets: [], employees: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  // Live entity search with debounce
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ assets: [], tickets: [], employees: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch<any>(`/search?q=${encodeURIComponent(query.trim())}`);
        setResults({
          assets: data.assets || [],
          tickets: data.tickets || [],
          employees: data.employees || [],
        });
      } catch {
        // Soft fallback
        setResults({ assets: [], tickets: [], employees: [] });
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    setQuery("");
    router.push(path);
  };

  const handleSelectEntity = (type: string, id: string | number) => {
    onOpenChange(false);
    setQuery("");
    if (type === "Asset") {
      router.push(`/assets`);
    } else if (type === "Ticket") {
      router.push(`/helpdesk`);
    } else if (type === "Employee") {
      router.push(`/employees`);
    }
  };

  const filteredNav = useMemo(() => {
    if (!query.trim()) return NAV_COMMANDS;
    const q = query.toLowerCase();
    return NAV_COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q));
  }, [query]);

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Global Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[16vh] px-4 font-sans"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />

      {/* Spotlight Window */}
      <div className="relative w-full max-w-2xl bg-card/90 backdrop-blur-2xl border border-border/70 shadow-2xl rounded-3xl overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="flex items-center border-b border-border/40 px-4 py-3.5 bg-muted/20">
          <Search className="w-4 h-4 text-muted-foreground mr-3 shrink-0" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Type a command, route, asset SKU, ticket ID, or staff name..."
            className="flex-1 bg-transparent border-none outline-none text-foreground text-xs sm:text-sm font-medium placeholder:text-muted-foreground/60 h-8"
          />
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0 ml-3" />
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-muted px-2 py-0.5 rounded-md border border-border/50 text-muted-foreground">
              ESC
            </kbd>
          )}
        </div>

        {/* Scrollable Command List */}
        <Command.List className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
          <Command.Empty className="py-8 text-center text-xs text-muted-foreground font-medium">
            {query.length > 0 ? "No matching modules or database records found." : "Start typing to search..."}
          </Command.Empty>

          {/* Quick Actions (When query is empty or matches action terms) */}
          {(!query || query.toLowerCase().includes("new") || query.toLowerCase().includes("add") || query.toLowerCase().includes("theme") || query.toLowerCase().includes("tour")) && (
            <Command.Group heading="Quick Triggers & Utilities" className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              <Command.Item
                onSelect={() => handleNavigate("/assets")}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-foreground cursor-pointer hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground flex items-center justify-center">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold">Add New Hardware Asset</span>
                </div>
                <span className="text-[10px] font-mono opacity-60">/assets</span>
              </Command.Item>

              <Command.Item
                onSelect={() => handleNavigate("/helpdesk")}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-foreground cursor-pointer hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground flex items-center justify-center">
                    <LifeBuoy className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold">Log Helpdesk Support Ticket</span>
                </div>
                <span className="text-[10px] font-mono opacity-60">/helpdesk</span>
              </Command.Item>

              <Command.Item
                onSelect={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  onOpenChange(false);
                }}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs text-foreground cursor-pointer hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-primary/10 text-primary group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground flex items-center justify-center">
                    {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="font-bold">Toggle Theme ({theme === "dark" ? "Light Mode" : "Dark Mode"})</span>
                </div>
                <span className="text-[10px] font-mono opacity-60">Theme</span>
              </Command.Item>
            </Command.Group>
          )}

          {/* Navigation Routes */}
          {filteredNav.length > 0 && (
            <Command.Group heading="Module Navigation" className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {filteredNav.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <Command.Item
                    key={cmd.href}
                    onSelect={() => handleNavigate(cmd.href)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-foreground cursor-pointer hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-muted text-foreground group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground flex items-center justify-center">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold">{cmd.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {cmd.badge && (
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground">
                          {cmd.badge}
                        </span>
                      )}
                      <ArrowUpRight className="w-3 h-3 opacity-40 group-aria-selected:opacity-100" />
                    </div>
                  </Command.Item>
                );
              })}
            </Command.Group>
          )}

          {/* Live Search: Assets */}
          {results.assets.length > 0 && (
            <Command.Group heading="Matching Assets" className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {results.assets.map((asset) => (
                <Command.Item
                  key={`asset-${asset.id}`}
                  onSelect={() => handleSelectEntity("Asset", asset.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-foreground cursor-pointer hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Monitor className="w-3.5 h-3.5 text-primary group-aria-selected:text-primary-foreground shrink-0" />
                    <span className="font-bold truncate">{asset.name}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground shrink-0">
                    Asset
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Live Search: Tickets */}
          {results.tickets.length > 0 && (
            <Command.Group heading="Matching Helpdesk Tickets" className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {results.tickets.map((ticket) => (
                <Command.Item
                  key={`ticket-${ticket.id}`}
                  onSelect={() => handleSelectEntity("Ticket", ticket.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-foreground cursor-pointer hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <LifeBuoy className="w-3.5 h-3.5 text-destructive group-aria-selected:text-primary-foreground shrink-0" />
                    <span className="font-bold truncate">{ticket.title}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground shrink-0">
                    Ticket
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {/* Live Search: Employees */}
          {results.employees.length > 0 && (
            <Command.Group heading="Matching Staff Directory" className="px-2 py-1 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
              {results.employees.map((emp) => (
                <Command.Item
                  key={`emp-${emp.id}`}
                  onSelect={() => handleSelectEntity("Employee", emp.id)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-foreground cursor-pointer hover:bg-muted/60 aria-selected:bg-primary aria-selected:text-primary-foreground transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className="w-3.5 h-3.5 text-emerald-500 group-aria-selected:text-primary-foreground shrink-0" />
                    <span className="font-bold truncate">{emp.name}</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-aria-selected:bg-primary-foreground/20 group-aria-selected:text-primary-foreground shrink-0">
                    Staff
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>

        {/* Footer HUD */}
        <div className="bg-muted/30 px-4 py-2.5 flex items-center justify-between border-t border-border/40 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-background border border-border/60 rounded px-1.5 py-0.5 mr-1 font-mono shadow-2xs">↑</kbd>
              <kbd className="bg-background border border-border/60 rounded px-1.5 py-0.5 font-mono shadow-2xs">↓</kbd> Navigate
            </span>
            <span>
              <kbd className="bg-background border border-border/60 rounded px-1.5 py-0.5 font-mono shadow-2xs">↵</kbd> Select
            </span>
          </div>
          <span className="flex items-center gap-1 font-mono text-[10px]">
            <CommandIcon className="w-3 h-3" />
            <span>K Palette</span>
          </span>
        </div>
      </div>
    </Command.Dialog>
  );
}
