import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Loader2, AlertCircle, Laptop, Smartphone, Monitor } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  employeeName: string;
}

export function AssignAssetModal({ isOpen, onClose, onSuccess, employeeId, employeeName }: AssignAssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableAssets, setAvailableAssets] = useState<any[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      // Fetch assets that are not assigned or are available
      apiFetch<any[]>('/assets')
        .then(data => {
          if (Array.isArray(data)) {
            // Basic client-side filter for now to just show Unassigned or Available
            const unassigned = data.filter(a => a.status === 'AVAILABLE' || a.status === 'IN_STOCK' || (!a.assigneeId && !a.assignee_id));
            setAvailableAssets(unassigned);
            if (unassigned.length > 0) {
              setSelectedAssetId(unassigned[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssetId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await apiFetch(`/assets/${selectedAssetId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ assigneeId: employeeId })
      });
      onSuccess();
    } catch (e: any) {
      setError(e.message || "Failed to assign asset");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
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
            className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-border/60 overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-border/40 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-foreground">Assign Asset</h2>
                <p className="text-sm text-muted-foreground mt-1">Assign an asset to {employeeName}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-xl flex items-start gap-3 border border-destructive/20">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Select Asset <span className="text-destructive">*</span></label>
                  {availableAssets.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic bg-slate-50 p-3 rounded-xl border border-border/60">No available assets found.</p>
                  ) : (
                    <select
                      required
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-border/60 rounded-xl text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm"
                    >
                      {availableAssets.map((asset: any) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.tag || asset.id.substring(0,6)})
                        </option>
                      ))}
                    </select>
                  )}
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
                disabled={isSubmitting || availableAssets.length === 0}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-sm font-semibold transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSubmitting ? "Assigning..." : "Assign"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
