"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Archive, Repeat, Laptop, Calendar, User, Building, MapPin, Tag, ShieldCheck, Server } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface AssetProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: any; // We'll type this properly later, using any for mock
}

export function AssetProfileDrawer({ isOpen, onClose, asset }: AssetProfileDrawerProps) {
  if (!isOpen) return null;

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
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40"
          />
          
          {/* Drawer */}
          <motion.div
            initial={{ x: "100%", boxShadow: "0 0 0 rgba(0,0,0,0)" }}
            animate={{ x: 0, boxShadow: "-8px 0 30px rgba(0,0,0,0.1)" }}
            exit={{ x: "100%", boxShadow: "0 0 0 rgba(0,0,0,0)" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-screen w-[500px] max-w-[90vw] bg-white z-50 flex flex-col border-l border-border/60"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border/40 bg-[#FAFAFA]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0 shadow-sm">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{asset?.name || "MacBook Pro M2 Max"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-muted-foreground">{asset?.id || "XIP-4910"}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-lg text-muted-foreground hover:bg-slate-200 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Toolbar */}
            <div className="flex items-center gap-2 px-6 py-3 border-b border-border/40">
              <Link href={`/assets/detail?id=${asset?.id || "XIP-4910"}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 shadow-sm">
                View Full Profile
              </Link>
              <div className="w-px h-4 bg-border/60 mx-1" />
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors border border-transparent hover:border-border/60">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors border border-transparent hover:border-border/60">
                <Repeat className="w-3.5 h-3.5" /> Reassign
              </button>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20 ml-auto">
                <Archive className="w-3.5 h-3.5" /> Retire
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              
              {/* Hardware Specs */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Identity
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Manufacturer</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.manufacturer || "Apple"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Model</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.model || "16-inch, 2023"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Serial Number</p>
                    <p className="text-sm font-semibold text-foreground font-mono">{asset?.serialNumber || "C02ZK0XXMD6R"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Asset Tag</p>
                    <p className="text-sm font-semibold text-foreground font-mono">{asset?.assetTag || "TAG-2023-4910"}</p>
                  </div>
                </div>
              </section>

              {/* Deep Technical Specs */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Server className="w-3.5 h-3.5" /> Technical Specs
                </h3>
                <div className="bg-slate-50 border border-border/60 rounded-xl p-4">
                  <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">IP Address</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{asset?.ip || "10.0.1.45"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">MAC Address</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{asset?.mac || "00:1A:2B:3C:4D:5E"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Processor</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.specs?.cpu || "Apple M2 Max (12-core)"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Memory</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.specs?.ram || "32 GB Unified"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Operating System</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.specs?.os || "macOS Sonoma 14.2.1"}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Assignment */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" /> Assignment
                </h3>
                <div className="bg-slate-50 border border-border/60 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold shadow-sm">
                      SJ
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{asset?.assignedUser || "Sarah Jenkins"}</p>
                      <p className="text-xs text-muted-foreground">Senior Software Engineer</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Building className="w-3.5 h-3.5"/> Department</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.department || "Engineering"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.location || "HQ - Floor 3"}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Lifecycle */}
              <section>
                <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5" /> Lifecycle & Condition
                </h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Purchase Date</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.purchaseDate || "Nov 12, 2023"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3"/> Warranty Exp</p>
                    <p className="text-sm font-semibold text-emerald-600">{asset?.warranty || "Dec 12, 2026"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Condition</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.condition || "Excellent"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cost</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.cost || "$2,450.00"}</p>
                  </div>
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
