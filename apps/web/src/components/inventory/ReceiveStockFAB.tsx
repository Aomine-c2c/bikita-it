"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PackagePlus, X, Box, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ReceiveStockFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

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
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Item Type</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="border-2 border-primary bg-primary/5 rounded-xl p-4 cursor-pointer">
                          <Box className="w-6 h-6 text-primary mb-2" />
                          <h3 className="font-bold text-foreground">Bulk / Consumables</h3>
                          <p className="text-xs text-muted-foreground mt-1">Cables, screws, tools tracked by quantity.</p>
                        </div>
                        <div className="border border-border/60 hover:border-primary/50 bg-white rounded-xl p-4 cursor-pointer transition-colors">
                          <PackagePlus className="w-6 h-6 text-muted-foreground mb-2" />
                          <h3 className="font-bold text-foreground">Serialized Assets</h3>
                          <p className="text-xs text-muted-foreground mt-1">Laptops, cameras with unique serials.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">SKU / Item Name</label>
                        <input type="text" defaultValue="Cat6 Ethernet Cable (50ft)" className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Category</label>
                        <select className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm">
                          <option>Networking (CONSUMABLE)</option>
                          <option>Tools (RETURNABLE)</option>
                          <option>Hardware (NON_RETURNABLE)</option>
                          <option>Peripherals (SERIALIZED)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Quantity Received</label>
                        <input type="number" defaultValue={50} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Destination</label>
                        <select className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm">
                          <option>Main HQ (Warehouse)</option>
                          <option>Processing Plant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Shelf / Bin</label>
                        <input type="text" defaultValue="C-02" className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm" />
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
                      onClick={() => {
                        alert('Stock intake functionality - Would call API to create inventory item and log transaction');
                        setStep(2);
                      }} 
                      className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors"
                    >
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
