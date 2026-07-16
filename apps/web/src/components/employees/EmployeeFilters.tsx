"use client";

import React from "react";
import { Search, SlidersHorizontal, Plus, DownloadCloud } from "lucide-react";

export function EmployeeFilters() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
      <div className="relative w-full sm:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search employees by name, email, or role..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-border/60 focus:bg-slate-50 focus:border-primary rounded-xl text-sm outline-none transition-all placeholder:text-muted-foreground shadow-sm"
        />
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
        <div className="flex items-center bg-white border border-border/60 rounded-xl shadow-sm h-10">
          <select className="px-4 h-full text-xs font-semibold text-foreground bg-transparent border-r border-border/60 outline-none appearance-none cursor-pointer pr-8 hover:bg-slate-50 rounded-l-xl">
            <option>All Departments</option>
            <option>Engineering</option>
            <option>Design</option>
            <option>Marketing</option>
            <option>HR & Ops</option>
            <option>Executive</option>
          </select>
          <select className="px-4 h-full text-xs font-semibold text-foreground bg-transparent border-r border-border/60 outline-none appearance-none cursor-pointer pr-8 hover:bg-slate-50">
            <option>All Roles</option>
            <option>Full-Time</option>
            <option>Contractor</option>
            <option>Intern</option>
          </select>
          <select className="px-4 h-full text-xs font-semibold text-foreground bg-transparent outline-none appearance-none cursor-pointer pr-8 hover:bg-slate-50 rounded-r-xl">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Onboarding</option>
            <option>Offboarding</option>
            <option>Leave</option>
          </select>
        </div>
        
        <button className="flex items-center gap-2 p-2.5 rounded-xl border border-border/60 bg-white shadow-sm hover:bg-slate-50 text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border/60 hidden sm:block mx-1" />

        <button className="flex items-center justify-center p-2.5 bg-white border border-border/60 rounded-xl text-foreground hover:bg-slate-50 transition-colors shadow-sm hidden sm:flex shrink-0">
          <DownloadCloud className="w-4 h-4" />
        </button>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs font-semibold transition-colors shadow-sm shrink-0">
          <Plus className="w-4 h-4" />
          Add Person
        </button>
      </div>
    </div>
  );
}
