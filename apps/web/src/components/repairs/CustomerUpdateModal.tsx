import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";

interface CustomerUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  repairId: string;
}

export function CustomerUpdateModal({ isOpen, onClose, repairId }: CustomerUpdateModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSend = () => {
    setIsSending(true);
    // Simulate sending email to customer
    setTimeout(() => {
      setIsSending(false);
      setMessage("");
      onClose();
    }, 1000);
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
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
          >
            <div className="p-6 border-b border-border/40 bg-[#FAFAFA] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground">Update Customer</h2>
                <p className="text-sm text-muted-foreground mt-1">Send an email update for repair {repairId}.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="p-6">
              <label className="block text-sm font-semibold text-foreground mb-1.5">Message</label>
              <textarea 
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-border/60 rounded-md text-sm outline-none focus:border-primary shadow-sm resize-none"
                placeholder="Hello, we are still waiting on parts for your device..."
              />
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button 
                onClick={handleSend}
                disabled={isSending || !message.trim()}
                className="px-5 py-2 bg-slate-950 text-white rounded-md text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send Update
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
