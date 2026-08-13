"use client";

import React, { useState, useEffect } from "react";
import { Book, FileText, Search, Plus, Network, Settings, Info, Tag, Trash2, Edit3, X, ChevronRight, Clock, User } from "lucide-react";
import { motion } from "framer-motion";
import { DocViewerDrawer } from "./DocViewerDrawer";
import { DocEditorModal } from "./DocEditorModal";
import { type KnowledgeDocument } from "@/lib/api";

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
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [editDoc, setEditDoc] = useState<Document | null>(null);

  const fetchDocuments = React.useCallback(async () => {
    try {
      setLoading(true);
      await import("@/lib/api").then((m) => m.waitForBackend(5000)).catch(() => {});
      const { knowledgeApi } = await import("@/lib/api");
      const data = (await knowledgeApi.getAll()) as Document[];
      const filtered = activeCategory === "ALL" ? data : data.filter((d) => d.category === activeCategory);
      setDocuments(filtered);
    } catch (e) {
      console.warn("API fetch failed, using empty list", e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const filteredDocs = React.useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q));
  }, [documents, search]);

  const activeDoc = activeDocId ? documents.find((d) => String(d.id) === activeDocId) : null;

  const activeKnowledgeDoc: KnowledgeDocument | null = activeDoc
    ? {
        id: String(activeDoc.id),
        title: activeDoc.title,
        content: activeDoc.content,
        category: activeDoc.category as any,
        authorName: activeDoc.author_name || undefined,
        updatedAt: activeDoc.updated_at,
      }
    : null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "SOP":
        return <Settings className="w-4 h-4 text-blue-500" />;
      case "MANUAL":
        return <Book className="w-4 h-4 text-amber-500" />;
      case "NETWORK_DOC":
        return <Network className="w-4 h-4 text-emerald-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Slide-over Drawer & Editor Modal */}
      <DocViewerDrawer
        isOpen={!!activeDocId}
        onClose={() => setActiveDocId(null)}
        doc={activeKnowledgeDoc}
        onSuccess={fetchDocuments}
      />

      {isEditorOpen && (
        <DocEditorModal
          doc={editDoc as any}
          onClose={() => setIsEditorOpen(false)}
          onSaved={() => {
            setIsEditorOpen(false);
            fetchDocuments();
          }}
        />
      )}

      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search runbooks, SOPs, network docs..."
            className="w-full pl-10 pr-4 py-2 bg-card border border-border/60 rounded-xl text-xs outline-none focus:border-primary shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            setEditDoc(null);
            setIsEditorOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Document / SOP</span>
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["ALL", "SOP", "MANUAL", "NETWORK_DOC", "GENERAL"].map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card/40 border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 3D Document Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full text-center py-12 border border-dashed border-border/60 rounded-3xl bg-card/20">
            <p className="text-xs text-muted-foreground">No knowledge base articles found.</p>
          </div>
        ) : (
          filteredDocs.map((d) => (
            <motion.div
              key={d.id}
              onClick={() => setActiveDocId(String(d.id))}
              whileHover={{ y: -3 }}
              className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-5 shadow-sm hover:border-primary/40 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="p-2 rounded-xl bg-muted/40 border border-border/40">{getCategoryIcon(d.category)}</div>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {d.category}
                  </span>
                </div>

                <h3 className="text-sm font-black text-foreground group-hover:text-primary transition-colors line-clamp-1">{d.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{d.content}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1 font-medium">
                  <User className="w-3 h-3 text-primary" /> {d.author_name || "Admin"}
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
