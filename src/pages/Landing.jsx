import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import {
  MessageSquare, User, Mail, ArrowRight, Sparkles, Bot, Ticket, Headphones, Zap,
} from 'lucide-react';
import { setSession } from '../lib/utils';

const features = [
  {
    icon: Bot,
    title: 'AI-Powered Support',
    description: 'Intelligent conversations that understand your telecom issues and resolve them instantly.',
  },
  {
    icon: Ticket,
    title: 'Smart Ticketing',
    description: 'Automatic ticket creation with AI classification, priority detection, and department routing.',
  },
  {
    icon: Headphones,
    title: 'Human Handoff',
    description: 'Seamless escalation to human agents when complex issues need personal attention.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStart = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    const session = {
      sessionId: uuidv4(),
      customerName: name.trim(),
      customerEmail: email.trim(),
    };
    setSession(session);
    navigate('/tickets');
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-semibold text-xl text-gray-900 tracking-tight">Telecom Support</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="/admin"
              className="text-sm font-semibold text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-all shadow-sm hover:shadow-md">
              Admin
            </a>
            <a href="#start"
              className="text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 px-5 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md">
              Get Started
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/40 via-white to-white pointer-events-none" />
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-bl from-brand-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="max-w-3xl mx-auto text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-brand-700 font-medium mb-6 ring-1 ring-blue-100/50">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Telecom Support
                </div>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-[1.1] tracking-tight mb-5">
                How may I help you today?
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base sm:text-lg text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed">
                Our AI understands your telecom issues, creates smart tickets, and resolves them instantly.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} id="start">
                <form onSubmit={handleStart} className="max-w-sm mx-auto space-y-3">
                  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 focus-within:border-brand-300 focus-within:ring-1 focus-within:ring-brand-100/50 transition-all">
                    <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input type="text" placeholder="Your name" value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="flex-1 border-0 outline-none text-sm bg-transparent placeholder:text-gray-400" required />
                  </div>
                  <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg px-3.5 py-2.5 focus-within:border-brand-300 focus-within:ring-1 focus-within:ring-brand-100/50 transition-all">
                    <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <input type="email" placeholder="your@email.com" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="flex-1 border-0 outline-none text-sm bg-transparent placeholder:text-gray-400" required />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Starting...
                      </span>
                    ) : (
                      <>Start AI Chat <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>
                </form>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="py-16 bg-gray-50/50">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-center mb-10">
              <span className="text-xs font-semibold text-brand-600 uppercase tracking-widest mb-3 block">Features</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                Everything you need
              </h2>
            </motion.div>

            <div className="grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {features.map((feature, i) => (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-white rounded-lg p-5 border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                    <feature.icon className="w-4.5 h-4.5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{feature.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-10 sm:p-14 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.12),transparent_60%)] pointer-events-none" />
                <div className="relative">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
                    Ready to get started?
                  </h2>
                  <p className="text-brand-100/80 max-w-lg mx-auto mb-8 text-sm">
                    Start a conversation with our AI support agent and experience the difference.
                  </p>
                  <a href="#start"
                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-brand-700 font-semibold rounded-lg hover:bg-brand-50 transition-all shadow-lg hover:shadow-xl text-sm">
                    Get Started <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <MessageSquare className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">Telecom Support</span>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Project by{' '}
            <a href="https://kartikeymittal.dev" target="_blank" rel="noopener noreferrer"
              className="text-brand-600 hover:text-brand-700 font-medium">Kartikey Mittal</a>
            {' '}&middot;{' '}
            <a href="mailto:mittalkartikey@gmail.com" className="text-brand-600 hover:text-brand-700">mittalkartikey@gmail.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
