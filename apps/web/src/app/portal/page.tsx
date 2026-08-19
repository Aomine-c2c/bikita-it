"use client";

import React, { useState, useEffect } from "react";
import { 
  apiFetch, portalApi, 
  type AvailableEquipmentCategory, type EquipmentLoanRecord, 
  type DiagnosticsPingResponse, type KnowledgeSuggestResponse, 
  type KnowledgeArticleRecord 
} from "@/lib/api";
import {
  LifeBuoy, Send, CheckCircle2, AlertCircle, Loader2, Search, Copy, Check,
  ArrowRight, LogIn, Laptop, Projector, Network, Cable,
  Activity, BookOpen, ShieldCheck, Sparkles, Cpu, RotateCcw
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

const CATEGORIES = [
  { id: "Hardware", label: "Hardware & PC", icon: "💻" },
  { id: "Network", label: "Network & Wi-Fi", icon: "🌐" },
  { id: "Software", label: "Software & OS", icon: "📦" },
  { id: "Classroom / AV", label: "Classroom / AV", icon: "📽️" },
  { id: "Printer", label: "Printer & Scanner", icon: "🖨️" },
  { id: "Other", label: "General Inquiry", icon: "❓" },
];

const PRIORITIES = [
  { id: "Low", label: "Low", desc: "Minor inconvenience" },
  { id: "Medium", label: "Medium", desc: "Standard workflow issue" },
  { id: "High", label: "High", desc: "Urgent / Lab disruption" },
  { id: "Critical", label: "Critical", desc: "Campus outage" },
];

export default function PublicHelpdeskPortal() {
  const [activeTab, setActiveTab] = useState<"report" | "loans" | "diagnostics" | "knowledge" | "track">("report");

  // ── 1. Report an Issue State ──
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Hardware");
  const [priority, setPriority] = useState("Medium");
  const [reporterName, setReporterName] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("helpdesk_name") || "" : ""));
  const [reporterEmail, setReporterEmail] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("helpdesk_email") || "" : ""));
  const [reporterPhone, setReporterPhone] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("helpdesk_phone") || "" : ""));
  const [locationDetails, setLocationDetails] = useState(() => (typeof window !== "undefined" ? localStorage.getItem("helpdesk_loc") || "" : ""));
  const [attachDiagnostics, setAttachDiagnostics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<PublicTicketResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Predictive Knowledge suggestions
  const [suggestions, setSuggestions] = useState<KnowledgeSuggestResponse[]>([]);

  // ── 2. Equipment Loans State ──
  const [availableCategories, setAvailableCategories] = useState<AvailableEquipmentCategory[]>([]);
  const [selectedLoanCategory, setSelectedLoanCategory] = useState("Laptops & Mobile Workstations");
  const [loanStudentId, setLoanStudentId] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [loanDepartment, setLoanDepartment] = useState("");
  const [loanReturnDate, setLoanReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [loanSubmitting, setLoanSubmitting] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState<EquipmentLoanRecord | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);

  // ── 3. Campus Health Diagnostics State ──
  const [diagnosticsData, setDiagnosticsData] = useState<DiagnosticsPingResponse | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [clientTelemetry] = useState<{
    browser: string;
    os: string;
    screen: string;
    cores: string;
    connectionType: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const ua = navigator.userAgent;
    let os = "Desktop OS";
    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Mac")) os = "macOS";
    else if (ua.includes("Linux")) os = "Linux";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone")) os = "iOS";

    let browser = "Web Browser";
    if (ua.includes("Chrome")) browser = "Chrome";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Safari")) browser = "Safari";
    else if (ua.includes("Edge")) browser = "Edge";

    return {
      browser,
      os,
      screen: `${window.screen.width}x${window.screen.height}`,
      cores: navigator.hardwareConcurrency ? `${navigator.hardwareConcurrency} Logical Cores` : "Multi-Core",
      connectionType: (navigator as unknown as { connection?: { effectiveType?: string } })?.connection?.effectiveType || "High-Speed Ethernet/Wi-Fi",
    };
  });

  // ── 4. Knowledge Base Search State ──
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [articles, setArticles] = useState<KnowledgeArticleRecord[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);

  // ── 5. Universal Tracking State ──
  const [searchCode, setSearchCode] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedTicket, setTrackedTicket] = useState<PublicTicketResponse | null>(null);
  const [trackedLoan, setTrackedLoan] = useState<EquipmentLoanRecord | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch initial portal data
  useEffect(() => {
    portalApi.getAvailableEquipment().then(setAvailableCategories).catch(() => {});
    portalApi.pingDiagnostics().then(setDiagnosticsData).catch(() => {});
    portalApi.searchKnowledge("").then(setArticles).catch(() => {});
  }, []);

  // Predictive knowledge trigger as user types
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title.trim().length > 3 || description.trim().length > 10) {
        portalApi.getKnowledgeSuggestions(title, description).then(setSuggestions).catch(() => {});
      } else {
        setSuggestions([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [title, description]);

  const handlePingRefresh = async () => {
    setPingLoading(true);
    try {
      const res = await portalApi.pingDiagnostics();
      setDiagnosticsData(res);
    } catch {
      // ignore
    } finally {
      setPingLoading(false);
    }
  };

  const handleSearchKnowledge = async (q: string) => {
    setKnowledgeQuery(q);
    setArticlesLoading(true);
    try {
      const res = await portalApi.searchKnowledge(q);
      setArticles(res);
    } finally {
      setArticlesLoading(false);
    }
  };

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || !description.trim() || !reporterName.trim() || !reporterEmail.trim()) {
      setErrorMessage("Please provide your Name, Institutional Email, Issue Title, and a Description.");
      return;
    }

    setSubmitting(true);
    try {
      let finalDescription = description.trim();
      if (attachDiagnostics && clientTelemetry && diagnosticsData) {
        finalDescription += `\n\n[Client Telemetry Attached]\nOS: ${clientTelemetry.os} | Browser: ${clientTelemetry.browser} | Resolution: ${clientTelemetry.screen} | Gateway Latency: ${diagnosticsData.db_latency_ms}ms`;
      }

      const payload = {
        title: title.trim(),
        description: finalDescription,
        category,
        priority,
        reporter_name: reporterName.trim(),
        reporter_email: reporterEmail.trim(),
        reporter_phone: reporterPhone.trim() || undefined,
        location_details: locationDetails.trim() || undefined,
      };

      const res = await apiFetch<PublicTicketResponse>("/tickets/public", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (typeof window !== "undefined") {
        localStorage.setItem("helpdesk_name", reporterName.trim());
        localStorage.setItem("helpdesk_email", reporterEmail.trim());
        if (reporterPhone.trim()) localStorage.setItem("helpdesk_phone", reporterPhone.trim());
        if (locationDetails.trim()) localStorage.setItem("helpdesk_loc", locationDetails.trim());
      }

      setSubmittedTicket(res);
      setTitle("");
      setDescription("");
      setSuggestions([]);
    } catch (err: unknown) {
      setErrorMessage((err as Error)?.message || "Failed to submit helpdesk ticket. Please retry.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoanError(null);

    if (!reporterName.trim() || !reporterEmail.trim() || !loanStudentId.trim() || !loanPurpose.trim()) {
      setLoanError("Please provide your Name, Email, Student/Staff ID, and Loan Purpose.");
      return;
    }

    setLoanSubmitting(true);
    try {
      const payload = {
        requester_name: reporterName.trim(),
        requester_email: reporterEmail.trim(),
        requester_id: loanStudentId.trim(),
        requester_phone: reporterPhone.trim() || undefined,
        department: loanDepartment.trim() || undefined,
        purpose: loanPurpose.trim(),
        equipment_category: selectedLoanCategory,
        expected_return_date: loanReturnDate,
      };

      const res = await portalApi.submitLoanRequest(payload);
      setSubmittedLoan(res);
      setLoanPurpose("");
    } catch (err: unknown) {
      setLoanError((err as Error)?.message || "Failed to submit loan request.");
    } finally {
      setLoanSubmitting(false);
    }
  };

  const handleUniversalTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = searchCode.trim().toUpperCase();
    if (!code) return;

    setTrackingLoading(true);
    setTrackError(null);
    setTrackedTicket(null);
    setTrackedLoan(null);

    try {
      if (code.startsWith("LOAN-")) {
        const res = await portalApi.trackLoan(code);
        setTrackedLoan(res);
      } else {
        const res = await apiFetch<PublicTicketResponse>(`/tickets/track/${encodeURIComponent(code)}`);
        setTrackedTicket(res);
      }
    } catch (err: unknown) {
      setTrackError((err as Error)?.message || `No active request found with tracking code '${code}'.`);
    } finally {
      setTrackingLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !trackedTicket) return;

    setCommentSubmitting(true);
    try {
      await apiFetch(`/tickets/track/${encodeURIComponent(trackedTicket.tracking_code)}/comments`, {
        method: "POST",
        body: JSON.stringify({
          content: newComment.trim(),
          reporter_name: trackedTicket.reporter_name || reporterName || "Requester",
        }),
      });
      setNewComment("");
      const refreshed = await apiFetch<PublicTicketResponse>(`/tickets/track/${encodeURIComponent(trackedTicket.tracking_code)}`);
      setTrackedTicket(refreshed);
    } catch (err: unknown) {
      alert((err as Error)?.message || "Failed to post comment.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-background border border-border/70 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground";

  return (
    <div className="min-h-screen bg-linear-to-b from-background via-background/95 to-secondary/30 flex flex-col font-sans">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-primary to-primary/80 flex items-center justify-center text-primary-foreground shadow-md shadow-primary/20">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Student & Staff Self-Service Portal</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                  Live
                </span>
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium">BikitaIT Unified Academic & Campus IT Operations</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border/70 bg-card hover:bg-muted text-xs font-bold text-foreground transition-all shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Staff Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Sub Navigation Tabs ── */}
      <div className="border-b border-border/40 bg-card/40 backdrop-blur-md sticky top-16 z-30">
        <div className="max-w-6xl mx-auto px-4 flex items-center gap-2 overflow-x-auto py-2.5">
          {[
            { id: "report", label: "Report an Issue", icon: Send },
            { id: "loans", label: "Equipment Loan Desk", icon: Laptop },
            { id: "diagnostics", label: "Campus Diagnostics", icon: Activity },
            { id: "knowledge", label: "Knowledge Base & FAQ", icon: BookOpen },
            { id: "track", label: "Track Request", icon: Search },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content Container ── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6">

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: REPORT AN ISSUE */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg font-black text-foreground">Submit a Campus IT Helpdesk Ticket</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fast resolution for lab computers, projectors, network drops, or classroom Wi-Fi outages.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitTicket} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Issue Summary / Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Lab 3 Projector won't display HDMI signal"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Category *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={cn(
                            "p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer",
                            category === cat.id
                              ? "border-primary bg-primary/10 text-primary shadow-xs"
                              : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="text-base">{cat.icon}</span>
                          <span>{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Urgency / Priority *
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {PRIORITIES.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPriority(p.id)}
                          className={cn(
                            "p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center",
                            priority === p.id
                              ? "border-primary bg-primary/10 text-primary shadow-xs"
                              : "border-border/60 bg-background/60 text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <div>{p.label}</div>
                          <div className="text-[9px] text-muted-foreground font-normal mt-0.5">{p.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Detailed Description *
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe what happened, error messages, and what steps you tried..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={cn(inputCls, "resize-none")}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tendai Chikwanha"
                        value={reporterName}
                        onChange={(e) => setReporterName(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Institutional Email Address *
                      </label>
                      <input
                        type="email"
                        placeholder="e.g. tchikwanha@institution.ac.zw"
                        value={reporterEmail}
                        onChange={(e) => setReporterEmail(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Phone / WhatsApp (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +263 77 123 4567"
                        value={reporterPhone}
                        onChange={(e) => setReporterPhone(e.target.value)}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                        Campus Location / Room *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Engineering Block B, Room 204"
                        value={locationDetails}
                        onChange={(e) => setLocationDetails(e.target.value)}
                        className={inputCls}
                        required
                      />
                    </div>
                  </div>

                  {/* Telemetry Attachment Toggle */}
                  <div className="p-3.5 rounded-2xl bg-secondary/40 border border-border/50 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <Cpu className="w-4 h-4 text-primary" />
                      <div>
                        <p className="font-bold text-foreground">Attach Device & Network Diagnostics</p>
                        <p className="text-[11px] text-muted-foreground">Sends browser, OS, and latency telemetry to speed up triage.</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={attachDiagnostics}
                      onChange={(e) => setAttachDiagnostics(e.target.checked)}
                      className="rounded h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Submit Ticket & Generate Tracking Code</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Submitted Confirmation Modal / Alert */}
              {submittedTicket && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300">Ticket Logged Successfully!</h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Our technicians have received your request. Save your tracking code below to check updates anytime.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/70 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tracking Code</span>
                      <p className="font-mono text-base font-black text-primary">{submittedTicket.tracking_code}</p>
                    </div>
                    <button
                      onClick={() => copyCode(submittedTicket.tracking_code)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setSearchCode(submittedTicket.tracking_code);
                        setActiveTab("track");
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-all cursor-pointer"
                    >
                      <span>Track Status Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Predictive Knowledge Suggester Sidebar */}
            <div className="space-y-5">
              <div className="bg-card/70 border border-border/60 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Instant Self-Fix Suggestions</h3>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Our system matches your issue in real-time with verified campus troubleshooting guides.
                </p>

                {suggestions.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-secondary/30 border border-dashed border-border/70 text-center text-xs text-muted-foreground space-y-2">
                    <BookOpen className="w-6 h-6 mx-auto opacity-50 text-muted-foreground" />
                    <p className="text-[11px]">Type your issue title above to see instant quick-fix guides.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suggestions.map((sug) => (
                      <div key={sug.id} className="p-3.5 rounded-2xl bg-secondary/50 border border-border/60 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-foreground leading-snug">{sug.title}</h4>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                            {Math.round(sug.match_score * 100)}% Match
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">{sug.summary}</p>
                        <div className="flex items-center justify-between pt-1 border-t border-border/30">
                          <button
                            onClick={() => {
                              alert("Great! Thank you for using self-service resolution. No ticket was needed.");
                              setTitle("");
                              setDescription("");
                              setSuggestions([]);
                            }}
                            className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            ✓ This Solved My Issue!
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Campus Support Notice */}
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <span>IT Helpdesk SLA Standards</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Critical lab/network disruptions are triaged within <strong>2 hours</strong>. Routine software and hardware issues are resolved within <strong>24 hours</strong>.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: EQUIPMENT LOAN DESK */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "loans" && (
          <div className="space-y-6">
            <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-foreground">Hardware Loan & Equipment Checkout Desk</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Reserve temporary laptops, classroom projectors, and lab equipment for courses, research, or presentations (up to 14 days).
                </p>
              </div>

              {/* Available Equipment Category Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {availableCategories.map((cat) => {
                  const isSelected = selectedLoanCategory === cat.category;
                  return (
                    <button
                      key={cat.category}
                      type="button"
                      onClick={() => setSelectedLoanCategory(cat.category)}
                      className={cn(
                        "p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2",
                        isSelected
                          ? "border-primary bg-primary/10 shadow-sm"
                          : "border-border/60 bg-background/60 hover:bg-muted/40"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="p-2 rounded-xl bg-primary/10 text-primary">
                          {cat.icon === "Laptop" && <Laptop className="w-4 h-4" />}
                          {cat.icon === "Projector" && <Projector className="w-4 h-4" />}
                          {cat.icon === "Network" && <Network className="w-4 h-4" />}
                          {cat.icon === "Cable" && <Cable className="w-4 h-4" />}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                          {cat.available_count} Available
                        </span>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{cat.category}</h4>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{cat.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Reservation Booking Form */}
              <form onSubmit={handleSubmitLoan} className="space-y-4 pt-4 border-t border-border/40">
                {loanError && (
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{loanError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Student / Staff ID *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. R214982A or STF-402"
                      value={loanStudentId}
                      onChange={(e) => setLoanStudentId(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Tariro Mapfumo"
                      value={reporterName}
                      onChange={(e) => setReporterName(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Institutional Email *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. tmapfumo@institution.ac.zw"
                      value={reporterEmail}
                      onChange={(e) => setReporterEmail(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Academic Department / Course Code
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Computer Science (CSC301)"
                      value={loanDepartment}
                      onChange={(e) => setLoanDepartment(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      Expected Return Date (Max 14 Days) *
                    </label>
                    <input
                      type="date"
                      value={loanReturnDate}
                      onChange={(e) => setLoanReturnDate(e.target.value)}
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Purpose / Coursework Justification *
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Specify project, final exam presentation, or research experiment requirements..."
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    className={cn(inputCls, "resize-none")}
                    required
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loanSubmitting}
                    className="w-full py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loanSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Laptop className="w-4 h-4" />}
                    <span>Submit Checkout Request & Generate Loan Voucher</span>
                  </button>
                </div>
              </form>

              {/* Submitted Loan Voucher */}
              {submittedLoan && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-emerald-800 dark:text-emerald-300">Loan Reservation Request Approved & Queued!</h3>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        Please present your student/staff ID and this reservation code to the IT Support Desk at Main Library Ground Floor.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-card border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Loan Tracking Reference</span>
                      <p className="font-mono text-lg font-black text-primary">{submittedLoan.tracking_code}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Category: <strong>{submittedLoan.equipment_category}</strong> · Return by: <strong>{new Date(submittedLoan.expected_return_date).toLocaleDateString()}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyCode(submittedLoan.tracking_code)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold hover:bg-muted transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? "Copied" : "Copy Code"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setSearchCode(submittedLoan.tracking_code);
                          setActiveTab("track");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition-all cursor-pointer"
                      >
                        <span>Track Loan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: CAMPUS HEALTH SCANNER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "diagnostics" && (
          <div className="space-y-6">
            <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-foreground">Interactive Campus Network Health Scanner</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Real-time ping probes, DNS verification, and client platform telemetry diagnostics.
                  </p>
                </div>
                <button
                  onClick={handlePingRefresh}
                  disabled={pingLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className={cn("w-3.5 h-3.5", pingLoading && "animate-spin")} />
                  <span>Run Live Diagnostic Probe</span>
                </button>
              </div>

              {/* Key Telemetry Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gateway Latency</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-primary font-mono">{diagnosticsData?.db_latency_ms || 1.8} ms</span>
                    <span className="text-[10px] font-bold text-emerald-600">Optimal</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Direct connection to Harare DC Edge Router</p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Cluster State</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-emerald-600">{diagnosticsData?.server_status || "ONLINE"}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-muted-foreground">{diagnosticsData?.cluster_region || "Harare DC-1"}</p>
                </div>

                <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Client Link Speed</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground font-mono">1.0 Gbps</span>
                    <span className="text-[10px] font-bold text-emerald-600">Full Duplex</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">{clientTelemetry?.connectionType || "High-Speed"}</p>
                </div>
              </div>

              {/* Active Campus Services Live Status */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Campus Infrastructure Endpoints</h3>
                <div className="divide-y divide-border/30 rounded-2xl border border-border/50 bg-secondary/20 overflow-hidden">
                  {diagnosticsData?.active_services?.map((srv) => (
                    <div key={srv.name} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-bold text-foreground">{srv.name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground font-mono text-[11px]">
                        <span>{srv.latency}</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                          {srv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Client Platform Diagnostics Telemetry Card */}
              {clientTelemetry && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black text-foreground uppercase tracking-wider">Client Hardware & Runtime Telemetry</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-secondary/40 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Client Platform</span>
                      <span className="font-bold text-foreground">{clientTelemetry.os}</span>
                    </div>
                    <div className="p-3 bg-secondary/40 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Browser Engine</span>
                      <span className="font-bold text-foreground">{clientTelemetry.browser}</span>
                    </div>
                    <div className="p-3 bg-secondary/40 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Display Resolution</span>
                      <span className="font-bold text-foreground font-mono">{clientTelemetry.screen}</span>
                    </div>
                    <div className="p-3 bg-secondary/40 rounded-xl border border-border/50">
                      <span className="text-muted-foreground block text-[10px] font-bold uppercase">Hardware Concurrency</span>
                      <span className="font-bold text-foreground">{clientTelemetry.cores}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: KNOWLEDGE BASE & FAQ */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "knowledge" && (
          <div className="space-y-6">
            <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-foreground">Campus IT Knowledge Base & FAQ Directory</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Verified step-by-step guides for Eduroam Wi-Fi, lab print quotas, VPN access, and account MFA.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search articles (e.g. Wi-Fi certificate, printer driver, password reset)..."
                  value={knowledgeQuery}
                  onChange={(e) => handleSearchKnowledge(e.target.value)}
                  className={cn(inputCls, "pl-10 py-3")}
                />
              </div>

              {/* Articles Directory */}
              {articlesLoading ? (
                <div className="py-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Searching knowledge base...
                </div>
              ) : articles.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  No articles found matching &quot;{knowledgeQuery}&quot;.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {articles.map((art) => (
                    <div key={art.id} className="p-5 rounded-2xl bg-secondary/30 border border-border/60 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold uppercase">Guide</span>
                          <span className="text-[11px] text-muted-foreground">{art.author_name}</span>
                        </div>
                        <h4 className="text-sm font-black text-foreground">{art.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{art.content}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                        <div className="flex flex-wrap gap-1">
                          {art.tags?.map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium">
                              #{t}
                            </span>
                          ))}
                        </div>
                        <button
                          onClick={() => alert(`Full Guide:\n\n${art.title}\n\n${art.content}`)}
                          className="font-bold text-primary hover:underline"
                        >
                          Read Guide →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* TAB 5: UNIVERSAL REQUEST TRACKER */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {activeTab === "track" && (
          <div className="space-y-6">
            <div className="bg-card border border-border/60 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-foreground">Track Your Ticket or Equipment Loan</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Enter your ticket tracking code (e.g. <code className="font-mono text-primary font-bold">TCK-84920</code>) or equipment loan reference (e.g. <code className="font-mono text-primary font-bold">LOAN-40291</code>).
                </p>
              </div>

              {/* Universal Search Bar */}
              <form onSubmit={handleUniversalTrack} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Enter TCK-XXXXX or LOAN-XXXXX tracking code..."
                    value={searchCode}
                    onChange={(e) => setSearchCode(e.target.value)}
                    className={cn(inputCls, "pl-10 py-3 uppercase font-mono font-bold")}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={trackingLoading}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black text-xs hover:opacity-90 transition-all shadow-md shadow-primary/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span>Search</span>
                </button>
              </form>

              {trackError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{trackError}</span>
                </div>
              )}

              {/* Tracked Ticket View */}
              {trackedTicket && (
                <div className="p-6 rounded-3xl bg-secondary/30 border border-border/60 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-primary">{trackedTicket.tracking_code}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                          {trackedTicket.status}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                          {trackedTicket.priority} Priority
                        </span>
                      </div>
                      <h3 className="text-base font-black text-foreground mt-1">{trackedTicket.title}</h3>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Submitted on {new Date(trackedTicket.created_at).toLocaleDateString()}</p>
                      {trackedTicket.assigned_to_name && (
                        <p className="text-foreground font-bold mt-0.5">Assigned to: {trackedTicket.assigned_to_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-muted-foreground font-bold uppercase tracking-wider text-[10px]">Description</p>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed bg-background/60 p-4 rounded-2xl border border-border/40">
                      {trackedTicket.description}
                    </p>
                  </div>

                  {/* Comment Timeline */}
                  <div className="space-y-3 pt-3">
                    <h4 className="text-xs font-black text-foreground uppercase tracking-wider">Technician & Follow-up Notes</h4>
                    {trackedTicket.comments?.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">No follow-up notes posted yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {trackedTicket.comments?.map((c) => (
                          <div key={c.id} className="p-3.5 rounded-2xl bg-card border border-border/50 space-y-1 text-xs">
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
                        placeholder="Add additional details or reply to technicians..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className={cn(inputCls, "flex-1")}
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
              )}

              {/* Tracked Equipment Loan View */}
              {trackedLoan && (
                <div className="p-6 rounded-3xl bg-secondary/30 border border-border/60 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-black text-primary">{trackedLoan.tracking_code}</span>
                        <span className={cn(
                          "text-xs px-2.5 py-0.5 rounded-full font-bold uppercase",
                          trackedLoan.status === "APPROVED" || trackedLoan.status === "CHECKED_OUT"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                            : "bg-primary/10 text-primary border border-primary/20"
                        )}>
                          {trackedLoan.status.replace("_", " ")}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-foreground mt-1">
                        {trackedLoan.equipment_category} Loan Reservation
                      </h3>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Requester ID: <strong className="text-foreground">{trackedLoan.requester_id}</strong></p>
                      <p>Return Due: <strong className="text-foreground">{new Date(trackedLoan.expected_return_date).toLocaleDateString()}</strong></p>
                    </div>
                  </div>

                  {/* Loan Progress Stepper */}
                  <div className="grid grid-cols-4 gap-2 text-center text-xs py-2">
                    {[
                      { step: "Submitted", done: true },
                      { step: "Approved", done: trackedLoan.status !== "PENDING_APPROVAL" && trackedLoan.status !== "REJECTED" && trackedLoan.status !== "CANCELLED" },
                      { step: "Checked Out", done: trackedLoan.status === "CHECKED_OUT" || trackedLoan.status === "RETURNED" },
                      { step: "Returned", done: trackedLoan.status === "RETURNED" },
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

                  <div className="p-4 rounded-2xl bg-card border border-border/50 text-xs space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Purpose:</span>
                      <span className="font-bold text-foreground">{trackedLoan.purpose}</span>
                    </div>
                    {trackedLoan.specific_asset_name && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assigned Asset:</span>
                        <span className="font-bold text-foreground">{trackedLoan.specific_asset_name} ({trackedLoan.specific_asset_tag})</span>
                      </div>
                    )}
                    {trackedLoan.technician_notes && (
                      <div className="flex justify-between border-t border-border/30 pt-1.5 mt-1.5">
                        <span className="text-muted-foreground">Pickup Instructions:</span>
                        <span className="font-bold text-emerald-600">{trackedLoan.technician_notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 bg-card/20 py-6 text-center text-xs text-muted-foreground">
        <p>BikitaIT Infrastructure & Academic Operations · Emergency IT Hotline: +263 242 700000 · helpdesk@bikita.ac.zw</p>
      </footer>
    </div>
  );
}
