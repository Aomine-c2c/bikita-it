"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, User, Package, Hash, Check } from "lucide-react";

interface DispatchAccessoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  accessory: any;
  onSuccess: (accessoryId: string, quantity: number) => void;
}

export function DispatchAccessoryModal({
  isOpen,
  onClose,
  accessory,
  onSuccess,
}: DispatchAccessoryModalProps) {
  const [selectedEmployee, setSelectedEmployee] = useState("emp-101");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !accessory) return null;

  const employees = [
    { id: "emp-101", name: "Sarah Jenkins", dept: "Engineering", email: "s.jenkins@bikita.io" },
    { id: "emp-102", name: "David Chen", dept: "Product Design", email: "d.chen@bikita.io" },
    { id: "emp-103", name: "Alex Rivera", dept: "DevOps & NOC", email: "a.rivera@bikita.io" },
    { id: "emp-104", name: "Elena Rostova", dept: "Executive", email: "e.rostova@bikita.io" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      onSuccess(accessory.id, quantity);
      onClose();
    } catch (err) {
      console.error("Failed to dispatch accessory", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/60 rounded-3xl p-6 shadow-2xl max-w-md w-full space-y-5 overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border/40 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-foreground">Dispatch Accessory</h3>
                    <p className="text-xs text-muted-foreground">{accessory.name || "Peripheral Item"}</p>
                  </div>
                </div>

                <button onClick={onClose} className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                {/* Employee Selection */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" /> Assign to Staff Member
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl outline-none focus:border-primary font-medium"
                  >
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.dept})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dispatch Quantity */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-primary" /> Quantity to Dispatch
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={accessory.stock || 100}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl outline-none focus:border-primary font-mono font-bold"
                  />
                  <p className="text-[10px] text-muted-foreground">Available Stock: {accessory.stock || 0} units</p>
                </div>

                {/* Issuance Notes */}
                <div className="space-y-1.5">
                  <label className="font-bold text-foreground">Issuance Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Replacement for damaged USB-C hub..."
                    className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl outline-none focus:border-primary"
                  />
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-card border border-border/60 rounded-xl font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submitting ? "Dispatching..." : "Confirm Dispatch"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
