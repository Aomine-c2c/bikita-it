/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { assetApi, apiFetch, type Asset } from "@/lib/api";

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultLocationId?: string;
  assetToEdit?: Asset | null;
}

export function AssetFormModal({ isOpen, onClose, onSuccess, defaultLocationId, assetToEdit }: AssetFormModalProps) {
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

  useEffect(() => {
    if (assetToEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        tag: assetToEdit.assetTag || "",
        name: assetToEdit.name || "",
        category: assetToEdit.category || "COMPUTING",
        make: assetToEdit.manufacturer || "",
        model: assetToEdit.model || "",
        serialNumber: assetToEdit.serialNumber || "",
        locationId: assetToEdit.location?.id || defaultLocationId || "",
      });
    } else {
      setFormData({
        tag: "",
        name: "",
        category: "COMPUTING",
        make: "",
        model: "",
        serialNumber: "",
        locationId: defaultLocationId || "",
      });
    }
  }, [assetToEdit, isOpen, defaultLocationId]);

  const [taxonomies, setTaxonomies] = useState({ brands: [], models: [] } as { brands: string[], models: string[] });

  useEffect(() => {
    if (isOpen) {
      assetApi.getAll().then((assets: any[]) => {
        const brands = new Set<string>();
        const models = new Set<string>();
        assets.forEach(a => {
          if (a.manufacturer) brands.add(a.manufacturer);
          if (a.model) models.add(a.model);
        });
        setTaxonomies({ brands: Array.from(brands), models: Array.from(models) });
      }).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim() || `${formData.make} ${formData.model}`.trim(),
        assetTag: formData.tag,
        category: formData.category,
        manufacturer: formData.make,
        model: formData.model,
        serialNumber: formData.serialNumber,
        ...(formData.locationId ? { locationId: formData.locationId } : {})
      };

      if (assetToEdit) {
        await assetApi.update(assetToEdit.id, payload);
      } else {
        await assetApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err.message || `Failed to ${assetToEdit ? 'update' : 'create'} asset`);
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
                <h2 className="text-xl font-bold text-foreground">{assetToEdit ? "Edit Asset" : "Add New Asset"}</h2>
                <p className="text-sm text-muted-foreground mt-1">{assetToEdit ? "Update asset details." : "Register hardware into the system."}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm" role="alert" aria-live="assertive">
                  <AlertCircle className="w-4 h-4" /> {error}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="asset-tag" className="block text-sm font-semibold text-foreground mb-1.5">Asset Tag *</label>
                  <input id="asset-tag" required type="text" value={formData.tag} onChange={e => setFormData({...formData, tag: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. LPT-1024" autoFocus />
                </div>
                <div>
                  <label htmlFor="asset-cat" className="block text-sm font-semibold text-foreground mb-1.5">Category *</label>
                  <select id="asset-cat" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm">
                    <option value="COMPUTING">Computing</option>
                    <option value="NETWORKING">Networking</option>
                    <option value="PERIPHERAL">Peripheral</option>
                    <option value="MOBILE">Mobile</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="asset-name" className="block text-sm font-semibold text-foreground mb-1.5">Name</label>
                <input id="asset-name" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. MacBook Pro M3" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="asset-make" className="block text-sm font-semibold text-foreground mb-1.5">Make *</label>
                  <input id="asset-make" required list="brands-list" type="text" value={formData.make} onChange={e => setFormData({...formData, make: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. Apple" />
                  <datalist id="brands-list">
                    {taxonomies.brands?.map(b => <option key={b} value={b} />)}
                  </datalist>
                </div>
                <div>
                  <label htmlFor="asset-model" className="block text-sm font-semibold text-foreground mb-1.5">Model *</label>
                  <input id="asset-model" required list="models-list" type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. MacBook Pro 16-inch" />
                  <datalist id="models-list">
                    {taxonomies.models?.map(m => <option key={m} value={m} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <label htmlFor="asset-sn" className="block text-sm font-semibold text-foreground mb-1.5">Serial Number</label>
                <input id="asset-sn" type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-6">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {assetToEdit ? 'Save Changes' : 'Create Asset'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}