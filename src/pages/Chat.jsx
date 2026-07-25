import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  Send, Headphones, Paperclip, X, User, Ticket,
  FileText, Copy, Check, Loader2, Wifi, WifiOff, Sparkles,
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import Markdown from 'react-markdown';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import api from '../lib/axios';
import supabase from '../lib/supabase';
import { getSession, clearSession, setTicketId, getTicketId, formatTime, buildConversationHistory } from '../lib/utils';
import { fetchMessagesByTicketId, fetchTicketByTicketId, fetchTicketBySessionId } from '../lib/queries';
import { ChatSkeleton } from '../components/Skeleton';

function TypingDots() {
  return (
    <div className="flex gap-1.5 py-1">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '400ms' }} />
    </div>
  );
}

function CopyBtn({ content }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(content); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-gray-200/60 transition-all duration-200 text-gray-400 hover:text-gray-600">
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

function AutoResizeTextarea({ value, onChange, onKeyDown, disabled, placeholder }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 160) + 'px'; }
  }, [value]);
  useEffect(() => { if (!disabled && ref.current) ref.current.focus(); }, [disabled]);
  return (
    <textarea ref={ref} value={value} onChange={onChange} onKeyDown={onKeyDown}
      placeholder={placeholder} rows={1} disabled={disabled}
      className="flex-1 bg-transparent border-0 outline-none resize-none text-sm py-3 max-h-40 placeholder:text-gray-500 placeholder:font-medium disabled:opacity-40 disabled:cursor-not-allowed" />
  );
}

export default function Chat() {
  const navigate = useNavigate();
  const session = getSession();
  const messagesEndRef = useRef(null);
  const chatRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [ticketId, setLocalTicketId] = useState(getTicketId());
  const [ticket, setTicket] = useState(null);
  const [files, setFiles] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [online, setOnline] = useState(true);
  const [history, setHistory] = useState([]);
  const atBottom = useRef(true);

  useEffect(() => {
    if (!session) { navigate('/', { replace: true }); return; }
    loadData();
  }, []);

  useEffect(() => {
    if (atBottom.current) requestAnimationFrame(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [messages, isTyping]);

  const onScroll = useCallback(() => {
    const el = chatRef.current;
    if (!el) return;
    atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  }, []);

  const loadData = async () => {
    setInitialLoading(true);
    const stored = getTicketId();
    if (stored) {
      const t = await fetchTicketByTicketId(stored);
      // If stored ticket doesn't belong to this email, clear it
      if (t && t.customer_email !== session.customerEmail) {
        setTicketId(null);
        setLocalTicketId(null);
        localStorage.removeItem('nova_ticket_id');
        setInitialLoading(false);
        return;
      }
      setLocalTicketId(stored);
      if (t) {
        setTicket(t);
        if (t.conversation_history && Array.isArray(t.conversation_history)) {
          setHistory(t.conversation_history);
          const msgs = t.conversation_history.map((h, i) => ({
            id: `hist-${i}`, ticket_id: stored,
            sender: h.sender === 'customer' ? 'customer' : 'ai',
            message: h.message, created_at: new Date().toISOString(),
          }));
          setMessages(msgs);
        }
      }
      const existing = await fetchMessagesByTicketId(stored);
      if (existing.length > 0) {
        setMessages(existing);
        if (!t?.conversation_history || !Array.isArray(t.conversation_history) || t.conversation_history.length === 0) {
          setHistory(buildConversationHistory(existing));
        }
      }
    } else {
      const t = await fetchTicketBySessionId(session.sessionId);
      if (t && t.customer_email === session.customerEmail) {
        setTicket(t); setLocalTicketId(t.ticket_id); setTicketId(t.ticket_id);
        if (t.conversation_history && Array.isArray(t.conversation_history)) {
          setHistory(t.conversation_history);
          const msgs = t.conversation_history.map((h, i) => ({
            id: `hist-${i}`, ticket_id: t.ticket_id,
            sender: h.sender === 'customer' ? 'customer' : 'ai',
            message: h.message, created_at: new Date().toISOString(),
          }));
          setMessages(msgs);
        }
        const existing = await fetchMessagesByTicketId(t.ticket_id);
        if (existing.length > 0) {
          setMessages(existing);
          if (!t.conversation_history || !Array.isArray(t.conversation_history) || t.conversation_history.length === 0) {
            setHistory(buildConversationHistory(existing));
          }
        }
      }
    }
    setInitialLoading(false);
  };

  useEffect(() => {
    if (!ticketId) return;
    const ch = supabase.channel('chat_msgs')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `ticket_id=eq.${ticketId}` },
        (payload) => {
          const m = payload.new;
          if (m.sender !== 'customer') {
            setMessages((prev) => { if (prev.some((x) => x.id === m.id)) return prev; return [...prev, m]; });
            setHistory((prev) => { if (prev.some((x) => x.message === m.message && x.sender === 'ai')) return prev; return [...prev, { sender: 'ai', message: m.message }]; });
            setIsTyping(false); setSending(false);
          }
        })
      .subscribe();
    const th = supabase.channel('ticket_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `ticket_id=eq.${ticketId}` },
        (payload) => setTicket(payload.new))
      .subscribe();
    return () => { supabase.removeChannel(ch); supabase.removeChannel(th); };
  }, [ticketId]);

  const send = async () => {
    const text = input.trim();
    if ((!text && !files.length) || sending) return;
    setInput(''); setIsTyping(true); setSending(true);
    const msg = { id: uuidv4(), ticket_id: ticketId, sender: 'customer', message: text, created_at: new Date().toISOString() };
    setMessages((prev) => [...prev, msg]);
    const updated = [...history, { sender: 'customer', message: text }];
    setHistory(updated);
    const fd = new FormData();
    fd.append('sessionId', session.sessionId);
    fd.append('customerName', session.customerName);
    fd.append('customerEmail', session.customerEmail);
    fd.append('message', text);
    fd.append('ticketId', ticketId || '');
    fd.append('conversationHistory', JSON.stringify(updated));
    files.forEach((f) => fd.append('files', f));
    setFiles([]);
    try {
      const res = await api.post('/webhook/support-chat', fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 });
      const d = res.data;
      if (d.message) {
        const aiMsg = { id: uuidv4(), ticket_id: ticketId || d.ticketId, sender: 'ai', message: d.message, created_at: new Date().toISOString() };
        setMessages((prev) => [...prev, aiMsg]);
        setHistory((prev) => [...prev, { sender: 'ai', message: d.message }]);
      }
      setIsTyping(false); setSending(false);
      if (d.ticketId) {
        setLocalTicketId(d.ticketId); setTicketId(d.ticketId);
        if (!ticketId) { const td = await fetchTicketByTicketId(d.ticketId); if (td) setTicket(td); }
      }
      setOnline(true);
    } catch (err) {
      console.error('[Chat] send error:', err);
      setOnline(false); setIsTyping(false); setSending(false);
      toast.error(err.code === 'ECONNABORTED' ? 'Request timed out. Try again.' : 'Failed to send. Try again.');
    }
  };

  const onKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } };
  const onDrop = useCallback((accepted) => setFiles((prev) => [...prev, ...accepted]), []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'], 'text/plain': ['.txt'] }, maxSize: 10 * 1024 * 1024 });

  if (!session) return null;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top Bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-14 border-b-2 border-gray-200 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
            <Headphones className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-base text-gray-900">Support</span>
            <div className="flex items-center gap-1 -mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { navigate('/tickets'); }}
            className="            inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm">
            <Ticket className="w-4 h-4" /> My Tickets
          </button>
        </div>
      </div>

      {/* Conversation */}
      <div ref={chatRef} onScroll={onScroll} className="flex-1 overflow-y-auto bg-gray-50">
        {initialLoading ? <ChatSkeleton /> : messages.length === 0 && !isTyping ? (
          <div className="h-full flex flex-col items-center justify-center px-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center mb-6 shadow-sm ring-1 ring-blue-100/50">
              <Sparkles className="w-10 h-10 text-brand-500" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">How can I help you?</h2>
            <p className="text-sm text-gray-400 text-center max-w-md leading-relaxed">
              Describe your telecom issue and our AI will analyze, classify, and help resolve it.
            </p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-1">
            {messages.map((msg, i) => {
              const isCust = msg.sender === 'customer';
              const showAvatar = i === 0 || messages[i - 1]?.sender !== msg.sender;
              return (
                <motion.div key={msg.id || i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className={`flex gap-3 items-start py-2 ${isCust ? 'flex-row-reverse' : ''} group`}>
                  {showAvatar ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ${isCust ? 'bg-gradient-to-br from-blue-100 to-blue-200 ring-blue-200/50' : 'bg-white ring-gray-200 shadow-sm'}`}>
                      {isCust ? <User className="w-4 h-4 text-brand-600" /> : <Headphones className="w-4 h-4 text-gray-500" />}
                    </div>
                  ) : <div className="w-8 flex-shrink-0" />}
                  <div className={`max-w-[78%] sm:max-w-[70%] ${isCust ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`relative px-4 py-3 ${isCust ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-2xl rounded-tr-sm' : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm shadow-sm ring-1 ring-gray-100'}`}>
                      {isCust ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                      ) : (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-p:my-1 prose-strong:text-gray-900">
                          <Markdown>{msg.message}</Markdown>
                        </div>
                      )}
                    </div>
                    <div className={`flex items-center gap-1.5 mt-0.5 px-1 ${isCust ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] text-gray-400">{formatTime(msg.created_at)}</span>
                      {!isCust && <CopyBtn content={msg.message} />}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {isTyping && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start py-2">
                <div className="w-8 h-8 rounded-full bg-white shadow-sm ring-1 ring-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Headphones className="w-4 h-4 text-gray-500" />
                </div>
                <div className="bg-white rounded-2xl rounded-tl-sm shadow-sm ring-1 ring-gray-100 px-5 py-3.5">
                  <TypingDots />
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* File Previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-100 bg-gray-50 overflow-hidden">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-2.5 flex gap-2 overflow-x-auto">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs flex-shrink-0 shadow-sm">
                  <FileText className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-600 truncate max-w-[100px]">{f.name}</span>
                  <span className="text-gray-400">{(f.size / 1024).toFixed(0)}KB</span>
                  <button onClick={() => setFiles((p) => p.filter((_, j) => j !== i))} className="text-gray-400 hover:text-gray-600"><X className="w-3 h-3" /></button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="flex-shrink-0 border-t-2 border-gray-200 bg-white px-4 sm:px-6 py-3">
        <div className="max-w-3xl mx-auto">
          <div className={`flex items-end gap-2 bg-gray-50 rounded-2xl border px-3 py-1 transition-all duration-200 ${isDragActive ? 'border-brand-400 bg-brand-50/50' : sending ? 'border-gray-200 opacity-50' : 'border-gray-200 focus-within:border-brand-300 focus-within:shadow-sm focus-within:shadow-brand-100/50'}`}>
            <div {...getRootProps()} className="cursor-pointer">
              <input {...getInputProps()} disabled={sending} />
              <button type="button" disabled={sending}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 disabled:opacity-40">
                <Paperclip className="w-4 h-4" />
              </button>
            </div>
            <AutoResizeTextarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey}
              disabled={sending} placeholder={sending ? 'Waiting for AI response...' : 'Type your message...'} />
            <button onClick={send} disabled={(!input.trim() && !files.length) || sending}
              className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-700 hover:to-accent-700 disabled:from-gray-200 disabled:to-gray-200 transition-all text-white disabled:text-gray-400 flex-shrink-0 shadow-sm hover:shadow-md disabled:shadow-none">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1">
            <p className="text-[10px] text-gray-400">AI responses may be inaccurate. Enter to send.</p>
            <div className="flex items-center gap-1.5">
              {online ? <Wifi className="w-2.5 h-2.5 text-emerald-500" /> : <WifiOff className="w-2.5 h-2.5 text-red-400" />}
              <span className={`text-[10px] ${online ? 'text-emerald-600' : 'text-red-400'}`}>{online ? 'Connected' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
