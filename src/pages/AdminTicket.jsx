import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ArrowLeft, MessageSquare, User, Headphones, FileText,
  CheckCircle2, Send, Loader2, Phone, MapPin, Calendar, Mail, Activity,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import api from '../lib/axios';
import { formatDate, formatRelative, capitalize } from '../lib/utils';
import { fetchTicketByUUID, fetchMessagesByTicketId, fetchTimelineByTicketId, fetchAdminNotesByTicketId } from '../lib/queries';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import { CardSkeleton } from '../components/Skeleton';

const statuses = ['open', 'resolved', 'pending', 'marked_for_review'];

function AvInitial({ name }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-sm font-semibold text-brand-700 flex-shrink-0">
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function AdminTicket() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [noteText, setNoteText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const { data: ticket, isLoading: tLoading } = useQuery({
    queryKey: ['admin-ticket', id],
    queryFn: () => fetchTicketByUUID(id),
  });

  const tid = ticket?.ticket_id || id;

  const { data: messages = [] } = useQuery({
    queryKey: ['admin-ticket-msgs', tid],
    queryFn: () => fetchMessagesByTicketId(tid),
    enabled: !!tid,
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['admin-ticket-tl', tid],
    queryFn: () => fetchTimelineByTicketId(tid),
    enabled: !!tid,
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['admin-ticket-notes', tid],
    queryFn: () => fetchAdminNotesByTicketId(tid),
    enabled: !!tid,
  });

  const updateMutation = useMutation({
    mutationFn: ({ ticketId, status, note }) => api.post('/webhook/admin-update', { ticketId, status, note }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ticket'] });
      refetchNotes();
      toast.success('Ticket updated');
      setNoteText('');
      setSelectedStatus('');
    },
    onError: () => toast.error('Update failed'),
  });

  const handleUpdate = () => {
    if (!ticket) return;
    updateMutation.mutate({
      ticketId: ticket.ticket_id || ticket.id,
      status: selectedStatus || undefined,
      note: noteText.trim() || undefined,
    });
  };

  if (tLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-sm text-gray-400">Loading ticket...</p>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-gray-400">Ticket not found</p>
          <button onClick={() => navigate('/admin')} className="text-sm text-brand-600 hover:text-brand-700 mt-2">Back to Admin</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Sticky Top Bar */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm z-30">
        <div className="max-w-full mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-md text-sm font-bold font-mono text-gray-800">
              #{ticket.ticket_id?.slice(0, 8) || ticket.id?.toString().slice(0, 8)}
            </span>
            <span className="text-xs text-gray-400">Created {formatRelative(ticket.created_at)}</span>
          </div>
          <StatusBadge status={ticket.status} size="lg" />
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex-1 flex gap-4 px-4 py-4 min-h-0 overflow-hidden">
        {/* LEFT: Details + Customer + Admin Notes */}
        <div className="w-[30%] flex-shrink-0 overflow-y-auto space-y-4">
          {/* Details + Customer merged */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
              <AvInitial name={ticket.customer_name} />
              <div>
                <p className="text-sm font-semibold text-gray-900">{ticket.customer_name || 'N/A'}</p>
                <p className="text-xs text-gray-400">{ticket.customer_email}</p>
              </div>
            </div>
            <div className="space-y-0 divide-y divide-gray-100">
              <Row label="Priority" value={<PriorityBadge priority={ticket.priority} />} />
              <Row label="Urgency" value={ticket.urgency || '-'} />
              <Row label="Type" value={ticket.request_type || '-'} />
              <Row label="Department" value={<DepartmentBadge department={ticket.department} />} />
              {ticket.summary && <Row label="Summary" value={ticket.summary} />}
              <div className="py-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Confidence</span>
                  <span className="text-xs font-semibold text-emerald-600">{ticket.confidence || 0}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full" style={{ width: `${ticket.confidence || 0}%` }} />
                </div>
              </div>
              <Row label="Phone" value={ticket.phone_number || '-'} />
              <Row label="Address" value={ticket.installation_address || '-'} />
              {ticket.preferred_installation_date && <Row label="Pref. Date" value={ticket.preferred_installation_date} />}
            </div>
          </div>

          {/* Admin Notes + Status */}
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Admin Notes
            </h3>
            <div className="space-y-2.5 mb-4 max-h-[160px] overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-xs text-gray-400">No notes yet.</p>
              ) : (
                notes.map((n) => (
                  <div key={n.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">{n.note}</p>
                    <p className="text-xs text-gray-400 mt-1.5">{formatDate(n.created_at)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Change Status</p>
                <div className="flex flex-wrap gap-1.5">
                  {statuses.map((s) => (
                    <button key={s} onClick={() => setSelectedStatus(selectedStatus === s ? '' : s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${selectedStatus === s ? 'bg-brand-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}>
                      {capitalize(s)}
                    </button>
                  ))}
                </div>
              </div>
              <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100/50 transition-all resize-none placeholder:text-gray-400" />
              <button onClick={handleUpdate} disabled={updateMutation.isPending || (!selectedStatus && !noteText.trim())}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all shadow-sm">
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {updateMutation.isPending ? 'Saving...' : 'Save Note & Update'}
              </button>
            </div>
          </div>
        </div>

        {/* CENTER: Conversation */}
        <div className="w-[35%] flex-shrink-0 flex flex-col">
          <div className="bg-white rounded-lg border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0">
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-gray-400" />
                Conversation
              </h3>
              <span className="text-xs text-gray-400">{messages.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
              ) : (
                messages.map((msg, i) => {
                  const isCustomer = msg.sender === 'customer';
                  return (
                    <motion.div key={msg.id || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 items-start ${isCustomer ? '' : 'flex-row-reverse'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCustomer ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {isCustomer ? <User className="w-3 h-3 text-brand-600" /> : <Headphones className="w-3 h-3 text-purple-600" />}
                      </div>
                      <div className={`max-w-[80%] px-3 py-2 rounded-lg ${isCustomer ? 'bg-gray-50 text-gray-900 rounded-tl-sm' : 'bg-purple-50 text-purple-900 rounded-tr-sm border border-purple-100'}`}>
                        {isCustomer ? (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        ) : (
                          <div className="text-xs leading-relaxed prose prose-xs max-w-none prose-p:leading-relaxed prose-p:my-1">
                            <Markdown>{msg.message}</Markdown>
                          </div>
                        )}
                        <p className={`text-[10px] mt-1 ${isCustomer ? 'text-gray-400' : 'text-purple-400'}`}>{formatDate(msg.created_at)}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Timeline */}
        <div className="flex-1 overflow-y-auto">
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Timeline
            </h3>
            <div className="relative">
              {(timeline.length > 0 ? timeline : [{ title: 'Customer Submitted', created_at: ticket.created_at }]).map((ev, i, arr) => {
                const isLast = i === arr.length - 1;
                return (
                  <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="flex gap-3 relative pb-5">
                    {!isLast && <div className="absolute left-[11px] top-[20px] bottom-0 w-0.5 bg-gray-200" />}
                    <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 relative z-10 mt-0.5 ${
                      isLast ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                    <div className="flex-1 min-w-0 -mt-0.5">
                      <p className={`text-sm font-semibold ${isLast ? 'text-emerald-700' : 'text-gray-700'}`}>
                        {capitalize(ev.title)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.created_at)}</p>
                      {ev.description && (
                        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed bg-gray-50 rounded-lg p-2.5 border border-gray-100">{ev.description}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs font-medium text-gray-900">{value}</span>
    </div>
  );
}
