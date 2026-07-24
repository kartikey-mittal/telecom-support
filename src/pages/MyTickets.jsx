import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Ticket, MessageSquare, Sparkles, Clock, Headphones, User, Home } from 'lucide-react';
import supabase from '../lib/supabase';
import { getSession, formatDate, formatRelative, capitalize } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import { TableSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';

const FILTERS = ['all', 'open', 'in_progress', 'resolved', 'closed'];

export default function MyTickets() {
  const navigate = useNavigate();
  const session = getSession();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const { data, isLoading } = useQuery({
    queryKey: ['my-tickets', session?.customerEmail],
    queryFn: async () => {
      if (!session?.customerEmail) return [];
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('customer_email', session.customerEmail)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!session?.customerEmail,
  });

  if (!session) {
    navigate('/', { replace: true });
    return null;
  }

  const filtered = (data || [])
    .filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        t.ticket_id?.toLowerCase().includes(q) ||
        t.id?.toString().includes(q) ||
        t.summary?.toLowerCase().includes(q) ||
        t.department?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sort === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'priority') {
        const o = { critical: 4, high: 3, medium: 2, low: 1 };
        return (o[b.priority] || 0) - (o[a.priority] || 0);
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-brand-600 mb-2 transition-colors">
                <Home className="w-4 h-4" />
                Back to Landing Page
              </button>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Tickets</h1>
              <p className="text-sm text-gray-400 mt-1">{filtered.length} ticket{filtered.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search by ID, summary, or department..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100/50 transition-all placeholder:text-gray-400" />
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 outline-none focus:border-brand-300 cursor-pointer">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Priority</option>
            </select>
          </div>

          <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
            {FILTERS.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-300 hover:text-gray-700'
                }`}>
                {s === 'all' ? 'All' : capitalize(s)}
              </button>
            ))}
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState icon={Ticket} title="No tickets found"
              description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Start a conversation with our AI support agent.'}
              action={!search && statusFilter === 'all' ? (
                <button onClick={() => { localStorage.removeItem('nova_ticket_id'); navigate('/chat'); }}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md">
                  <Sparkles className="w-4 h-4" /> How may I help you?
                </button>
              ) : null} />
          ) : (
            <>
              {/* Chat Now CTA */}
              <div className="mb-5 bg-gradient-to-r from-brand-600 to-brand-700 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white">Chat Now — How may I help you?</h3>
                    <p className="text-sm text-white/80 mt-0.5">I can solve your problem. Start a new conversation.</p>
                  </div>
                  <button onClick={() => { localStorage.removeItem('nova_ticket_id'); navigate('/chat'); }}
                    className="flex-shrink-0 px-5 py-2.5 bg-white text-brand-700 text-sm font-semibold rounded-lg hover:bg-brand-50 transition-all shadow-sm">
                    Chat Now
                  </button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {filtered.map((ticket, i) => (
                  <motion.div key={ticket.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-gray-200 cursor-pointer transition-all group">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 rounded-md text-sm font-bold font-mono text-gray-800">
                          #{ticket.ticket_id?.slice(0, 7) || ticket.id?.toString().slice(0, 7)}
                        </span>
                        <StatusBadge status={ticket.status} />
                      </div>
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                    <p className="text-sm text-gray-900 mb-3 line-clamp-2">
                      <span className="font-medium text-gray-500">Summary: </span>{ticket.summary || 'No summary'}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <DepartmentBadge department={ticket.department} />
                      <span className="text-gray-300">·</span>
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-gray-400">{formatRelative(ticket.created_at)}</span>
                    </div>
                    {ticket.latest_message && (
                      <div className="flex items-start gap-2 mt-2.5 pt-2.5 border-t border-gray-50">
                        <User className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-400 truncate">{ticket.latest_message}</p>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
