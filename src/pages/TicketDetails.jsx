import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowLeft, MessageSquare, Clock, User, Headphones, CheckCircle2, Activity, Mail, Phone, MapPin, Calendar, Tag } from 'lucide-react';
import Markdown from 'react-markdown';
import { formatDate, formatRelative, capitalize } from '../lib/utils';
import { fetchTicketByUUID, fetchMessagesByTicketId, fetchTimelineByTicketId, fetchAdminNotesByTicketId } from '../lib/queries';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import { CardSkeleton } from '../components/Skeleton';

export default function TicketDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = JSON.parse(localStorage.getItem('nova_session') || 'null');

  if (!session) {
    navigate('/', { replace: true });
    return null;
  }

  const { data: ticket, isLoading: ticketLoading } = useQuery({
    queryKey: ['ticket', id],
    queryFn: () => fetchTicketByUUID(id),
  });

  const effectiveTicketId = ticket?.ticket_id || id;

  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['ticket-messages', effectiveTicketId],
    queryFn: () => fetchMessagesByTicketId(effectiveTicketId),
    enabled: !!effectiveTicketId,
  });

  const { data: timeline = [], isLoading: timelineLoading } = useQuery({
    queryKey: ['ticket-timeline', effectiveTicketId],
    queryFn: () => fetchTimelineByTicketId(effectiveTicketId),
    enabled: !!effectiveTicketId,
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['ticket-notes', effectiveTicketId],
    queryFn: () => fetchAdminNotesByTicketId(effectiveTicketId),
    enabled: !!effectiveTicketId,
  });

  const loading = ticketLoading || messagesLoading || timelineLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto space-y-4">
          <CardSkeleton /><CardSkeleton />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Ticket not found</p>
          <button onClick={() => navigate('/tickets')} className="text-sm text-brand-600 hover:text-brand-700 mt-2">Back to Tickets</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/tickets')}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-md text-sm font-bold font-mono text-gray-800">
                  #{ticket.ticket_id?.toString().slice(0, 8) || ticket.id?.toString().slice(0, 8)}
                </span>
                <StatusBadge status={ticket.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Created {formatRelative(ticket.created_at)}</p>
            </div>
          </div>
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="grid gap-5 lg:grid-cols-3 items-start">

            {/* Left: Merged Details + Conversation */}
            <div className="lg:col-span-2 space-y-5">
              {/* Merged Details Card */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{ticket.customer_name}</p>
                      <p className="text-xs text-gray-400">{ticket.customer_email}</p>
                    </div>
                    <div className="ml-auto">
                      <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-md text-xs font-bold font-mono text-gray-800">
                        #{ticket.ticket_id?.toString().slice(0, 8) || ticket.id?.toString().slice(0, 8)}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <DepartmentBadge department={ticket.department} />
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-orange-50 text-orange-700 text-xs font-medium ring-1 ring-orange-200/50">
                      <Tag className="w-3 h-3" />{ticket.request_type || 'General'}
                    </span>
                    {ticket.urgency && (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium ring-1 ${
                        ticket.urgency === 'low' ? 'bg-slate-100 text-slate-700 ring-slate-200/50' :
                        ticket.urgency === 'medium' ? 'bg-amber-100 text-amber-700 ring-amber-200/50' :
                        'bg-orange-100 text-orange-700 ring-orange-200/50'
                      }`}>
                        {capitalize(ticket.urgency)}
                      </span>
                    )}
                    {ticket.confidence && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 text-emerald-700 text-xs font-medium ring-1 ring-emerald-200/50">
                        {ticket.confidence}% confident
                      </span>
                    )}
                  </div>
                  <div className="space-y-0 divide-y divide-gray-100">
                    {[
                      { icon: Phone, label: 'Phone', value: ticket.phone_number },
                      { icon: MapPin, label: 'Address', value: ticket.installation_address },
                      { icon: Calendar, label: 'Pref. Date', value: ticket.preferred_installation_date },
                    ].filter(({ value }) => value).map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center gap-2.5 py-2.5">
                        <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-500 font-medium">{label}</span>
                        <span className="text-xs text-gray-900 ml-auto text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversation */}
              <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                    <Headphones className="w-3.5 h-3.5 text-brand-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900">Support</h3>
                  <span className="text-xs text-gray-400 ml-auto">{messages.length} messages</span>
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto space-y-3">
                  {messages.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No messages yet.</p>
                  ) : (
                    messages.map((msg, i) => {
                      const isCust = msg.sender === 'customer';
                      return (
                        <motion.div key={msg.id || i} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                          className={`flex gap-2.5 items-start ${isCust ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCust ? 'bg-blue-100' : 'bg-purple-100'}`}>
                            {isCust ? <User className="w-3.5 h-3.5 text-brand-600" /> : <Headphones className="w-3.5 h-3.5 text-purple-600" />}
                          </div>
                          <div className={`max-w-[80%] px-3.5 py-2.5 rounded-lg ${isCust ? 'bg-gray-50 text-gray-900 rounded-tl-sm' : 'bg-purple-50 text-purple-900 rounded-tr-sm border border-purple-100'}`}>
                            {isCust ? (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                            ) : (
                              <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1">
                                <Markdown>{msg.message}</Markdown>
                              </div>
                            )}
                            <p className={`text-xs mt-1 ${isCust ? 'text-gray-400' : 'text-purple-400'}`}>{formatDate(msg.created_at)}</p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Right: Timeline */}
            <div className="space-y-5">
              {/* Timeline (reversed - latest first) */}
              <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5" />
                  Timeline
                </h3>
                <div className="relative">
                  {(timeline.length > 0 ? [...timeline].reverse() : [{ title: 'Customer Submitted', created_at: ticket.created_at }]).map((ev, i, arr) => {
                    const isFirst = i === 0;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex gap-3 relative pb-4">
                        {i < arr.length - 1 && <div className="absolute left-[11px] top-[20px] bottom-0 w-0.5 bg-gray-200" />}
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0 relative z-10 mt-0.5 ${
                          isFirst ? 'bg-emerald-600 text-white ring-2 ring-emerald-200' : 'bg-gray-100 text-gray-500'
                        }`}>
                          <CheckCircle2 className="w-2.5 h-2.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold ${isFirst ? 'text-emerald-700' : 'text-gray-700'}`}>
                            {capitalize(ev.title)}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">{formatDate(ev.created_at)}</p>
                          {ev.description && (
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed bg-gray-50 rounded-lg p-2.5 border border-gray-100">{ev.description}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
