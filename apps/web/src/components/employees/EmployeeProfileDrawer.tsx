"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Mail, Building, MapPin, Laptop, Repeat, ShieldCheck, Tag, Plus, CheckCircle2 } from "lucide-react";
import { ReassignAssetModal } from "@/components/assets/ReassignAssetModal";
import { apiFetch } from "@/lib/api";

interface EmployeeProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
}

export function EmployeeProfileDrawer({ isOpen, onClose, employee }: EmployeeProfileDrawerProps) {
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  if (!isOpen) return null;

  const [assignedHardware, setAssignedHardware] = useState<any[]>([]);

  React.useEffect(() => {
    if (isOpen && employee?.id) {
      const fetchHardware = async () => {
        try {
          const assets = await apiFetch('/assets') as any[];
          const employeeAssets = assets.filter((a: any) => String(a.assigned_to?.id) === String(employee.id));
          setAssignedHardware(employeeAssets.map((a: any) => ({
            id: a.id,
            name: a.name,
            category: a.category || "Asset",
            serial: a.serial_number || "N/A",
            tag: a.asset_tag || "N/A",
            status: a.status || "Active"
          })));
        } catch (error) {
          console.error("Failed to fetch assigned hardware", error);
        }
      };
      fetchHardware();
    }
  }, [isOpen, employee]);

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

            {/* Slide-over Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-screen w-[520px] max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-black text-lg flex items-center justify-center shadow-md shrink-0">
                      {employee?.name ? employee.name.slice(0, 2).toUpperCase() : "EP"}
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-foreground tracking-tight">{employee?.name || "Employee Profile"}</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{employee?.role || "Team Member"} • {employee?.department || "General"}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          Active Employee
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
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact & Location Info */}
                <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Personnel Metadata</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-muted-foreground">Corporate Email</p>
                      <p className="font-bold text-foreground mt-0.5">{employee?.email || "employee@company.com"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Office Location</p>
                      <p className="font-bold text-foreground mt-0.5">{employee?.location || "HQ - Floor 3"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Department</p>
                      <p className="font-bold text-foreground mt-0.5">{employee?.department || "Engineering"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Staff ID</p>
                      <p className="font-mono font-bold text-primary mt-0.5">{employee?.id ? `EMP-${employee.id}` : "EMP-042"}</p>
                    </div>
                  </div>
                </section>

                {/* Assigned Hardware Roster */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Laptop className="w-4 h-4 text-primary" /> Assigned Hardware Roster ({assignedHardware.length})
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {assignedHardware.map((hw) => (
                      <div
                        key={hw.id}
                        className="bg-card border border-border/50 rounded-2xl p-4 space-y-2 shadow-sm hover:border-primary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-primary">{hw.tag}</span>
                            <span className="text-xs font-bold text-foreground">{hw.name}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            {hw.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground pt-2 border-t border-border/30">
                          <span>Serial: {hw.serial}</span>
                          <button
                            onClick={() => {
                              setSelectedAssetId(hw.id);
                              setIsReassignModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline cursor-pointer"
                          >
                            <Repeat className="w-3 h-3" /> Reassign
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ReassignAssetModal
        isOpen={isReassignModalOpen}
        onClose={() => setIsReassignModalOpen(false)}
        onSuccess={() => {
          setIsReassignModalOpen(false);
          onClose();
        }}
        assetId={selectedAssetId || "1"}
      />
    </>
  );
}
