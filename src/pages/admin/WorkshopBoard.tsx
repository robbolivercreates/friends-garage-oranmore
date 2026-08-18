import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { api } from './api';
import { fmtPhone } from './format';

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
  displayPlate?: string;
  workflowStatus: string;
  bay: number | null;
  technician: string | null;
  problemDescription: string;
}

interface Column {
  id: string;
  label: string;
  short: string;
  accent: string; // tailwind classes for the header tint
  dot: string;
}

const COLUMNS: Column[] = [
  { id: 'booked_in', label: 'Booked In', short: 'Booked In', accent: 'bg-slate-400/10 border-slate-400/25 text-slate-300', dot: 'bg-slate-400' },
  { id: 'diagnosing', label: 'In Bay / Diagnosis', short: 'In Bay', accent: 'bg-sky-400/10 border-sky-400/25 text-sky-300', dot: 'bg-sky-400' },
  { id: 'waiting_parts', label: 'Waiting on Parts', short: 'Parts', accent: 'bg-amber-400/10 border-amber-400/25 text-amber-300', dot: 'bg-amber-400' },
  { id: 'in_progress', label: 'Work in Progress', short: 'In Progress', accent: 'bg-brand-500/10 border-brand-500/30 text-brand-400', dot: 'bg-brand-500' },
  { id: 'quality_check', label: 'Quality Check', short: 'QC', accent: 'bg-violet-400/10 border-violet-400/25 text-violet-300', dot: 'bg-violet-400' },
  { id: 'ready', label: 'Ready', short: 'Ready', accent: 'bg-emerald-400/10 border-emerald-400/25 text-emerald-300', dot: 'bg-emerald-400' }
];

const BAYS = [1, 2, 3, 4];

interface WorkshopBoardProps {
  /** Optional: open a booking in the Bookings tab when a card is clicked. */
  onOpenBooking?: (referenceNumber: string) => void;
  /** Optional: open the manual booking form (walk-in) — used by empty states. */
  onAddWalkIn?: () => void;
}

/** Trello-simple live view of every car on the workshop floor. */
export const WorkshopBoard: React.FC<WorkshopBoardProps> = ({ onOpenBooking, onAddWalkIn }) => {
  const [cards, setCards] = useState<WorkshopCard[]>([]);
  const [team, setTeam] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [confirmCollectId, setConfirmCollectId] = useState<string | null>(null);
  const [undoCard, setUndoCard] = useState<WorkshopCard | null>(null);
  const [focusBayId, setFocusBayId] = useState<string | null>(null);
  const [jumpMenuId, setJumpMenuId] = useState<string | null>(null);

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
    // Real-bay moment: landing in Diagnosis without a bay → focus the bay picker
    if (next.id === 'diagnosing' && card.bay == null) {
      setFocusBayId(card.id);
      setTimeout(() => setFocusBayId(null), 4000);
    }
  };

  const collect = (card: WorkshopCard) => {
    setConfirmCollectId(null);
    setUndoCard(card);
    setCards(prev => prev.filter(c => c.id !== card.id));
    api(`/api/bookings/${card.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ workflowStatus: 'collected', status: 'completed' })
    }).catch(() => load(true));
    setTimeout(() => setUndoCard(prev => (prev?.id === card.id ? null : prev)), 8000);
  };

  const undoCollect = () => {
    if (!undoCard) return;
    const card = undoCard;
    setUndoCard(null);
    setCards(prev => [...prev, card]);
    api(`/api/bookings/${card.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ workflowStatus: card.workflowStatus, status: card.bookingStatus })
    }).catch(() => load(true));
  };

  const colIndex = (id: string) => COLUMNS.findIndex(c => c.id === id);

  const todayStr = new Date().toISOString().split('T')[0];
  const dayMs = 86400000;
  const fmtDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
  /** "2 min ago" style — faster to read on a wall-mounted screen. */
  const fmtAgo = (date: Date) => {
    const mins = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 min ago';
    if (mins < 60) return `${mins} min ago`;
    return date.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });
  };
  const daysOnBoard = (card: WorkshopCard) =>
    Math.max(0, Math.floor((Date.parse(todayStr) - Date.parse(card.bookingDate)) / dayMs));
  /** Aging cue: overdue in Booked In, due today, >3 days in any stage, uncollected in Ready. */
  const aging = (card: WorkshopCard): 'overdue' | 'due_today' | 'aging' | 'awaiting' | null => {
    if (card.bookingStatus === 'completed' || card.bookingStatus === 'cancelled') return null;
    if (card.workflowStatus === 'booked_in' && card.bookingDate < todayStr) return 'overdue';
    if (card.workflowStatus === 'booked_in' && card.bookingDate === todayStr) return 'due_today';
    if (card.workflowStatus === 'ready' && daysOnBoard(card) > 3) return 'awaiting';
    if (card.workflowStatus !== 'ready' && daysOnBoard(card) > 3) return 'aging';
    return null;
  };

  return (
    <div className="space-y-5">
      {/* Board header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Workshop Floor</h2>
          <p className="text-sm text-ink-300">
            {cards.length} active {cards.length === 1 ? 'booking' : 'bookings'} on the board
            {lastSync && <> · synced {fmtAgo(lastSync)}</>}
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

      {/* Undo toast after collecting a car */}
      <AnimatePresence>
        {undoCard && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="card-dark p-3.5 flex items-center justify-between gap-3 border-emerald-400/30"
          >
            <span className="text-sm text-ink-200">
              <span className="font-mono font-bold text-white">{undoCard.displayPlate || undoCard.vehicleRegistration}</span> marked as collected
            </span>
            <button
              onClick={undoCollect}
              className="text-xs font-bold text-brand-400 hover:text-brand-500 underline underline-offset-2 transition-colors shrink-0"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {COLUMNS.map(c => (
            <div key={c.id} className="card-dark h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start">
          {COLUMNS.map((col) => {
            const colCards = cards.filter(c => c.workflowStatus === col.id);
            // Only the column right after the furthest card gets a guidance hint —
            // five identical empty boxes read as clutter, not help.
            const furthestIdx = cards.length
              ? Math.max(...cards.map(c => colIndex(c.workflowStatus)))
              : -1;
            const showGuidance = colCards.length === 0 && col.id !== 'booked_in' && colIndex(col.id) === furthestIdx + 1;
            return (
              <div key={col.id} className="space-y-3">
                <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-wider whitespace-nowrap sticky top-[118px] z-10 bg-ink-950/95 backdrop-blur-sm ${col.accent}`}>
                  <span className="flex items-center gap-2 min-w-0 truncate">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${col.dot}`} />
                    {col.label}
                  </span>
                  <span className="font-mono shrink-0">{colCards.length}</span>
                </div>

                <AnimatePresence mode="popLayout">
                  {colCards.map((card) => {
                    const age = aging(card);
                    return (
                    <motion.div
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className={`card-dark p-4 space-y-3 ${
                        age === 'overdue'
                          ? '!border-red-400/50'
                          : age === 'aging' || age === 'awaiting'
                          ? '!border-amber-400/50'
                          : age === 'due_today'
                          ? '!border-emerald-400/40'
                          : ''
                      }`}
                    >
                      {/* Plate first — full-width, hard no-wrap, click-through to the booking */}
                      <button
                        onClick={() => onOpenBooking?.(card.referenceNumber)}
                        title={onOpenBooking ? `Open booking ${card.referenceNumber}` : undefined}
                        className="font-mono font-extrabold text-white text-base tracking-wide whitespace-nowrap truncate block text-left w-full hover:text-brand-400 transition-colors cursor-pointer"
                      >
                        {card.displayPlate || card.vehicleRegistration}
                      </button>
                      {age === 'overdue' && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-red-300 bg-red-400/10 border border-red-400/30 px-2 py-0.5 rounded-full">
                          {daysOnBoard(card) > 0 ? `${daysOnBoard(card)} days overdue` : 'Overdue'}
                        </span>
                      )}
                      {age === 'due_today' && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-400/10 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                          Arriving today
                        </span>
                      )}
                      {age === 'aging' && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                          {daysOnBoard(card)} days on board
                        </span>
                      )}
                      {age === 'awaiting' && (
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full">
                          {daysOnBoard(card)} days awaiting collection
                        </span>
                      )}

                      {/* Card body — whole surface opens the booking (controls excluded) */}
                      <div
                        onClick={() => onOpenBooking?.(card.referenceNumber)}
                        className={`space-y-0.5 ${onOpenBooking ? 'cursor-pointer' : ''}`}
                        title={onOpenBooking ? `Open booking ${card.referenceNumber}` : undefined}
                      >
                        <div className="text-sm font-bold text-white">{(card.customerName || '').trim() || 'Customer'}</div>
                        {card.phone && (
                          <a
                            href={`tel:${card.phone.replace(/\s+/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-xs text-sky-400 hover:text-sky-300 block w-fit transition-colors"
                            title={`Call ${card.customerName}`}
                          >
                            {fmtPhone(card.phone)}
                          </a>
                        )}
                        <div className="font-mono text-[10px] text-ink-300">{card.referenceNumber}</div>
                        <div className="text-xs text-ink-200 font-semibold">{card.serviceName}</div>
                        {card.vehicle && <div className="text-xs text-ink-300">{card.vehicle}</div>}
                        <div className="text-xs text-ink-300 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {fmtDate(card.bookingDate)} · {card.bookingTime}
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
                          ref={(el) => { if (el && focusBayId === card.id) el.focus(); }}
                          className={`input-dark !py-1 !px-1.5 !text-[11px] cursor-pointer ${
                            focusBayId === card.id ? '!border-sky-400/60 ring-2 ring-sky-400/20' : ''
                          }`}
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
                        {colIndex(card.workflowStatus) > 0 ? (
                          <button
                            onClick={() => move(card, -1)}
                            aria-label="Move back one stage"
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-ink-300 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" /> Back
                          </button>
                        ) : (
                          <span />
                        )}

                        {card.workflowStatus === 'ready' ? (
                          confirmCollectId === card.id ? (
                            <span className="flex items-center gap-1.5">
                              <button
                                onClick={() => collect(card)}
                                className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Confirm?
                              </button>
                              <button
                                onClick={() => setConfirmCollectId(null)}
                                className="text-[11px] font-bold text-ink-300 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirmCollectId(card.id)}
                              className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Collected
                            </button>
                          )
                        ) : (
                          <span />
                        )}

                        <div className="relative flex items-center">
                          <button
                            onClick={() => move(card, 1)}
                            disabled={colIndex(card.workflowStatus) === COLUMNS.length - 1}
                            aria-label={`Move to ${COLUMNS[colIndex(card.workflowStatus) + 1]?.label ?? 'next stage'}`}
                            className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-bold text-ink-300 hover:text-white hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-colors"
                          >
                            Next: {COLUMNS[colIndex(card.workflowStatus) + 1]?.short} <ChevronRight className="w-4 h-4" />
                          </button>
                          {colIndex(card.workflowStatus) < COLUMNS.length - 2 && (
                            <button
                              onClick={() => setJumpMenuId(jumpMenuId === card.id ? null : card.id)}
                              aria-label="Jump to a later stage"
                              title="Jump to a later stage"
                              className="px-1.5 py-1.5 rounded-lg text-[11px] font-bold text-ink-400 hover:text-white hover:bg-white/10 transition-colors"
                            >
                              ⋯
                            </button>
                          )}
                          {jumpMenuId === card.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setJumpMenuId(null)} />
                              <div className="absolute left-0 bottom-full mb-1 z-20 card-dark !rounded-xl p-1.5 min-w-[150px] shadow-2xl">
                              {COLUMNS.slice(colIndex(card.workflowStatus) + 2).map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => { patchCard(card.id, { workflowStatus: c.id }); setJumpMenuId(null); }}
                                  className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-ink-200 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                                >
                                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                                  Jump to {c.label}
                                </button>
                              ))}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                    );
                  })}
                </AnimatePresence>

                {colCards.length === 0 && col.id === 'booked_in' && (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center space-y-2.5">
                    <p className="text-[11px] text-ink-300 leading-relaxed">
                      Cars land here automatically when a booking comes in — or add a walk-in yourself:
                    </p>
                    {onAddWalkIn && (
                      <button
                        onClick={onAddWalkIn}
                        className="text-[11px] font-bold text-brand-400 hover:text-brand-500 underline underline-offset-2 transition-colors"
                      >
                        ＋ Add walk-in booking
                      </button>
                    )}
                  </div>
                )}

                {showGuidance && (
                  <div className="rounded-xl border border-dashed border-white/10 p-4 text-center text-[11px] text-ink-400">
                    Nothing here — use Next › on a card in {COLUMNS[colIndex(col.id) - 1]?.label ?? 'the previous stage'}
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
