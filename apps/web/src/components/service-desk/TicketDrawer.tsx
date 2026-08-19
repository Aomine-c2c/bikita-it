"use client";

import React, { useState } from "react";
import { X, Clock, Paperclip, Laptop, Sparkles, Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface TicketDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
}

// SLA countdown — dynamic visualization
function SLATimer({ hoursLeft }: { hoursLeft: number }) {
  const breached = hoursLeft <= 0;
  const urgent = hoursLeft > 0 && hoursLeft <= 2;
  const warning = hoursLeft > 2 && hoursLeft <= 8;
  const pct = breached ? 100 : Math.min(100, ((24 - hoursLeft) / 24) * 100);

  return (
    <div className={cn("rounded-2xl border p-4 mb-5", {
      "bg-destructive/10 border-destructive/20 text-destructive": breached || urgent,
      "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400": warning,
      "bg-muted/30 border-border/50 text-foreground": !breached && !urgent && !warning,
    })}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-xs font-black uppercase tracking-wider">
            {breached ? "SLA BREACHED" : urgent ? "SLA AT RISK" : "SLA Target Active"}
          </span>
        </div>
        <span className="text-xs font-mono font-bold">
          {breached ? "Overdue (Escalated)" : `${hoursLeft}h remaining`}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", {
            "bg-destructive": breached || urgent,
            "bg-amber-500": warning,
            "bg-primary": !breached && !urgent && !warning,
          })}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function TicketDrawer({ isOpen, onClose, ticketId }: TicketDrawerProps) {
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentFeedback, setCommentFeedback] = useState<string | null>(null);

  const SLA_HOURS = ticketId === "TKT-1003" ? 0 : ticketId === "TKT-1001" ? 2 : 8;

  if (!isOpen) return null;

  const handlePostComment = async () => {
    if (!commentText.trim() || !ticketId) return;
    setIsSubmittingComment(true);
    setCommentFeedback(null);
    try {
      const { ticketsApi } = await import("@/lib/api");
      await ticketsApi.addComment(ticketId, commentText.trim(), false);
      setCommentText("");
      setCommentFeedback("Comment recorded on ticket thread.");
      setTimeout(() => setCommentFeedback(null), 3000);
    } catch (err: any) {
      setCommentFeedback(err.message || "Failed to post comment.");
      setTimeout(() => setCommentFeedback(null), 3500);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end font-sans">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Drawer */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative w-full max-w-xl bg-card h-full border-l border-border/60 flex flex-col z-10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/40 bg-muted/20">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <span className="text-xs font-mono font-bold text-muted-foreground">{ticketId || "TKT-1003"}</span>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                  Critical
                </span>
              </div>
              <h2 className="text-lg font-black text-foreground">MacBook battery swelling &amp; chassis bulge</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {/* SLA Timer */}
            <SLATimer hoursLeft={SLA_HOURS} />

            {/* Context Panel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/20 border border-border/40 rounded-2xl p-3.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Requester</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center text-xs font-bold font-mono">
                    TM
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Tendai Moyo</p>
                    <p className="text-[10px] text-muted-foreground">Operations / Mining</p>
                  </div>
                </div>
              </div>

              <div className="bg-muted/20 border border-border/40 rounded-2xl p-3.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Assigned Engineer</p>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold font-mono">
                    IT
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">Senior SysAdmin</p>
                    <p className="text-[10px] text-muted-foreground">Infrastructure Tier 3</p>
                  </div>
                </div>
              </div>

              <div className="col-span-2 bg-muted/20 border border-border/40 rounded-2xl p-3.5">
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Linked Asset</p>
                <div className="flex items-center justify-between p-2.5 border border-border/60 rounded-xl bg-card hover:border-primary/50 cursor-pointer transition-colors group">
                  <div className="flex items-center gap-2.5">
                    <Laptop className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        Dell Latitude 7440 Intel Core i7
                      </p>
                      <p className="text-[10px] font-mono text-muted-foreground">AST-00984 • Tag #BK-8830</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Warranty Active
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Incident Summary</p>
              <div className="text-xs text-foreground bg-muted/20 border border-border/40 rounded-2xl p-4 space-y-2 leading-relaxed">
                <p>Trackpad difficult to click and keyboard chassis bulging on the left palm rest area.</p>
                <p className="text-muted-foreground text-[11px]">Hardware quarantined in safe storage. Replacement unit requested for dispatch.</p>
              </div>
            </div>

            {/* AI Suggested Solution */}
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">AI Diagnostic Recommendation</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Battery degradation detected. Isolate device power adapter. Issue RMA replacement dispatch from spare inventory stock.
              </p>
            </div>
          </div>

          {/* Quick Reply Box */}
          <div className="p-4 border-t border-border/40 bg-muted/20 space-y-2">
            {commentFeedback && (
              <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-bold text-primary flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{commentFeedback}</span>
              </div>
            )}
            <div className="relative">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write technician note or update..."
                className="w-full bg-background border border-border/60 rounded-2xl px-4 py-3 text-xs outline-none focus:border-primary resize-none h-20 shadow-xs"
              />
              <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2">
                <button
                  type="button"
                  disabled={isSubmittingComment || !commentText.trim()}
                  onClick={handlePostComment}
                  className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-1.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Send className="w-3 h-3" />
                  )}
                  <span>Post Update</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
