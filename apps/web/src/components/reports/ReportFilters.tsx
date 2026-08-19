"use client";

import React, { useState } from "react";
import { Filter, Calendar, Layers, Building2, Download, Printer, RefreshCw, FileSpreadsheet, FileText } from "lucide-react";

export interface ReportFilterState {
  dateRange: string;
  department: string;
  category: string;
  reportType: string;
}

interface ReportFiltersProps {
  filters?: ReportFilterState;
  onFilterChange?: (filters: ReportFilterState) => void;
  onExportExcel?: () => void;
  onExportCSV?: () => void;
  onExportPDF?: () => void;
  onPrint?: () => void;
  isExporting?: boolean;
}

export function ReportFilters({
  filters = {
    dateRange: "30",
    department: "all",
    category: "all",
    reportType: "executive",
  },
  onFilterChange,
  onExportExcel,
  onExportCSV,
  onExportPDF,
  onPrint,
  isExporting = false,
}: ReportFiltersProps) {
  const [localFilters, setLocalFilters] = useState<ReportFilterState>(filters);

  const update = (key: keyof ReportFilterState, value: string) => {
    const next = { ...localFilters, [key]: value };
    setLocalFilters(next);
    onFilterChange?.(next);
  };

  const selectCls =
    "px-3 py-1.5 bg-background border border-border/60 rounded-xl text-xs font-semibold outline-none focus:border-primary transition-colors shadow-sm cursor-pointer";

  return (
    <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground mr-1">
            <Filter className="w-3.5 h-3.5 text-primary" />
            <span>Filters:</span>
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={localFilters.dateRange}
              onChange={(e) => update("dateRange", e.target.value)}
              className={selectCls}
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="YTD">Year to Date (YTD)</option>
              <option value="ALL">All Time</option>
            </select>
          </div>

          {/* Department */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={localFilters.department}
              onChange={(e) => update("department", e.target.value)}
              className={selectCls}
            >
              <option value="all">All Departments</option>
              <option value="engineering">Engineering & Mining</option>
              <option value="operations">Site Operations</option>
              <option value="finance">Finance & Procurement</option>
              <option value="it">IT & Infrastructure</option>
              <option value="hr">Human Resources</option>
            </select>
          </div>

          {/* Asset Category */}
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={localFilters.category}
              onChange={(e) => update("category", e.target.value)}
              className={selectCls}
            >
              <option value="all">All Categories</option>
              <option value="laptops">Laptops & Workstations</option>
              <option value="servers">Servers & Data Center</option>
              <option value="network">Network Switches & APs</option>
              <option value="cameras">CCTV Surveillance</option>
              <option value="consumables">Printer Consumables</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto flex-wrap">
          {onExportExcel && (
            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-emerald-600 hover:border-emerald-500/40 transition-all cursor-pointer shadow-sm"
              title="Export formatted Excel spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Excel Export</span>
            </button>
          )}

          {onPrint && (
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm"
              title="Print official institutional copies"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Sheet</span>
            </button>
          )}

          {onExportCSV && (
            <button
              onClick={onExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border/60 text-xs font-bold text-foreground hover:bg-muted transition-all cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Export CSV</span>
            </button>
          )}

          {onExportPDF && (
            <button
              onClick={onExportPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:bg-primary/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
            >
              {isExporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              <span>{isExporting ? "Generating PDF…" : "Export PDF"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
