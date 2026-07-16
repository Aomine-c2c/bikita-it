"use client";

import React, { useState, useEffect } from "react";
import { X, Sparkles, Laptop, Clock, Paperclip, Send, AlertTriangle, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
}

// SLA countdown — refreshes every minute
function SLATimer({ hoursLeft }: { hoursLeft: number }) {
  const breached = hoursLeft <= 0;
  const urgent = hoursLeft > 0 && hoursLeft <= 2;
  const warning = hoursLeft > 2 && hoursLeft <= 8;
  const pct = breached ? 100 : Math.min(100, ((24 - hoursLeft) / 24) * 100);

  return (
    <div className={cn("rounded-xl border p-4 mb-6", {
      "bg-red-50 border-red-200": breached || urgent,
      "bg-amber-50 border-amber-200": warning,
      "bg-slate-50 border-slate-200": !breached && !urgent && !warning,
    })}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={cn("w-4 h-4", {
            "text-red-600": breached || urgent,
            "text-amber-600": warning,
            "text-slate-500": !breached && !urgent && !warning,
          })} />
          <span className={cn("text-xs font-bold", {
            "text-red-700": breached || urgent,
            "text-amber-700": warning,
            "text-slate-700": !breached && !urgent && !warning,
          })}>
            {breached ? "SLA BREACHED" : urgent ? "SLA AT RISK" : "SLA On Track"}
          </span>
        </div>
        <span className={cn("text-xs font-bold", {
          "text-red-600": breached || urgent,
          "text-amber-600": warning,
          "text-slate-600": !breached && !urgent && !warning,
        })}>
          {breached ? "Overdue" : `${hoursLeft}h remaining`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", {
            "bg-red-500": breached || urgent,
            "bg-amber-400": warning,
            "bg-emerald-500": !breached && !urgent && !warning,
          })}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TicketDrawer({ isOpen, onClose, ticketId }: TicketDrawerProps) {
  const [comment, setComment] = useState("");
  if (!isOpen) return null;

  // Simulated — in real app would be fetched by ticketId
  const SLA_HOURS = ticketId === "TKT-1003" ? 0 : ticketId === "TKT-1001" ? 2 : 8;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
          animate={{ x: 0, boxShadow: "-20px 0 40px rgba(0,0,0,0.1)" }}
          exit={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full max-w-xl bg-white h-full border-l border-border/60 flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/40 bg-[#FAFAFA]">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono text-muted-foreground">{ticketId || "TKT-1003"}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-500/10 text-red-600 border border-red-200">Critical</span>
              </div>
              <h2 className="text-xl font-bold text-foreground">MacBook battery swelling</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">

            {/* SLA Timer */}
            <SLATimer hoursLeft={SLA_HOURS} />

            {/* Context Panel */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Reporter</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">JC</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">John Chen</p>
                    <p className="text-xs text-muted-foreground">Engineering</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Assignee</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">DL</div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">David Lee</p>
                    <p className="text-xs text-muted-foreground">IT Support</p>
                  </div>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Assigned Asset</p>
                <div className="flex items-center justify-between p-3 border border-border/60 rounded-xl bg-slate-50 hover:border-primary/50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-3">
                    <Laptop className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">MacBook Pro M2 Max</p>
                      <p className="text-xs text-muted-foreground">XIP-4910</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">Active Warranty</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</p>
              <div className="text-sm text-foreground space-y-4">
                <p>Hi IT Team,</p>
                <p>I noticed today that the trackpad on my MacBook is very hard to press, and the chassis underneath looks slightly warped/bulging. I'm worried the battery might be swelling.</p>
                <p>Can someone take a look?</p>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-2 p-2 border border-border/60 rounded-lg bg-slate-50">
                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-foreground">photo_1.jpg</span>
                </div>
              </div>
            </div>

            {/* AI Suggested Solution */}
            <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-indigo-50/50 p-5">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider">AI Suggested Resolution</h3>
              </div>
              <p className="text-sm text-foreground relative z-10 leading-relaxed">
                Battery swelling detected on Apple Silicon models. **Do not attempt to charge.** 
                <br/><br/>
                1. Ask user to shut down immediately.
                2. Warranty status is active via AppleCare+.
                3. Dispatch replacement device (Dell XPS or spare Mac) immediately.
              </p>
            </div>

            {/* Timeline */}
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Activity Timeline</p>
              <div className="space-y-4 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/60 before:to-transparent">
                
                <div className="relative flex gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center shrink-0 z-10 text-xs font-bold">JC</div>
                  <div className="pt-1">
                    <p className="text-sm text-foreground"><span className="font-semibold">John Chen</span> opened this ticket</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/> 2 hours ago</p>
                  </div>
                </div>

                <div className="relative flex gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-blue-500 text-white flex items-center justify-center shrink-0 z-10 text-xs font-bold">DL</div>
                  <div className="pt-1">
                    <p className="text-sm text-foreground"><span className="font-semibold">David Lee</span> assigned this to themselves</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3"/> 1 hour ago</p>
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Quick Reply */}
          <div className="p-4 border-t border-border/40 bg-white">
            <div className="relative">
              <textarea 
                placeholder="Type a reply or internal note..." 
                className="w-full bg-slate-50 border border-border/60 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary resize-none h-24"
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-4 h-4" /></button>
                <button className="flex items-center gap-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm">
                  <Send className="w-3 h-3" /> Send
                </button>
              </div>
            </div>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
