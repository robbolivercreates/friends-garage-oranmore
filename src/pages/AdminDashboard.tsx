import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Lock,
  LogOut,
  Calendar,
  CalendarX,
  Clock,
  Search,
  Download,
  FileText,
  PhoneCall,
  ShieldAlert,
  Settings,
  Plus,
  Trash2,
  Save,
  Wrench,
  MapPin,
  MessageCircle,
  Bot,
  PlusCircle,
  Send
} from 'lucide-react';
import { Booking, EstimateRequest, CallbackRequest, RoadsideRequest, SiteSettings } from '../types';
import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal';

interface AdminDashboardProps {
  onLogout: () => void;
}

type TabId = 'bookings' | 'estimates' | 'callbacks' | 'roadside' | 'blocked' | 'settings' | 'assistant';

/** Consistent status pill colours across every inbox. */
const statusPillClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    rescheduled: 'bg-white/5 text-ink-300 border-white/15',
    dispatched: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    in_progress: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    new: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    in_review: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    quoted: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    closed: 'bg-white/5 text-ink-300 border-white/15'
  };
  return map[status] ?? 'bg-white/5 text-ink-300 border-white/15';
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => (
  <span
    className={`inline-block px-2.5 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${statusPillClass(status)}`}
  >
    {status.replace('_', ' ')}
  </span>
);

/** Small ghost action button used inside table rows and inbox cards. */
const ghostBtn =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-white/10 bg-white/5 text-ink-200 hover:bg-white/10 hover:text-white transition-colors cursor-pointer';

/**
 * Build a WhatsApp deep link (wa.me) with a pre-filled message.
 * Converts Irish local numbers (087...) to international format (35387...).
 * Opens the customer's chat in WhatsApp — no API or subscription needed.
 */
const waLink = (phone: string, message: string): string => {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('00353')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = '353' + digits.slice(1);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
};

/** WhatsApp-styled ghost button (anchor). */
const waBtn =
  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 transition-colors cursor-pointer';

/** Same workshop time slots offered on the public booking form. */
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00'
];

const BOOKING_STATUSES = ['pending', 'confirmed', 'completed', 'rescheduled', 'cancelled'];

/** Authenticated fetch for staff endpoints — attaches the session token. */
const api = (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('fg_admin_token') || '';
  return fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<TabId>('bookings');
  const [loading, setLoading] = useState(true);

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [estimates, setEstimates] = useState<EstimateRequest[]>([]);
  const [callbacks, setCallbacks] = useState<CallbackRequest[]>([]);
  const [roadside, setRoadside] = useState<RoadsideRequest[]>([]);
  const [blockedDates, setBlockedDates] = useState<{ id: string; date: string; reason: string }[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Blocked Date Form
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('Holiday / Closed');

  // Internal Notes Editing
  const [selectedBookingNotes, setSelectedBookingNotes] = useState<{ id: string; text: string } | null>(null);

  // Reschedule editing (staff can freely move a booking to another day/time)
  const [rescheduleEditing, setRescheduleEditing] = useState<{ id: string; date: string; time: string } | null>(null);

  // Services list (for the manual booking form)
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);

  // Manual booking creation (walk-ins / phone bookings)
  const [showManualForm, setShowManualForm] = useState(false);
  const [manual, setManual] = useState({
    customerName: '', phone: '', email: '', vehicleRegistration: '',
    serviceName: '', bookingDate: '', bookingTime: '09:30', customerNotes: ''
  });
  const [manualMsg, setManualMsg] = useState<string | null>(null);

  // AI Assistant chat
  const [chat, setChat] = useState<{ role: 'user' | 'model'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatBusy, setChatBusy] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bRes, eRes, cRes, rRes, bdRes, sRes] = await Promise.all([
        api('/api/bookings'),
        api('/api/estimates'),
        api('/api/callbacks'),
        api('/api/roadside'),
        api('/api/blocked-dates'),
        api('/api/admin/settings')
      ]);

      if (bRes.status === 401) { onLogout(); return; }
      if (bRes.ok) setBookings(await bRes.json());
      if (eRes.ok) setEstimates(await eRes.json());
      if (cRes.ok) setCallbacks(await cRes.json());
      if (rRes.ok) setRoadside(await rRes.json());
      if (bdRes.ok) setBlockedDates(await bdRes.json());
      if (sRes.ok) setSettings(await sRes.json());
      fetch('/api/services').then(r => (r.ok ? r.json() : [])).then(setServices).catch(() => {});
    } catch (err) {
      console.error('Error loading admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateBookingStatus = async (id: string, status: string) => {
    try {
      const res = await api(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, status: status as any } : b));
      }
    } catch (err) {
      console.error(err);
    }
  };

  /** Status change with an undo-friendly guard: cancelling asks first. */
  const handleStatusChange = (b: Booking, newStatus: string) => {
    if (newStatus === b.status) return;
    if (newStatus === 'cancelled') {
      const ok = window.confirm(
        `Cancel booking ${b.referenceNumber} for ${b.customerName}?\n\nThe customer will receive a cancellation email. You can undo this later by changing the status back.`
      );
      if (!ok) return;
    }
    handleUpdateBookingStatus(b.id, newStatus);
  };

  /** Move a booking to a new date/time (staff override — no slot restrictions). */
  const handleReschedule = async () => {
    if (!rescheduleEditing) return;
    const { id, date, time } = rescheduleEditing;
    if (!date || !time) return;
    try {
      const res = await api(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ bookingDate: date, bookingTime: time, status: 'rescheduled' })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, bookingDate: date, bookingTime: time, status: 'rescheduled' } : b));
        setRescheduleEditing(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  /** Create a booking manually (walk-in / phone). Uses the staff override. */
  const handleManualCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualMsg(null);
    try {
      const res = await api('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          customerName: manual.customerName,
          phone: manual.phone,
          email: manual.email || 'walkin@friendsgarage.local',
          vehicleRegistration: manual.vehicleRegistration || 'N/A',
          serviceName: manual.serviceName || 'General Service',
          bookingDate: manual.bookingDate,
          bookingTime: manual.bookingTime,
          customerNotes: manual.customerNotes,
          override: true
        })
      });
      const data = await res.json();
      if (res.ok) {
        setManualMsg(`Booking created — ${data.referenceNumber}`);
        setManual({ customerName: '', phone: '', email: '', vehicleRegistration: '', serviceName: '', bookingDate: '', bookingTime: '09:30', customerNotes: '' });
        fetchData();
      } else {
        setManualMsg(data.error || 'Could not create booking.');
      }
    } catch (err) {
      console.error(err);
      setManualMsg('Network error.');
    }
  };

  /** Send a message to the staff AI assistant. */
  const handleChatSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = chatInput.trim();
    if (!text || chatBusy) return;
    const next = [...chat, { role: 'user' as const, text }];
    setChat(next);
    setChatInput('');
    setChatBusy(true);
    try {
      const res = await api('/api/admin/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history: chat })
      });
      const data = await res.json();
      setChat([...next, { role: 'model', text: data.reply || '(no reply)' }]);
      fetchData(); // the assistant may have changed bookings
    } catch {
      setChat([...next, { role: 'model', text: 'Connection error — try again.' }]);
    } finally {
      setChatBusy(false);
    }
  };

  const handleSaveInternalNotes = async (id: string, notes: string) => {
    try {
      const res = await api(`/api/bookings/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes: notes })
      });
      if (res.ok) {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, internalNotes: notes } : b));
        setSelectedBookingNotes(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBlockedDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedDate) return;
    try {
      const res = await api('/api/blocked-dates', {
        method: 'POST',
        body: JSON.stringify({ date: newBlockedDate, reason: newBlockedReason })
      });
      if (res.ok) {
        const added = await res.json();
        setBlockedDates([...blockedDates, added]);
        setNewBlockedDate('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    try {
      const res = await api(`/api/blocked-dates/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setBlockedDates(prev => prev.filter(b => b.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      const res = await api('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        alert('Site settings updated successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Export Bookings to CSV
  const exportBookingsCSV = () => {
    if (bookings.length === 0) return;
    const headers = ['Ref', 'Date', 'Time', 'Customer', 'Phone', 'Email', 'Registration', 'Vehicle', 'Service', 'Status'];
    const rows = bookings.map(b => [
      b.referenceNumber,
      b.bookingDate,
      b.bookingTime,
      `"${b.customerName}"`,
      b.phone,
      b.email,
      b.vehicleRegistration,
      `"${b.vehicleMake} ${b.vehicleModel}"`,
      `"${b.serviceName}"`,
      b.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FriendsGarage_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter Bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch =
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.vehicleRegistration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Header stat figures (derived from the same state — no extra fetching)
  const todayIso = new Date().toISOString().split('T')[0];
  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: Calendar },
    { label: 'Pending Approval', value: bookings.filter(b => b.status === 'pending').length, icon: Clock },
    { label: "Today's Jobs", value: bookings.filter(b => b.bookingDate === todayIso && b.status !== 'cancelled').length, icon: Wrench },
    { label: 'Open Estimates', value: estimates.filter(e => e.status !== 'closed').length, icon: FileText }
  ];

  const tabs: { id: TabId; label: string; count?: number; icon: React.ElementType }[] = [
    { id: 'bookings', label: 'Bookings', count: bookings.length, icon: Calendar },
    { id: 'estimates', label: 'Estimates', count: estimates.length, icon: FileText },
    { id: 'callbacks', label: 'Callbacks', count: callbacks.length, icon: PhoneCall },
    { id: 'roadside', label: 'Roadside', count: roadside.length, icon: ShieldAlert },
    { id: 'blocked', label: 'Blocked Dates', count: blockedDates.length, icon: CalendarX },
    { id: 'settings', label: 'Site Settings', icon: Settings },
    { id: 'assistant', label: 'AI Assistant', icon: Bot }
  ];

  return (
    <div className="relative min-h-screen bg-ink-950 text-ink-200 pt-28 sm:pt-32 md:pt-36 pb-24 overflow-hidden">
      <div className="glow-brand w-[28rem] h-[28rem] -top-40 -right-40" />

      <div className="relative max-w-7xl mx-auto px-4 md:px-8 space-y-10">

        {/* Top Header */}
        <Reveal inView={false}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/10 pb-8">
            <div className="space-y-3">
              <span className="eyebrow">
                <Lock className="w-3.5 h-3.5" />
                Staff Portal
              </span>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold leading-[1.08] text-white">
                Workshop Control Centre
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-ink-300">
                <span>Deerpark Industrial Estate, Oranmore, Galway</span>
                <span className="hidden sm:inline text-ink-600">•</span>
                <span className="inline-flex items-center gap-2 text-ink-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-dot" />
                  Signed in — staff session active
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={exportBookingsCSV} className="btn btn-outline-light">
                <Download className="w-4 h-4 text-brand-400" />
                <span>Export CSV</span>
              </button>

              <button onClick={onLogout} className="btn btn-outline-light">
                <LogOut className="w-4 h-4 text-brand-400" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </Reveal>

        {/* Stat Cards */}
        <motion.div
          variants={staggerParent}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.label} variants={staggerChild} className="card-dark p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-ink-300">
                    {stat.label}
                  </span>
                  <Icon className="w-4 h-4 text-brand-400" />
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-bold text-white leading-none">
                  {stat.value}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Admin Navigation Tabs */}
        <Reveal inView={false} delay={0.1}>
          <div className="flex flex-wrap gap-x-1 gap-y-2 border-b border-white/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                    isActive ? 'text-white' : 'text-ink-300 hover:text-white'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : ''}`} />
                  <span>{tab.label}</span>
                  {typeof tab.count === 'number' && (
                    <span
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded-md ${
                        isActive ? 'bg-brand-500/15 text-brand-400' : 'bg-white/5 text-ink-300'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="admin-tab-underline"
                      transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </Reveal>

        {/* TAB 1: BOOKINGS MANAGER */}
        {activeTab === 'bookings' && (
          <div className="space-y-5">
            {/* Search & Filter Bar */}
            <div className="card-dark p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <Search className="w-4 h-4 text-ink-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by customer name, registration, or reference (e.g. FG-2026-9021)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-dark pl-11"
                />
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input-dark cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="rescheduled">Rescheduled</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <p className="text-xs text-ink-300 px-1">
              Tip: every action can be undone — use the status dropdown on any booking to change it back, or "Reschedule" to move the date/time. The customer is emailed automatically on any change.
            </p>

            {/* Manual booking (walk-in / phone) */}
            <div className="card-dark p-5">
              <button
                onClick={() => setShowManualForm(!showManualForm)}
                className="flex items-center gap-2 text-sm font-bold text-white hover:text-brand-400 transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4 text-brand-400" />
                {showManualForm ? 'Close manual booking form' : 'Add a booking manually (walk-in / phone customer)'}
              </button>

              {showManualForm && (
                <form onSubmit={handleManualCreate} className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <input className="input-dark" required placeholder="Customer name *" value={manual.customerName} onChange={(e) => setManual({ ...manual, customerName: e.target.value })} />
                  <input className="input-dark" required placeholder="Phone *" value={manual.phone} onChange={(e) => setManual({ ...manual, phone: e.target.value })} />
                  <input className="input-dark" type="email" placeholder="Email (optional)" value={manual.email} onChange={(e) => setManual({ ...manual, email: e.target.value })} />
                  <input className="input-dark uppercase" placeholder="Vehicle reg" value={manual.vehicleRegistration} onChange={(e) => setManual({ ...manual, vehicleRegistration: e.target.value })} />
                  <select className="input-dark cursor-pointer" value={manual.serviceName} onChange={(e) => setManual({ ...manual, serviceName: e.target.value })}>
                    <option value="">General Service</option>
                    {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <input className="input-dark flex-1" required type="date" value={manual.bookingDate} onChange={(e) => setManual({ ...manual, bookingDate: e.target.value })} />
                    <select className="input-dark cursor-pointer !w-24" value={manual.bookingTime} onChange={(e) => setManual({ ...manual, bookingTime: e.target.value })}>
                      {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <input className="input-dark sm:col-span-2" placeholder="Notes (optional)" value={manual.customerNotes} onChange={(e) => setManual({ ...manual, customerNotes: e.target.value })} />
                  <button type="submit" className="btn btn-primary">Create Booking</button>
                  {manualMsg && <p className="sm:col-span-3 text-sm font-semibold text-emerald-400">{manualMsg}</p>}
                </form>
              )}
            </div>

            {/* Bookings Table */}
            <div className="card-dark overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-ink-950/60 text-ink-300 uppercase font-mono text-[11px] tracking-[0.14em] border-b border-white/10">
                    <tr>
                      <th className="p-4 sm:p-5 font-bold">Reference & Status</th>
                      <th className="p-4 sm:p-5 font-bold">Date & Time</th>
                      <th className="p-4 sm:p-5 font-bold">Customer & Vehicle</th>
                      <th className="p-4 sm:p-5 font-bold">Service Required</th>
                      <th className="p-4 sm:p-5 font-bold">Internal Notes</th>
                      <th className="p-4 sm:p-5 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-ink-300">
                          Loading workshop data…
                        </td>
                      </tr>
                    ) : filteredBookings.length > 0 ? (
                      filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.03] transition-colors">
                          <td className="p-4 sm:p-5 space-y-2 align-top">
                            <span className="font-mono font-bold text-white block">{b.referenceNumber}</span>
                            <StatusPill status={b.status} />
                          </td>

                          <td className="p-4 sm:p-5 align-top">
                            {rescheduleEditing?.id === b.id ? (
                              <div className="space-y-2 min-w-[160px]">
                                <input
                                  type="date"
                                  value={rescheduleEditing.date}
                                  onChange={(e) => setRescheduleEditing({ ...rescheduleEditing, date: e.target.value })}
                                  className="input-dark !py-1.5 text-xs"
                                />
                                <select
                                  value={rescheduleEditing.time}
                                  onChange={(e) => setRescheduleEditing({ ...rescheduleEditing, time: e.target.value })}
                                  className="input-dark !py-1.5 text-xs cursor-pointer"
                                >
                                  {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="flex gap-1.5">
                                  <button
                                    onClick={handleReschedule}
                                    className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setRescheduleEditing(null)}
                                    className={ghostBtn}
                                  >
                                    Back
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <span className="font-bold text-white block">{b.bookingDate}</span>
                                <span className="text-ink-300">{b.bookingTime} ({b.durationMinutes}m)</span>
                                <button
                                  onClick={() => setRescheduleEditing({ id: b.id, date: b.bookingDate, time: b.bookingTime })}
                                  className="block mt-1.5 text-xs font-semibold text-brand-400 hover:text-brand-500 underline underline-offset-2 transition-colors cursor-pointer"
                                >
                                  Reschedule
                                </button>
                              </>
                            )}
                          </td>

                          <td className="p-4 sm:p-5 space-y-1 align-top">
                            <span className="font-bold text-white block">{b.customerName}</span>
                            <span className="text-brand-400 font-mono font-bold block">{b.vehicleRegistration}</span>
                            <span className="text-ink-300 text-xs block">{b.vehicleMake} {b.vehicleModel}</span>
                            <span className="text-ink-300 text-xs block">{b.phone}</span>
                          </td>

                          <td className="p-4 sm:p-5 align-top">
                            <span className="font-bold text-white block">{b.serviceName}</span>
                            <span className="text-ink-300 text-xs line-clamp-1">{b.problemDescription || 'Routine appointment'}</span>
                          </td>

                          <td className="p-4 sm:p-5 max-w-xs align-top">
                            {selectedBookingNotes?.id === b.id ? (
                              <div className="space-y-2">
                                <textarea
                                  rows={2}
                                  value={selectedBookingNotes.text}
                                  onChange={(e) => setSelectedBookingNotes({ ...selectedBookingNotes, text: e.target.value })}
                                  className="input-dark text-sm"
                                ></textarea>
                                <button
                                  onClick={() => handleSaveInternalNotes(b.id, selectedBookingNotes.text)}
                                  className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                                >
                                  Save Notes
                                </button>
                              </div>
                            ) : (
                              <div
                                onClick={() => setSelectedBookingNotes({ id: b.id, text: b.internalNotes || '' })}
                                className="text-ink-300 italic cursor-pointer hover:text-white truncate transition-colors"
                                title="Click to edit notes"
                              >
                                {b.internalNotes || '+ Add technician note'}
                              </div>
                            )}
                          </td>

                          <td className="p-4 sm:p-5 text-right space-x-1.5 space-y-1.5 align-top">
                            <a
                              href={waLink(
                                b.phone,
                                `Hi ${b.customerName}, this is Friends Garage Oranmore regarding your booking ${b.referenceNumber} (${b.serviceName} on ${b.bookingDate} at ${b.bookingTime}).`
                              )}
                              target="_blank"
                              rel="noreferrer"
                              className={waBtn}
                              title="Open WhatsApp chat with this customer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>

                            {b.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(b, 'confirmed')}
                                className={`${ghostBtn} text-emerald-400 border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:text-emerald-300`}
                              >
                                Confirm
                              </button>
                            )}

                            <select
                              value={b.status}
                              onChange={(e) => handleStatusChange(b, e.target.value)}
                              title="Change status — you can always change it back"
                              className="input-dark !py-1.5 !px-2.5 !text-xs cursor-pointer !w-auto inline-block"
                            >
                              {BOOKING_STATUSES.map(s => (
                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-ink-300">
                          No bookings found matching filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ESTIMATES INBOX */}
        {activeTab === 'estimates' && (
          <div className="card-dark p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-xl font-bold text-white">Quote & Estimate Requests</h2>
            <div className="space-y-3">
              {estimates.length > 0 ? (
                estimates.map((est) => (
                  <div key={est.id} className="bg-ink-950/60 p-5 rounded-xl border border-white/10 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-brand-400 font-bold">{est.referenceNumber}</span>
                          <StatusPill status={est.status} />
                        </div>
                        <h3 className="font-bold text-white text-base">{est.name} <span className="text-ink-300 font-normal">({est.phone})</span></h3>
                        <span className="text-ink-300 text-sm">{est.email}</span>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-mono font-bold text-brand-400 uppercase bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 text-xs">
                          Reg: {est.vehicleRegistration}
                        </span>
                        <a
                          href={waLink(est.phone, `Hi ${est.name}, this is Friends Garage Oranmore about your estimate request ${est.referenceNumber} (${est.serviceRequired}).`)}
                          target="_blank"
                          rel="noreferrer"
                          className={waBtn}
                          title="Open WhatsApp chat with this customer"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          WhatsApp
                        </a>
                      </div>
                    </div>

                    <div className="text-sm text-ink-200">
                      <strong className="text-white">Scope:</strong> {est.problemDescription}
                    </div>

                    {est.fileUrls.length > 0 && (
                      <div className="text-ink-300 text-xs">
                        <strong>Uploaded files:</strong> {est.fileUrls.join(', ')}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-ink-300 text-center py-8 text-sm">No pending estimate requests.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CALLBACKS INBOX */}
        {activeTab === 'callbacks' && (
          <div className="card-dark p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-xl font-bold text-white">Callback Requests</h2>
            <div className="space-y-3">
              {callbacks.length > 0 ? (
                callbacks.map((cb) => (
                  <div key={cb.id} className="bg-ink-950/60 p-5 rounded-xl border border-white/10 flex flex-wrap justify-between items-center gap-3">
                    <div className="space-y-1">
                      <h3 className="font-bold text-white text-base">{cb.name}</h3>
                      <div className="text-brand-400 font-bold font-mono text-sm">{cb.phone}</div>
                      <div className="text-ink-300 text-sm">Pref. Time: {cb.preferredContactTime}</div>
                      {cb.vehicleRegistration && <div className="text-ink-300 font-mono text-xs">Reg: {cb.vehicleRegistration}</div>}
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={waLink(cb.phone, `Hi ${cb.name}, this is Friends Garage Oranmore returning your callback request.`)}
                        target="_blank"
                        rel="noreferrer"
                        className={waBtn}
                        title="Open WhatsApp chat with this customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                      <StatusPill status={cb.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-ink-300 text-center py-8 text-sm">No callback requests.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: ROADSIDE ASSISTANCE INBOX */}
        {activeTab === 'roadside' && (
          <div className="card-dark p-6 sm:p-8 space-y-5">
            <h2 className="font-display text-xl font-bold text-white">Roadside Emergency Requests</h2>
            <div className="space-y-3">
              {roadside.length > 0 ? (
                roadside.map((rs) => (
                  <div key={rs.id} className="bg-ink-950/60 p-5 rounded-xl border border-white/10 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-amber-400 font-bold">{rs.referenceNumber}</span>
                          <StatusPill status={rs.status} />
                        </div>
                        <h3 className="font-bold text-white text-base">{rs.name} <span className="text-ink-300 font-normal">({rs.phone})</span></h3>
                        <div className="text-ink-200 font-bold flex items-center gap-1.5 text-sm">
                          <MapPin className="w-4 h-4 text-brand-400" />
                          Location: {rs.currentLocation}
                        </div>
                      </div>
                      <span className="text-[11px] bg-brand-500/15 text-brand-400 border border-brand-500/30 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                        {rs.problemType.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="text-ink-300 text-sm">
                      Vehicle: {rs.vehicleMakeModel} ({rs.vehicleRegistration}) | Can Move: {rs.vehicleCanMove ? 'Yes' : 'No'}
                    </div>

                    <div className="pt-1">
                      <a
                        href={waLink(rs.phone, `Hi ${rs.name}, this is Friends Garage Oranmore — we've received your roadside request ${rs.referenceNumber} and are on our way.`)}
                        target="_blank"
                        rel="noreferrer"
                        className={waBtn}
                        title="Open WhatsApp chat with this customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp Customer
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-ink-300 text-center py-8 text-sm">No active roadside emergency requests.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: BLOCKED DATES MANAGER */}
        {activeTab === 'blocked' && (
          <div className="card-dark p-6 sm:p-8 space-y-8">
            <h2 className="font-display text-xl font-bold text-white">Workshop Blocked Dates & Holidays</h2>

            <form onSubmit={handleAddBlockedDate} className="flex flex-wrap gap-4 bg-ink-950/60 p-5 rounded-xl border border-white/10 items-end">
              <div>
                <label className="label-dark">Select Date to Block</label>
                <input
                  type="date"
                  required
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="input-dark"
                />
              </div>

              <div className="flex-1 min-w-[220px]">
                <label className="label-dark">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Holiday / Staff Training"
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="input-dark"
                />
              </div>

              <button type="submit" className="btn btn-primary">
                <Plus className="w-4 h-4" />
                <span>Add Blocked Date</span>
              </button>
            </form>

            <div className="space-y-3">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Currently Blocked Calendar Dates</h3>
              {blockedDates.length > 0 ? (
                blockedDates.map((bd) => (
                  <div key={bd.id} className="bg-ink-950/60 p-4 rounded-xl border border-white/10 flex justify-between items-center gap-3">
                    <div>
                      <span className="font-mono font-bold text-white block">{bd.date}</span>
                      <span className="text-ink-300 text-sm">{bd.reason}</span>
                    </div>

                    <button
                      onClick={() => handleDeleteBlockedDate(bd.id)}
                      className={`${ghostBtn} text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20 hover:text-red-300`}
                      title="Remove blocked date"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-ink-300 text-sm py-2">No dates are currently blocked.</div>
              )}
            </div>
          </div>
        )}

        {/* TAB 6: SITE SETTINGS MANAGER */}
        {activeTab === 'settings' && settings && (
          <div className="card-dark p-6 sm:p-8 space-y-8">
            <h2 className="font-display text-xl font-bold text-white">Garage Settings & Opening Hours Note</h2>

            <form onSubmit={handleSaveSettings} className="space-y-5 max-w-xl">
              <div>
                <label className="label-dark">Garage Operating Name</label>
                <input
                  type="text"
                  value={settings.garageName}
                  onChange={(e) => setSettings({ ...settings, garageName: e.target.value })}
                  className="input-dark"
                />
              </div>

              <div>
                <label className="label-dark">Saturday Opening Hours Note</label>
                <input
                  type="text"
                  value={settings.saturdayHoursNote}
                  onChange={(e) => setSettings({ ...settings, saturdayHoursNote: e.target.value })}
                  className="input-dark"
                />
                <span className="text-xs text-ink-300 block mt-1.5">
                  Editable placeholder as specified for Saturday hours.
                </span>
              </div>

              <div className="sm:col-span-2">
                <label className="label-dark">Roadside Dispatch Hours Note</label>
                <input
                  type="text"
                  value={settings.roadsideHoursNote || ''}
                  onChange={(e) => setSettings({ ...settings, roadsideHoursNote: e.target.value })}
                  className="input-dark"
                />
                <span className="text-xs text-ink-300 block mt-1.5">
                  Shown on the roadside page above the dispatch form — tells customers when emergency recovery operates.
                </span>
              </div>

              <div>
                <label className="label-dark">Telephone Contact Number</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="input-dark"
                />
              </div>

              <div>
                <label className="label-dark">Mobile Emergency Line</label>
                <input
                  type="text"
                  value={settings.mobile}
                  onChange={(e) => setSettings({ ...settings, mobile: e.target.value })}
                  className="input-dark"
                />
              </div>

              {/* Hero Video Background Settings */}
              <div className="pt-5 border-t border-white/10 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableHeroVideo"
                    checked={settings.enableHeroVideo !== false}
                    onChange={(e) => setSettings({ ...settings, enableHeroVideo: e.target.checked })}
                    className="w-4 h-4 accent-brand-500 cursor-pointer"
                  />
                  <label htmlFor="enableHeroVideo" className="font-bold text-white text-sm cursor-pointer">
                    Enable Live Hero Video Background
                  </label>
                </div>

                <div>
                  <label className="label-dark">Workshop Hero Video URL (.mp4 or stream link)</label>
                  <input
                    type="url"
                    placeholder="https://your-domain.com/video-oficina.mp4"
                    value={settings.heroVideoUrl || ''}
                    onChange={(e) => setSettings({ ...settings, heroVideoUrl: e.target.value })}
                    className="input-dark"
                  />
                  <span className="text-xs text-ink-300 block mt-1.5">
                    You can record a video of your workshop (mechanics at work, lifts, tools), upload it online, and paste the MP4 link here!
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="autoConfirm"
                  checked={settings.autoConfirmBookings}
                  onChange={(e) => setSettings({ ...settings, autoConfirmBookings: e.target.checked })}
                  className="w-4 h-4 accent-brand-500 cursor-pointer"
                />
                <label htmlFor="autoConfirm" className="font-bold text-white text-sm cursor-pointer">
                  Auto-confirm online bookings instantly
                </label>
              </div>

              {/* AI Assistant — bring your own key */}
              <div className="bg-ink-950/60 p-5 rounded-xl border border-white/10 space-y-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-brand-400" />
                  <span className="font-bold text-white text-sm">AI Assistant (Bring Your Own Key)</span>
                </div>
                <p className="text-xs text-ink-300 leading-relaxed">
                  Paste a free Gemini API key (from <span className="font-mono text-brand-400">aistudio.google.com/apikey</span>) to enable the AI Assistant tab.
                  Stored in the workshop database — never shown on the public site.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="label-dark">Gemini API Key</label>
                    <input
                      type="password"
                      placeholder="AIzaSy…"
                      value={settings.geminiApiKey || ''}
                      onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
                      className="input-dark font-mono"
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className="label-dark">Model (optional)</label>
                    <input
                      type="text"
                      placeholder="gemini-3.6-flash"
                      value={settings.geminiModel || ''}
                      onChange={(e) => setSettings({ ...settings, geminiModel: e.target.value })}
                      className="input-dark font-mono"
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary">
                <Save className="w-4 h-4" />
                <span>Save Garage Settings</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 7: AI ASSISTANT */}
        {activeTab === 'assistant' && (
          <div className="card-dark p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">Workshop AI Assistant</h2>
                <p className="text-sm text-ink-300">Ask in plain language: search customers, create or move bookings (in bulk), block dates, get stats.</p>
              </div>
            </div>

            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {chat.length === 0 && (
                <div className="text-sm text-ink-300 bg-ink-950/60 border border-white/10 rounded-xl p-4 space-y-2">
                  <p className="font-bold text-white">Try for example:</p>
                  <p>• "What bookings do we have on Friday?"</p>
                  <p>• "Find the customer with reg 201-G-4819"</p>
                  <p>• "Add a phone booking: Mary, 087 1234567, brakes, tomorrow 10:00"</p>
                  <p>• "Block next Monday — staff training"</p>
                </div>
              )}
              {chat.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-brand-500 text-white rounded-br-sm'
                      : 'bg-ink-950/60 border border-white/10 text-ink-200 rounded-bl-sm'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatBusy && <div className="text-sm text-ink-300 italic">Assistant is thinking…</div>}
            </div>

            <form onSubmit={handleChatSend} className="flex gap-2 pt-2 border-t border-white/10">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a request, e.g. 'book John for tyres on Tuesday 14:30'…"
                className="input-dark flex-1"
              />
              <button type="submit" disabled={chatBusy} className="btn btn-primary !px-4">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
