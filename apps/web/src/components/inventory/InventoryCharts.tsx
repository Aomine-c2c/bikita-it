/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { TrendingUp, PieChart, DollarSign, AlertCircle } from "lucide-react";

export function InventoryCharts() {
  const movementData: any[] = [];
  const consumptionData: any[] = [];
  const valueData: any[] = [];
  const unavailable = true;

  if (unavailable) {
    return (
      <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm flex items-center justify-center h-[350px]">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">Charts Unavailable</p>
          <p className="text-xs">Inventory metrics cannot be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Chart 1: Stock Movement */}
      <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col h-[350px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-500" /> Stock Movement
          </h3>
          <select className="text-xs bg-slate-50 border border-border/60 rounded-lg px-2 py-1 outline-none">
            <option>Last 6 Months</option>
            <option>This Year</option>
          </select>
        </div>
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={movementData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7', backgroundColor: '#ffffff', color: '#09090b', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="received" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="consumed" stroke="#ef4444" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Consumption */}
      <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col h-[350px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-500" /> Consumption by Dept
          </h3>
        </div>
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={consumptionData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7', backgroundColor: '#ffffff', color: '#09090b', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Inventory Value */}
      <div className="bg-white border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col h-[350px]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Inventory Value
          </h3>
        </div>
        <div className="flex-1 w-full h-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={valueData} margin={{ top: 5, right: 0, bottom: 5, left: 10 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val/1000}k`} dx={-10} />
              <Tooltip 
                contentStyle={{ borderRadius: '10px', border: '1px solid #e4e4e7', backgroundColor: '#ffffff', color: '#09090b', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                formatter={(val: unknown) => [`$${Number(val).toLocaleString()}`, "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
