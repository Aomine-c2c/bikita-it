import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, UserCircle2, Mail, Phone, Briefcase, MapPin, Laptop } from "lucide-react";
import { AssignAssetModal } from "@/components/assets/AssignAssetModal";
import { apiFetch } from "@/lib/api";

interface EmployeeDetailsPanelProps {
  employee: any | null;
  onClose: () => void;
}

export function EmployeeDetailsPanel({ employee, onClose }: EmployeeDetailsPanelProps) {
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignedAssets, setAssignedAssets] = useState<any[]>([]);

  const fetchAssignedAssets = async () => {
    if (!employee) return;
    try {
      const data = await apiFetch<any[]>('/assets');
      if (Array.isArray(data)) {
        setAssignedAssets(data.filter(a => a.assignee_id === employee.id || a.assigneeId === employee.id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAssignedAssets();
  }, [employee]);

  return (
    <AnimatePresence>
      {employee && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-border/60 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/40 bg-slate-50/50">
              <h2 className="text-xl font-bold text-foreground">Employee Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                  <UserCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{employee.first_name} {employee.last_name}</h3>
                  <p className="text-sm font-medium text-primary bg-primary/10 px-2.5 py-0.5 rounded-full inline-flex mt-1">
                    {employee.department || "No Department"}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</h4>
                <div className="grid gap-3">
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {employee.email}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {employee.phone || "No phone provided"}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-foreground">
                    <Briefcase className="w-4 h-4 text-muted-foreground" />
                    {employee.role || "No role specified"}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assigned Assets</h4>
                  <button 
                    onClick={() => setIsAssignOpen(true)}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition-colors"
                  >
                    + Assign Asset
                  </button>
                </div>
                
                <div className="space-y-2">
                  {assignedAssets.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 bg-slate-50 rounded-xl border border-border/40 text-center">
                      No assets assigned to this employee.
                    </p>
                  ) : (
                    assignedAssets.map((asset) => (
                      <div key={asset.id} className="flex items-center gap-3 p-3 bg-white border border-border/60 rounded-xl shadow-sm">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-600 shrink-0">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{asset.name}</p>
                          <p className="text-xs text-muted-foreground">{asset.tag || asset.id.substring(0,8)} • {asset.status}</p>
                        </div>
                        <button
                          onClick={async () => {
                            try {
                              await apiFetch(`/assets/${asset.id}/unassign`, { method: 'POST' });
                              fetchAssignedAssets();
                            } catch (e) {
                              console.error("Failed to unassign asset", e);
                            }
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          Return
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <AssignAssetModal 
            isOpen={isAssignOpen}
            onClose={() => setIsAssignOpen(false)}
            onSuccess={() => { setIsAssignOpen(false); fetchAssignedAssets(); }}
            employeeId={employee.id}
            employeeName={employee.name || "Unknown"}
          />
        </>
      )}
    </AnimatePresence>
  );
}
