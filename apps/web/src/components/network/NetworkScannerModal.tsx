"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Radar, Loader2, CheckCircle2, ShieldAlert, Cpu } from "lucide-react";
import { networkApi } from "@/lib/api";

interface NetworkScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NetworkScannerModal({ isOpen, onClose, onSuccess }: NetworkScannerModalProps) {
  const [subnet, setSubnet] = useState("192.168.1.0/24");
  const [scanType, setScanType] = useState("PING_ARP");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [discoveredCount, setDiscoveredCount] = useState(0);

  if (!isOpen) return null;

  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setProgress(15);

    try {
      // Trigger scan API
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 25;
        });
      }, 400);

      await (networkApi.triggerScan as any)({ subnet, scanType });
      
      clearInterval(interval);
      setProgress(100);
      setDiscoveredCount(4);

      setTimeout(() => {
        setIsScanning(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Failed to run network scan", err);
      setIsScanning(false);
      setProgress(0);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-card border border-border/60 rounded-3xl shadow-2xl p-6 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Radar className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">Subnet Discovery Scanner</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Scan CIDR Subnets for Unmanaged Network Devices</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleStartScan} className="space-y-5 pt-4">
              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Target CIDR Subnet Range</label>
                <input
                  type="text"
                  value={subnet}
                  onChange={(e) => setSubnet(e.target.value)}
                  placeholder="e.g. 192.168.1.0/24"
                  required
                  disabled={isScanning}
                  className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs font-mono font-bold outline-none focus:border-primary shadow-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-foreground mb-1.5 block">Scan Protocol & Depth</label>
                <select
                  value={scanType}
                  onChange={(e) => setScanType(e.target.value)}
                  disabled={isScanning}
                  className="w-full px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs font-bold outline-none focus:border-primary shadow-sm cursor-pointer"
                >
                  <option value="PING_ARP">Fast Ping Sweep + ARP Table Discovery</option>
                  <option value="SNMP_PROBE">Deep SNMP v2c/v3 Port Probe</option>
                  <option value="FULL_SCAN">Comprehensive TCP/UDP Network Scan</option>
                </select>
              </div>

              {/* Progress Indicator */}
              {isScanning && (
                <div className="space-y-2 bg-muted/30 border border-border/40 p-4 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Scanning {subnet}...
                    </span>
                    <span className="font-mono text-muted-foreground">{progress}%</span>
                  </div>

                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/40">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isScanning}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-border/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-5 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Scanning Subnet...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      <span>Launch Network Scan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
