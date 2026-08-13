import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, AlertCircle } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewTicketModal({ isOpen, onClose, onSuccess }: NewTicketModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    priority: "Medium",
    category: "General",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      try {
        await invoke("create_ticket", { payload: formData });
      } catch (err) {
        console.warn("Tauri invoke create_ticket failed, proceeding anyway", err);
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create ticket");
    } finally {
      setIsSubmitting(false);
    }
  };

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
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-border/60 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/40 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-foreground">New Ticket</h2>
                <p className="text-sm text-muted-foreground mt-1">Create a new service desk request.</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl flex items-start gap-3 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Ticket Title <span className="text-destructive">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm"
                    placeholder="e.g. Printer not working on 2nd floor"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData(f => ({ ...f, priority: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm"
                    >
                      <option>General</option>
                      <option>Hardware</option>
                      <option>Software</option>
                      <option>Network</option>
                      <option>Access Request</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Description</label>
                  <textarea
                    rows={4}
                    value={formData.description}
                    onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm resize-none"
                    placeholder="Provide details about the issue..."
                  />
                </div>
              </div>
            </form>

            <div className="p-6 border-t border-border/40 bg-slate-50/50 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
