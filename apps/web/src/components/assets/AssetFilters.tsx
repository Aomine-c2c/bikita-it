"use client";

import React from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";

export function AssetFilters() {
  return (
    <div className="bg-white rounded-t-[14px] border border-border/60 border-b-0 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by ID, Serial, or User..."
          className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-border/60 focus:bg-white focus:border-primary rounded-lg text-sm outline-none transition-all placeholder:text-muted-foreground shadow-sm"
        />
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <div className="flex items-center bg-white border border-border/60 rounded-lg shadow-sm h-9">
          <select className="px-3 h-full text-xs font-semibold text-foreground bg-transparent border-r border-border/60 outline-none appearance-none cursor-pointer pr-8 hover:bg-slate-50">
            <option>All Categories</option>
            <option>Laptops</option>
            <option>Desktops</option>
            <option>Network</option>
            <option>Software</option>
          </select>
          <select className="px-3 h-full text-xs font-semibold text-foreground bg-transparent border-r border-border/60 outline-none appearance-none cursor-pointer pr-8 hover:bg-slate-50">
            <option>All Statuses</option>
            <option>Active</option>
            <option>In Repair</option>
            <option>In Stock</option>
            <option>Retired</option>
          </select>
          <select className="px-3 h-full text-xs font-semibold text-foreground bg-transparent outline-none appearance-none cursor-pointer pr-8 hover:bg-slate-50">
            <option>All Locations</option>
            <option>HQ - Floor 1</option>
            <option>HQ - Floor 2</option>
            <option>Processing Plant</option>
            <option>Remote</option>
          </select>
        </div>
        
        <button className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-white shadow-sm hover:bg-slate-50 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
