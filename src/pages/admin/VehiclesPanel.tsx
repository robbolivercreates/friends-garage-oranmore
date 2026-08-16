import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  CalendarDays,
  Car,
  Check,
  Clock,
  Loader2,
  Plus,
  Search,
  Trash2,
  User,
  Wrench
} from 'lucide-react';
import { api } from './api';
import { MAKES } from '../../data/carData';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Vehicle {
  id: string;
  registration: string;
  displayPlate: string;
  make?: string;
  model?: string;
  engine?: string;
  year?: string;
  fuelType?: string;
  transmission?: string;
  colour?: string;
  county?: string;
  plateFormat?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  notes?: string;
  lastSeenAt?: string;
}

interface ServiceRecord {
  id: string;
  date?: string;
  serviceName: string;
  technician?: string;
  partsUsed: string[];
  notes?: string;
  bookingRef?: string;
}

interface LinkedBooking {
  referenceNumber: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  status: string;
}

interface ParsedPlate {
  format: string;
  registration: string;
  year?: number;
  half?: 1 | 2;
  county?: string;
  countyCode?: string;
  needsReview: boolean;
  note?: string;
}

interface ProfileResponse {
  vehicle: Vehicle;
  displayPlate: string;
  serviceHistory: ServiceRecord[];
  bookings: LinkedBooking[];
}

interface NotFoundResponse {
  error: string;
  parsed: ParsedPlate;
  displayPlate: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface FirstVisitForm {
  plateInput: string;
  displayPlate: string;
  parsed: ParsedPlate | null;
  make: string;
  model: string;
  engine: string;
  year: string;
  county: string;
  fuelType: string;
  transmission: string;
  colour: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  notes: string;
  saving: boolean;
  error: string;
}

interface RecordForm {
  serviceChoice: string;
  customService: string;
  technician: string;
  date: string;
  parts: string;
  notes: string;
}

type View = 'browse' | 'profile' | 'firstVisit';
type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const normalizeReg = (s: string): string => s.toUpperCase().replace(/[^A-Z0-9]/g, '');

const todayStr = (): string => new Date().toISOString().slice(0, 10);

const fmtDate = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso?: string): string => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString('en-IE', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const FORMAT_LABELS: Record<string, string> = {
  irish_current: 'Irish 2013+',
  irish_87_12: 'Irish 1987–2012',
  irish_pre87: 'Pre-1987',
  uk_current: 'UK import',
  uk_prefix: 'UK import (pre-2001)',
  unknown: 'Unknown format'
};

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'Electric'];
const TRANSMISSIONS = ['Manual', 'Automatic', 'Semi-Automatic'];
const COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry',
  'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth',
  'Mayo', 'Meath', 'Monaghan', 'Offaly', 'Roscommon', 'Sligo', 'Tipperary',
  'Waterford', 'Westmeath', 'Wexford', 'Wicklow', 'United Kingdom (import)'
];

const CUSTOM_VALUE = '__custom__';
const OTHER_SERVICE = '__other__';

const emptyRecordForm = (): RecordForm => ({
  serviceChoice: '',
  customService: '',
  technician: '',
  date: todayStr(),
  parts: '',
  notes: ''
});

const bookingPillClass = (status: string): string => {
  const map: Record<string, string> = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    confirmed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    completed: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    cancelled: 'bg-red-500/10 text-red-400 border-red-500/30',
    rescheduled: 'bg-white/5 text-ink-300 border-white/15'
  };
  return map[status] ?? 'bg-white/5 text-ink-300 border-white/15';
};

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

const Badge: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-xs font-mono text-ink-200">
    {children}
  </span>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="label-dark">{children}</label>
);

/** Select that falls back to a free-text input via "Other (custom)…". */
const SmartSelect: React.FC<{
  value: string;
  options: string[];
  placeholder: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
}> = ({ value, options, placeholder, disabled, onCommit }) => {
  const [customOpen, setCustomOpen] = useState(value !== '' && !options.includes(value));
  const [draft, setDraft] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setDraft(value);
      setCustomOpen(value !== '' && !options.includes(value));
    }
  }, [value, options]);

  if (customOpen) {
    return (
      <input
        type="text"
        autoFocus
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => onCommit(draft.trim())}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          if (e.key === 'Escape') { setDraft(value); setCustomOpen(false); }
        }}
        className="input-dark"
        disabled={disabled}
      />
    );
  }

  return (
    <select
      value={options.includes(value) ? value : ''}
      onChange={(e) => {
        if (e.target.value === CUSTOM_VALUE) {
          setDraft('');
          setCustomOpen(true);
        } else {
          onCommit(e.target.value);
        }
      }}
      className="input-dark"
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
      <option value={CUSTOM_VALUE}>Other (custom)…</option>
    </select>
  );
};

/** Plain select used for fixed option lists (fuel, transmission, county). */
const AutoSelect: React.FC<{
  value: string;
  options: string[];
  placeholder: string;
  onCommit: (value: string) => void;
}> = ({ value, options, placeholder, onCommit }) => (
  <select value={value} onChange={(e) => onCommit(e.target.value)} className="input-dark">
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o} value={o}>{o}</option>
    ))}
    {value !== '' && !options.includes(value) && (
      <option value={value}>{value}</option>
    )}
  </select>
);

/** Text input that commits on blur/Enter (used for profile auto-save). */
const AutoText: React.FC<{
  value: string;
  placeholder?: string;
  mono?: boolean;
  onCommit: (value: string) => void;
}> = ({ value, placeholder, mono, onCommit }) => {
  const [draft, setDraft] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setDraft(value);
    }
  }, [value]);

  return (
    <input
      type="text"
      value={draft}
      placeholder={placeholder}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const v = draft.trim();
        if (v !== value) onCommit(v);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
      className={`input-dark${mono ? ' font-mono' : ''}`}
    />
  );
};

/* ------------------------------------------------------------------ */
/* Main panel                                                          */
/* ------------------------------------------------------------------ */

export interface VehicleBookingPrefill {
  customerName?: string;
  phone?: string;
  email?: string;
  vehicleRegistration?: string;
}

interface VehiclesPanelProps {
  /** Hand off to the Bookings tab manual form, prefilled with this vehicle. */
  onBookVehicle?: (prefill: VehicleBookingPrefill) => void;
}

const VehiclesPanel: React.FC<VehiclesPanelProps> = ({ onBookVehicle }) => {
  const [view, setView] = useState<View>('browse');

  // Top plate search
  const [regInput, setRegInput] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [lookupError, setLookupError] = useState('');

  // Browsable list
  const [list, setList] = useState<Vehicle[] | null>(null);
  const [listQuery, setListQuery] = useState('');
  const [listError, setListError] = useState('');

  // Profile
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [saveState, setSaveState] = useState<SaveState>('idle');

  // First visit
  const [firstVisit, setFirstVisit] = useState<FirstVisitForm | null>(null);

  // Add-record card
  const [recordForm, setRecordForm] = useState<RecordForm>(emptyRecordForm());
  const [recordBusy, setRecordBusy] = useState(false);
  const [recordError, setRecordError] = useState('');
  const [historyError, setHistoryError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState('');

  // Dropdown sources
  const [serviceNames, setServiceNames] = useState<string[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);

  const lookupSeq = useRef(0);
  const activeRegRef = useRef('');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- data loading ---------- */

  const loadList = useCallback(async (q: string) => {
    try {
      const res = await api(`/api/vehicles${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      if (!res.ok) throw new Error('list failed');
      setList((await res.json()) as Vehicle[]);
      setListError('');
    } catch {
      setList((prev) => prev ?? []);
      setListError('Could not load vehicles — check your connection.');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { void loadList(listQuery); }, 300);
    return () => clearTimeout(t);
  }, [listQuery, loadList]);

  useEffect(() => {
    (async () => {
      try {
        const [sRes, tRes] = await Promise.all([api('/api/services'), api('/api/team')]);
        if (sRes.ok) {
          const raw = (await sRes.json()) as Array<{ name?: string }>;
          setServiceNames(raw.map((s) => s.name ?? '').filter((n) => n !== ''));
        }
        if (tRes.ok) setTeam((await tRes.json()) as TeamMember[]);
      } catch {
        /* dropdowns still work via free-text fallback */
      }
    })();
  }, []);

  const loadProfile = useCallback(async (reg: string) => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const res = await api(`/api/vehicles/${encodeURIComponent(reg)}`);
      if (!res.ok) throw new Error('profile failed');
      const data = (await res.json()) as ProfileResponse;
      setProfile(data);
      setView('profile');
      setSaveState('idle');
      setHistoryError('');
      setConfirmDeleteId('');
    } catch {
      setProfileError('Could not load this vehicle — try again.');
    } finally {
      setProfileLoading(false);
    }
  }, []);

  /* ---------- top plate lookup (debounced) ---------- */

  const openFirstVisit = useCallback((plate: string, parsed: ParsedPlate | null) => {
    setFirstVisit({
      plateInput: plate, // already display-formatted by the server when possible
      displayPlate: plate,
      parsed,
      make: '',
      model: '',
      engine: '',
      year: parsed?.year ? String(parsed.year) : '',
      county: parsed?.county ?? '',
      fuelType: '',
      transmission: '',
      colour: '',
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      notes: '',
      saving: false,
      error: ''
    });
    setView('firstVisit');
  }, []);

  // Keep the form's detection banner above the fold when a view switches
  // (the typed reg stays in the search box so staff keep their context)
  useEffect(() => {
    if (view === 'firstVisit' || view === 'profile') {
      window.scrollTo({ top: 150, behavior: 'smooth' });
    }
  }, [view]);

  useEffect(() => {
    const norm = normalizeReg(regInput);
    if (norm.length < 4) {
      setLookupState('idle');
      setLookupError('');
      return;
    }
    if (norm === activeRegRef.current) return;
    const seq = ++lookupSeq.current;
    setLookupState('loading');
    const t = setTimeout(async () => {
      try {
        const res = await api(`/api/vehicles/${encodeURIComponent(norm)}`);
        if (seq !== lookupSeq.current) return;
        if (res.ok) {
          const data = (await res.json()) as ProfileResponse;
          activeRegRef.current = norm;
          setProfile(data);
          setView('profile');
          setSaveState('idle');
          setLookupState('idle');
        } else if (res.status === 404) {
          const data = (await res.json()) as NotFoundResponse;
          activeRegRef.current = norm;
          openFirstVisit(data.displayPlate || norm, data.parsed ?? null);
          setLookupState('idle');
        } else {
          setLookupState('error');
          setLookupError('Lookup failed — server error. Try again.');
        }
      } catch {
        if (seq !== lookupSeq.current) return;
        setLookupState('error');
        setLookupError('Lookup failed — check your connection.');
      }
    }, 400);
    return () => clearTimeout(t);
  }, [regInput, openFirstVisit]);

  /* ---------- live plate parse inside the first-visit form ---------- */

  const firstVisitPlate = firstVisit?.plateInput ?? '';
  useEffect(() => {
    if (view !== 'firstVisit') return;
    const norm = normalizeReg(firstVisitPlate);
    if (norm.length < 3) return;
    const t = setTimeout(async () => {
      try {
        const res = await api(`/api/plates/parse/${encodeURIComponent(norm)}`);
        if (!res.ok) return;
        const data = (await res.json()) as ParsedPlate & { displayPlate?: string };
        setFirstVisit((fv) => {
          if (!fv || normalizeReg(fv.plateInput) !== norm) return fv;
          return {
            ...fv,
            parsed: data,
            displayPlate: data.displayPlate || norm,
            year: fv.year || (data.year ? String(data.year) : ''),
            county: fv.county || (data.county ?? '')
          };
        });
      } catch {
        /* live parse is best-effort */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [firstVisitPlate, view]);

  /* ---------- profile auto-save ---------- */

  const commitPatch = useCallback((patch: Partial<Vehicle>) => {
    setProfile((p) => (p ? { ...p, vehicle: { ...p.vehicle, ...patch } } : p));
    const reg = profile?.vehicle.registration;
    if (!reg) return;
    setSaveState('saving');
    (async () => {
      try {
        const res = await api(`/api/vehicles/${encodeURIComponent(reg)}`, {
          method: 'PATCH',
          body: JSON.stringify(patch)
        });
        if (!res.ok) throw new Error('patch failed');
        const updated = (await res.json()) as Vehicle;
        setProfile((p) => (p ? { ...p, vehicle: { ...p.vehicle, ...updated } } : p));
        setSaveState('saved');
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveState('idle'), 1600);
      } catch {
        setSaveState('error');
      }
    })();
  }, [profile?.vehicle.registration]);

  const commitMake = (make: string) => {
    if (!profile) return;
    const mk = MAKES.find((m) => m.name === make);
    const modelStillValid = mk?.models.some((mo) => mo.name === (profile.vehicle.model ?? '')) ?? false;
    commitPatch(modelStillValid ? { make } : { make, model: '', engine: '' });
  };

  const commitModel = (model: string) => {
    if (!profile) return;
    const mk = MAKES.find((m) => m.name === (profile.vehicle.make ?? ''));
    const mo = mk?.models.find((x) => x.name === model);
    const engineStillValid = mo?.engines.includes(profile.vehicle.engine ?? '') ?? false;
    commitPatch(engineStillValid ? { model } : { model, engine: '' });
  };

  /* ---------- records ---------- */

  const submitRecord = async () => {
    if (!profile) return;
    const serviceName = recordForm.serviceChoice === OTHER_SERVICE
      ? recordForm.customService.trim()
      : recordForm.serviceChoice;
    if (!serviceName) {
      setRecordError('Pick a service from the list or enter a custom one.');
      return;
    }
    setRecordBusy(true);
    setRecordError('');
    try {
      const res = await api(`/api/vehicles/${encodeURIComponent(profile.vehicle.registration)}/records`, {
        method: 'POST',
        body: JSON.stringify({
          serviceName,
          technician: recordForm.technician || undefined,
          date: recordForm.date || undefined,
          partsUsed: recordForm.parts.split(',').map((p) => p.trim()).filter((p) => p !== ''),
          notes: recordForm.notes.trim()
        })
      });
      if (!res.ok) throw new Error('record failed');
      setRecordForm(emptyRecordForm());
      await loadProfile(profile.vehicle.registration);
    } catch {
      setRecordError('Could not save the record — try again.');
    } finally {
      setRecordBusy(false);
    }
  };

  const deleteRecord = async (id: string) => {
    setHistoryError('');
    try {
      const res = await api(`/api/vehicles/records/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('delete failed');
      setProfile((p) => (p ? { ...p, serviceHistory: p.serviceHistory.filter((r) => r.id !== id) } : p));
      setConfirmDeleteId('');
    } catch {
      setHistoryError('Could not delete that record — try again.');
    }
  };

  /* ---------- first-visit save ---------- */

  const saveFirstVisit = async (thenBook = false) => {
    if (!firstVisit) return;
    const reg = normalizeReg(firstVisit.plateInput);
    if (!reg) {
      setFirstVisit({ ...firstVisit, error: 'A registration is required.' });
      return;
    }
    setFirstVisit({ ...firstVisit, saving: true, error: '' });
    try {
      const res = await api('/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          registration: firstVisit.plateInput,
          make: firstVisit.make,
          model: firstVisit.model,
          engine: firstVisit.engine,
          year: firstVisit.year,
          fuelType: firstVisit.fuelType,
          transmission: firstVisit.transmission,
          colour: firstVisit.colour,
          county: firstVisit.county,
          customerName: firstVisit.customerName,
          customerPhone: firstVisit.customerPhone,
          customerEmail: firstVisit.customerEmail,
          notes: firstVisit.notes
        })
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Save failed');
      }
      activeRegRef.current = reg;
      setRegInput('');
      if (thenBook && onBookVehicle) {
        onBookVehicle({
          customerName: firstVisit.customerName,
          phone: firstVisit.customerPhone,
          email: firstVisit.customerEmail,
          vehicleRegistration: firstVisit.displayPlate || firstVisit.plateInput
        });
      } else {
        await loadProfile(reg);
      }
      void loadList(listQuery);
    } catch (e) {
      setFirstVisit((fv) => (fv ? { ...fv, saving: false, error: e instanceof Error ? e.message : 'Save failed — try again.' } : fv));
    }
  };

  /* ---------- navigation helpers ---------- */

  const goBrowse = () => {
    setView('browse');
    activeRegRef.current = '';
    setLookupState('idle');
    setProfileError('');
    void loadList(listQuery);
  };

  const openVehicle = (v: Vehicle) => {
    activeRegRef.current = normalizeReg(v.registration);
    setRegInput('');
    void loadProfile(v.registration);
  };

  const startManualEntry = () => {
    activeRegRef.current = '';
    openFirstVisit('', null);
  };

  /* ---------- derived dropdown options ---------- */

  const vehicleMake = profile?.vehicle.make ?? '';
  const vehicleModel = profile?.vehicle.model ?? '';
  const profileMakeEntry = MAKES.find((m) => m.name === vehicleMake);
  const profileModelEntry = profileMakeEntry?.models.find((m) => m.name === vehicleModel);

  const fvMakeEntry = firstVisit ? MAKES.find((m) => m.name === firstVisit.make) : undefined;
  const fvModelEntry = firstVisit ? fvMakeEntry?.models.find((m) => m.name === firstVisit.model) : undefined;

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* ---------- TOP: plate search ---------- */}
      <div className="card-dark p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-white">Vehicle Database</h2>
            <p className="text-sm text-ink-300">Type a registration — existing vehicles open instantly, new ones start a first-visit entry.</p>
          </div>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-ink-300 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={regInput}
            onChange={(e) => setRegInput(e.target.value.toUpperCase())}
            placeholder="TYPE A REG — e.g. 241-D-12345"
            className="input-dark font-mono text-lg tracking-widest uppercase !pl-12"
            autoComplete="off"
            spellCheck={false}
          />
          {lookupState === 'loading' && (
            <Loader2 className="w-5 h-5 text-brand-400 animate-spin absolute right-4 top-1/2 -translate-y-1/2" />
          )}
        </div>
        {lookupState === 'error' && (
          <p className="mt-2 text-sm text-red-400 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> {lookupError}
          </p>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* ================= BROWSE ================= */}
        {view === 'browse' && (
          <motion.div
            key="browse"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="card-dark p-5 sm:p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ink-300 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={listQuery}
                  onChange={(e) => setListQuery(e.target.value)}
                  placeholder="Filter by reg, make, model or customer…"
                  className="input-dark !pl-10"
                />
              </div>
              <button type="button" onClick={startManualEntry} className="btn btn-primary whitespace-nowrap">
                <Plus className="w-4 h-4" />
                <span>Register vehicle manually</span>
              </button>
            </div>

            {listError && (
              <p className="mb-3 text-sm text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> {listError}
              </p>
            )}

            {list === null ? (
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-ink-950/60 border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <div className="text-center py-10 text-ink-300">
                <Car className="w-10 h-10 mx-auto mb-3 text-ink-600" />
                <p className="font-bold text-white mb-1">No vehicles found</p>
                <p className="text-sm">{listQuery ? 'Try a different search.' : 'Type a reg above or register one manually to get started.'}</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                {list.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => openVehicle(v)}
                    className="w-full text-left bg-ink-950/60 hover:bg-ink-800 border border-white/10 hover:border-brand-500/40 rounded-xl px-4 py-3 flex items-center gap-4 transition-colors"
                  >
                    <span className="font-mono font-bold text-white text-base tracking-wider whitespace-nowrap">
                      {v.displayPlate || v.registration}
                    </span>
                    <span className="flex-1 min-w-0 truncate text-sm text-ink-200">
                      {[v.make, v.model].filter(Boolean).join(' ') || '—'}
                      {v.year ? <span className="text-ink-300"> · {v.year}</span> : null}
                    </span>
                    <span className="hidden md:block text-sm text-ink-300 truncate max-w-[160px]">
                      {v.customerName ?? ''}
                    </span>
                    <span className="hidden lg:flex items-center gap-1.5 text-xs font-mono text-ink-300 whitespace-nowrap">
                      <Clock className="w-3.5 h-3.5" />
                      {v.lastSeenAt ? fmtDateTime(v.lastSeenAt) : 'never'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* ================= PROFILE ================= */}
        {view === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={goBrowse}
              className="inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to all vehicles
            </button>

            {profileLoading && (
              <div className="card-dark p-6 space-y-3">
                <div className="h-9 w-48 rounded-lg bg-ink-950/80 animate-pulse" />
                <div className="h-24 rounded-xl bg-ink-950/60 animate-pulse" />
                <div className="h-24 rounded-xl bg-ink-950/60 animate-pulse" />
              </div>
            )}

            {profileError && !profileLoading && (
              <div className="card-dark p-6">
                <p className="text-sm text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> {profileError}
                </p>
              </div>
            )}

            {profile && !profileLoading && (
              <>
                {/* Header */}
                <div className="card-dark p-5 sm:p-6 flex flex-wrap items-center gap-4">
                  <span className="font-mono font-bold text-white text-2xl sm:text-3xl tracking-widest">
                    {profile.displayPlate || profile.vehicle.displayPlate || profile.vehicle.registration}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {profile.vehicle.year && <Badge>{profile.vehicle.year}</Badge>}
                    {profile.vehicle.county && <Badge>{profile.vehicle.county}</Badge>}
                    <Badge>{FORMAT_LABELS[profile.vehicle.plateFormat ?? ''] ?? 'Unknown format'}</Badge>
                  </div>
                  {onBookVehicle && (
                    <button
                      onClick={() => onBookVehicle({
                        customerName: profile.vehicle.customerName,
                        phone: profile.vehicle.customerPhone,
                        email: profile.vehicle.customerEmail,
                        vehicleRegistration: profile.vehicle.displayPlate || profile.vehicle.registration
                      })}
                      className="btn btn-primary !text-xs"
                    >
                      Book this vehicle in →
                    </button>
                  )}
                  <div className="ml-auto min-w-[110px] text-right">
                    {saveState === 'saving' && (
                      <span className="text-xs text-ink-300 inline-flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
                      </span>
                    )}
                    {saveState === 'saved' && (
                      <span className="text-xs text-emerald-400 inline-flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5" /> Saved ✓
                      </span>
                    )}
                    {saveState === 'error' && (
                      <span className="text-xs text-red-400 inline-flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Save failed
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* LEFT: details + customer */}
                  <div className="space-y-6">
                    <div className="card-dark p-5 sm:p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Wrench className="w-4 h-4 text-brand-400" /> Vehicle details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Make</FieldLabel>
                          <SmartSelect
                            value={vehicleMake}
                            options={MAKES.map((m) => m.name)}
                            placeholder="Select make…"
                            onCommit={commitMake}
                          />
                        </div>
                        <div>
                          <FieldLabel>Model</FieldLabel>
                          <SmartSelect
                            value={vehicleModel}
                            options={profileMakeEntry ? profileMakeEntry.models.map((m) => m.name) : []}
                            placeholder={vehicleMake ? 'Select model…' : 'Pick a make first'}
                            onCommit={commitModel}
                          />
                        </div>
                        <div>
                          <FieldLabel>Engine</FieldLabel>
                          <SmartSelect
                            value={profile.vehicle.engine ?? ''}
                            options={profileModelEntry ? profileModelEntry.engines : []}
                            placeholder={vehicleModel ? 'Select engine…' : 'Pick a model first'}
                            onCommit={(engine) => commitPatch({ engine })}
                          />
                        </div>
                        <div>
                          <FieldLabel>Year</FieldLabel>
                          <AutoText
                            value={profile.vehicle.year ?? ''}
                            placeholder="e.g. 2021"
                            mono
                            onCommit={(year) => commitPatch({ year })}
                          />
                        </div>
                        <div>
                          <FieldLabel>Fuel type</FieldLabel>
                          <AutoSelect
                            value={profile.vehicle.fuelType ?? ''}
                            options={FUEL_TYPES}
                            placeholder="Select fuel…"
                            onCommit={(fuelType) => commitPatch({ fuelType })}
                          />
                        </div>
                        <div>
                          <FieldLabel>Transmission</FieldLabel>
                          <AutoSelect
                            value={profile.vehicle.transmission ?? ''}
                            options={TRANSMISSIONS}
                            placeholder="Select gearbox…"
                            onCommit={(transmission) => commitPatch({ transmission })}
                          />
                        </div>
                        <div>
                          <FieldLabel>Colour</FieldLabel>
                          <AutoText
                            value={profile.vehicle.colour ?? ''}
                            placeholder="e.g. Grey"
                            onCommit={(colour) => commitPatch({ colour })}
                          />
                        </div>
                        <div>
                          <FieldLabel>County</FieldLabel>
                          <AutoSelect
                            value={profile.vehicle.county ?? ''}
                            options={COUNTIES}
                            placeholder="Select county…"
                            onCommit={(county) => commitPatch({ county })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="card-dark p-5 sm:p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <User className="w-4 h-4 text-brand-400" /> Customer
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <FieldLabel>Name</FieldLabel>
                          <AutoText
                            value={profile.vehicle.customerName ?? ''}
                            placeholder="Customer name"
                            onCommit={(customerName) => commitPatch({ customerName })}
                          />
                        </div>
                        <div>
                          <FieldLabel>Phone</FieldLabel>
                          <AutoText
                            value={profile.vehicle.customerPhone ?? ''}
                            placeholder="087…"
                            mono
                            onCommit={(customerPhone) => commitPatch({ customerPhone })}
                          />
                          {profile.vehicle.customerPhone && (
                            <a
                              href={`tel:${profile.vehicle.customerPhone.replace(/\s+/g, '')}`}
                              className="inline-block mt-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
                            >
                              Call customer →
                            </a>
                          )}
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Email</FieldLabel>
                          <AutoText
                            value={profile.vehicle.customerEmail ?? ''}
                            placeholder="name@email.com"
                            onCommit={(customerEmail) => commitPatch({ customerEmail })}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <FieldLabel>Notes</FieldLabel>
                          <NotesAutosave
                            value={profile.vehicle.notes ?? ''}
                            onCommit={(notes) => commitPatch({ notes })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: bookings + history + add record */}
                  <div className="space-y-6">
                    <div className="card-dark p-5 sm:p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-brand-400" /> Linked bookings
                      </h3>
                      {profile.bookings.length === 0 ? (
                        <div className="space-y-3">
                          <p className="text-sm text-ink-300">No bookings under this registration yet.</p>
                          {onBookVehicle && (
                            <button
                              onClick={() => onBookVehicle({
                                customerName: profile.vehicle.customerName,
                                phone: profile.vehicle.customerPhone,
                                email: profile.vehicle.customerEmail,
                                vehicleRegistration: profile.vehicle.displayPlate || profile.vehicle.registration
                              })}
                              className="btn btn-primary !text-xs"
                            >
                              Book this vehicle in →
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {profile.bookings.map((b) => (
                            <div key={b.referenceNumber} className="bg-ink-950/60 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3">
                              <span className="font-mono text-brand-400 text-sm font-bold">{b.referenceNumber}</span>
                              <span className="flex-1 min-w-0 truncate text-sm text-ink-200">{b.serviceName}</span>
                              <span className="hidden sm:block text-xs font-mono text-ink-300 whitespace-nowrap">
                                {fmtDate(b.bookingDate)} {b.bookingTime}
                              </span>
                              <span className={`inline-block px-2.5 py-1 rounded-full border text-xs font-bold capitalize ${bookingPillClass(b.status)}`}>
                                {b.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="card-dark p-5 sm:p-6">
                      <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-brand-400" /> Service history
                      </h3>
                      {historyError && (
                        <p className="mb-3 text-sm text-red-400 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4" /> {historyError}
                        </p>
                      )}
                      {profile.serviceHistory.length === 0 ? (
                        <p className="text-sm text-ink-300 mb-5">No work recorded yet — add the first record below.</p>
                      ) : (
                        <div className="space-y-3 mb-5 max-h-[360px] overflow-y-auto pr-1">
                          {profile.serviceHistory.map((r) => (
                            <div key={r.id} className="bg-ink-950/60 border border-white/10 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-mono text-xs text-ink-300">{fmtDate(r.date)}</span>
                                    <span className="font-bold text-white text-sm">{r.serviceName}</span>
                                  </div>
                                  {r.technician && (
                                    <p className="text-xs text-ink-300 mt-0.5">Tech: {r.technician}</p>
                                  )}
                                  {r.bookingRef && (
                                    <p className="text-xs font-mono text-brand-400 mt-0.5">Ref: {r.bookingRef}</p>
                                  )}
                                  {r.partsUsed.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                      {r.partsUsed.map((part, pi) => (
                                        <span key={pi} className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-xs text-ink-200">
                                          {part}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  {r.notes && <p className="text-sm text-ink-300 mt-2 leading-relaxed">{r.notes}</p>}
                                </div>
                                {confirmDeleteId === r.id ? (
                                  <span className="flex items-center gap-2 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => { void deleteRecord(r.id); }}
                                      className="text-xs font-bold text-red-400 hover:text-red-300"
                                    >
                                      Confirm?
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmDeleteId('')}
                                      className="text-xs text-ink-300 hover:text-white"
                                    >
                                      Cancel
                                    </button>
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteId(r.id)}
                                    className="text-ink-300 hover:text-red-400 transition-colors shrink-0"
                                    aria-label="Delete record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add record card */}
                      <div className="bg-ink-950/60 border border-brand-500/20 rounded-xl p-4 space-y-3">
                        <p className="font-bold text-white text-sm flex items-center gap-2">
                          <Plus className="w-4 h-4 text-brand-400" /> Add service record
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <FieldLabel>Service</FieldLabel>
                            <select
                              value={recordForm.serviceChoice}
                              onChange={(e) => setRecordForm({ ...recordForm, serviceChoice: e.target.value })}
                              className="input-dark"
                            >
                              <option value="">Select service…</option>
                              {serviceNames.map((s) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                              <option value={OTHER_SERVICE}>Other (custom)…</option>
                            </select>
                          </div>
                          <div>
                            <FieldLabel>Technician</FieldLabel>
                            <select
                              value={recordForm.technician}
                              onChange={(e) => setRecordForm({ ...recordForm, technician: e.target.value })}
                              className="input-dark"
                            >
                              <option value="">Select technician…</option>
                              {team.map((m) => (
                                <option key={m.id} value={m.name}>{m.name} — {m.role}</option>
                              ))}
                            </select>
                          </div>
                          {recordForm.serviceChoice === OTHER_SERVICE && (
                            <div className="sm:col-span-2">
                              <FieldLabel>Custom service name</FieldLabel>
                              <input
                                type="text"
                                value={recordForm.customService}
                                onChange={(e) => setRecordForm({ ...recordForm, customService: e.target.value })}
                                placeholder="e.g. Timing belt kit"
                                className="input-dark"
                              />
                            </div>
                          )}
                          <div>
                            <FieldLabel>Date</FieldLabel>
                            <input
                              type="date"
                              value={recordForm.date}
                              onChange={(e) => setRecordForm({ ...recordForm, date: e.target.value })}
                              className="input-dark font-mono"
                            />
                          </div>
                          <div>
                            <FieldLabel>Parts used (comma-separated)</FieldLabel>
                            <input
                              type="text"
                              value={recordForm.parts}
                              onChange={(e) => setRecordForm({ ...recordForm, parts: e.target.value })}
                              placeholder="Oil filter, 5W-30 oil, sump washer"
                              className="input-dark"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <FieldLabel>Notes</FieldLabel>
                            <textarea
                              rows={2}
                              value={recordForm.notes}
                              onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                              placeholder="Anything worth remembering — advisories, measurements, customer requests…"
                              className="input-dark resize-y"
                            />
                          </div>
                        </div>
                        {recordError && (
                          <p className="text-sm text-red-400 flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> {recordError}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => { void submitRecord(); }}
                          disabled={recordBusy}
                          className="btn btn-primary disabled:opacity-50"
                        >
                          {recordBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          <span>Save record</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* ================= FIRST VISIT ================= */}
        {view === 'firstVisit' && firstVisit && (
          <motion.div
            key="firstVisit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={goBrowse}
              className="inline-flex items-center gap-1.5 text-sm text-ink-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to all vehicles
            </button>

            <div className="card-dark p-5 sm:p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold text-white">First visit — register vehicle</h2>
                  <p className="text-sm text-ink-300">This reg is not in the database yet. Fill in what you know; everything can be edited later.</p>
                </div>
              </div>

              {/* Detection banner */}
              {firstVisit.parsed ? (
                <div className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-2 ${
                  firstVisit.parsed.needsReview
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                }`}>
                  {firstVisit.parsed.needsReview
                    ? <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                    : <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>
                    {firstVisit.parsed.year && firstVisit.parsed.county
                      ? `${firstVisit.parsed.year}${firstVisit.parsed.half ? ` (${firstVisit.parsed.half === 1 ? 'Jan–Jun' : 'Jul–Dec'})` : ''} · ${firstVisit.parsed.county} — detected from plate`
                      : firstVisit.parsed.note ?? 'Plate not recognised automatically — please enter the details manually.'}
                    {firstVisit.parsed.needsReview && (
                      <span className="block mt-1 font-bold">Please double-check the auto-filled details before saving.</span>
                    )}
                  </span>
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-ink-950/60 px-4 py-3 text-sm text-ink-300">
                  Manual entry — type the registration and the year/county will prefill automatically when the plate is recognised.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FieldLabel>Registration</FieldLabel>
                  <input
                    type="text"
                    value={firstVisit.plateInput}
                    onChange={(e) => setFirstVisit({ ...firstVisit, plateInput: e.target.value.toUpperCase() })}
                    placeholder="e.g. 241-D-12345"
                    className="input-dark font-mono text-lg tracking-widest uppercase"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  {firstVisit.displayPlate && firstVisit.displayPlate !== firstVisit.plateInput && (
                    <p className="mt-1.5 text-xs font-mono text-ink-300">
                      Display: <span className="text-brand-400">{firstVisit.displayPlate}</span>
                    </p>
                  )}
                </div>
                <div>
                  <FieldLabel>Make</FieldLabel>
                  <SmartSelect
                    value={firstVisit.make}
                    options={MAKES.map((m) => m.name)}
                    placeholder="Select make…"
                    onCommit={(make) => {
                      const mk = MAKES.find((m) => m.name === make);
                      const modelStillValid = mk?.models.some((mo) => mo.name === firstVisit.model) ?? false;
                      setFirstVisit({
                        ...firstVisit,
                        make,
                        model: modelStillValid ? firstVisit.model : '',
                        engine: modelStillValid ? firstVisit.engine : ''
                      });
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Model</FieldLabel>
                  <SmartSelect
                    value={firstVisit.model}
                    options={fvMakeEntry ? fvMakeEntry.models.map((m) => m.name) : []}
                    placeholder={firstVisit.make ? 'Select model…' : 'Pick a make first'}
                    onCommit={(model) => {
                      const mo = fvMakeEntry?.models.find((x) => x.name === model);
                      const engineStillValid = mo?.engines.includes(firstVisit.engine) ?? false;
                      setFirstVisit({ ...firstVisit, model, engine: engineStillValid ? firstVisit.engine : '' });
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>Engine</FieldLabel>
                  <SmartSelect
                    value={firstVisit.engine}
                    options={fvModelEntry ? fvModelEntry.engines : []}
                    placeholder={firstVisit.model ? 'Select engine…' : 'Pick a model first'}
                    onCommit={(engine) => setFirstVisit({ ...firstVisit, engine })}
                  />
                </div>
                <div>
                  <FieldLabel>Year</FieldLabel>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={firstVisit.year}
                    onChange={(e) => setFirstVisit({ ...firstVisit, year: e.target.value })}
                    placeholder="e.g. 2021"
                    className="input-dark font-mono"
                  />
                </div>
                <div>
                  <FieldLabel>County</FieldLabel>
                  <AutoSelect
                    value={firstVisit.county}
                    options={COUNTIES}
                    placeholder="Select county…"
                    onCommit={(county) => setFirstVisit({ ...firstVisit, county })}
                  />
                </div>
                <div>
                  <FieldLabel>Fuel type</FieldLabel>
                  <AutoSelect
                    value={firstVisit.fuelType}
                    options={FUEL_TYPES}
                    placeholder="Select fuel…"
                    onCommit={(fuelType) => setFirstVisit({ ...firstVisit, fuelType })}
                  />
                </div>
                <div>
                  <FieldLabel>Transmission</FieldLabel>
                  <AutoSelect
                    value={firstVisit.transmission}
                    options={TRANSMISSIONS}
                    placeholder="Select gearbox…"
                    onCommit={(transmission) => setFirstVisit({ ...firstVisit, transmission })}
                  />
                </div>
                <div>
                  <FieldLabel>Colour</FieldLabel>
                  <input
                    type="text"
                    value={firstVisit.colour}
                    onChange={(e) => setFirstVisit({ ...firstVisit, colour: e.target.value })}
                    placeholder="e.g. Grey"
                    className="input-dark"
                  />
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <p className="font-bold text-white text-sm mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-brand-400" /> Customer (optional)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Name</FieldLabel>
                    <input
                      type="text"
                      value={firstVisit.customerName}
                      onChange={(e) => setFirstVisit({ ...firstVisit, customerName: e.target.value })}
                      placeholder="Customer name"
                      className="input-dark"
                    />
                  </div>
                  <div>
                    <FieldLabel>Phone</FieldLabel>
                    <input
                      type="tel"
                      inputMode="tel"
                      value={firstVisit.customerPhone}
                      onChange={(e) => setFirstVisit({ ...firstVisit, customerPhone: e.target.value })}
                      placeholder="087…"
                      className="input-dark font-mono"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Email</FieldLabel>
                    <input
                      type="email"
                      value={firstVisit.customerEmail}
                      onChange={(e) => setFirstVisit({ ...firstVisit, customerEmail: e.target.value })}
                      placeholder="name@email.com"
                      className="input-dark"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel>Notes</FieldLabel>
                    <textarea
                      rows={2}
                      value={firstVisit.notes}
                      onChange={(e) => setFirstVisit({ ...firstVisit, notes: e.target.value })}
                      placeholder="Anything worth remembering about this vehicle or customer…"
                      className="input-dark resize-y"
                    />
                  </div>
                </div>
              </div>

              {firstVisit.error && (
                <p className="text-sm text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> {firstVisit.error}
                </p>
              )}

              <div className="sticky bottom-0 z-10 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 mt-2 px-5 sm:px-6 py-4 bg-ink-900/95 backdrop-blur-md border-t border-white/10 rounded-b-[1.25rem]">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => { void saveFirstVisit(); }}
                    disabled={firstVisit.saving}
                    className="btn btn-primary disabled:opacity-50"
                  >
                    {firstVisit.saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Save &amp; open vehicle</span>
                  </button>
                  {onBookVehicle && (
                    <button
                      type="button"
                      onClick={() => { void saveFirstVisit(true); }}
                      disabled={firstVisit.saving}
                      className="btn btn-outline-light disabled:opacity-50"
                    >
                      <span>Save &amp; book in →</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** Textarea with blur-commit, used for the profile notes field. */
const NotesAutosave: React.FC<{ value: string; onCommit: (value: string) => void }> = ({ value, onCommit }) => {
  const [draft, setDraft] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setDraft(value);
    }
  }, [value]);

  return (
    <textarea
      rows={2}
      value={draft}
      placeholder="Notes about this vehicle or customer…"
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        const v = draft.trim();
        if (v !== value) onCommit(v);
      }}
      className="input-dark resize-y"
    />
  );
};

export default VehiclesPanel;
