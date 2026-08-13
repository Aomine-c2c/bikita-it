 
 

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle, Search, User } from "lucide-react";
import { assetApi, apiFetch } from "@/lib/api";

interface ReassignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetId: string;
  currentAssigneeId?: string | null;
}

export function ReassignAssetModal({ isOpen, onClose, onSuccess, assetId, currentAssigneeId }: ReassignAssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [_error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedId(currentAssigneeId || null);
    }
  }, [isOpen, currentAssigneeId]);

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const data = await apiFetch<any>('/employees');
      setEmployees(Array.isArray(data) ? data : data.data || []);
    } catch (err: any) {
      console.error("Failed to load employees:", err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchEmployees();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await assetApi.reassign(assetId, selectedId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reassign asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(search.toLowerCase()) || 
    emp.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.department?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] mx-2 sm:mx-auto"
          >
            <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Reassign Asset</h2>
                <p className="text-sm text-muted-foreground mt-1">Select a new employee for this asset.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="p-4 border-b border-border/40">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search employees..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-border/60 rounded-lg text-sm outline-none focus:border-primary shadow-sm"
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-2 flex-1 overflow-y-auto min-h-[200px]">
                {loadingEmployees ? (
                  <div className="h-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    No employees found.
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedId === null ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-transparent hover:bg-slate-50"
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="assignee" 
                        className="sr-only" 
                        checked={selectedId === null}
                        onChange={() => setSelectedId(null)}
                      />
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-muted-foreground">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-foreground">Unassigned</p>
                        <p className="text-xs text-muted-foreground">Return to inventory pool</p>
                      </div>
                    </label>

                    {filteredEmployees.map(emp => {
                      const isSelected = selectedId !== null && String(selectedId) === String(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/40 hover:bg-slate-50"
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="assignee" 
                            className="sr-only" 
                            checked={isSelected}
                            onChange={() => setSelectedId(String(emp.id))}
                          />
                          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                            {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-foreground">{emp.name}</p>
                            <p className="text-xs text-muted-foreground">{emp.department || "No department"} • {emp.role || "No role"}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-6 pt-4 border-t border-border/40 flex justify-end gap-3 bg-white">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Assignment
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
