/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, User, Laptop, MapPin, Network, Package, X, Loader2 } from "lucide-react";
import { searchApi, _GlobalSearchResult } from "@/lib/api";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await searchApi.search(query);
        setResults(res);
        setSelectedIndex(0);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Flatten results for keyboard navigation
  const flatResults: { type: string; item: unknown; icon: unknown; path: string }[] = [];
  
  if (results) {
    results.employees.forEach((e: unknown) => flatResults.push({ type: 'Employee', item: e, icon: User, path: `/employees/detail?id=${e.id}` }));
    results.assets.forEach((a: unknown) => flatResults.push({ type: 'Asset', item: a, icon: Laptop, path: `/assets/detail?id=${a.id}` }));
    results.locations.forEach((l: unknown) => flatResults.push({ type: 'Location', item: l, icon: MapPin, path: `/locations?id=${l.id}` }));
    results.network.forEach((n: unknown) => flatResults.push({ type: 'Network', item: n, icon: Network, path: `/network` }));
    results.inventory.forEach((i: unknown) => flatResults.push({ type: 'Inventory', item: i, icon: Package, path: `/inventory` }));
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || flatResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % flatResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + flatResults.length) % flatResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = flatResults[selectedIndex];
      if (selected) {
        handleNavigate(selected.path);
      }
    }
  };

  const handleNavigate = (path: string) => {
    router.push(path);
    setIsOpen(false);
  };

  const totalResults = results ? 
    results.employees.length + results.assets.length + results.locations.length + results.network.length + results.inventory.length 
    : 0;

  return (
    <div className="relative group" id="tour-search" ref={containerRef}>
      {/* Search Bar triggers open state */}
      <div 
        className={cn(
          "relative flex items-center transition-all duration-200 ease-in-out",
          isOpen ? "w-96" : "w-64 xl:w-80"
        )}
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 z-10" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search everywhere..."
          className="w-full pl-11 pr-12 py-2.5 bg-[#F4F4F5]/60 border border-transparent rounded-xl text-[13px] font-medium outline-none focus:bg-white focus:border-border focus:shadow-premium transition-all placeholder:text-muted-foreground/50 relative z-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10">
          {query ? (
            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center justify-center bg-white rounded-lg text-[10px] font-black text-muted-foreground/40 h-5 px-1.5 shadow-sm border border-border/50">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {isOpen && (query.length > 0) && (
        <div className="absolute top-full mt-2 w-125 right-0 bg-white rounded-xl border border-border shadow-premium overflow-hidden z-50 flex flex-col max-h-[80vh]">
          {isLoading && !results && (
            <div className="p-8 flex items-center justify-center text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="ml-3 text-sm font-medium">Searching across all modules...</span>
            </div>
          )}

          {results && totalResults === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No results found for &quot;{query}&quot;</p>
              <p className="text-xs mt-1 opacity-70">Try searching by ID, MAC address, or name</p>
            </div>
          )}

          {results && totalResults > 0 && (
            <div className="overflow-y-auto py-2">
              <div className="px-3 pb-2 mb-2 border-b border-border/40">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  {totalResults} Results Found
                </span>
              </div>

              <div className="space-y-4 px-2">
                {/* Employees */}
                {results.employees.length > 0 && (
                  <div>
                    <div className="px-2 mb-1 flex items-center gap-2 text-primary/70">
                      <User className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Employees</span>
                    </div>
                    {results.employees.map((emp: unknown) => {
                      const idx = flatResults.findIndex(r => r.item.id === emp.id && r.type === 'Employee');
                      return (
                        <div 
                          key={emp.id}
                          onClick={() => handleNavigate(`/employees/detail?id=${emp.id}`)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === idx ? "bg-primary/5 border border-primary/20" : "hover:bg-slate-50 border border-transparent"
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              {emp.name}
                              {emp.employeeId && <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{emp.employeeId}</span>}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {emp.department || 'No Dept'} • {emp.position || 'No Position'}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Assets */}
                {results.assets.length > 0 && (
                  <div>
                    <div className="px-2 mb-1 flex items-center gap-2 text-emerald-600/70">
                      <Laptop className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Assets</span>
                    </div>
                    {results.assets.map((asset: unknown) => {
                      const idx = flatResults.findIndex(r => r.item.id === asset.id && r.type === 'Asset');
                      return (
                        <div 
                          key={asset.id}
                          onClick={() => handleNavigate(`/assets/detail?id=${asset.id}`)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === idx ? "bg-emerald-500/5 border border-emerald-500/20" : "hover:bg-slate-50 border border-transparent"
                          )}
                        >
                          <div className="w-8 h-8 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Laptop className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              {asset.name || asset.tag}
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">{asset.tag}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {asset.make} {asset.model} {asset.serialNumber ? `• SN: ${asset.serialNumber}` : ''}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Network */}
                {results.network.length > 0 && (
                  <div>
                    <div className="px-2 mb-1 flex items-center gap-2 text-indigo-600/70">
                      <Network className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Network</span>
                    </div>
                    {results.network.map((net: unknown) => {
                      const idx = flatResults.findIndex(r => r.item.id === net.id && r.type === 'Network');
                      return (
                        <div 
                          key={net.id}
                          onClick={() => handleNavigate(`/network`)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === idx ? "bg-indigo-500/5 border border-indigo-500/20" : "hover:bg-slate-50 border border-transparent"
                          )}
                        >
                          <div className="w-8 h-8 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Network className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              {net.hostname}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex gap-2">
                              <span>IP: {net.ipAddress}</span>
                              <span>MAC: {net.macAddress}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Locations */}
                {results.locations.length > 0 && (
                  <div>
                    <div className="px-2 mb-1 flex items-center gap-2 text-amber-600/70">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Locations</span>
                    </div>
                    {results.locations.map((loc: unknown) => {
                      const idx = flatResults.findIndex(r => r.item.id === loc.id && r.type === 'Location');
                      return (
                        <div 
                          key={loc.id}
                          onClick={() => handleNavigate(`/locations?id=${loc.id}`)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === idx ? "bg-amber-500/5 border border-amber-500/20" : "hover:bg-slate-50 border border-transparent"
                          )}
                        >
                          <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-600">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground">
                              {loc.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {loc.type}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                
                {/* Inventory */}
                {results.inventory.length > 0 && (
                  <div>
                    <div className="px-2 mb-1 flex items-center gap-2 text-rose-600/70">
                      <Package className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold uppercase tracking-wider">Inventory</span>
                    </div>
                    {results.inventory.map((inv: unknown) => {
                      const idx = flatResults.findIndex(r => r.item.id === inv.id && r.type === 'Inventory');
                      return (
                        <div 
                          key={inv.id}
                          onClick={() => handleNavigate(`/inventory`)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={cn(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            selectedIndex === idx ? "bg-rose-500/5 border border-rose-500/20" : "hover:bg-slate-50 border border-transparent"
                          )}
                        >
                          <div className="w-8 h-8 rounded-md bg-rose-50 flex items-center justify-center text-rose-600">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-foreground flex items-center gap-2">
                              {inv.name}
                              <span className="text-[10px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">{inv.sku}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {inv.category}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}