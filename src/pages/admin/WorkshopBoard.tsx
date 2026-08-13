import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2,
  Wrench
} from 'lucide-react';
import { api } from './api';

interface WorkshopCard {
  id: string;
  referenceNumber: string;
  customerName: string;
  phone: string;
  vehicleRegistration: string;
  vehicle: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  bookingStatus: string;
  workflowStatus: string;
  bay: number | null;
  technician: string | null;
  problemDescription: string;
}

interface Column {
  id: string;
  label: string;
  accent: string; // tailwind classes for the header tint
  dot: string;
}

const COLUMNS: Column[] = [
  { id: 'booked_in', label: 'Booked In', accent: 'bg-slate-400/10 border-slate-400/25 text-slate-300', dot: 'bg-slate-400' },
  { id: 'diagnosing', label: 'In Bay / Diagnosis', accent: 'bg-sky-400/10 border-sky-400/25 text-sky-300', dot: 'bg-sky-400' },
  { id: 'waiting_parts', label: 'Waiting on Parts', accent: 'bg-amber-400/10 border-amber-400/25 text-amber-300', dot: 'bg-amber-400' },
  { id: 'in_progress', label: 'Work in Progress', accent: 'bg-brand-500/10 border-brand-500/30 text-brand-400', dot: 'bg-brand-500' },
  { id: 'quality_check', label: 'Quality Check', accent: 'bg-violet-400/10 border-violet-400/25 text-violet-300', dot: 'bg-violet-400' },
  { id: 'ready', label: 'Ready for Collection', accent: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-300', dot: 'bg-emerald-400' }
];

const BAYS = [1, 2, 3, 4];

/** Trello-simple live view of every car on the workshop floor. */
export const WorkshopBoard: React.FC = () => {
  const [cards, setCards] = useState<WorkshopCard[]>([]);
  const [team, setTeam] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api('/api/workshop');
      if (!res.ok) throw new Error('bad status');
      setCards(await res.json());
      setFailed(false);
      setLastSync(new Date());
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    fetch('/api/team').then(r => (r.ok ? r.json() : [])).then(setTeam).catch(() => {});
    const timer = setInterval(() => load(true), 30000);
    return () => clearInterval(timer);
  }, [load]);

  const patchCard = async (id: string, patch: Record<string, any>) => {
    // Optimistic update
    setCards(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    try {
      await api(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    } catch {
      load(true); // revert on failure
    }
  };

  const move = (card: WorkshopCard, dir: 1 | -1) => {
    const idx = COLUMNS.findIndex(c => c.id === card.workflowStatus);
    const next = COLUMNS[idx + dir];
    if (!next) return;
    patchCard(card.id, { workflowStatus: next.id });
  };

  const collect = (card: WorkshopCard) => {
    setCards(prev => prev.filter(c => c.id !== card.id));
    api(`/api/bookings/${card.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ workflowStatus: 'collected', status: 'completed' })
    }).catch(() => load(true));
  };

  const colIndex = (id: string) => COLUMNS.findIndex(c => c.id === id);

  return (
    <div className="space-y-5">
      {/* Board header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Workshop Floor</h2>
          <p className="text-sm text-ink-300">
            {cards.length} {cards.length === 1 ? 'car' : ' cars'} on the board
            {lastSync && <> · synced {lastSync.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}</>}
          </p>
        </div>
        <button onClick={() => load()} className="btn btn-outline-light !px-4 !py-2 !text-xs">
          <RefreshCw className="w-3.5 h-3.5 text-brand-400" />
          Refresh
        </button>
      </div>

      {failed && (
        <div className="card-dark p-4 text-sm text-amber-300 border-amber-400/30">
          Could not load the board. <button onClick={() => load()} className="underline font-bold">Retry</button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {COLUMNS.map(c => (
            <div key={c.id} className="card-dark h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colCards = cards.filter(c => c.workflowStatus === col.id);
            return (
              <div key={col.id} className="space-y-3">
                <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider ${col.accent}`}>
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                    {col.label}
                  </span>
                  <span className="font-mono">{colCards.length}</span>
                </div>

                <AnimatePresence mode="popLayout">
                  {colCards.map((card) => (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="card-dark p-4 space-y-3"
                    >
                      {/* Plate first — the most scannable element */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-mono font-extrabold text-white text-sm tracking-wide leading-tight whitespace-nowrap">
                          {card.vehicleRegistration}
                        </span>
                        <span className="font-mono text-[10px] text-ink-300 shrink-0">{card.referenceNumber}</span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-sm font-bold text-white">{card.customerName}</div>
                        <div className="text-xs text-brand-400 font-semibold">{card.serviceName}</div>
                        {card.vehicle && <div className="text-xs text-ink-300">{card.vehicle}</div>}
                        <div className="text-xs text-ink-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {card.bookingDate} · {card.bookingTime}
                        </div>
                        {card.problemDescription && (
                          <div className="text-xs text-ink-300 italic line-clamp-2 pt-0.5">“{card.problemDescription}”</div>
                        )}
                      </div>

                      {/* Bay + technician */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <select
                          value={card.bay ?? ''}
                          onChange={(e) => patchCard(card.id, { bay: e.target.value ? Number(e.target.value) : null })}
                          className="input-dark !py-1 !px-1.5 !text-[11px] cursor-pointer"
                          title="Assign bay"
                        >
                          <option value="">Bay —</option>
                          {BAYS.map(b => <option key={b} value={b}>Bay {b}</option>)}
                        </select>
                        <select
                          value={card.technician ?? ''}
                          onChange={(e) => patchCard(card.id, { technician: e.target.value || null })}
                          className="input-dark !py-1 !px-1.5 !text-[11px] cursor-pointer"
                          title="Assign technician"
                        >
                          <option value="">Tech —</option>
                          {team.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                      </div>

                      {/* Move controls */}
                      <div className="flex items-center justify-between pt-1 border-t border-white/10">
                        <button
                          onClick={() => move(card, -1)}
                          disabled={colIndex(card.workflowStatus) === 0}
                          className="p-1.5 rounded-lg text-ink-300 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                          title="Move back"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>

                        {card.workflowStatus === 'ready' ? (
                          <button
                            onClick={() => collect(card)}
                            className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                          </button>
                        ) : (
                          <Wrench className="w-3.5 h-3.5 text-ink-600" />
                        )}

                        <button
                          onClick={() => move(card, 1)}
                          disabled={colIndex(card.workflowStatus) === COLUMNS.length - 1}
                          className="p-1.5 rounded-lg text-ink-300 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                          title="Move forward"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {colCards.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] text-ink-400">
                    No cars here
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WorkshopBoard;
