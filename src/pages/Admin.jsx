import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  MessageSquare, Ticket, X, Send, BarChart3, RefreshCw, Activity,
  AlertCircle, CheckCircle2, Search, Clock, TrendingUp, Eye,
  ChevronDown, ArrowUpDown, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../lib/axios';
import supabase from '../lib/supabase';
import { formatRelative } from '../lib/utils';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import DepartmentBadge from '../components/DepartmentBadge';
import { StatSkeleton } from '../components/Skeleton';

const STATUSES = ['open', 'in_progress', 'resolved', 'closed', 'pending', 'marked_for_review'];

const STATUS_PILLS = [
  { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200', active: 'bg-brand-600 text-white shadow-sm' },
  { key: 'open', label: 'Open', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', active: 'bg-blue-600 text-white shadow-sm' },
  { key: 'in_progress', label: 'Progress', color: 'bg-violet-50 text-violet-700 hover:bg-violet-100', active: 'bg-violet-600 text-white shadow-sm' },
  { key: 'waiting_for_customer', label: 'Waiting', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100', active: 'bg-orange-600 text-white shadow-sm' },
  { key: 'resolved', label: 'Resolved', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100', active: 'bg-emerald-600 text-white shadow-sm' },
  { key: 'closed', label: 'Closed', color: 'bg-gray-100 text-gray-600 hover:bg-gray-200', active: 'bg-gray-600 text-white shadow-sm' },
  { key: 'pending', label: 'Pending', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', active: 'bg-amber-600 text-white shadow-sm' },
  { key: 'marked_for_review', label: 'Review', color: 'bg-rose-50 text-rose-700 hover:bg-rose-100', active: 'bg-rose-600 text-white shadow-sm' },
];

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'department', label: 'Department' },
];

export default function Admin() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [newStatus, setNewStatus] = useState('all');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const { data: tickets = [], isLoading: tLoading } = useQuery({
    queryKey: ['admin-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (error) { console.error('[Admin] tickets error:', error); return []; }
      return data || [];
    },
    refetchInterval: 15000,
  });

  const { data: stats, isLoading: sLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tickets').select('*');
      if (error) { console.error('[Admin] stats error:', error); return null; }
      const t = data || [];
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const week = new Date(today); week.setDate(week.getDate() - week.getDay());
      return {
        total: t.length,
        open: t.filter((x) => x.status === 'open').length,
        inProgress: t.filter((x) => x.status === 'in_progress').length,
        resolved: t.filter((x) => x.status === 'resolved').length,
        closed: t.filter((x) => x.status === 'closed').length,
        pending: t.filter((x) => x.status === 'pending').length,
        waiting: t.filter((x) => x.status === 'waiting_for_customer').length,
        review: t.filter((x) => x.status === 'marked_for_review').length,
        highP: t.filter((x) => x.priority === 'high' || x.priority === 'critical').length,
        today: t.filter((x) => new Date(x.created_at) >= today).length,
        week: t.filter((x) => new Date(x.created_at) >= week).length,
      };
    },
    refetchInterval: 15000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ ticketId, status, note }) => api.post('/webhook/admin-update', { ticketId, status, note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin'] }); toast.success('Ticket updated'); setSelectedTicket(null); setNoteText(''); setNewStatus('all'); },
    onError: () => toast.error('Update failed.'),
  });

  const statCards = useMemo(() => [
    { label: 'Total', value: stats?.total || 0, icon: Ticket, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', txt: 'text-blue-600' },
    { label: 'Open', value: stats?.open || 0, icon: AlertCircle, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50', txt: 'text-blue-600' },
    { label: 'Progress', value: stats?.inProgress || 0, icon: Activity, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50', txt: 'text-violet-600' },
    { label: 'Resolved', value: stats?.resolved || 0, icon: CheckCircle2, color: 'from-emerald-500 to-emerald-600', bg: 'bg-emerald-50', txt: 'text-emerald-600' },
    { label: 'Pending', value: stats?.pending || 0, icon: Clock, color: 'from-amber-500 to-amber-600', bg: 'bg-amber-50', txt: 'text-amber-600' },
    { label: 'Review', value: stats?.review || 0, icon: AlertCircle, color: 'from-rose-500 to-rose-600', bg: 'bg-rose-50', txt: 'text-rose-600' },
    { label: 'High Priority', value: stats?.highP || 0, icon: TrendingUp, color: 'from-red-500 to-red-600', bg: 'bg-red-50', txt: 'text-red-600' },
    { label: 'This Week', value: stats?.week || 0, icon: BarChart3, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50', txt: 'text-cyan-600' },
  ], [stats]);

  const filtered = useMemo(() => {
    let items = [...tickets];
    if (statusFilter !== 'all') items = items.filter((t) => t.status === statusFilter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter((t) =>
        t.id?.toString().includes(q) || t.ticket_id?.toLowerCase().includes(q) ||
        t.customer_name?.toLowerCase().includes(q) || t.customer_email?.toLowerCase().includes(q) ||
        t.summary?.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'oldest': items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)); break;
      case 'priority': { const o = { critical: 4, high: 3, medium: 2, low: 1 }; items.sort((a, b) => (o[b.priority] || 0) - (o[a.priority] || 0)); break; }
      case 'status': items.sort((a, b) => (a.status || '').localeCompare(b.status || '')); break;
      case 'department': items.sort((a, b) => (a.department || '').localeCompare(b.department || '')); break;
      default: items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return items;
  }, [tickets, statusFilter, debouncedSearch, sort]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-accent-600 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-semibold text-base text-gray-900 tracking-tight">Admin</span>
              <p className="text-[10px] text-gray-400 -mt-0.5">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => qc.invalidateQueries({ queryKey: ['admin'] })}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Refresh">
              <RefreshCw className="w-4 h-4" />
            </button>
            <a href="/" className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors">Back to Landing Page</a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {sLoading ? <StatSkeleton compact /> : (
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 mb-5">
              {statCards.map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-white rounded-lg border border-gray-100 shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-lg ${s.bg} flex items-center justify-center flex-shrink-0`}>
                    <s.icon className={`w-4 h-4 ${s.txt}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold text-gray-900 leading-none mb-0.5">{s.value}</p>
                    <p className="text-xs text-gray-400 truncate">{s.label}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2.5">
                <h2 className="text-sm font-semibold text-gray-900">Tickets</h2>
                <span className="text-xs text-gray-400">{filtered.length} total</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex gap-1 overflow-x-auto flex-1">
                  {STATUS_PILLS.map((p) => (
                    <button key={p.key} onClick={() => setStatusFilter(p.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 ${statusFilter === p.key ? p.active : p.color}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="relative flex-shrink-0">
                  <button onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-gray-300 transition-all">
                    <ArrowUpDown className="w-3 h-3" />
                    {SORT_OPTIONS.find((o) => o.key === sort)?.label || 'Sort'}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {sortOpen && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-1 min-w-[140px]">
                      {SORT_OPTIONS.map((o) => (
                        <button key={o.key} onClick={() => { setSort(o.key); setSortOpen(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 transition-colors ${sort === o.key ? 'text-brand-600 font-medium' : 'text-gray-600'}`}>
                          {o.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="relative mt-2.5">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input type="text" placeholder="Search by ID, name, email, summary..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-100/50 transition-all placeholder:text-gray-400" />
              </div>
            </div>

            <div className="overflow-x-auto">
              {tLoading ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center">
                  <Ticket className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No tickets found.</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ID</th>
                      <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider max-w-[160px]">Summary</th>
                      <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                      <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Priority</th>
                      <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Dept</th>
                      <th className="text-left px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="text-right px-3 sm:px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((t, i) => (
                      <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}
                        className="border-b border-gray-50 hover:bg-gray-50/70 transition-colors last:border-0">
                        <td className="px-3 sm:px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 bg-gray-100 rounded-md text-xs font-bold font-mono text-gray-800">
                            #{t.ticket_id?.slice(0, 7) || t.id?.toString().slice(0, 7)}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3">
                          <p className="text-sm font-medium text-gray-900">{t.customer_name || 'N/A'}</p>
                          <p className="text-xs text-gray-400 leading-none mt-0.5">{t.customer_email}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3 max-w-[160px]">
                          <p className="text-sm text-gray-600 truncate">{t.summary || '-'}</p>
                        </td>
                        <td className="px-3 sm:px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-3 sm:px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-3 sm:px-4 py-3"><DepartmentBadge department={t.department} /></td>
                        <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">{formatRelative(t.created_at)}</span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-right">
                          <button onClick={() => navigate(`/admin/ticket/${t.id}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors">
                            <Eye className="w-3 h-3" /> View
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
