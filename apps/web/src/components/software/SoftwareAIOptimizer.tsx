"use client";

import React from "react";
import { Sparkles, TrendingDown, Users, AlertCircle, ArrowRight } from "lucide-react";

export function SoftwareAIOptimizer() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-indigo-500/30 bg-indigo-50/50 p-6 shadow-sm">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10" />
      
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-500/20">
          <Sparkles className="w-4 h-4 text-indigo-600" />
        </div>
        <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wider">AI Cost Optimization</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Recommendation 1 */}
        <div className="bg-white/60 backdrop-blur-sm border border-indigo-500/10 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-emerald-500" />
              <p className="text-xs font-bold text-foreground">Unused Licenses</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You have <span className="font-semibold text-foreground">45 unassigned Adobe CC</span> licenses. Revoking these will save <span className="text-emerald-500 font-semibold">$3,600/mo</span>.
            </p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-4 flex items-center gap-1 hover:gap-2 transition-all">
            Review Unassigned <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Recommendation 2 */}
        <div className="bg-white/60 backdrop-blur-sm border border-indigo-500/10 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-amber-500" />
              <p className="text-xs font-bold text-foreground">Duplicate Assignments</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">12 users</span> are assigned both <span className="font-semibold text-foreground">Microsoft 365 E3</span> and <span className="font-semibold text-foreground">E5</span>.
            </p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-4 flex items-center gap-1 hover:gap-2 transition-all">
            Resolve Duplicates <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Recommendation 3 */}
        <div className="bg-white/60 backdrop-blur-sm border border-indigo-500/10 rounded-xl p-4 flex flex-col justify-between hover:border-indigo-500/30 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-xs font-bold text-foreground">Critical Renewals</p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">GitHub Enterprise</span> expires in 5 days. Ensure payment method is up to date to prevent outage.
            </p>
          </div>
          <button className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mt-4 flex items-center gap-1 hover:gap-2 transition-all">
            Manage Renewal <ArrowRight className="w-3 h-3" />
          </button>
        </div>

      </div>
    </div>
  );
}
