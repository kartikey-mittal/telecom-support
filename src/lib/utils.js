import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatDate(date) {
  if (!date) return '';
  return dayjs(date).format('MMM D, YYYY h:mm A');
}

export function formatTime(date) {
  if (!date) return '';
  return dayjs(date).format('h:mm A');
}

export function formatRelative(date) {
  if (!date) return '';
  return dayjs(date).fromNow();
}

export function getSession() {
  try {
    const s = localStorage.getItem('nova_session');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export function setSession(data) {
  localStorage.setItem('nova_session', JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem('nova_session');
  localStorage.removeItem('nova_ticket_id');
}

export function getTicketId() {
  return localStorage.getItem('nova_ticket_id') || null;
}

export function setTicketId(id) {
  if (id) {
    localStorage.setItem('nova_ticket_id', id);
  } else {
    localStorage.removeItem('nova_ticket_id');
  }
}

export function buildConversationHistory(messages) {
  return messages
    .filter((m) => m.message && m.message.trim())
    .map((m) => ({
      sender: m.sender === 'customer' ? 'customer' : 'ai',
      message: m.message,
    }));
}

export function getStatusColor(status) {
  const map = {
    open: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300/60',
    closed: 'bg-gray-100 text-gray-600 ring-1 ring-gray-300/60',
    resolved: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60',
    pending: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/60',
    in_progress: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/60',
    waiting_for_customer: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300/60',
    marked_for_review: 'bg-rose-100 text-rose-800 ring-1 ring-rose-300/60',
  };
  return map[status?.toLowerCase()] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-300/60';
}

export function capitalize(str) {
  if (!str) return '';
  return str.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getPriorityColor(priority) {
  const map = {
    low: 'bg-slate-100 text-slate-700 ring-1 ring-slate-300/60',
    medium: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/60',
    high: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300/60',
    critical: 'bg-red-100 text-red-800 ring-1 ring-red-300/60',
  };
  return map[priority?.toLowerCase()] || 'bg-gray-100 text-gray-600 ring-1 ring-gray-300/60';
}

export function getDepartmentColor(dept) {
  const map = {
    billing: 'bg-blue-100 text-blue-800 ring-1 ring-blue-300/60',
    technical: 'bg-violet-100 text-violet-800 ring-1 ring-violet-300/60',
    sales: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300/60',
    support: 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-300/60',
    general: 'bg-amber-100 text-amber-800 ring-1 ring-amber-300/60',
    enquiry: 'bg-orange-100 text-orange-800 ring-1 ring-orange-300/60',
    installation: 'bg-sky-100 text-sky-800 ring-1 ring-sky-300/60',
    complaint: 'bg-rose-100 text-rose-800 ring-1 ring-rose-300/60',
  };
  return map[dept?.toLowerCase()] || 'bg-gray-100 text-gray-700 ring-1 ring-gray-300/60';
}
