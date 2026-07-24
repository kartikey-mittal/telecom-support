import { Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import MyTickets from './pages/MyTickets';
import TicketDetails from './pages/TicketDetails';
import Admin from './pages/Admin';
import AdminTicket from './pages/AdminTicket';

export default function App() {
  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/tickets" element={<MyTickets />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/ticket/:id" element={<AdminTicket />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
