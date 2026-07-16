"use client";

import React from "react";
import { Wrench, ArrowRight, ShieldCheck, UserCircle, Receipt, Box, ExternalLink, MessageSquare } from "lucide-react";
import { RepairItem } from "./RepairQueue";
import { cn } from "@/lib/utils";

interface RepairDetailsProps {
  repair: RepairItem;
}

const steps = ["Diagnosis", "Waiting Parts", "Repairing", "Ready", "Returned"];

export function RepairDetails({ repair }: RepairDetailsProps) {
  // Determine current step index based on status
  let currentStep = 0;
  if (repair.status === "Waiting Parts") currentStep = 1;
  if (repair.status === "Repairing") currentStep = 2;
  if (repair.status === "Ready") currentStep = 3;

  return (
    <div className="bg-white border border-border/60 rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
      
      {/* Header & Stepper */}
      <div className="p-8 border-b border-border/40">
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-muted-foreground">{repair.id}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-primary/10 text-primary border border-primary/20">Active RMA</span>
            </div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
              <repair.icon className="w-6 h-6 text-muted-foreground" />
              {repair.device}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Reported Issue: {repair.issue}</p>
          </div>
          <button className="flex items-center gap-2 bg-slate-950 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors shadow-sm">
            <MessageSquare className="w-4 h-4" /> Update Customer
          </button>
        </div>

        {/* Custom Progress Stepper */}
        <div className="flex items-center justify-between relative mt-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-10" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary -z-10 transition-all duration-500" 
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                <div 
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors border-2",
                    isActive ? "border-primary bg-white  text-primary" : 
                    isCompleted ? "bg-primary border-primary text-white" : 
                    "bg-slate-50  border-slate-200  text-slate-400"
                  )}
                >
                  {isCompleted ? <ShieldCheck className="w-3 h-3" /> : idx + 1}
                </div>
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 overflow-y-auto p-8 bg-[#FAFAFA] -[#0B0F19]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-[1200px] mx-auto">
          
          {/* Left Col: Info & Photos */}
          <div className="lg:col-span-2 space-y-8">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl border border-border/60 shadow-sm">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><UserCircle className="w-4 h-4" /> Assigned Technician</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">DL</div>
                  <div>
                    <p className="text-sm font-bold text-foreground">David Lee</p>
                    <p className="text-xs text-muted-foreground">Tier 2 Hardware Repair</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-5 rounded-xl border border-border/60 shadow-sm relative overflow-hidden">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Warranty Claim</p>
                <p className="text-lg font-bold text-foreground">AppleCare+ Enterprise</p>
                <p className="text-xs font-mono text-emerald-600 mt-1">Claim ID: AC-990214</p>
              </div>
            </div>

            {/* Photos */}
            <div>
              <h3 className="text-sm font-bold text-foreground mb-4">Diagnostic Photos</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-video bg-slate-200 rounded-xl border border-border/60 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-white/20 hover:bg-white/40 backdrop-blur-md text-white p-2 rounded-full transition-colors"><ExternalLink className="w-5 h-5" /></button>
                  </div>
                  <span className="text-sm font-bold text-slate-400">Before Repair (Damage)</span>
                </div>
                <div className="aspect-video bg-slate-100 rounded-xl border border-border/60 border-dashed flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors cursor-pointer">
                  <Wrench className="w-6 h-6 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Upload After Photo</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Col: Ledger & Details */}
          <div className="space-y-6">
            
            <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-border/40 bg-[#FAFAFA]">
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2"><Box className="w-4 h-4" /> Parts Ledger</h3>
              </div>
              <div className="divide-y divide-border/40">
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Battery A2141 (OEM)</p>
                    <p className="text-xs text-muted-foreground">SKU: INV-092</p>
                  </div>
                  <span className="text-sm font-mono text-foreground">$129.00</span>
                </div>
                <div className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Bottom Case Screws</p>
                    <p className="text-xs text-muted-foreground">SKU: INV-011</p>
                  </div>
                  <span className="text-sm font-mono text-foreground">$4.50</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Receipt className="w-4 h-4" /> Cost Summary</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Parts Total</span>
                  <span>$133.50</span>
                </div>
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300">Labor (2h)</span>
                  <span>$150.00</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-emerald-400">
                  <span>Warranty Coverage</span>
                  <span>-$283.50</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Billable To Dept</span>
                <span className="text-2xl font-bold tracking-tight">$0.00</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
