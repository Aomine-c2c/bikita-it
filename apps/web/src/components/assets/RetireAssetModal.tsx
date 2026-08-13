
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { assetApi, Asset } from "@/lib/api";

interface RetireAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset;
}

export function RetireAssetModal({ isOpen, onClose, onSuccess, asset }: RetireAssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("Obsolete");
  const [notes, setNotes] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await assetApi.retire(asset.id, reason, notes);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to retire asset");
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-red-600">Retire Asset</h2>
                <p className="text-sm text-muted-foreground mt-1">Retire {asset.name}. This action will mark it as retired and unassign it.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Reason *</label>
                  <select 
                    required 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-red-500"
                  >
                    <option value="Obsolete">Obsolete</option>
                    <option value="Broken/Unrepairable">Broken/Unrepairable</option>
                    <option value="Lost/Stolen">Lost/Stolen</option>
                    <option value="Sold/Donated">Sold/Donated</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={e => setNotes(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-red-500 min-h-[100px]"
                    placeholder="Additional context..."
                  />
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-border/40 flex justify-end gap-3 bg-white">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Retirement
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
