"use client";

import React, { useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";
import { apiFetch } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { PieChart as PieIcon, TrendingUp, Clock, Box } from "lucide-react";

const CustomTooltip = React.memo(({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card text-foreground text-xs p-3 rounded-xl shadow-xl border border-border/60">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono font-bold">
              {entry.name.toLowerCase().includes("cost") ||
              entry.name.toLowerCase().includes("spend") ||
              entry.name.toLowerCase().includes("value")
                ? `$${entry.value.toLocaleString()}`
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
});
CustomTooltip.displayName = "CustomTooltip";

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

interface ReportChartsProps {
  activeTab?: string;
}

export function ReportCharts({ activeTab = "overview" }: ReportChartsProps) {
  const { data = {} } = useQuery({
    queryKey: ["reportChartsData"],
    queryFn: async () => {
      const res = await apiFetch<any>("/reports");
      return res || {};
    },
  });

  const departmentSpend = data.departmentSpend || [];
  const assetAge = data.assetAge || [];
  const ticketTrend = data.ticketTrend || [];
  const stockConsumption = data.stockConsumption || [];

  return (
    <div className="space-y-6">
      {/* Overview or Asset Financials */}
      {(activeTab === "overview" || activeTab === "financials") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Department Spending (Pie) */}
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
              Department IT Spend Allocation
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentSpend}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {departmentSpend.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Hardware Age Distribution (Bar) */}
          <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
              Hardware Fleet Age Breakdown
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={assetAge} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Devices" fill="#3B82F6" radius={[8, 8, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Helpdesk SLA Tab */}
      {(activeTab === "overview" || activeTab === "sla") && (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
            Incident Ticket Volume & Maintenance Costs Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ticketTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ticketGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="tickets" name="Tickets" stroke="#3B82F6" strokeWidth={3} fill="url(#ticketGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Inventory & Stock Tab */}
      {(activeTab === "overview" || activeTab === "inventory") && (
        <div className="bg-card/40 backdrop-blur-xl border border-border/50 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">
            Consumable Stock Consumption vs. Safety Thresholds
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stockConsumption} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="consumed" name="Consumed Qty" fill="#10B981" radius={[8, 8, 0, 0]} barSize={32} />
                <Bar dataKey="reorderLevel" name="Safety Reorder Level" fill="#F59E0B" radius={[8, 8, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
