"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Edit2, Archive, Repeat, Laptop, Calendar, User, Building, MapPin,
  Tag, ShieldCheck, Server, Wrench, FileText, Network, Clock, CheckCircle2, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { AssetFormModal } from "./AssetFormModal";
import { ReassignAssetModal } from "./ReassignAssetModal";
import { RetireAssetDialog } from "./RetireAssetDialog";
import { UpdateRepairStatusModal } from "@/components/repairs/UpdateRepairStatusModal";
import { cn } from "@/lib/utils";

interface AssetProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  asset?: any;
}

export function AssetProfileDrawer({ isOpen, onClose, asset }: AssetProfileDrawerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "maintenance" | "documents" | "relations">("overview");

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isRetireModalOpen, setIsRetireModalOpen] = useState(false);
  const [isRepairModalOpen, setIsRepairModalOpen] = useState(false);

  const tabs = [
    { id: "overview", label: "Overview", icon: Tag },
    { id: "history", label: "History", icon: Clock },
    { id: "maintenance", label: "Maintenance", icon: Wrench },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "relations", label: "Relations", icon: Network },
  ];

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
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-[520px] max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden"
            >
              {/* Top Header */}
              <div className="p-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-foreground tracking-tight">{asset?.name || "Hardware Asset"}</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono font-bold text-muted-foreground">{asset?.assetTag || asset?.id || "TAG-001"}</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                          {asset?.status || "Active"}
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

                {/* 4 Header Quick Action Triggers */}
                <div className="grid grid-cols-4 gap-2 mt-5">
                  <button
                    onClick={() => setIsReassignModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all cursor-pointer shadow-sm"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    <span>Reassign</span>
                  </button>

                  <button
                    onClick={() => setIsRepairModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Repair</span>
                  </button>

                  <button
                    onClick={() => setIsEditModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-card border border-border/60 text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => setIsRetireModalOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 transition-all cursor-pointer shadow-sm"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Retire</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs Header */}
              <div className="flex items-center border-b border-border/40 bg-muted/20 px-4 pt-2 gap-1 overflow-x-auto">
                {tabs.map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0",
                        isActive
                          ? "border-primary text-primary bg-card"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Scrollable Tab Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* 1. OVERVIEW TAB */}
                {activeTab === "overview" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Identity & Hardware Specs</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Make / Vendor</p>
                          <p className="font-bold text-foreground mt-0.5">{asset?.make || asset?.manufacturer || "Dell Inc."}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Model Name</p>
                          <p className="font-bold text-foreground mt-0.5">{asset?.model || "Latitude 7420"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Serial Number</p>
                          <p className="font-mono font-bold text-foreground mt-0.5">{asset?.serialNumber || "SN-8849201"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Asset Tag</p>
                          <p className="font-mono font-bold text-primary mt-0.5">{asset?.assetTag || "IT-092"}</p>
                        </div>
                      </div>
                    </section>

                    <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Network & Endpoints</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                        <div>
                          <p className="text-muted-foreground font-sans">IP Address</p>
                          <p className="font-bold text-foreground mt-0.5">{asset?.ipAddress || "192.168.1.104"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground font-sans">MAC Address</p>
                          <p className="font-bold text-foreground mt-0.5">{asset?.macAddress || "00:1A:2B:3C:4D:5E"}</p>
                        </div>
                      </div>
                    </section>

                    <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Lifecycle Dates</h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Purchase Date</p>
                          <p className="font-bold text-foreground mt-0.5">{asset?.purchaseDate || "2024-03-15"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Warranty Expiry</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{asset?.warrantyExpiry || "2027-03-15"}</p>
                        </div>
                      </div>
                    </section>
                  </motion.div>
                )}

                {/* 2. HISTORY TIMELINE TAB */}
                {activeTab === "history" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Immutable Audit Log</h4>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                      {[
                        { title: "Asset Reassigned", desc: "Assigned to Alex Johnson", date: "2 hours ago" },
                        { title: "Status Changed", desc: "Updated status from Maintenance to Active", date: "Yesterday" },
                        { title: "Initial Provisioning", desc: "Registered into inventory catalog", date: "2024-03-15" },
                      ].map((evt, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center" />
                          <h5 className="text-xs font-bold text-foreground">{evt.title}</h5>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{evt.desc}</p>
                          <span className="text-[10px] text-muted-foreground/60 mt-1 block font-mono">{evt.date}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. MAINTENANCE TAB */}
                {activeTab === "maintenance" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Service & Repairs</h4>
                      <button
                        onClick={() => setIsRepairModalOpen(true)}
                        className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer"
                      >
                        + Log Repair
                      </button>
                    </div>

                    <div className="bg-card border border-border/50 rounded-2xl p-4 space-y-3 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-foreground">Screen & Battery Replacement</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Completed</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Replaced OLED panel and installed high-capacity OEM battery module.</p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/30">
                        <span>Cost: $149.00</span>
                        <span>Date: 2026-01-20</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 4. DOCUMENTS TAB */}
                {activeTab === "documents" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Attached Files & Certificates</h4>
                    <div className="space-y-2">
                      {[
                        { name: "Purchase_Invoice_2024.pdf", size: "1.2 MB" },
                        { name: "Dell_ProSupport_Warranty.pdf", size: "840 KB" },
                        { name: "Hardware_Spec_Sheet.pdf", size: "2.4 MB" },
                      ].map((doc) => (
                        <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold text-foreground">{doc.name}</span>
                          </div>
                          <span className="text-[10px] font-mono text-muted-foreground">{doc.size}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 5. RELATIONS TAB */}
                {activeTab === "relations" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Connected Entities</h4>
                    <div className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs">
                          {asset?.assignedUser?.name ? asset.assignedUser.name.slice(0, 2).toUpperCase() : "AJ"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">{asset?.assignedUser?.name || "Alex Johnson"}</p>
                          <p className="text-[11px] text-muted-foreground">Engineering • Senior Lead</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/40 space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Location Node:</span>
                          <span className="font-bold text-foreground">HQ - Floor 3 (Desk 302)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Network Switch Port:</span>
                          <span className="font-mono font-bold text-foreground">SW-CORE-01 [Port 14]</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AssetFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          onClose();
        }}
        assetToEdit={asset}
      />

      <ReassignAssetModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        onSuccess={() => {
          setIsReassignModalOpen(false);
          onClose();
        }}
        assetId={asset?.id}
        currentAssigneeId={asset?.assigneeId || asset?.assignedUser?.id}
      />

      <RetireAssetDialog
        isOpen={isRetireModalOpen}
        onClose={() => setIsRetireModalOpen(false)}
        onSuccess={() => {
          setIsRetireModalOpen(false);
          onClose();
        }}
        assetId={asset?.id}
        assetName={asset?.name || "Hardware Asset"}
      />

      <UpdateRepairStatusModal
        isOpen={isRepairModalOpen}
        onClose={() => setIsRepairModalOpen(false)}
        repairId={String(asset?.id || "1")}
        currentStatus="QUEUED"
        onSuccess={() => {
          setIsRepairModalOpen(false);
          onClose();
        }}
      />
    </>
  );
}
