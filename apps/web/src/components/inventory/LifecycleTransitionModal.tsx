 
 

"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, AlertCircle } from "lucide-react";
import { InventoryItem, employeesApi, locationsApi, assetApi, inventoryApi, apiFetch } from "@/lib/api";

interface LifecycleTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  item: (InventoryItem & Record<string, unknown>) | null;
}

interface SimpleOption {
  id: string | number;
  name?: string | null;
  asset_tag?: string | null;
  model?: string | null;
}

export function LifecycleTransitionModal({ isOpen, onClose, onSuccess, item }: LifecycleTransitionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [employees, setEmployees] = useState<SimpleOption[]>([]);
  const [locations, setLocations] = useState<SimpleOption[]>([]);
  const [hardwareAssets, setHardwareAssets] = useState<SimpleOption[]>([]);

  const isFixedAsset = item?.category === "Fixed Assets";

  const [formData, setFormData] = useState({
    consumptionType: "Assign to Employee",
    targetId: "",
    quantity: 1,
    notes: "",
    assignmentType: "Permanent",
    useCableMarking: false,
    newMeterMark: ""
  });

  useEffect(() => {
    // Fetch employees, locations, and hardware assets for assignment options
    employeesApi.getAll().then((res) => {
      setEmployees(Array.isArray(res) ? res : []);
    }).catch(console.error);
    
    locationsApi.getAll().then((res) => {
      setLocations(Array.isArray(res) ? res : []);
    }).catch(console.error);
    
    assetApi.getAll().then((res) => {
      setHardwareAssets(Array.isArray(res) ? res : []);
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;
    setIsSubmitting(true);
    setError(null);

    try {
      if (isFixedAsset) {
        await inventoryApi.issueAsset(String(item.id), formData.targetId, formData.notes);
      } else {
        const payload = {
          ...formData,
          newMeterMark: formData.useCableMarking && formData.newMeterMark ? parseInt(formData.newMeterMark) : undefined
        };
        await apiFetch(`/inventory/${item.id}/issue-consumable`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
      }
      onSuccess();
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to issue item");
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <AnimatePresence>
      {isOpen && item && (
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
                <h2 className="text-xl font-bold text-foreground">Issue Inventory Item</h2>
                <p className="text-sm text-muted-foreground mt-1">Issue {item.name} from stock.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
              <div className="p-6 space-y-5 overflow-y-auto">
                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-center gap-2 text-sm">
                    <AlertCircle className="w-4 h-4" /> {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  {!isFixedAsset && (
                    <>
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-1.5">Consumption Type *</label>
                        <select 
                          required 
                          value={formData.consumptionType} 
                          onChange={e => setFormData({...formData, consumptionType: e.target.value, targetId: ""})} 
                          className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary"
                        >
                          <option value="Assign to Employee">Assign to Employee</option>
                          <option value="Install at Location">Install at Location</option>
                          <option value="Use for Hardware Repair">Use for Hardware Repair</option>
                          <option value="General Consumption">General Consumption</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-4 mb-2">
                        <input
                          type="checkbox"
                          id="useCableMarking"
                          checked={formData.useCableMarking}
                          onChange={e => setFormData({...formData, useCableMarking: e.target.checked, quantity: 1, newMeterMark: ""})}
                          className="rounded border-border/60 text-primary focus:ring-primary"
                        />
                        <label htmlFor="useCableMarking" className="text-sm font-medium text-foreground cursor-pointer">
                          Calculate from Cable Markings
                        </label>
                      </div>
                      
                      {formData.useCableMarking ? (
                        <div className="bg-muted/30 p-4 rounded-md border border-border/50">
                          <label className="block text-sm font-semibold text-foreground mb-1.5">New Meter Mark *</label>
                          <input 
                            required 
                            type="number" 
                            min={item.currentMeterMark || 0}
                            value={formData.newMeterMark} 
                            onChange={e => setFormData({...formData, newMeterMark: e.target.value})} 
                            className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary" 
                          />
                          <p className="text-xs text-muted-foreground mt-1 mb-3">Last known mark: <strong>{item.currentMeterMark || 0}m</strong> (Remaining: {item.quantity}m)</p>
                          
                          {formData.newMeterMark && parseInt(formData.newMeterMark) >= (item.currentMeterMark || 0) && (
                            <div className="p-3 bg-primary/10 text-primary-800 rounded-md text-sm flex items-center justify-between">
                              <span>Calculated Usage:</span>
                              <span className="font-bold text-lg">{parseInt(formData.newMeterMark) - (item.currentMeterMark || 0)}m</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-1.5">Quantity to Issue *</label>
                          <input 
                            required 
                            type="number" 
                            min="1"
                            max={item.quantity}
                            value={formData.quantity} 
                            onChange={e => setFormData({...formData, quantity: parseInt(e.target.value) || 1})} 
                            className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary" 
                          />
                          <p className="text-xs text-muted-foreground mt-1">Max available: {item.quantity}</p>
                        </div>
                      )}
                    </>
                  )}

                  {(!isFixedAsset && formData.consumptionType === "Assign to Employee") || isFixedAsset ? (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Assign To Employee *</label>
                      <select required value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary">
                        <option value="">Select Employee...</option>
                        {employees.map((emp) => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  {!isFixedAsset && formData.consumptionType === "Install at Location" && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Install Location *</label>
                      <select required value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary">
                        <option value="">Select Location...</option>
                        {locations.map((loc) => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {!isFixedAsset && formData.consumptionType === "Use for Hardware Repair" && (
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1.5">Hardware Asset *</label>
                      <select required value={formData.targetId} onChange={e => setFormData({...formData, targetId: e.target.value})} className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary">
                        <option value="">Select Asset...</option>
                        {hardwareAssets.map((asset) => (
                          <option key={asset.id} value={asset.id}>{asset.asset_tag} - {asset.model}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {isFixedAsset && (
                    <div className="p-3 bg-blue-50 text-blue-700 rounded-md text-xs">
                      Issuing this fixed asset will automatically convert it into a tracked Hardware Asset and assign it to the selected employee.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 pt-4 flex justify-end gap-3 border-t border-border/40 bg-white shrink-0">
                <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-primary text-white rounded-md text-sm font-bold shadow-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Issue Item
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
