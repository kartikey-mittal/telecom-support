import supabase from './supabase';

function logError(context, error) {
  console.error(`[Supabase] ${context} failed:`, error);
}

export async function fetchAllTickets() {
  const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
  if (error) { logError('fetchAllTickets', error); return []; }
  return data || [];
}

export async function fetchTicketByUUID(uuid) {
  const { data, error } = await supabase.from('tickets').select('*').eq('id', uuid).single();
  if (error) { logError('fetchTicketByUUID', error); return null; }
  return data;
}

export async function fetchTicketByTicketId(ticketId) {
  const { data, error } = await supabase.from('tickets').select('*').eq('ticket_id', ticketId).maybeSingle();
  if (error) { logError('fetchTicketByTicketId', error); return null; }
  return data;
}

export async function fetchTicketBySessionId(sessionId) {
  const { data, error } = await supabase.from('tickets').select('*').eq('session_id', sessionId).maybeSingle();
  if (error) { logError('fetchTicketBySessionId', error); return null; }
  return data;
}

export async function fetchCustomerTickets(email) {
  const { data, error } = await supabase.from('tickets').select('*').eq('customer_email', email).order('created_at', { ascending: false });
  if (error) { logError('fetchCustomerTickets', error); return []; }
  return data || [];
}

export async function fetchMessagesByTicketId(ticketId) {
  const { data, error } = await supabase.from('chat_messages').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  if (error) { logError('fetchMessagesByTicketId', error); return []; }
  return data || [];
}

export async function fetchTimelineByTicketId(ticketId) {
  const { data, error } = await supabase.from('ticket_timeline').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: true });
  if (error) { logError('fetchTimelineByTicketId', error); return []; }
  return data || [];
}

export async function fetchAdminNotesByTicketId(ticketId) {
  const { data, error } = await supabase.from('admin_notes').select('*').eq('ticket_id', ticketId).order('created_at', { ascending: false });
  if (error) { logError('fetchAdminNotesByTicketId', error); return []; }
  return data || [];
}
