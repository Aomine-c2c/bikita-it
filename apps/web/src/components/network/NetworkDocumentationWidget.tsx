/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Book, ChevronRight } from "lucide-react";
import Link from "next/link";

export function NetworkDocumentationWidget() {
  const [docs, setDocs] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    invoke<unknown[]>("get_documents", { category: "NETWORK_DOC", relatedEntityType: null, relatedEntityId: null })
      .then(d => setDocs(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border/60 p-5 h-full animate-pulse flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border/60 shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border/40 bg-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-foreground flex items-center gap-2 text-sm">
          <Book className="w-4 h-4 text-emerald-600" />
          Network Documentation
        </h3>
        <Link href="/knowledge" className="text-xs font-bold text-primary hover:underline">
          View All
        </Link>
      </div>
      
      <div className="p-3 flex-1 overflow-y-auto space-y-2">
        {docs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4">
            <Book className="w-8 h-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No network documents found. Add them in the Knowledge Base.</p>
          </div>
        ) : (
          docs.slice(0, 5).map(doc => (
            <div key={doc.id} className="group flex items-center justify-between p-3 rounded-lg border border-border/40 hover:border-emerald-500/30 hover:bg-emerald-50/30 transition-all cursor-pointer">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{doc.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">Last updated: {new Date(doc.updated_at).toLocaleDateString()}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-emerald-600 transition-colors shrink-0 ml-2" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
