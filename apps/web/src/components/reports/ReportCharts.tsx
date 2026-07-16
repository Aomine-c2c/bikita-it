"use client";

import React from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts";

// --- Mock Data ---

const departmentSpend = [
  { name: "Engineering", value: 450000 },
  { name: "Sales", value: 320000 },
  { name: "Marketing", value: 150000 },
  { name: "HR", value: 80000 },
  { name: "Operations", value: 240000 },
];
const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#F43F5E", "#8B5CF6"];

const assetAge = [
  { age: "< 1 Yr", count: 420 },
  { age: "1-2 Yrs", count: 850 },
  { age: "2-3 Yrs", count: 640 },
  { age: "3-4 Yrs", count: 320 },
  { age: "4+ Yrs", count: 110 },
];

const ticketTrend = [
  { month: "Jan", tickets: 450, cost: 2100 },
  { month: "Feb", tickets: 420, cost: 1800 },
  { month: "Mar", tickets: 580, cost: 3200 },
  { month: "Apr", tickets: 490, cost: 2500 },
  { month: "May", tickets: 610, cost: 4100 },
  { month: "Jun", tickets: 550, cost: 3800 },
];

const stockConsumption = [
  { month: "Jan", cables: 45, peripherals: 20 },
  { month: "Feb", cables: 52, peripherals: 24 },
  { month: "Mar", cables: 38, peripherals: 18 },
  { month: "Apr", cables: 65, peripherals: 32 },
  { month: "May", cables: 48, peripherals: 22 },
  { month: "Jun", cables: 55, peripherals: 28 },
];

// --- Custom Tooltip ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white text-foreground text-xs p-3 rounded-lg shadow-xl border border-border/60">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span className="font-mono font-bold">
              {entry.name.toLowerCase().includes('cost') || entry.name.toLowerCase().includes('spend') || entry.name.toLowerCase().includes('value') 
                ? `$${entry.value.toLocaleString()}` 
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Components ---

export function ReportCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Chart 1: Department Spending (Pie) */}
      <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Department IT Spend</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={departmentSpend}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
              >
                {departmentSpend.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Asset Age Distribution (Bar) */}
      <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-foreground mb-4">Hardware Age Distribution</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={assetAge} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="age" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Devices" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Ticket Volume & Repair Costs (Line) */}
      <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-bold text-foreground mb-4">Ticket Volume vs Repair Costs (6 Months)</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ticketTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}/>
              <Line yAxisId="left" type="monotone" dataKey="tickets" name="Tickets Opened" stroke="#64748b" strokeWidth={3} dot={{ r: 4, fill: '#64748b' }} activeDot={{ r: 6 }} />
              <Line yAxisId="right" type="monotone" dataKey="cost" name="Repair Cost" stroke="#F43F5E" strokeWidth={3} dot={{ r: 4, fill: '#F43F5E' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 4: Stock Consumption (Area) */}
      <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm lg:col-span-2">
        <h3 className="text-sm font-bold text-foreground mb-4">Inventory Burn Rate</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stockConsumption} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCables" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPeripherals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}/>
              <Area type="monotone" dataKey="cables" name="Cables & Adapters" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorCables)" />
              <Area type="monotone" dataKey="peripherals" name="Peripherals (Mice/Keyboards)" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorPeripherals)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 5: SLA Compliance (Bar) */}
      <div className="bg-white border border-border/60 rounded-xl p-5 shadow-sm lg:col-span-2 xl:col-span-1">
        <h3 className="text-sm font-bold text-foreground mb-4">SLA Compliance by Priority</h3>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { priority: "Low", met: 98, breached: 2 },
              { priority: "Medium", met: 95, breached: 5 },
              { priority: "High", met: 88, breached: 12 },
              { priority: "Critical", met: 99, breached: 1 },
            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
              <XAxis dataKey="priority" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingBottom: '20px' }}/>
              <Bar dataKey="met" name="SLA Met" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} barSize={40} />
              <Bar dataKey="breached" name="SLA Breached" stackId="a" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
