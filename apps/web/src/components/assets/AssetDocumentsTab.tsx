 
 

"use client";

import React, { useState, useEffect } from "react";
import { type Asset } from "@/lib/api";
import { FileText, Image as ImageIcon, Book } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { format } from "date-fns";

type Document = {
  id: string;
  title: string;
  content: string;
  category: string;
  updated_at: string;
};

export function AssetDocumentsTab({ asset }: { asset: any }) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const photos: string[] = (asset as any).photos || [];

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const docs = await invoke<Document[]>("get_documents", {
          category: null,
          relatedEntityType: "ASSET",
          relatedEntityId: asset.id,
        });
        setDocuments(docs);
      } catch (e) {
        console.error(e);
      }
    };
    fetchDocs();
  }, [asset.id]);

  return (
    <div className="p-8 space-y-12">
      <div>
        <div className="mb-6 flex justify-between items-end">
          <div>
            <h3 className="text-lg font-bold text-foreground">Knowledge Base & Manuals</h3>
            <p className="text-sm text-muted-foreground">Standard Operating Procedures and User Manuals attached to this asset.</p>
          </div>
        </div>
        
        {documents.length === 0 ? (
          <div className="p-8 text-center bg-white border border-border/60 rounded-2xl flex flex-col items-center">
            <Book className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">No documents attached from the Knowledge Base.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white border border-border/60 rounded-2xl hover:border-primary/50 hover:shadow-sm transition-all group cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Book className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{doc.category.replace('_', ' ')} • {new Date(doc.updated_at).toISOString().split('T')[0]}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="mb-6">
          <h3 className="text-lg font-bold text-foreground">Photos</h3>
          <p className="text-sm text-muted-foreground">Images of this asset.</p>
        </div>
        
        {photos.length === 0 ? (
          <div className="p-8 text-center bg-white border border-border/60 rounded-2xl flex flex-col items-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-sm text-muted-foreground">No photos uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <div key={i} className="aspect-square rounded-2xl border border-border/60 overflow-hidden bg-slate-50 flex items-center justify-center">
                <img src={photo} alt={`Asset photo ${i+1}`} className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        )}
      </div>
      
    </div>
  );
}
