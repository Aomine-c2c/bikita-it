import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { invoke } from "@tauri-apps/api/core";

interface NewLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewLocationModal({ isOpen, onClose, onSuccess }: NewLocationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    type: "ROOM",
    parent_id: "",
  });

  useEffect(() => {
    if (isOpen) {
      apiFetch<any[]>('/locations')
        .then(data => setLocations(Array.isArray(data) ? data : []))
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      try {
        await apiFetch('/locations', {
          method: 'POST',
          body: JSON.stringify({
            name: formData.name,
            type: formData.type,
            parent_id: formData.parent_id || null
          })
        });
      } catch (err) {
        console.warn("apiFetch create location failed, falling back to tauri invoke", err);
        await invoke("create_location", { payload: formData });
      }
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to create location");
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
                <h2 className="text-xl font-bold text-foreground">New Location</h2>
                <p className="text-sm text-muted-foreground mt-1">Register a new physical location.</p>
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
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Location Name <span className="text-destructive">*</span></label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm"
                    placeholder="e.g. Server Room B"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(f => ({ ...f, type: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm"
                    >
                      <option value="MINE">Mine / Site</option>
                      <option value="BUILDING">Building</option>
                      <option value="ROOM">Room</option>
                      <option value="RACK">Rack</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">Parent Location</label>
                    <select
                      value={formData.parent_id}
                      onChange={(e) => setFormData(f => ({ ...f, parent_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 shadow-sm"
                    >
                      <option value="">None (Top Level)</option>
                      {locations.map((loc: any) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.type})
                        </option>
                      ))}
                    </select>
                  </div>
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
                {isSubmitting ? "Saving..." : "Save Location"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
