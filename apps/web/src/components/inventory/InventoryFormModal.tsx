 
 

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { inventoryApi, type InventoryItem } from "@/lib/api";

interface InventoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  itemToEdit?: InventoryItem | null;
}

export function InventoryFormModal({ isOpen, onClose, onSuccess, itemToEdit }: InventoryFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "Cables",
    stock: 0,
    minStock: 0,
    maxStock: 0,
    unitCost: 0,
    binLocation: "",
    supplier: "",
  });

  useEffect(() => {
    if (itemToEdit) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        name: itemToEdit.name || "",
        sku: itemToEdit.sku || "",
        category: itemToEdit.category || "Cables",
        stock: (itemToEdit as any).stock || (itemToEdit as any).quantity || 0,
        minStock: itemToEdit.minStock || 0,
        maxStock: itemToEdit.maxStock || 0,
        unitCost: itemToEdit.unitCost || 0,
        binLocation: itemToEdit.binLocation || "",
        supplier: itemToEdit.supplier || "",
      });
    } else {
      setFormData({
        name: "",
        sku: "",
        category: "Cables",
        stock: 0,
        minStock: 0,
        maxStock: 0,
        unitCost: 0,
        binLocation: "",
        supplier: "",
      });
    }
  }, [itemToEdit, isOpen]);

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
        name: formData.name,
        sku: formData.sku,
        category: formData.category,
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        maxStock: Number(formData.maxStock),
        unitCost: Number(formData.unitCost),
        binLocation: formData.binLocation,
        supplier: formData.supplier,
      };

      if (itemToEdit) {
        await inventoryApi.update(itemToEdit.id, payload);
      } else {
        await inventoryApi.create(payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || `Failed to ${itemToEdit ? 'update' : 'create'} inventory item`);
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-bold text-foreground">{itemToEdit ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
                <p className="text-sm text-muted-foreground mt-1">{itemToEdit ? "Update item details." : "Add new items to stock."}</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm" role="alert" aria-live="assertive">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inv-sku" className="block text-sm font-semibold text-foreground mb-1.5">SKU *</label>
                    <input id="inv-sku" required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. CAB-001" autoFocus />
                  </div>
                  <div>
                    <label htmlFor="inv-cat" className="block text-sm font-semibold text-foreground mb-1.5">Category *</label>
                    <input id="inv-cat" required type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. Cables" />
                  </div>
                </div>

                <div>
                  <label htmlFor="inv-name" className="block text-sm font-semibold text-foreground mb-1.5">Name *</label>
                  <input id="inv-name" required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. Cat6 Ethernet Cable" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="inv-stock" className="block text-sm font-semibold text-foreground mb-1.5">Stock</label>
                    <input id="inv-stock" type="number" min="0" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="inv-minstock" className="block text-sm font-semibold text-foreground mb-1.5">Min Stock</label>
                    <input id="inv-minstock" type="number" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: Number(e.target.value)})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="inv-maxstock" className="block text-sm font-semibold text-foreground mb-1.5">Max Stock</label>
                    <input id="inv-maxstock" type="number" min="0" value={formData.maxStock} onChange={e => setFormData({...formData, maxStock: Number(e.target.value)})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="inv-cost" className="block text-sm font-semibold text-foreground mb-1.5">Unit Cost ($)</label>
                    <input id="inv-cost" type="number" step="0.01" min="0" value={formData.unitCost} onChange={e => setFormData({...formData, unitCost: Number(e.target.value)})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" />
                  </div>
                  <div>
                    <label htmlFor="inv-bin" className="block text-sm font-semibold text-foreground mb-1.5">Bin Location</label>
                    <input id="inv-bin" type="text" value={formData.binLocation} onChange={e => setFormData({...formData, binLocation: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. A1-Bin3" />
                  </div>
                </div>

                <div>
                  <label htmlFor="inv-supplier" className="block text-sm font-semibold text-foreground mb-1.5">Supplier</label>
                  <input id="inv-supplier" type="text" value={formData.supplier} onChange={e => setFormData({...formData, supplier: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus:border-primary shadow-sm" placeholder="e.g. Amazon" />
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-3 border-t border-border/40 bg-white shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 rounded-md">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {itemToEdit ? 'Save Changes' : 'Create Item'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
