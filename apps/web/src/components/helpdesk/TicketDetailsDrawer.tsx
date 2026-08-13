"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, User, Laptop, MapPin, MessageSquare, Clock, AlertCircle,
  CheckCircle2, Calendar, Send, ShieldAlert, Wrench, Lock, Globe
} from "lucide-react";
import { apiFetch, ticketsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TicketDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string | null;
  onSuccess?: () => void;
}

export function TicketDetailsDrawer({
  isOpen,
  onClose,
  ticketId,
  onSuccess,
}: TicketDetailsDrawerProps) {
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Open");

  const fetchTicket = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const data = await apiFetch<any>(`/tickets/${ticketId}`);
      setTicket(data);
      setCurrentStatus(data.status || "Open");
    } catch (err) {
      console.error("Failed to load ticket details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicket();
    }
  }, [isOpen, ticketId]);

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return;
    setCurrentStatus(newStatus);
    try {
      await ticketsApi.update(ticketId, { status: newStatus });
      fetchTicket();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticketId) return;
    setSubmittingComment(true);
    try {
      await ticketsApi.addComment(ticketId, newComment, isInternalNote);
      setNewComment("");
      fetchTicket();
    } catch (err) {
      console.error("Failed to post comment", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  if (!isOpen) return null;

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          />

          {/* Slide-over Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-screen w-[560px] max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      {ticket?.id || ticketId}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground">
                      {ticket?.category || "IT Support"}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-foreground tracking-tight">{ticket?.title || "Ticket Details"}</h2>
                </div>

                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status Selector & Quick Header Actions */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-border/30">
                {/* Status Dropdown */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Current Status
                  </label>
                  <select
                    value={currentStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full text-xs font-bold bg-background border border-border/60 rounded-xl px-3 py-1.5 outline-none focus:border-primary shadow-sm cursor-pointer"
                  >
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Waiting">Waiting User</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                {/* Priority Badge */}
                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1 block">
                    Priority Level
                  </label>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border bg-background text-xs font-bold shadow-sm">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                    <span>{ticket?.priority || "Medium"} Priority</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="p-8 text-center text-xs font-bold text-muted-foreground animate-pulse">
                  Loading ticket details & comment thread...
                </div>
              ) : (
                <>
                  {/* Issue Description */}
                  <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Issue Description</h4>
                    <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">{ticket?.description || "No description provided."}</p>
                  </section>

                  {/* Requester & Technician Info */}
                  <section className="grid grid-cols-2 gap-4">
                    <div className="bg-muted/30 border border-border/40 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <User className="w-3 h-3 text-primary" /> Requester
                      </span>
                      <p className="text-xs font-bold text-foreground">{ticket?.requester_name || ticket?.requesterName || "Employee"}</p>
                      <p className="text-[10px] text-muted-foreground">{ticket?.department || "Engineering"} • {ticket?.location || "HQ"}</p>
                    </div>

                    <div className="bg-muted/30 border border-border/40 rounded-2xl p-3.5 space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-500" /> SLA Target
                      </span>
                      <p className="text-xs font-bold text-foreground">SLA Due: {ticket?.slaDueDate ? new Date(ticket.slaDueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "In 3h 15m"}</p>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Within Target Window</span>
                    </div>
                  </section>

                  {/* Comments & Activity Stream */}
                  <section className="space-y-4 pt-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-primary" /> Activity & Conversation ({ticket?.comments?.length || 0})
                    </h4>

                    <div className="space-y-3">
                      {ticket?.comments?.map((c: any, idx: number) => (
                        <div
                          key={c.id ?? idx}
                          className={cn(
                            "p-3.5 rounded-2xl border text-xs space-y-1.5 shadow-sm",
                            c.is_internal || c.isInternal
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200"
                              : "bg-card border-border/50 text-foreground"
                          )}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="flex items-center gap-1">
                              {c.is_internal || c.isInternal ? <Lock className="w-3 h-3 text-amber-600" /> : <Globe className="w-3 h-3 text-blue-500" />}
                              <span>{c.author?.name || c.author_name || "Support Tech"}</span>
                              {c.is_internal && <span className="text-amber-600 font-extrabold uppercase ml-1">(Internal Note)</span>}
                            </span>
                            <span className="text-muted-foreground font-mono">{c.created_at ? new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                          </div>
                          <p className="leading-relaxed">{c.content}</p>
                        </div>
                      ))}

                      {(!ticket?.comments || ticket.comments.length === 0) && (
                        <div className="p-4 text-center text-xs text-muted-foreground bg-muted/20 border border-border/40 rounded-2xl">
                          No comments posted yet. Start the conversation below.
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* Comment Form Footer */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-border/40 bg-card/60 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">Add Response</span>
                <button
                  type="button"
                  onClick={() => setIsInternalNote(!isInternalNote)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer",
                    isInternalNote
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-600"
                      : "bg-muted border-border/50 text-muted-foreground"
                  )}
                >
                  <Lock className="w-3 h-3" />
                  <span>{isInternalNote ? "Internal Note" : "Public Reply"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={isInternalNote ? "Write internal technician note..." : "Write public reply to user..."}
                  className="flex-1 px-3.5 py-2 bg-background border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newComment.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 disabled:opacity-40 transition-all shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
