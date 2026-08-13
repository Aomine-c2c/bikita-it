 
 

"use client";

/**
 * Shared document editor modal used by Knowledge Base, Documentation, SOPs and Manuals.
 * Accepts category pre-selection so each module can lock its own category.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Edit3, Trash2, Tag, BookOpen, FileText, Network, Settings, HelpCircle, AlertCircle, CheckCircle2, Save, Eye, Code2,  } from "lucide-react";
import { knowledgeApi, type KnowledgeDocument, type DocumentCategory } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES: { value: DocumentCategory; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: "SOP",         label: "Standard Operating Procedure", icon: Settings,   color: "text-blue-600",   bg: "bg-blue-50"   },
  { value: "MANUAL",      label: "Manual / Guide",               icon: BookOpen,   color: "text-amber-600",  bg: "bg-amber-50"  },
  { value: "NETWORK_DOC", label: "Network Documentation",        icon: Network,    color: "text-emerald-600",bg: "bg-emerald-50"},
  { value: "GENERAL",     label: "General Knowledge",            icon: FileText,   color: "text-slate-600",  bg: "bg-slate-100" },
];

const STATUS_OPTIONS = [
  { value: "DRAFT",    label: "Draft",    color: "text-slate-600",  bg: "bg-slate-100"  },
  { value: "REVIEW",   label: "In Review",color: "text-amber-600",  bg: "bg-amber-50"   },
  { value: "APPROVED", label: "Approved", color: "text-emerald-600",bg: "bg-emerald-50" },
  { value: "ARCHIVED", label: "Archived", color: "text-red-600",    bg: "bg-red-50"     },
] as const;

interface Props {
  doc: KnowledgeDocument | null;
  defaultCategory?: DocumentCategory;
  lockCategory?: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function DocEditorModal({ doc, defaultCategory = "GENERAL", lockCategory = false, onClose, onSaved }: Props) {
  const [title,    setTitle]    = useState(doc?.title   ?? "");
  const [content,  setContent]  = useState(doc?.content ?? "");
  const [category, setCategory] = useState<DocumentCategory>(doc?.category ?? defaultCategory);
  const [status,   setStatus]   = useState<string>(doc?.status ?? "APPROVED");
  const [version,  setVersion]  = useState(doc?.version ?? "1.0");
  const [tagInput, setTagInput] = useState("");
  const [tags,     setTags]     = useState<string[]>(doc?.tags ?? []);
  const [preview,  setPreview]  = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const cat = CATEGORIES.find(c => c.value === category)!;

  function addTag() {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) { setError("Title and content are required."); return; }
    setSaving(true); setError(null);
    try {
      if (doc) {
        await knowledgeApi.update(doc.id, { title, content, category, status: status as any, version });
      } else {
        await knowledgeApi.create({ title, content, category, tags, status, version });
      }
      onSaved();
    } catch (_e) {
      setError("Failed to save document. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!doc || !confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    setSaving(true);
    try { await knowledgeApi.remove(doc.id); onSaved(); }
    catch { setError("Failed to delete document."); setSaving(false); }
  }

  /** Very simple markdown-to-HTML renderer for preview */
  function renderMarkdown(md: string): string {
    return md
      .replace(/^### (.+)$/gm, '<h3 class="text-sm font-black mt-4 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm,  '<h2 class="text-base font-black mt-5 mb-2">$1</h2>')
      .replace(/^# (.+)$/gm,   '<h1 class="text-lg font-black mt-6 mb-2">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,   '<em>$1</em>')
      .replace(/`(.+?)`/g,     '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
      .replace(/^- (.+)$/gm,   '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm,'<li class="ml-4 list-decimal">$1</li>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/^(?!<[hlcp])/gm, '')
      .trim();
  }

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
        className="relative w-full max-w-5xl max-h-[92vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border/50"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border border-border/30", cat.bg)}>
              <cat.icon className={cn("w-4.5 h-4.5", cat.color)} />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">{doc ? "Edit Document" : "New Document"}</h2>
              <p className="text-[11px] font-medium text-muted-foreground">{cat.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreview(p => !p)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all",
                preview ? "bg-primary text-primary-foreground border-primary" : "bg-white border-border/60 text-muted-foreground hover:text-foreground")}
            >
              {preview ? <Code2 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {preview ? "Edit" : "Preview"}
            </button>
            {doc && (
              <button onClick={handleDelete} disabled={saving}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-red-500 hover:bg-red-50 border border-border/40 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-slate-100 border border-border/40 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 h-full">
            {/* Main editor */}
            <div className="lg:col-span-2 p-6 space-y-5 border-r border-border/30">
              {/* Title */}
              <div>
                <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Server Rack Installation Protocol"
                  className="w-full px-4 py-3 bg-slate-50 border border-border/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-semibold text-foreground transition-all"
                />
              </div>

              {/* Content */}
              <div className="flex-1">
                <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">
                  Content {preview ? "(Preview)" : "(Markdown)"}  *
                </label>
                {preview ? (
                  <div
                    className="min-h-[380px] p-5 bg-white border border-border/50 rounded-xl text-sm text-foreground leading-relaxed prose prose-sm max-w-none overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: `<p class="mb-2">${renderMarkdown(content)}</p>` }}
                  />
                ) : (
                  <textarea
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    placeholder={"# Title\n\nWrite your document content here...\n\n## Section\n\n- Step 1\n- Step 2"}
                    className="w-full min-h-[380px] p-4 bg-slate-50 border border-border/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono text-sm text-foreground resize-y transition-all"
                  />
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Tags</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-full border border-slate-200">
                      {tag}
                      <button onClick={() => setTags(t => t.filter(x => x !== tag))} className="text-slate-400 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                    placeholder="Add tag…"
                    className="flex-1 px-3 py-2 bg-slate-50 border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
                  />
                  <button onClick={addTag}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-border/40 transition-all">
                    <Tag className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar options */}
            <div className="p-6 space-y-6 bg-slate-50/40">
              {/* Category */}
              {!lockCategory && (
                <div>
                  <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-3">Category</label>
                  <div className="space-y-2">
                    {CATEGORIES.map(c => (
                      <button key={c.value} onClick={() => setCategory(c.value)}
                        className={cn("w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all",
                          category === c.value
                            ? "bg-white border-primary/30 shadow-sm"
                            : "border-transparent hover:bg-white hover:border-border/50"
                        )}>
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg)}>
                          <c.icon className={cn("w-4 h-4", c.color)} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-foreground leading-tight">{c.label}</p>
                        </div>
                        {category === c.value && (
                          <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-3">Status</label>
                <div className="space-y-2">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} onClick={() => setStatus(s.value)}
                      className={cn("w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all",
                        status === s.value
                          ? "bg-white border-primary/30 shadow-sm"
                          : "border-transparent hover:bg-white hover:border-border/50"
                      )}>
                      <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", s.bg, s.color)}>{s.label}</span>
                      {status === s.value && <CheckCircle2 className="w-3.5 h-3.5 text-primary ml-auto shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Version */}
              <div>
                <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-wider mb-1.5">Version</label>
                <input
                  type="text"
                  value={version}
                  onChange={e => setVersion(e.target.value)}
                  placeholder="1.0"
                  className="w-full px-3 py-2 bg-white border border-border/50 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Tip */}
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-[11px] font-black text-blue-800 uppercase tracking-wider mb-1">Markdown Supported</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Use <code className="bg-blue-100 px-1 rounded">#</code> for headings, <code className="bg-blue-100 px-1 rounded">**bold**</code>, <code className="bg-blue-100 px-1 rounded">- lists</code>, and <code className="bg-blue-100 px-1 rounded">`code`</code>.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-border/40 bg-slate-50/60 flex items-center justify-between">
          {error ? (
            <div className="flex items-center gap-2 text-red-600 text-xs font-semibold">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          ) : <div />}
          <div className="flex items-center gap-3">
            <button onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-slate-200/60 transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={!title || !content || saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 disabled:opacity-40 transition-all">
              {saving ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : <Save className="w-4 h-4" />}
              {saving ? "Saving…" : "Save Document"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
