"use client";

import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, Monitor, Ticket, Users, FileText, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

interface SearchResult {
  id: string | number;
  name?: string;
  title?: string;
  type: "Asset" | "Ticket" | "Employee";
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ assets: SearchResult[], tickets: SearchResult[], employees: SearchResult[] }>({ assets: [], tickets: [], employees: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

  useEffect(() => {
    if (query.length < 2) {
      setResults({ assets: [], tickets: [], employees: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiFetch<any>(`/search?q=${encodeURIComponent(query)}`);
        setResults({
          assets: data.assets || [],
          tickets: data.tickets || [],
          employees: data.employees || []
        });
      } catch (e) {
        console.error("Search failed", e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (type: string, id: string | number) => {
    onOpenChange(false);
    if (type === "Asset") {
      router.push(`/assets/${id}`);
    } else if (type === "Ticket") {
      router.push(`/helpdesk/${id}`);
    } else if (type === "Employee") {
      router.push(`/employees`);
    }
  };

  return (
    <Command.Dialog 
      open={open} 
      onOpenChange={onOpenChange}
      label="Global Search"
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4"
    >
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-border px-4 py-3">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <Command.Input
            value={query}
            onValueChange={setQuery}
            placeholder="Search assets, tickets, employees..."
            className="flex-1 bg-transparent border-none outline-none text-foreground text-sm font-medium placeholder:text-muted-foreground/60 h-8"
          />
          {loading && <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0 ml-3" />}
        </div>
        
        <Command.List className="max-h-[300px] overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <Command.Empty className="py-6 text-center text-sm text-muted-foreground font-medium">
            {query.length < 2 ? "Type at least 2 characters to search." : "No results found."}
          </Command.Empty>

          {results.assets.length > 0 && (
            <Command.Group heading="Assets" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/80 mb-2">
              {results.assets.map(asset => (
                <Command.Item
                  key={`asset-${asset.id}`}
                  onSelect={() => handleSelect("Asset", asset.id)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm text-foreground cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors group mt-1"
                >
                  <Monitor className="w-4 h-4 mr-3 text-primary shrink-0" />
                  <span className="flex-1 truncate">{asset.name}</span>
                  <span className="text-[10px] bg-background border border-border px-2 py-0.5 rounded-md ml-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                    Asset
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {results.tickets.length > 0 && (
            <Command.Group heading="Tickets" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/80 mb-2">
              {results.tickets.map(ticket => (
                <Command.Item
                  key={`ticket-${ticket.id}`}
                  onSelect={() => handleSelect("Ticket", ticket.id)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm text-foreground cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors group mt-1"
                >
                  <Ticket className="w-4 h-4 mr-3 text-destructive shrink-0" />
                  <span className="flex-1 truncate">{ticket.title}</span>
                  <span className="text-[10px] bg-background border border-border px-2 py-0.5 rounded-md ml-2 group-hover:bg-destructive group-hover:text-destructive-foreground group-hover:border-destructive transition-colors">
                    Ticket
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}

          {results.employees.length > 0 && (
            <Command.Group heading="Employees" className="px-2 py-1.5 text-xs font-semibold text-muted-foreground/80 mb-2">
              {results.employees.map(emp => (
                <Command.Item
                  key={`emp-${emp.id}`}
                  onSelect={() => handleSelect("Employee", emp.id)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm text-foreground cursor-pointer hover:bg-muted aria-selected:bg-muted transition-colors group mt-1"
                >
                  <Users className="w-4 h-4 mr-3 text-emerald-500 shrink-0" />
                  <span className="flex-1 truncate">{emp.name}</span>
                  <span className="text-[10px] bg-background border border-border px-2 py-0.5 rounded-md ml-2 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-500 transition-colors">
                    Employee
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          )}
        </Command.List>
        <div className="bg-muted px-4 py-3 flex items-center justify-between border-t border-border">
          <span className="text-xs text-muted-foreground font-medium">Use <kbd className="bg-background border border-border rounded px-1.5 py-0.5 ml-1 shadow-sm">↑</kbd> <kbd className="bg-background border border-border rounded px-1.5 py-0.5 shadow-sm">↓</kbd> to navigate</span>
          <span className="text-xs text-muted-foreground font-medium">Press <kbd className="bg-background border border-border rounded px-1.5 py-0.5 ml-1 shadow-sm">Enter</kbd> to select</span>
        </div>
      </div>
    </Command.Dialog>
  );
}
