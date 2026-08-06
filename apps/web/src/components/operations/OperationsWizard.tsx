/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
 
// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { operationsApi, OperationPayload, assetApi, inventoryApi, employeesApi, locationsApi } from "@/lib/api";
import { Play, CheckCircle2 } from "lucide-react";

const OPERATION_TYPES = [
  "Install Asset",
  "Assign Asset",
  "Transfer Asset",
  "Issue Tool",
  "Return Tool",
  "Maintenance",
  "Repair",
  "Inspection",
  "Relocation",
  "Retirement"
];

export function OperationsWizard() {
  const [opType, setOpType] = useState(OPERATION_TYPES[0]);
  const [hardwareAssetId, setHardwareAssetId] = useState("");
  const [inventoryItemId, setInventoryItemId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");

  const [assets, setAssets] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    Promise.all([
      assetApi.getAll(),
      inventoryApi.getAll(),
      employeesApi.getAll(),
      locationsApi.getAll()
    ]).then(([a, i, e, l]) => {
      setAssets(Array.isArray(a) ? a : (a as any).data || []);
      setInventory(Array.isArray(i) ? i : (i as any).data || []);
      setEmployees(Array.isArray(e) ? e : (e as any).data || []);
      setLocations(Array.isArray(l) ? l : (l as any).data || []);
    });
  }, []);

  const needsAsset = ["Install Asset", "Assign Asset", "Transfer Asset", "Maintenance", "Repair", "Inspection", "Relocation", "Retirement"].includes(opType);
  const needsInventory = ["Issue Tool", "Return Tool"].includes(opType);
  const needsEmployee = ["Assign Asset", "Transfer Asset", "Issue Tool", "Return Tool"].includes(opType);
  const needsLocation = ["Install Asset", "Relocation"].includes(opType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    
    const payload: OperationPayload = {
      operationType: opType,
      hardwareAssetId: needsAsset && hardwareAssetId ? hardwareAssetId : undefined,
      inventoryItemId: needsInventory && inventoryItemId ? inventoryItemId : undefined,
      locationId: needsLocation && locationId ? locationId : undefined,
      assigneeId: needsEmployee && assigneeId ? assigneeId : undefined,
      quantity: needsInventory ? quantity : 1,
      notes: notes || undefined
    };

    try {
      await operationsApi.execute(payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Refresh page or trigger event to reload history
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      alert("Failed to execute operation");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-border/40 bg-slate-50">
        <h3 className="font-bold text-foreground flex items-center gap-2">
          <Play className="w-4 h-4 text-primary" />
          New Operation
        </h3>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Operation Type</label>
          <select 
            className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={opType}
            onChange={e => setOpType(e.target.value)}
          >
            {OPERATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {needsAsset && (
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Target Asset</label>
            <select 
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={hardwareAssetId}
              onChange={e => setHardwareAssetId(e.target.value)}
              required
            >
              <option value="">Select Asset...</option>
              {assets.map(a => <option key={a.id} value={a.id}>{a.tag} - {a.name || a.model}</option>)}
            </select>
          </div>
        )}

        {needsInventory && (
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Inventory Item</label>
            <select 
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={inventoryItemId}
              onChange={e => setInventoryItemId(e.target.value)}
              required
            >
              <option value="">Select Tool/Item...</option>
              {inventory.map(i => <option key={i.id} value={i.id}>{i.sku} - {i.name}</option>)}
            </select>
          </div>
        )}

        {needsEmployee && (
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Employee (Assignee)</label>
            <select 
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={assigneeId}
              onChange={e => setAssigneeId(e.target.value)}
              required
            >
              <option value="">Select Employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
            </select>
          </div>
        )}

        {needsLocation && (
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Location</label>
            <select 
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              required
            >
              <option value="">Select Location...</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.type})</option>)}
            </select>
          </div>
        )}

        {needsInventory && (
          <div>
            <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Quantity</label>
            <input 
              type="number"
              min="1"
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={quantity}
              onChange={e => setQuantity(parseInt(e.target.value))}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wider">Operation Notes</label>
          <textarea 
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[80px]"
            placeholder="Add context for this operation..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>

        <button 
          type="submit" 
          disabled={submitting || success}
          className={`w-full h-10 rounded-md font-bold text-sm text-white shadow-sm transition-colors flex items-center justify-center gap-2 ${
            success ? 'bg-emerald-500' : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {success ? (
            <><CheckCircle2 className="w-4 h-4" /> Executed</>
          ) : submitting ? (
            "Executing..."
          ) : (
            "Execute Operation"
          )}
        </button>
      </form>
    </div>
  );
}