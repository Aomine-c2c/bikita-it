import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { assetApi } from "@/lib/api";

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultLocationId?: string;
}

export function AddAssetModal({ isOpen, onClose, onSuccess, defaultLocationId }: AddAssetModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tag: "",
    name: "",
    category: "COMPUTING",
    make: "",
    model: "",
    serialNumber: "",
    locationId: defaultLocationId || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await assetApi.create({
        ...formData,
        // Optional location mapping
        ...(formData.locationId ? { locationId: formData.locationId } : {})
      });
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        tag: "",
        name: "",
        category: "COMPUTING",
        make: "",
        model: "",
        serialNumber: "",
        locationId: defaultLocationId || "",
      });
    } catch (err: any) {
      setError(err.message || "Failed to create asset");
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Add New Asset</h2>
                <p className="text-sm text-muted-foreground mt-1">Register hardware into the system.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Asset Tag *</label>
                  <input required type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. LPT-1024" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Category *</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm">
                    <option value="COMPUTING">Computing</option>
                    <option value="NETWORKING">Networking</option>
                    <option value="PERIPHERAL">Peripheral</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. MacBook Pro M3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Make *</label>
                  <input required type="text" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. Apple" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-1.5">Model *</label>
                  <input required type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="e.g. MacBook Pro 16-inch" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-1.5">Serial Number</label>
                <input type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Asset
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
