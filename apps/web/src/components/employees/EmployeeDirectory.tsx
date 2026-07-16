"use client";

import React, { useState } from "react";
import { Laptop, Ticket, Building, Mail, Phone, MoreHorizontal, X, ShieldAlert, Monitor, HardDrive, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const mockEmployees = [
  { id: "EMP-001", name: "Sarah Jenkins", role: "Senior Software Engineer", department: "Engineering", email: "sarah.j@xiphos.com", phone: "+1 (555) 019-2831", status: "Active", avatar: "SJ", assets: 4, value: "$6,250", tickets: 2 },
  { id: "EMP-002", name: "Mike Ross", role: "Product Designer", department: "Design", email: "mike.r@xiphos.com", phone: "+1 (555) 018-9273", status: "Active", avatar: "MR", assets: 3, value: "$4,800", tickets: 0 },
  { id: "EMP-003", name: "Emily Chen", role: "DevOps Specialist", department: "Engineering", email: "emily.c@xiphos.com", phone: "+1 (555) 012-4451", status: "Active", avatar: "EC", assets: 5, value: "$8,900", tickets: 1 },
  { id: "EMP-004", name: "David Kim", role: "Marketing Director", department: "Marketing", email: "david.k@xiphos.com", phone: "+1 (555) 016-7782", status: "Active", avatar: "DK", assets: 2, value: "$2,400", tickets: 0 },
  { id: "EMP-005", name: "Alex Mercer", role: "Data Scientist", department: "Engineering", email: "alex.m@xiphos.com", phone: "+1 (555) 019-3321", status: "Onboarding", avatar: "AM", assets: 0, value: "$0", tickets: 0 },
  { id: "EMP-006", name: "Jessica Day", role: "HR Manager", department: "HR & Ops", email: "jessica.d@xiphos.com", phone: "+1 (555) 015-8899", status: "Leave", avatar: "JD", assets: 2, value: "$1,800", tickets: 3 },
  { id: "EMP-007", name: "Harvey Specter", role: "Chief Executive Officer", department: "Executive", email: "harvey.s@xiphos.com", phone: "+1 (555) 011-1000", status: "Active", avatar: "HS", assets: 6, value: "$12,500", tickets: 0 },
  { id: "EMP-008", name: "Rachel Zane", role: "Legal Counsel", department: "Executive", email: "rachel.z@xiphos.com", phone: "+1 (555) 017-4433", status: "Active", avatar: "RZ", assets: 2, value: "$3,200", tickets: 1 },
];

const mockAssignedAssets = [
  { id: "XIP-1024", name: "MacBook Pro 16\"", category: "Hardware", status: "Healthy", icon: Laptop },
  { id: "XIP-3091", name: "Dell UltraSharp 27\"", category: "Hardware", status: "Healthy", icon: Monitor },
  { id: "INV-004", name: "Makita Hammer Drill", category: "Tool (Loan)", status: "Active", icon: Key },
  { id: "INV-081", name: "Fluke Multimeter", category: "Tool (Loan)", status: "Active", icon: Key },
  { id: "NET-042", name: "Cisco IP Phone", category: "Hardware", status: "Healthy", icon: Phone },
];

const mockTicketHistory = [
  { id: "TKT-1004", title: "Cannot access VPN", date: "2 days ago", status: "Resolved", priority: "High" },
  { id: "TKT-0892", title: "Need Figma License", date: "1 month ago", status: "Resolved", priority: "Low" },
  { id: "TKT-0811", title: "Monitor flickering", date: "2 months ago", status: "Resolved", priority: "Medium" },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
    case "Onboarding": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
    case "Offboarding": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
    case "Leave": return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
  }
};

export function EmployeeDirectory() {
  const [selectedEmp, setSelectedEmp] = useState<any>(null);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {mockEmployees.map((emp) => (
          <div key={emp.id} onClick={() => setSelectedEmp(emp)} className="block group cursor-pointer">
            <div className="bg-white border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group-hover:border-primary/30">
              <div className="h-16 bg-gradient-to-r from-slate-100 to-slate-50" />
              <div className="px-5 -mt-8 flex justify-between items-end mb-3">
                <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-xl font-bold shadow-lg border-4 border-white transition-transform group-hover:scale-105">
                  {emp.avatar}
                </div>
                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getStatusColor(emp.status))}>
                  {emp.status}
                </div>
              </div>
              <div className="px-5 pb-5">
                <h3 className="text-base font-bold text-foreground mb-0.5 group-hover:text-primary transition-colors">{emp.name}</h3>
                <p className="text-xs text-muted-foreground font-medium mb-4">{emp.role}</p>
                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{emp.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{emp.phone}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <Laptop className="w-3 h-3 text-primary" /> {emp.assets}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600">
                      <Ticket className="w-3 h-3 text-amber-500" /> {emp.tickets}
                    </div>
                  </div>
                  <div className="text-[11px] font-bold text-foreground bg-slate-50 px-2 py-1 rounded border border-border/40">
                    {emp.value}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      <AnimatePresence>
        {selectedEmp && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEmp(null)}
              className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
              animate={{ x: 0, boxShadow: "-20px 0 40px rgba(0,0,0,0.1)" }}
              exit={{ x: "100%", boxShadow: "-20px 0 40px rgba(0,0,0,0)" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-xl bg-[#FAFAFA] h-full border-l border-border/60 flex flex-col z-10"
            >
              {/* Drawer Header */}
              <div className="bg-white px-6 py-8 border-b border-border/40 relative">
                <button onClick={() => setSelectedEmp(null)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
                <div className="flex gap-5 items-center">
                  <div className="w-20 h-20 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-bold shadow-lg">
                    {selectedEmp.avatar}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-foreground mb-1">{selectedEmp.name}</h2>
                    <p className="text-sm font-medium text-muted-foreground">{selectedEmp.role}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border", getStatusColor(selectedEmp.status))}>
                        {selectedEmp.status}
                      </span>
                      <span className="text-xs font-mono text-muted-foreground border border-border/60 px-2 py-0.5 rounded bg-slate-50">{selectedEmp.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                
                {/* Contact Info */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Contact Information</h3>
                  <div className="bg-white border border-border/60 rounded-xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Email</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{selectedEmp.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Phone</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{selectedEmp.phone}</span>
                    </div>
                    <div className="flex items-center justify-between p-4 border-b border-border/40 last:border-0">
                      <div className="flex items-center gap-3">
                        <Building className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-foreground">Department</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{selectedEmp.department}</span>
                    </div>
                  </div>
                </div>

                {/* Assigned Assets */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Assets & Equipment</h3>
                    <span className="text-[11px] font-bold text-primary hover:underline cursor-pointer">Assign New</span>
                  </div>
                  <div className="space-y-3">
                    {mockAssignedAssets.map((asset) => (
                      <div key={asset.id} className="bg-white border border-border/60 rounded-xl p-4 flex items-center justify-between hover:border-primary/40 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                            <asset.icon className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{asset.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono text-muted-foreground">{asset.id}</span>
                              <span className="text-[10px] text-muted-foreground/50">•</span>
                              <span className="text-[10px] font-medium text-muted-foreground">{asset.category}</span>
                            </div>
                          </div>
                        </div>
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ticket History */}
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Recent Tickets</h3>
                  <div className="bg-white border border-border/60 rounded-xl overflow-hidden">
                    {mockTicketHistory.map((tkt, idx) => (
                      <div key={tkt.id} className="p-4 border-b border-border/40 last:border-0 hover:bg-slate-50 transition-colors cursor-pointer">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-bold text-foreground">{tkt.title}</p>
                          <span className="text-[10px] font-medium text-muted-foreground">{tkt.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-muted-foreground">{tkt.id}</span>
                          <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-slate-100 text-slate-600 border border-slate-200">
                            {tkt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
