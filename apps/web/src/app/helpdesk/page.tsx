/* eslint-disable @typescript-eslint/ban-ts-comment */
 
 
// @ts-nocheck
"use client";

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { Ticket } from '@/modules/helpdesk/HelpDeskModule';
import { Plus, Search, AlertCircle, Clock, CheckCircle2, X } from 'lucide-react';
import TicketDetailsClient from './TicketDetailsClient';
import { NewTicketModal } from '@/components/helpdesk/NewTicketModal';

export default function HelpDeskPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  
  const fetchTickets = async () => {

    try {
      const result = await apiFetch<unknown>('/tickets');
      setTickets(result.data || result);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTickets();
  }, []);

  const filteredTickets = tickets.filter(t => {
    if (statusFilter !== 'All' && t.status !== statusFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.id.toString().toLowerCase().includes(q);
    }
    return true;
  });

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'Open': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Resolved':
      case 'Closed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse flex space-x-4">
      <div className="flex-1 space-y-6 py-1">
        <div className="h-2 bg-slate-200 rounded"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-2 bg-slate-200 rounded col-span-2"></div>
            <div className="h-2 bg-slate-200 rounded col-span-1"></div>
          </div>
          <div className="h-2 bg-slate-200 rounded"></div>
        </div>
      </div>
    </div>;
  }

  if (selectedTicketId) {
    return (
      <div>
        <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <button
            onClick={() => setSelectedTicketId(null)}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
            Back to Tickets
          </button>
        </div>
        <TicketDetailsClient overrideId={selectedTicketId} onBack={() => setSelectedTicketId(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Help Desk</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage IT support tickets and service requests.</p>
        </div>
        <button onClick={() => setIsNewTicketModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium">
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search tickets by ID or title..." 
            className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ticket</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Requester</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredTickets.map(ticket => (
                <tr key={ticket.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group cursor-pointer"
                    onClick={() => setSelectedTicketId(String(ticket.id))}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {ticket.title}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">{ticket.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{ticket.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {ticket.requesterId}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filteredTickets.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No tickets found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <NewTicketModal 
        isOpen={isNewTicketModalOpen} 
        onClose={() => setIsNewTicketModalOpen(false)} 
        onSuccess={() => { setIsNewTicketModalOpen(false); fetchTickets(); }} 
      />
    </div>
  );
}
