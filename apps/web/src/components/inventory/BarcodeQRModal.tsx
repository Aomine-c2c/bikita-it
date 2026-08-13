"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, QrCode, Printer, Download, Copy, Check } from "lucide-react";

interface BarcodeQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    sku: string;
    name: string;
    category: string;
    warehouse?: string;
  } | null;
}

export function BarcodeQRModal({ isOpen, onClose, item }: BarcodeQRModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !item) return null;

  const handleCopySKU = () => {
    navigator.clipboard.writeText(item.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-card/90 border border-border/60 rounded-3xl p-6 w-full max-w-sm shadow-2xl backdrop-blur-xl relative"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Modal Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-3">
              <QrCode className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-foreground tracking-tight">{item.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{item.category} • {item.warehouse || "HQ Warehouse"}</p>
          </div>

          {/* Printable Label Badge Card */}
          <div className="bg-white text-slate-900 border-2 border-dashed border-slate-300 rounded-2xl p-5 text-center shadow-inner flex flex-col items-center space-y-3">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">PULSE INVENTORY TAG</span>

            {/* QR Code Graphic */}
            <div className="w-32 h-32 bg-slate-900 rounded-xl p-2.5 flex items-center justify-center shadow-md relative group">
              <div className="w-full h-full border-2 border-white/20 rounded-lg flex flex-col items-center justify-center p-2 text-white text-[9px] font-mono leading-tight text-center">
                <div className="w-6 h-6 border-2 border-white mb-1 rounded flex items-center justify-center font-bold">QR</div>
                <span>{item.sku}</span>
              </div>
            </div>

            {/* SKU Badge */}
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-xs font-mono font-bold tracking-wider">{item.sku}</span>
              <button
                onClick={handleCopySKU}
                className="text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                title="Copy SKU"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <button
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 text-xs font-bold text-foreground bg-card hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badge</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Done</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
