/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useState, useEffect, _Suspense } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Book, FileText, Search, Plus, Network, Settings, Info, Tag, Trash2, Edit3, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Document = {
  id: string;
  title: string;
  content: string;
  category: "SOP" | "MANUAL" | "NETWORK_DOC" | "GENERAL";
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  created_at: string;
  updated_at: string;
  author_name?: string | null;
};

export function KnowledgeDashboard({ defaultCategory = "ALL" }: { defaultCategory?: string }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(defaultCategory);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const fetchDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await invoke<Document[]>("get_documents", {
        category: activeCategory === "ALL" ? null : activeCategory,
        relatedEntityType: null,
        relatedEntityId: null,
      });
      setDocuments(data);
    } catch (e) {
      console.warn("Tauri invoke get_documents failed, using empty list", e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocs = React.useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return documents;
    return documents.filter(d => 
      d.title.toLowerCase().includes(q) || 
      d.content.toLowerCase().includes(q)
    );
  }, [documents, search]);

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'SOP': return <Settings className="w-5 h-5 text-blue-500" />;
      case 'MANUAL': return <Book className="w-5 h-5 text-amber-500" />;
      case 'NETWORK_DOC': return <Network className="w-5 h-5 text-emerald-500" />;
      default: return <FileText className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search knowledge base..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button 
          onClick={() => { setSelectedDoc(null); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors shadow-premium whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          New Document
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {["ALL", "SOP", "MANUAL", "NETWORK_DOC", "GENERAL"].map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${activeCategory === cat ? 'bg-foreground text-background shadow-md' : 'bg-white text-muted-foreground hover:bg-slate-50 border border-border/50'}`}
          >
            {cat === 'ALL' ? 'All Documents' : cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white/50 border border-dashed border-border/60 rounded-3xl">
          <Info className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">No documents found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <motion.div 
              key={doc.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { setSelectedDoc(doc); setIsModalOpen(true); }}
              className="bg-white p-5 rounded-2xl border border-border/40 shadow-sm hover:shadow-premium transition-all cursor-pointer group flex flex-col h-48"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-border/40 group-hover:bg-white transition-colors">
                  {getCategoryIcon(doc.category)}
                </div>
                <span className="text-[10px] font-bold text-muted-foreground bg-slate-100 px-2 py-1 rounded-md uppercase tracking-wider">
                  {doc.category.replace('_', ' ')}
                </span>
              </div>
              
              <h3 className="font-bold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">{doc.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{doc.content}</p>
              
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/30">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                  <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-black uppercase">
                    {doc.author_name ? doc.author_name.charAt(0) : 'S'}
                  </div>
                  {doc.author_name || 'System'}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground/60">
                  {new Date(doc.updated_at).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <DocumentEditorModal 
            doc={selectedDoc} 
            onClose={() => setIsModalOpen(false)} 
            onSaved={() => {
              setIsModalOpen(false);
              fetchDocuments();
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function DocumentEditorModal({ doc, onClose, onSaved }: { doc: Document | null, onClose: () => void, onSaved: () => void }) {
  const [title, setTitle] = useState(doc?.title || "");
  const [content, setContent] = useState(doc?.content || "");
  const [category, setCategory] = useState(doc?.category || "SOP");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      if (doc) {
        await invoke("update_document", { docId: doc.id, title, content, category });
      } else {
        await invoke("create_document", { 
          title, content, category, 
          relatedEntityType: null, relatedEntityId: null, authorId: null 
        });
      }
      onSaved();
    } catch (e) {
      console.error(e);
      alert("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!doc || !confirm("Delete this document forever?")) return;
    try {
      setSaving(true);
      await invoke("delete_document", { docId: doc.id });
      onSaved();
    } catch(e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-border/50"
      >
        <div className="flex items-center justify-between p-6 border-b border-border/50 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-border/40 flex items-center justify-center">
              {doc ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {doc ? "Edit Document" : "Create Document"}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                Knowledge Base Entry
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc && (
              <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-2 text-muted-foreground hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Server Rack Setup Protocol"
                  className="w-full px-4 py-3 bg-slate-50 border border-border/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-foreground"
                />
              </div>
              <div className="flex-1 flex flex-col h-full min-h-[400px]">
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Content (Markdown)</label>
                <textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)}
                  placeholder="Write your document content here..."
                  className="flex-1 w-full p-4 bg-slate-50 border border-border/50 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-mono text-sm text-foreground resize-none"
                />
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="p-5 bg-slate-50 rounded-2xl border border-border/50">
                <h3 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-primary" />
                  Classification
                </h3>
                
                <div className="space-y-3">
                  {["SOP", "MANUAL", "NETWORK_DOC", "GENERAL"].map(c => (
                    <label key={c} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${category === c ? 'bg-white border-primary shadow-sm' : 'border-transparent hover:bg-white hover:border-border/50'}`}>
                      <input 
                        type="radio" 
                        name="category" 
                        value={c} 
                        checked={category === c}
                        onChange={() => setCategory(c as unknown)}
                        className="hidden"
                      />
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${category === c ? 'border-primary' : 'border-slate-300'}`}>
                        {category === c && <div className="w-2 h-2 rounded-full bg-primary" />}
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {c.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Pro Tip</h3>
                <p className="text-xs text-blue-900/70 font-medium leading-relaxed">
                  Use Markdown to format your document. You can add headers, lists, code blocks, and bold text easily.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border/50 bg-slate-50/50 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-slate-200/50 transition-all"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={!title || !content || saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white shadow-premium hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : "Save Document"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
