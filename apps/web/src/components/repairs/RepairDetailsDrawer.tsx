"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Wrench, Clock, CheckCircle2, AlertCircle, DollarSign,
  Laptop, User, Calendar, Tag, ArrowRight, ShieldCheck, ChevronRight
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RepairDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  repair?: any;
  onStatusChange?: (id: string, newStatus: string) => void;
}

export function RepairDetailsDrawer({
  isOpen,
  onClose,
  repair,
  onStatusChange,
}: RepairDetailsDrawerProps) {
  const [advancing, setAdvancing] = useState(false);

  if (!isOpen) return null;

  const steps = [
    { id: "QUEUED", label: "Diagnosis" },
    { id: "WAITING_PARTS", label: "Waiting Parts" },
    { id: "IN_PROGRESS", label: "Repairing" },
    { id: "COMPLETED", label: "Completed" },
  ];

  const currentStepIdx = steps.findIndex((s) => s.id === (repair?.status || "QUEUED"));
  const nextStep = currentStepIdx < steps.length - 1 ? steps[currentStepIdx + 1] : null;

  const handleAdvanceStatus = async () => {
    if (!nextStep || !repair?.id) return;
    setAdvancing(true);
    try {
      if (onStatusChange) {
        onStatusChange(String(repair.id), nextStep.id);
      } else {
        await apiFetch(`/repairs/${repair.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: nextStep.id }),
        });
      }
    } catch (err) {
      console.error("Failed to advance repair status", err);
    } finally {
      setAdvancing(false);
    }
  };

  // Parts cost ledger
  const partsLedger = [
    { part: "OEM Battery Module (68Wh)", cost: 89.0 },
    { part: "Display Panel Ribbon Cable", cost: 24.5 },
    { part: "Technician Labor (1.5 hrs)", cost: 75.0 },
  ];

  const totalCost = partsLedger.reduce((sum, p) => sum + p.cost, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-screen w-[540px] max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 shadow-sm">
                    <Wrench className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground tracking-tight">{repair?.device || repair?.name || "Hardware Repair Ticket"}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono font-bold text-primary">#{repair?.id || "RPR-102"}</span>
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        {repair?.status || "QUEUED"}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Advance Status Header Button */}
              {nextStep && (
                <div className="mt-4 pt-4 border-t border-border/30">
                  <button
                    onClick={handleAdvanceStatus}
                    disabled={advancing}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <span>Advance Status to: {nextStep.label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 4-Step Progress Stepper */}
              <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Repair Workflow Progress</h4>
                <div className="grid grid-cols-4 gap-2">
                  {steps.map((s, idx) => {
                    const isPassed = idx <= currentStepIdx;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "p-2 rounded-xl border text-center text-[10px] font-extrabold transition-all",
                          isPassed
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background border-border/50 text-muted-foreground"
                        )}
                      >
                        {s.label}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Hardware Failure Summary */}
              <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Reported Hardware Failure</h4>
                <p className="text-xs text-foreground leading-relaxed">{repair?.issue || "Thermal throttling & battery degradation under high system load."}</p>
              </section>

              {/* Parts Replacement Cost Ledger */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> Maintenance Cost Ledger
                  </h4>
                  <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">Total: ${totalCost.toFixed(2)}</span>
                </div>

                <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-2 shadow-sm">
                  {partsLedger.map((item) => (
                    <div key={item.part} className="flex items-center justify-between text-xs py-1 border-b border-border/30 last:border-0">
                      <span className="font-semibold text-foreground">{item.part}</span>
                      <span className="font-mono font-bold text-muted-foreground">${item.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
