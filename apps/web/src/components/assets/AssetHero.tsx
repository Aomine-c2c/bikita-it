"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, User, Building, MapPin, Calendar, Edit2, Repeat, Archive, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { assetApi, type Asset } from "@/lib/api";

interface AssetHeroProps {
  assetId: string;
}

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  IN_STOCK: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  UNDER_REPAIR: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ASSIGNED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  RETIRED: "bg-slate-100 text-slate-600 border-slate-200",
};

export function AssetHero({ assetId }: AssetHeroProps) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsset = async () => {
      try {
        const data = await assetApi.getOne(assetId);
        setAsset(data);
      } catch (e) {
        console.error('Failed to fetch asset:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAsset();
  }, [assetId]);

  if (loading) {
    return (
      <div className="bg-white border-b border-border/60 pb-6 pt-2">
        <div className="px-8 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading asset...</span>
        </div>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="bg-white border-b border-border/60 pb-6 pt-2">
        <div className="px-8">
          <p className="text-sm text-muted-foreground">Asset not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-b border-border/60 pb-6 pt-2">
      {/* Breadcrumbs & Actions */}
      <div className="flex items-center justify-between mb-6 px-8">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/assets" className="hover:text-foreground transition-colors">Assets</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground">{asset.id}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors border border-transparent hover:border-border/60 shadow-sm">
            <Edit2 className="w-3.5 h-3.5" /> Edit Asset
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-foreground hover:bg-slate-100 transition-colors border border-transparent hover:border-border/60 shadow-sm">
            <Repeat className="w-3.5 h-3.5" /> Reassign
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors border border-transparent hover:border-destructive/20 shadow-sm">
            <Archive className="w-3.5 h-3.5" /> Retire
          </button>
        </div>
      </div>

      {/* Hero Identity */}
      <div className="px-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              {asset.name}
            </motion.h1>
            <motion.span 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
              {asset.status}
            </motion.span>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{asset.id} • Serial: C02ZK0XXMD6R</p>
        </div>

        {/* Metadata Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center gap-x-8 gap-y-4 bg-slate-50 p-4 rounded-xl border border-border/40"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
              {asset.avatar}
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">Assigned To</p>
              <p className="text-sm font-semibold text-foreground">{asset.assignedUser}</p>
            </div>
          </div>
          
          <div className="w-px h-8 bg-border hidden sm:block" />

          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1"><Building className="w-3 h-3"/> Department</p>
            <p className="text-sm font-semibold text-foreground">{asset.department}</p>
          </div>

          <div className="w-px h-8 bg-border hidden sm:block" />

          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</p>
            <p className="text-sm font-semibold text-foreground">{asset.location}</p>
          </div>

          <div className="w-px h-8 bg-border hidden sm:block" />

          <div>
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5 flex items-center gap-1"><ShieldCheck className="w-3 h-3"/> Warranty</p>
            <p className="text-sm font-semibold text-emerald-600">{asset.warranty}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
