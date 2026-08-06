/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { _X, Loader2, AlertTriangle } from "lucide-react";
import { assetApi } from "@/lib/api";

interface RetireAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetId: string;
  assetName: string;
}

export function RetireAssetDialog({ isOpen, onClose, onSuccess, assetId, assetName }: RetireAssetDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetire = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      await assetApi.update(assetId, {
        status: "RETIRED",
        assigneeId: null, // Clear assignment when retired
      } as unknown);
      onSuccess();
      onClose();
    } catch (err: unknown) {
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 pb-0">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 border border-red-200">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Retire Asset</h2>
              <p className="text-sm text-muted-foreground mt-2">
                Are you sure you want to retire <strong className="text-foreground">{assetName}</strong> ({assetId})? 
                This will mark its status as retired and remove any active employee assignments.
              </p>
              
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-100">
                  {error}
                </div>
              )}
            </div>

            <div className="p-6 pt-6 flex justify-end gap-3">
              <button 
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-bold text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleRetire}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Retire Asset
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}