"use client";

import React from "react";
import { Laptop, ShieldCheck, Ticket, History, ArrowRightLeft, Undo2, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

// --- WIDGET 1: Assigned Equipment ---
export function EmployeeEquipment() {
  const assets = [
    { id: "XIP-4910", name: "MacBook Pro M2 Max", category: "Laptop", status: "Active", date: "Nov 2023" },
    { id: "XIP-4911", name: "Dell UltraSharp 32\"", category: "Monitor", status: "Active", date: "Jan 2024" },
    { id: "XIP-5022", name: "Magic Keyboard", category: "Accessories", status: "Active", date: "Nov 2023" },
    { id: "XIP-5023", name: "Magic Mouse 2", category: "Accessories", status: "Active", date: "Nov 2023" },
  ];

  return (
    <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-border/40 flex justify-between items-center bg-[#FAFAFA]">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Laptop className="w-4 h-4 text-primary" /> Assigned Hardware
        </h3>
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">{assets.length} Items</span>
      </div>
      <div className="divide-y divide-border/40 flex-1 overflow-y-auto">
        {assets.map((asset) => (
          <div key={asset.id} className="p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-sm font-semibold text-foreground">{asset.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{asset.id} • Assigned {asset.date}</p>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-slate-200 transition-colors border border-transparent hover:border-border/60 shadow-sm">
                <Undo2 className="w-3 h-3" /> Quick Return
              </button>
              <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:bg-slate-200 transition-colors border border-transparent hover:border-border/60 shadow-sm">
                <ArrowRightLeft className="w-3 h-3" /> Transfer
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- WIDGET 2: Software Licenses ---
export function EmployeeSoftware() {
  const software = [
    { name: "Adobe Creative Cloud", plan: "All Apps Plan", cost: "$80/mo" },
    { name: "GitHub Enterprise", plan: "Developer", cost: "$21/mo" },
    { name: "Figma", plan: "Organization", cost: "$45/mo" },
    { name: "Slack", plan: "Enterprise Grid", cost: "$15/mo" },
  ];

  return (
    <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-border/40 flex justify-between items-center bg-[#FAFAFA]">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Software Provisioning
        </h3>
        <span className="text-xs font-bold text-muted-foreground">$161/mo</span>
      </div>
      <div className="divide-y divide-border/40 flex-1 overflow-y-auto">
        {software.map((sw, i) => (
          <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-sm font-semibold text-foreground">{sw.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{sw.plan}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{sw.cost}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-border/40 bg-[#FAFAFA] text-center">
         <button className="text-[10px] font-bold text-primary uppercase tracking-wider hover:underline flex items-center justify-center gap-1 w-full">
           View All Provisioning <ArrowUpRight className="w-3 h-3" />
         </button>
      </div>
    </div>
  );
}

// --- WIDGET 3: Open Tickets ---
export function EmployeeTickets() {
  return (
    <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-border/40 flex justify-between items-center bg-[#FAFAFA]">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Ticket className="w-4 h-4 text-amber-500" /> Open Tickets
        </h3>
        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold shadow-sm">1</span>
      </div>
      <div className="p-4">
        <div className="p-4 rounded-xl border border-border/60 hover:border-primary/50 transition-colors cursor-pointer group">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono text-muted-foreground group-hover:text-primary transition-colors">TKT-8902</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20">Open</span>
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Battery not holding charge as long</p>
          <p className="text-xs text-muted-foreground">MacBook Pro M2 Max • Opened 2 days ago</p>
        </div>
      </div>
    </div>
  );
}

// --- WIDGET 4: Timeline ---
export function EmployeeTimeline() {
  const events = [
    { date: "Today, 10:42 AM", title: "Opened Ticket TKT-8902", icon: Ticket, color: "text-amber-500", bg: "bg-amber-500/10" },
    { date: "Jan 12, 2024", title: "Assigned Dell UltraSharp 32\"", icon: Laptop, color: "text-primary", bg: "bg-primary/10" },
    { date: "Nov 15, 2023", title: "Assigned MacBook Pro M2 Max", icon: Laptop, color: "text-primary", bg: "bg-primary/10" },
    { date: "Nov 15, 2023", title: "Provisioned Adobe CC", icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { date: "Mar 01, 2021", title: "Onboarding Completed", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
  ];

  return (
    <div className="bg-white border border-border/60 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      <div className="p-5 border-b border-border/40 flex justify-between items-center bg-[#FAFAFA]">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <History className="w-4 h-4 text-purple-500" /> Activity Timeline
        </h3>
      </div>
      <div className="p-6">
        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-[1.125rem] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border/60 before:to-transparent">
          {events.map((event, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              {/* Icon marker */}
              <div className={cn("flex items-center justify-center w-9 h-9 rounded-full border-2 border-white  shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10", event.bg, event.color)}>
                <event.icon className="w-4 h-4" />
              </div>
              
              {/* Card */}
              <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-border/60 bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <time className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{event.date}</time>
                </div>
                <div className="text-sm font-semibold text-foreground">{event.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
