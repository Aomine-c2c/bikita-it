import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Save } from "lucide-react";
import { repairsApi } from "@/lib/api";

interface UpdateRepairStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairId: string;
  currentStatus: string;
  onSuccess: () => void;
}

export function UpdateRepairStatusModal({ isOpen, onClose, repairId, currentStatus, onSuccess }: UpdateRepairStatusModalProps) {
  const [status, setStatus] = useState(currentStatus || "QUEUED");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map user-friendly labels to database values
  const statuses = [
    { label: "Diagnosis", value: "QUEUED" },
    { label: "Waiting Parts", value: "WAITING_PARTS" },
    { label: "Repairing", value: "IN_PROGRESS" },
    { label: "Ready", value: "COMPLETED" },
  ];

  // Try to match the incoming string to a known value
  const matchedInitial = statuses.find(s => s.label === currentStatus || s.value === currentStatus)?.value || "QUEUED";

  React.useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus(matchedInitial);
      setError(null);
    }
  }, [isOpen, matchedInitial]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await repairsApi.update(repairId, { status });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError((err as Error).message || 'Failed to update status');
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">Update Status</h2>
                <p className="text-sm text-muted-foreground mt-1">Change the repair progress.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="p-6 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Repair Status</label>
                  <select 
                    value={status} 
                    onChange={e => setStatus(e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm"
                  >
                    {statuses.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 pt-0 flex justify-end gap-3 border-t border-border/40 bg-[#FAFAFA] mt-4 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Status
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
