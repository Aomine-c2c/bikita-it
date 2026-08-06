/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Edit2, Archive, Repeat, Laptop, Calendar, User, Building, MapPin, Tag, ShieldCheck, Server } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AssetFormModal } from "./AssetFormModal";
import { ReassignAssetModal } from "./ReassignAssetModal";
import { RetireAssetDialog } from "./RetireAssetDialog";

interface AssetProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: unknown; // We'll type this properly later, using any for mock
}

export function AssetProfileDrawer({ isOpen, onClose, asset }: AssetProfileDrawerProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);

  if (!isOpen) return null;

  return (
    <>
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
            className="fixed top-0 right-0 h-screen w-125 max-w-[90vw] bg-white z-50 flex flex-col border-l border-border/60"
          >
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-border/40 bg-[#FAFAFA]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-border/50 flex items-center justify-center text-muted-foreground shrink-0 shadow-sm">
                  <Laptop className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{asset?.name || "Unknown Asset"}</h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-muted-foreground">{asset?.id || "No ID"}</span>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1" />
                      {asset?.status || "Unknown"}
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
              <Link href={`/assets/detail?id=${asset?.id || ""}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors border border-primary/20 shadow-sm">
                View Full Profile
              </Link>
              <div className="w-px h-4 bg-border/60 mx-1" />
              <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors border border-transparent hover:border-border/60">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button onClick={() => setIsReassignModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors border border-transparent hover:border-border/60">
                <Repeat className="w-3.5 h-3.5" /> Reassign
              </button>
              <button onClick={() => setIsRetireModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20 ml-auto">
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
                    <p className="text-sm font-semibold text-foreground">{asset?.manufacturer || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Model</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.model || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Serial Number</p>
                    <p className="text-sm font-semibold text-foreground font-mono">{asset?.serialNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Asset Tag</p>
                    <p className="text-sm font-semibold text-foreground font-mono">{asset?.assetTag || "N/A"}</p>
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
                      <p className="text-sm font-semibold text-foreground font-mono">{asset?.ipAddress || asset?.ip || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">MAC Address</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{asset?.macAddress || asset?.mac || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Processor</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.specs?.cpu || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Memory</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.specs?.ram || "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Operating System</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.specs?.os || "N/A"}</p>
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
                      {asset?.assignedUser?.name ? asset.assignedUser.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{asset?.assignedUser?.name || "Unassigned"}</p>
                      <p className="text-xs text-muted-foreground">{asset?.assignedUser?.role || "—"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><Building className="w-3.5 h-3.5"/> Department</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.assignedUser?.department || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5"/> Location</p>
                      <p className="text-sm font-semibold text-foreground">{asset?.location?.name || asset?.location || "—"}</p>
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
                    <p className="text-sm font-semibold text-foreground">{asset?.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1.5"><ShieldCheck className="w-3 h-3"/> Warranty Exp</p>
                    <p className="text-sm font-semibold text-emerald-600">{asset?.warrantyExpiry || asset?.warranty || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Condition</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.condition || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Cost</p>
                    <p className="text-sm font-semibold text-foreground">{asset?.purchaseCost ? `$${asset.purchaseCost}` : "N/A"}</p>
                  </div>
                </div>
              </section>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    
    <AssetFormModal 
      isOpen={isEditModalOpen} 
      onClose={() => setIsEditModalOpen(false)} 
      onSuccess={() => { setIsEditModalOpen(false); /* should reload */ }} 
      assetToEdit={asset}
    />
    <ReassignAssetModal
      isOpen={isReassignModalOpen}
      onClose={() => setIsReassignModalOpen(false)}
      onSuccess={() => { setIsReassignModalOpen(false); onClose(); window.location.reload(); }}
      assetId={asset?.id}
      currentAssigneeId={asset?.assigneeId || asset?.assignedUser?.id}
    />
    <RetireAssetDialog
      isOpen={isRetireModalOpen}
      onClose={() => setIsRetireModalOpen(false)}
      onSuccess={() => { setIsRetireModalOpen(false); onClose(); window.location.reload(); }}
      assetId={asset?.id}
      assetName={asset?.name || "Asset"}
    />
    </>
  );
}
