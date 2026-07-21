"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PackagePlus, X, Box, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { inventoryApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ReceiveStockFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    type: "bulk",
    name: "Cat6 Ethernet Cable (50ft)",
    category: "Networking",
    quantity: 50,
    destination: "Main HQ (Warehouse)",
    binLocation: "C-02",
    sku: "SKU-123",
  });

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setStep(1), 300); // reset after animation
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(true)}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
        className="fixed bottom-8 right-8 z-40 flex items-center gap-2 bg-primary text-white px-5 py-3.5 rounded-full shadow-[0_8px_30px_rgba(79,70,229,0.4)] hover:bg-primary/90 hover:shadow-[0_8px_40px_rgba(79,70,229,0.5)] hover:-translate-y-1 transition-all group"
      >
        <PackagePlus className="w-5 h-5 transition-transform group-hover:scale-110" />
        <span className="font-bold tracking-wide">Receive Stock</span>
      </motion.button>

      {/* Intake Wizard Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-foreground">Stock Intake Wizard</h2>
                  <p className="text-sm text-muted-foreground mt-1">Receive new inventory into the warehouse.</p>
                </div>
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Wizard Content */}
              <div className="p-6">
                {step === 1 && (
                  <div className="space-y-6">
                    {error && (
                      <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4" /> {error}
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Item Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div 
                          onClick={() => setFormData({ ...formData, type: 'bulk' })}
                          className={cn("border rounded-xl p-4 cursor-pointer transition-colors", formData.type === 'bulk' ? "border-2 border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 bg-white")}
                        >
                          <Box className={cn("w-6 h-6 mb-2", formData.type === 'bulk' ? "text-primary" : "text-muted-foreground")} />
                          <h3 className="font-bold text-foreground">Bulk / Consumables</h3>
                          <p className="text-xs text-muted-foreground mt-1">Cables, screws, tools tracked by quantity.</p>
                        </div>
                        <div 
                          onClick={() => setFormData({ ...formData, type: 'serialized' })}
                          className={cn("border rounded-xl p-4 cursor-pointer transition-colors", formData.type === 'serialized' ? "border-2 border-primary bg-primary/5" : "border-border/60 hover:border-primary/50 bg-white")}
                        >
                          <PackagePlus className={cn("w-6 h-6 mb-2", formData.type === 'serialized' ? "text-primary" : "text-muted-foreground")} />
                          <h3 className="font-bold text-foreground">Serialized Assets</h3>
                          <p className="text-xs text-muted-foreground mt-1">Laptops, cameras with unique serials.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Item Name</label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm">
                          <option value="Networking">Networking</option>
                          <option value="Tools">Tools</option>
                          <option value="Hardware">Hardware</option>
                          <option value="Peripherals">Peripherals</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Quantity Received</label>
                        <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">SKU (Optional)</label>
                        <input type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" placeholder="SKU-XXX" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Shelf / Bin</label>
                        <input type="text" value={formData.binLocation} onChange={e => setFormData({...formData, binLocation: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" />
                      </div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Stock Received Successfully</h3>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      50 units of <strong>Cat6 Ethernet Cable (50ft)</strong> have been added to Main HQ (Shelf C-02). An INTAKE transaction has been logged.
                    </p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-border/40 bg-[#FAFAFA] flex justify-end gap-3">
                {step === 1 ? (
                  <>
                    <button onClick={handleClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                    <button 
                      disabled={isSubmitting}
                      onClick={async () => {
                        setIsSubmitting(true);
                        setError(null);
                        try {
                          await inventoryApi.create({
                            name: formData.name,
                            category: formData.category,
                            quantity: formData.quantity,
                            sku: formData.sku || `${formData.category.substring(0,3).toUpperCase()}-${Math.floor(Math.random()*1000)}`,
                            binLocation: formData.binLocation,
                            minStock: 10, // Default defaults
                            maxStock: 500,
                          });
                          setStep(2);
                        } catch (err: any) {
                          setError(err.message || "Failed to intake stock");
                        } finally {
                          setIsSubmitting(false);
                        }
                      }} 
                      className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                    >
                      {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                      Confirm Intake
                    </button>
                  </>
                ) : (
                  <button onClick={handleClose} className="px-5 py-2 bg-slate-800 text-white rounded-md text-sm font-bold shadow-sm hover:bg-slate-700 transition-colors">
                    Close
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
