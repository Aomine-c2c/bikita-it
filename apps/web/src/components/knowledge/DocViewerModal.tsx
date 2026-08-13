"use client";

/**
 * Read-only viewer for a KnowledgeDocument. Renders markdown and shows metadata.
 */
import React from "react";
import { motion } from "framer-motion";
import { X, Edit3, Calendar, Tag, BookOpen, Settings, Network, FileText, Clock } from "lucide-react";
import { type KnowledgeDocument } from "@/lib/api";
import { cn } from "@/lib/utils";

interface Props {
  doc: KnowledgeDocument;
  onClose: () => void;
  onEdit: () => void;
}

const CAT_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  SOP:         { label: "Standard Operating Procedure", icon: Settings, color: "text-blue-600",   bg: "bg-blue-50"   },
  MANUAL:      { label: "Manual / Guide",               icon: BookOpen, color: "text-amber-600",  bg: "bg-amber-50"  },
  NETWORK_DOC: { label: "Network Documentation",        icon: Network,  color: "text-emerald-600",bg: "bg-emerald-50"},
  GENERAL:     { label: "General Knowledge",            icon: FileText, color: "text-slate-600",  bg: "bg-slate-100" },
};

const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  DRAFT:    "bg-slate-100 text-slate-600 border-slate-200",
  REVIEW:   "bg-amber-50 text-amber-700 border-amber-100",
  ARCHIVED: "bg-red-50 text-red-600 border-red-100",
};

function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black mt-5 mb-2 text-foreground">$1</h3>')
    .replace(/^## (.+)$/gm,  '<h2 class="text-base font-black mt-6 mb-2 text-foreground">$1</h2>')
    .replace(/^# (.+)$/gm,   '<h1 class="text-lg font-black mt-6 mb-3 text-foreground">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g,'<strong class="font-bold text-foreground">$1</strong>')
    .replace(/\*(.+?)\*/g,   '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g,     '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono text-foreground">$1</code>')
    .replace(/^---$/gm,      '<hr class="my-6 border-border/40">')
    .replace(/^> (.+)$/gm,   '<blockquote class="border-l-4 border-primary/30 pl-4 italic text-muted-foreground my-3">$1</blockquote>')
    .replace(/^- (.+)$/gm,   '<li class="ml-5 list-disc text-sm leading-relaxed mb-1">$1</li>')
    .replace(/^\d+\. (.+)$/gm,'<li class="ml-5 list-decimal text-sm leading-relaxed mb-1">$1</li>')
    .replace(/\n\n/g,        '<br/><br/>');
}

export function DocViewerModal({ doc, onClose, onEdit }: Props) {
  const meta = CAT_META[doc.category] ?? CAT_META.GENERAL;
  const statusCls = STATUS_COLORS[doc.status ?? "APPROVED"] ?? STATUS_COLORS.APPROVED;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border/50"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border/40 bg-slate-50/60 shrink-0">
          <div className="flex items-start gap-4 min-w-0">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/30", meta.bg)}>
              <meta.icon className={cn("w-5 h-5", meta.color)} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-black text-foreground leading-tight">{doc.title}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <span className="text-[11px] font-bold text-muted-foreground">{meta.label}</span>
                <span className="text-muted-foreground/30">·</span>
                <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-full border", statusCls)}>{doc.status ?? "APPROVED"}</span>
                {doc.version && (
                  <>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-[11px] font-mono font-bold text-muted-foreground">v{doc.version}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-border/60 text-muted-foreground hover:text-foreground hover:shadow-sm transition-all">
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-slate-100 border border-border/40 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/30">
            {/* Content */}
            <div className="lg:col-span-3 p-6 lg:p-8">
              <div
                className="text-sm text-foreground leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(doc.content || "") }}
              />
            </div>

            {/* Metadata panel */}
            <div className="p-6 space-y-5 bg-slate-50/40">
              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Author</p>
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black uppercase">
                    {doc.authorName ? doc.authorName.charAt(0) : "S"}
                  </div>
                  <span className="text-xs font-semibold text-foreground">{doc.authorName ?? "System"}</span>
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Created</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(doc.createdAt).toISOString().split('T')[0]}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Last Updated</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(doc.updatedAt).toISOString().split('T')[0]}
                </div>
              </div>

              {doc.tags && doc.tags.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {doc.tags.map((tag: string) => (
                      <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200">
                        <Tag className="w-2.5 h-2.5" /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {doc.relatedEntityType && (
                <div>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Linked To</p>
                  <span className="text-xs font-semibold text-muted-foreground capitalize">
                    {doc.relatedEntityType}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
