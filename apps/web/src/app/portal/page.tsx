"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { LifeBuoy, Send, CheckCircle2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function PortalPage() {
  const [category, setCategory] = useState("Hardware");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  
  // Employee Context Fields
  const [requesterName, setRequesterName] = useState("");
  const [requesterId, setRequesterId] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Load saved context on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRequesterName(localStorage.getItem("portal_name") || "");
      setRequesterId(localStorage.getItem("portal_id") || "");
      setDepartment(localStorage.getItem("portal_department") || "");
      setLocation(localStorage.getItem("portal_location") || "");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !requesterName.trim() || !requesterId.trim()) return;
    
    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        status: "New",
        priority,
        category,
        requesterId,
        requesterName,
        department,
        location,
      };
      
      await apiFetch('/tickets', { method: 'POST', body: JSON.stringify(payload) });
      
      // Save context to local storage
      localStorage.setItem("portal_name", requesterName);
      localStorage.setItem("portal_id", requesterId);
      localStorage.setItem("portal_department", department);
      localStorage.setItem("portal_location", location);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setTitle("");
        setDescription("");
      }, 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans">
      <header className="bg-white dark:bg-slate-800 border-b border-border/40 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <LifeBuoy className="w-4 h-4" />
          </div>
          <h1 className="font-bold text-lg">Employee IT Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-border/40 shadow-sm relative overflow-hidden">
          {success ? (
            <div className="absolute inset-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Ticket Submitted!</h3>
              <p className="text-slate-500">IT has been notified and will be in touch shortly.</p>
            </div>
          ) : null}

          <div className="mb-8">
            <h2 className="text-xl font-bold mb-2">Report an Issue</h2>
            <p className="text-sm text-slate-500">Provide details about the issue you are facing so we can resolve it quickly.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Employee Context Section */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border border-border/60 rounded-xl space-y-6">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Your Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Full Name *</label>
                  <input 
                    type="text" required
                    value={requesterName} onChange={e => setRequesterName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Employee ID *</label>
                  <input 
                    type="text" required
                    value={requesterId} onChange={e => setRequesterId(e.target.value)}
                    placeholder="EMP-1234"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Department</label>
                  <input 
                    type="text"
                    value={department} onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Finance"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Location / Desk</label>
                  <input 
                    type="text"
                    value={location} onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Floor 2, Desk A4"
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Issue Section */}
            <div className="space-y-6">
              <h3 className="font-semibold text-sm text-slate-500 uppercase tracking-wider">Issue Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Category</label>
                  <select 
                    value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option>Hardware</option>
                    <option>Software</option>
                    <option>Network</option>
                    <option>Access & Login</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Urgency</label>
                  <select 
                    value={priority} onChange={e => setPriority(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Low">Low - Not blocking my work</option>
                    <option value="Medium">Medium - Annoying, but I can work around it</option>
                    <option value="High">High - Blocking a significant part of my job</option>
                    <option value="Critical">Critical - Completely unable to work</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Brief Summary *</label>
                <input 
                  type="text" required
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. My laptop screen is flickering"
                  className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Detailed Description *</label>
                <textarea 
                  required rows={5}
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Please describe exactly what happened, what you were doing, and any error messages."
                  className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                type="submit" disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 dark:shadow-none active:scale-[0.98] disabled:opacity-50"
              >
                {submitting ? "Submitting..." : <><Send className="w-4 h-4" /> Submit Ticket</>}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
