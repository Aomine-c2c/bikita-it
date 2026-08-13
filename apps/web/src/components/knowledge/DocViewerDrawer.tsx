"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Book, FileText, Calendar, User, Tag, Edit3, Download,
  Clock, CheckCircle2, Shield, Layers, FileCode
} from "lucide-react";
import { type KnowledgeDocument } from "@/lib/api";
import { DocEditorModal } from "./DocEditorModal";
import { generateTablePdf } from "@/lib/pdf";

interface DocViewerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  doc: KnowledgeDocument | null;
  onSuccess?: () => void;
}

export function DocViewerDrawer({
  isOpen,
  onClose,
  doc,
  onSuccess,
}: DocViewerDrawerProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!isOpen || !doc) return null;

  const handleExportPdf = () => {
    generateTablePdf(
      doc.title,
      [
        { header: "Field", dataKey: "field" },
        { header: "Value", dataKey: "value" },
      ],
      [
        { field: "Document ID", value: doc.id },
        { field: "Category", value: doc.category },
        { field: "Author", value: doc.authorName || "IT Administrator" },
        { field: "Last Updated", value: doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "Recent" },
        { field: "Content Summary", value: doc.content.slice(0, 300) },
      ],
      `knowledge_doc_${doc.id}`
    );
  };

  return (
    <>
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
              className="fixed top-0 right-0 h-screen w-[580px] max-w-[95vw] bg-card z-50 flex flex-col border-l border-border/60 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 border-b border-border/40 bg-card/60 backdrop-blur-md">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-sm">
                      <Book className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                        {doc.category || "GENERAL"}
                      </span>
                      <h2 className="text-lg font-black text-foreground tracking-tight mt-1">{doc.title}</h2>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-2 rounded-xl text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Drawer Quick Actions Header */}
                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted/60 transition-all cursor-pointer shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-primary" />
                    <span>Edit Article</span>
                  </button>

                  <button
                    onClick={handleExportPdf}
                    className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Document Metadata Bar */}
                <section className="bg-muted/30 border border-border/40 rounded-2xl p-4 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <User className="w-3 h-3 text-primary" /> Author
                    </p>
                    <p className="font-bold text-foreground mt-0.5">{doc.authorName || "IT Support Team"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" /> Revision Date
                    </p>
                    <p className="font-bold text-foreground mt-0.5">
                      {doc.updatedAt ? new Date(doc.updatedAt).toLocaleDateString() : "2026-02-01"}
                    </p>
                  </div>
                </section>

                {/* Formatted Markdown Content */}
                <section className="bg-card border border-border/50 rounded-2xl p-5 space-y-3 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-primary" /> Article Content & Guidelines
                  </h4>

                  <div className="text-xs text-foreground leading-relaxed whitespace-pre-wrap font-sans">
                    {doc.content || "No document body available."}
                  </div>
                </section>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {isEditOpen && (
        <DocEditorModal
          doc={doc}
          onClose={() => setIsEditOpen(false)}
          onSaved={() => {
            setIsEditOpen(false);
            if (onSuccess) onSuccess();
          }}
        />
      )}
    </>
  );
}
