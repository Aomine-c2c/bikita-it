"use client";

import React, { useEffect, useState, useCallback } from "react";
import { apiFetch, portalApi, type EquipmentLoanRecord } from "@/lib/api";
import {
  AlertCircle,
  Loader2,
  ArrowLeft,
  Send,
  LogIn
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface PublicTicketResponse {
  id: number;
  tracking_code: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  reporter_name?: string;
  reporter_email?: string;
  location_details?: string;
  created_at: string;
  assigned_to_name?: string;
  comments: Array<{
    id: number;
    author_name: string;
    content: string;
    created_at: string;
  }>;
}

export function PublicTicketTrackingView({ code }: { code: string }) {
  const [ticket, setTicket] = useState<PublicTicketResponse | null>(null);
  const [loan, setLoan] = useState<EquipmentLoanRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const isLoan = code?.toUpperCase().startsWith("LOAN-");

  const refetchData = useCallback(async () => {
    if (!code) return;
    try {
      if (isLoan) {
        const res = await portalApi.trackLoan(code);
        setLoan(res);
      } else {
        const res = await apiFetch<PublicTicketResponse>(`/tickets/track/${encodeURIComponent(code)}`);
        setTicket(res);
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || `No record found with reference code '${code}'.`);
    }
  }, [code, isLoan]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!code) return;
      setLoading(true);
      setError(null);
      try {
        if (isLoan) {
          const res = await portalApi.trackLoan(code);
          if (!ignore) setLoan(res);
        } else {
          const res = await apiFetch<PublicTicketResponse>(`/tickets/track/${encodeURIComponent(code)}`);
          if (!ignore) setTicket(res);
        }
      } catch (err: unknown) {
        if (!ignore) setError((err as Error)?.message || `No record found with reference code '${code}'.`);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [code, isLoan]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !ticket) return;

    setCommentSubmitting(true);
    try {
      await apiFetch(`/tickets/track/${encodeURIComponent(ticket.tracking_code)}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: newComment.trim(),
          reporter_name: ticket.reporter_name || "Reporter",
        }),
      });
      setNewComment("");
      await refetchData();
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to post note.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "RESOLVED" || s === "CLOSED" || s === "RETURNED" || s === "APPROVED" || s === "CHECKED_OUT") {
      return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    }
    if (s === "IN_PROGRESS" || s === "PENDING_APPROVAL") {
      return "bg-primary/10 text-primary border-primary/20";
    }
    if (s === "REJECTED" || s === "CANCELLED" || s === "OVERDUE") {
      return "bg-destructive/10 text-destructive border-destructive/20";
    }
    return "bg-muted text-muted-foreground border-border";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/60 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href="/portal"
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Portal Hub</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 text-xs font-bold hover:bg-muted transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Staff Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-medium">Locating request record for {code}…</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-card border border-border/60 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-black text-foreground">Record Not Found</h2>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
            <Link
              href="/portal"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all"
            >
              <span>Return to Portal</span>
            </Link>
          </div>
        ) : isLoan && loan ? (
          /* ── Equipment Loan View ── */
          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-primary">{loan.tracking_code}</span>
                  <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase", getStatusBadge(loan.status))}>
                    {loan.status.replace("_", " ")}
                  </span>
                </div>
                <h2 className="text-base font-black text-foreground mt-1">
                  {loan.equipment_category} Loan Reservation
                </h2>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Submitted: {new Date(loan.created_at).toLocaleDateString()}</p>
                <p>Expected Return: <strong className="text-foreground">{new Date(loan.expected_return_date).toLocaleDateString()}</strong></p>
              </div>
            </div>

            {/* Stepper */}
            <div className="grid grid-cols-4 gap-2 text-center text-xs py-2">
              {[
                { step: "Submitted", done: true },
                { step: "Approved", done: loan.status !== "PENDING_APPROVAL" && loan.status !== "REJECTED" && loan.status !== "CANCELLED" },
                { step: "Checked Out", done: loan.status === "CHECKED_OUT" || loan.status === "RETURNED" },
                { step: "Returned", done: loan.status === "RETURNED" },
              ].map((st, idx) => (
                <div key={st.step} className="space-y-1">
                  <div className={cn(
                    "h-2 rounded-full transition-colors",
                    st.done ? "bg-primary" : "bg-muted"
                  )} />
                  <span className={cn("text-[10px] font-bold", st.done ? "text-foreground" : "text-muted-foreground")}>
                    {idx + 1}. {st.step}
                  </span>
                </div>
              ))}
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Requester Information</span>
                <p className="font-bold text-foreground">{loan.requester_name}</p>
                <p className="text-muted-foreground">ID: {loan.requester_id}</p>
                <p className="text-muted-foreground">Email: {loan.requester_email}</p>
                {loan.department && <p className="text-muted-foreground">Dept: {loan.department}</p>}
              </div>

              <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Loan Details</span>
                <p className="text-muted-foreground">Purpose: <strong className="text-foreground">{loan.purpose}</strong></p>
                {loan.specific_asset_name && (
                  <p className="text-muted-foreground">Assigned Asset: <strong className="text-foreground">{loan.specific_asset_name}</strong></p>
                )}
                {loan.technician_notes && (
                  <p className="text-emerald-600 font-medium">Pickup Notes: {loan.technician_notes}</p>
                )}
              </div>
            </div>
          </div>
        ) : ticket ? (
          /* ── Ticket Tracking View ── */
          <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-lg font-black text-primary">{ticket.tracking_code}</span>
                  <span className={cn("text-xs px-2.5 py-0.5 rounded-full border font-bold uppercase", getStatusBadge(ticket.status))}>
                    {ticket.status}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                    {ticket.priority}
                  </span>
                </div>
                <h2 className="text-base font-black text-foreground mt-1">{ticket.title}</h2>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Created on {new Date(ticket.created_at).toLocaleDateString()}</p>
                {ticket.assigned_to_name && (
                  <p className="text-foreground font-bold mt-0.5">Assigned to: {ticket.assigned_to_name}</p>
                )}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Description</span>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed bg-secondary/30 p-4 rounded-2xl border border-border/40">
                {ticket.description}
              </p>
            </div>

            {/* Comment Timeline */}
            <div className="space-y-4 pt-4 border-t border-border/40">
              <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Technician & Follow-up Notes</h3>
              {ticket.comments?.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">No technician notes posted yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {ticket.comments?.map((c) => (
                    <div key={c.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/50 space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">{c.author_name}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-foreground leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="pt-2 flex gap-2">
                <input
                  type="text"
                  placeholder="Reply to technicians or add details..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-background border border-border/70 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground"
                  required
                />
                <button
                  type="submit"
                  disabled={commentSubmitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {commentSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
