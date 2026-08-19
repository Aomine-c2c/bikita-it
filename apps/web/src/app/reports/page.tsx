"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import dynamic from "next/dynamic";
import { DollarSign, TrendingUp, ShieldCheck, Layers, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiFetch, assetApi } from "@/lib/api";
import { exportAssetsPDF, exportAssetsCSV } from "@/lib/reportExport";
import { exportAssetsExcel, printAssetsSheet } from "@/lib/excelExport";
import { ReportFilters, ReportFilterState } from "@/components/reports/ReportFilters";

const ReportCharts = dynamic(
  () => import("@/components/reports/ReportCharts").then((m) => m.ReportCharts),
  {
    ssr: false,
    loading: () => (
      <div className="h-75 flex items-center justify-center border border-border/50 rounded-3xl bg-card/40 backdrop-blur-xl">
        <span className="text-xs font-bold text-muted-foreground animate-pulse">Loading analytics engine…</span>
      </div>
    ),
  }
);

interface ReportKpis {
  totalAssetValue: number;
  monthlyMaintenance: number;
  slaResolutionRate: number;
  inventoryItems: number;
}

const fmt$ = (n: number) =>
  n === 0 ? "$0.00" : `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [exporting, setExporting] = useState(false);
  const [kpis, setKpis] = useState<ReportKpis | null>(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [filterState, setFilterState] = useState<ReportFilterState>({
    dateRange: "30",
    department: "all",
    category: "all",
    reportType: "executive",
  });

  const fetchKpis = async () => {
    setKpisLoading(true);
    try {
      const data = await apiFetch<ReportKpis>("/reports/kpis");
      setKpis(data);
    } catch {
      setKpis(null);
    } finally {
      setKpisLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      setKpisLoading(true);
      try {
        const data = await apiFetch<ReportKpis>("/reports/kpis");
        if (!ignore) setKpis(data);
      } catch {
        if (!ignore) setKpis(null);
      } finally {
        if (!ignore) setKpisLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const handleExportExcel = async () => {
    try {
      const assets = await assetApi.getAll();
      exportAssetsExcel(assets);
    } catch (err) {
      console.error("Excel export failed", err);
    }
  };

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const assets = await assetApi.getAll();
      exportAssetsPDF(assets);
    } catch (err) {
      console.error("PDF export failed", err);
    } finally {
      setExporting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const assets = await assetApi.getAll();
      exportAssetsCSV(assets);
    } catch (err) {
      console.error("CSV export failed", err);
    }
  };

  const handlePrint = async () => {
    try {
      const assets = await assetApi.getAll();
      printAssetsSheet(assets);
    } catch {
      window.print();
    }
  };

  const kpiCards = [
    {
      label: "Total Fleet Asset Value",
      value: kpisLoading ? "…" : fmt$(kpis?.totalAssetValue ?? 0),
      icon: DollarSign,
      color: "text-foreground",
      bg: "bg-primary/10",
    },
    {
      label: "Monthly Maintenance Expense",
      value: kpisLoading ? "…" : fmt$(kpis?.monthlyMaintenance ?? 0),
      icon: TrendingUp,
      color: "text-foreground",
      bg: "bg-primary/10",
    },
    {
      label: "SLA Resolution Rate",
      value: kpisLoading ? "…" : `${kpis?.slaResolutionRate ?? 100}%`,
      icon: ShieldCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Inventory SKUs Tracked",
      value: kpisLoading ? "…" : (kpis?.inventoryItems ?? 0).toLocaleString(),
      icon: Layers,
      color: "text-foreground",
      bg: "bg-primary/10",
    },
  ];

  const tabs = [
    { id: "overview",   label: "Executive Overview" },
    { id: "financials", label: "Asset Financials & TCO" },
    { id: "sla",        label: "Helpdesk SLA Performance" },
    { id: "inventory",  label: "Inventory & Stock Turnover" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-12 relative min-h-[calc(100vh-4rem)] max-w-375 mx-auto">
        {/* Title Area */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Executive Analytics & Reports</h1>
            <p className="text-xs font-medium text-muted-foreground mt-1">
              Business Intelligence, Financial Depreciation Curves, SLA Metrics & Printable Reports
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchKpis}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-card border border-border/60 text-xs font-bold text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", kpisLoading && "animate-spin")} />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Live KPI Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                <div>
                  <p className={cn("text-2xl font-black tracking-tight", kpisLoading ? "animate-pulse text-muted-foreground" : "text-foreground")}>
                    {kpi.value}
                  </p>
                  <p className="text-xs font-bold text-muted-foreground mt-0.5">{kpi.label}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${kpi.bg} border border-border/40 flex items-center justify-center ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <ReportFilters
          filters={filterState}
          onFilterChange={setFilterState}
          onExportExcel={handleExportExcel}
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onPrint={handlePrint}
          isExporting={exporting}
        />

        {/* Tab Nav */}
        <div className="flex items-center border-b border-border/40 bg-muted/20 px-4 pt-2 gap-2 rounded-2xl border overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0",
                activeTab === t.id
                  ? "border-primary text-primary bg-card"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Dynamic Charts Section */}
        <section className="mt-6">
          <ReportCharts activeTab={activeTab} />
        </section>
      </div>
    </DashboardLayout>
  );
}
