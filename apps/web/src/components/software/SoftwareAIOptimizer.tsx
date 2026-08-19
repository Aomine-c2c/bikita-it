"use client";

import React, { useState } from "react";
import { Sparkles, TrendingDown, Users, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

interface SoftwareAIOptimizerProps {
  onSelectFilter?: (filter: string) => void;
}

export function SoftwareAIOptimizer({ onSelectFilter }: SoftwareAIOptimizerProps) {
  const [reclaiming, setReclaiming] = useState<string | null>(null);
  const [reclaimedSuccess, setReclaimedSuccess] = useState<string | null>(null);

  const handleQuickReclaim = (key: string) => {
    setReclaiming(key);
    setTimeout(() => {
      setReclaiming(null);
      setReclaimedSuccess(key);
      setTimeout(() => setReclaimedSuccess(null), 3000);
    }, 1200);
  };

  return (
    <div data-tour="software-optimizer" className="relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 backdrop-blur-xl p-6 shadow-sm font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-foreground uppercase tracking-wider">
              AI SaaS Cost & Seat Reclamation Engine
            </h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Automated anomaly detection across subscription seats, dormant users & duplicated SKU tiers
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 self-start sm:self-auto">
          Est. Monthly Savings: $4,850/mo
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Recommendation 1 */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <TrendingDown className="w-4 h-4 text-emerald-500" />
                <span>Dormant & Unused Seats</span>
              </div>
              <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400">
                -$3,600/mo
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Detected <span className="font-bold text-foreground">45 unassigned Adobe Creative Cloud</span> licenses inactive for &gt;60 days.
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between">
            <button
              onClick={() => onSelectFilter?.("unassigned")}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Filter List
            </button>
            <button
              onClick={() => handleQuickReclaim("adobe")}
              disabled={reclaiming === "adobe"}
              className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {reclaimedSuccess === "adobe" ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Reclaimed!</span>
                </>
              ) : reclaiming === "adobe" ? (
                <span>Reclaiming...</span>
              ) : (
                <>
                  <span>Auto-Reclaim</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recommendation 2 */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Dual SKU Over-Licensing</span>
              </div>
              <span className="text-[10px] font-mono font-black text-amber-600 dark:text-amber-400">
                -$780/mo
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">12 team members</span> possess overlapping <span className="font-bold text-foreground">Microsoft 365 E3 + E5</span> redundant suites.
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between">
            <button
              onClick={() => onSelectFilter?.("duplicates")}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Filter Duplicates
            </button>
            <button
              onClick={() => handleQuickReclaim("m365")}
              disabled={reclaiming === "m365"}
              className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {reclaimedSuccess === "m365" ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Downgraded!</span>
                </>
              ) : reclaiming === "m365" ? (
                <span>Rebalancing...</span>
              ) : (
                <>
                  <span>Downgrade Tier</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recommendation 3 */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col justify-between hover:border-primary/40 transition-colors shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span>Expiring Term Contracts</span>
              </div>
              <span className="text-[10px] font-mono font-black text-foreground">
                30 Days Left
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              <span className="font-bold text-foreground">JetBrains All-Products Pack</span> auto-renews in 24 days. Switch to annual co-term billing to save 15%.
            </p>
          </div>

          <div className="pt-3 mt-3 border-t border-border/30 flex items-center justify-between">
            <button
              onClick={() => onSelectFilter?.("expiring")}
              className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              View Contract
            </button>
            <button
              onClick={() => handleQuickReclaim("jetbrains")}
              disabled={reclaiming === "jetbrains"}
              className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:bg-primary/90 transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
            >
              {reclaimedSuccess === "jetbrains" ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Queued!</span>
                </>
              ) : (
                <span>Lock Co-Term</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
