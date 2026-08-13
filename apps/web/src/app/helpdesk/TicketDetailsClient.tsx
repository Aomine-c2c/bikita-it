"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Ticket } from '@/modules/helpdesk/HelpDeskModule';
import Link from 'next/link';
import { ArrowLeft, User, Laptop, MapPin, MessageSquare, Clock, AlertCircle, CheckCircle2, Calendar, EyeOff } from 'lucide-react';

interface Props {
  overrideId?: string;
  onBack?: () => void;
}

export default function TicketDetailsClient({ overrideId, onBack }: Props = {}) {
  const router = useRouter();
  const id = overrideId ?? '';
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);


  const fetchTicket = async () => {
    try {
      const result = await apiFetch<Ticket>(`/tickets/${id}`);
      setTicket(result);
    } catch (e) {
      console.error(e);
      if (onBack) onBack(); else router.push('/helpdesk');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchTicket();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
      case 'Open': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'In Progress': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'Resolved':
      case 'Closed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      default: return null;
    }
  };

  if (loading) {
    return <div className="p-8 animate-pulse text-slate-500">Loading ticket details...</div>;
  }

  if (!ticket) return null;

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      <Link
        href="/helpdesk"
        onClick={onBack ? (e) => { e.preventDefault(); onBack(); } : undefined}
        className="inline-flex items-center text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Tickets
      </Link>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{ticket.id}</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority} Priority
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {getStatusIcon(ticket.status)}
                  {ticket.status}
                </span>
              </div>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{ticket.title}</h1>
            </div>
            <div className="flex gap-2">
              <button  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium text-sm">
                Update Status
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-700">
          
          <div className="lg:col-span-2 p-6">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Description</h3>
            <p className="text-slate-900 dark:text-white whitespace-pre-wrap">{ticket.description}</p>

            <div className="mt-8">
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" /> Activity &amp; Comments
              </h3>
              {(!ticket.comments || ticket.comments.length === 0) ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-8 text-center text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700">
                  No comments yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {ticket.comments.map(c => (
                    <div key={c.id} className={`p-4 rounded-lg border ${c.isInternal ? 'bg-amber-50/50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/50' : 'bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900 dark:text-white">{c.authorName}</span>
                          {c.isInternal && <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded"><EyeOff className="w-3 h-3" /> Internal Note</span>}
                        </div>
                        <span className="text-xs text-slate-500">{new Date(c.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">{c.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Details</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Requester</div>
                    <div className="text-sm text-slate-500">{ticket.requesterId || 'Unknown'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-indigo-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Assignee</div>
                    <div className="text-sm text-slate-500">{ticket.assigneeName || ticket.assigneeId || 'Unassigned'}</div>
                  </div>
                </div>
                {ticket.dueDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-red-400 mt-0.5" />
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">SLA Deadline</div>
                      <div className="text-sm font-semibold text-red-600">{new Date(ticket.dueDate).toLocaleString()}</div>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Laptop className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Asset</div>
                    <div className="text-sm text-slate-500">
                      {ticket.assetId ? (
                        <span className="text-indigo-600 dark:text-indigo-400">
                          Asset #{ticket.assetId}
                        </span>
                      ) : 'None'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Location</div>
                    <div className="text-sm text-slate-500">
                      {ticket.locationId || 'None'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700">
              <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1">
                <span>Created: {new Date(ticket.createdAt).toLocaleString()}</span>
                <span>Updated: {new Date(ticket.updatedAt).toLocaleString()}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
