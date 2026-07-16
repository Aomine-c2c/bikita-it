"use client";

import React from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from "recharts";
import { TrendingUp, PieChart, DollarSign } from "lucide-react";

const movementData = [
  { name: "Jan", received: 4000, consumed: 2400 },
  { name: "Feb", received: 3000, consumed: 1398 },
  { name: "Mar", received: 2000, consumed: 9800 },
  { name: "Apr", received: 2780, consumed: 3908 },
  { name: "May", received: 1890, consumed: 4800 },
  { name: "Jun", received: 2390, consumed: 3800 },
  { name: "Jul", received: 3490, consumed: 4300 },
];

const consumptionData = [
  { name: "Engineering", value: 400 },
  { name: "Design", value: 300 },
  { name: "Marketing", value: 300 },
  { name: "HR", value: 200 },
  { name: "Sales", value: 278 },
];

const valueData = [
  { name: "Jan", value: 120000 },
  { name: "Feb", value: 135000 },
  { name: "Mar", value: 125000 },
  { name: "Apr", value: 150000 },
  { name: "May", value: 145000 },
  { name: "Jun", value: 160000 },
];

export function InventoryCharts() {
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
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', fontSize: '12px' }}
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
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', fontSize: '12px' }}
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
                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: 'rgba(15, 23, 42, 0.9)', color: '#fff', fontSize: '12px' }}
                formatter={(val: any) => [`$${val.toLocaleString()}`, "Value"]}
              />
              <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
