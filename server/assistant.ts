/**
 * Friends Garage — Staff AI Assistant (Gemini function calling).
 *
 * Lets staff manage the workshop in plain language: search bookings,
 * look up customers, create/reschedule/cancel bookings (incl. bulk),
 * manage blocked dates, and get quick stats.
 *
 * Requires GEMINI_API_KEY (server env or Site Settings BYOK). Model via
 * Site Settings / GEMINI_MODEL, default gemini-3.6-flash. Every tool call
 * runs against the local SQLite layer — the AI never touches the DB directly.
 */
import { GoogleGenAI } from '@google/genai';
import * as db from './db.js';

const DEFAULT_MODEL = 'gemini-3.6-flash';

function resolveModel(): string {
  try {
    const fromSettings = (db.getSettings() as any).geminiModel;
    if (fromSettings) return fromSettings;
  } catch { /* fall through */ }
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

const SYSTEM_PROMPT = `You are the Friends Garage workshop assistant (Oranmore, Galway, Ireland).
You help staff manage bookings, estimates and the workshop schedule.
Rules:
- Answer briefly and practically. Use reference numbers (FG-2026-XXXX) when talking about bookings.
- Before creating or changing anything, confirm the key details back in one short sentence.
- For bulk requests, call the tool once per item.
- Never invent booking data — always read with tools first.
- Times are 24h HH:MM, dates YYYY-MM-DD. The garage is closed Sundays.
- If a request is ambiguous, ask one short clarifying question.`;

const FUNCTION_DECLARATIONS = [
  {
    name: 'list_bookings',
    description: 'List bookings, optionally filtered by date (YYYY-MM-DD) and/or status.',
    parameters: {
      type: 'OBJECT',
      properties: {
        date: { type: 'STRING', description: 'YYYY-MM-DD filter' },
        status: { type: 'STRING', description: 'pending|confirmed|completed|rescheduled|cancelled' }
      }
    }
  },
  {
    name: 'search_bookings',
    description: 'Search bookings by customer name, vehicle registration, reference number, or phone.',
    parameters: {
      type: 'OBJECT',
      properties: { query: { type: 'STRING' } },
      required: ['query']
    }
  },
  {
    name: 'get_availability',
    description: 'Get blocked dates, taken time slots and capacity for a given date.',
    parameters: {
      type: 'OBJECT',
      properties: { date: { type: 'STRING', description: 'YYYY-MM-DD' } },
      required: ['date']
    }
  },
  {
    name: 'create_booking',
    description: 'Create a booking manually (e.g. a phone booking). Staff override: no slot restrictions apply.',
    parameters: {
      type: 'OBJECT',
      properties: {
        customerName: { type: 'STRING' },
        phone: { type: 'STRING' },
        email: { type: 'STRING' },
        vehicleRegistration: { type: 'STRING' },
        serviceName: { type: 'STRING' },
        bookingDate: { type: 'STRING', description: 'YYYY-MM-DD' },
        bookingTime: { type: 'STRING', description: 'HH:MM' },
        vehicleMake: { type: 'STRING' },
        vehicleModel: { type: 'STRING' },
        customerNotes: { type: 'STRING' }
      },
      required: ['customerName', 'phone', 'bookingDate', 'bookingTime']
    }
  },
  {
    name: 'update_booking',
    description: 'Update a booking: change status, reschedule (bookingDate/bookingTime) or add internal notes.',
    parameters: {
      type: 'OBJECT',
      properties: {
        reference: { type: 'STRING', description: 'Reference number or id' },
        status: { type: 'STRING' },
        bookingDate: { type: 'STRING' },
        bookingTime: { type: 'STRING' },
        internalNotes: { type: 'STRING' }
      },
      required: ['reference']
    }
  },
  {
    name: 'list_blocked_dates',
    description: 'List staff-blocked dates (holidays/closures).',
    parameters: { type: 'OBJECT', properties: {} }
  },
  {
    name: 'add_blocked_date',
    description: 'Block a date (holiday/closure).',
    parameters: {
      type: 'OBJECT',
      properties: { date: { type: 'STRING' }, reason: { type: 'STRING' } },
      required: ['date']
    }
  },
  {
    name: 'get_stats',
    description: 'Quick counts: total bookings, pending, today\'s jobs, open estimates.',
    parameters: { type: 'OBJECT', properties: {} }
  }
];

const generateRef = (prefix: string) => `${prefix}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

function executeTool(name: string, args: any): any {
  switch (name) {
    case 'list_bookings': {
      let list = db.getBookings();
      if (args.date) list = list.filter((b: any) => b.bookingDate === args.date);
      if (args.status) list = list.filter((b: any) => b.status === args.status);
      return list.slice(0, 50).map(slimBooking);
    }
    case 'search_bookings': {
      const q = String(args.query || '').toLowerCase();
      return db.getBookings()
        .filter((b: any) =>
          [b.customerName, b.vehicleRegistration, b.referenceNumber, b.phone, b.email]
            .some((f: string) => (f || '').toLowerCase().includes(q)))
        .slice(0, 20)
        .map(slimBooking);
    }
    case 'get_availability':
      return db.getAvailability(args.date);
    case 'create_booking': {
      const b = {
        id: `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        referenceNumber: generateRef('FG'),
        serviceId: 'manual',
        serviceName: args.serviceName || 'Manual booking',
        customerName: String(args.customerName || '').slice(0, 120),
        email: String(args.email || '').slice(0, 160),
        phone: String(args.phone || '').slice(0, 40),
        preferredContact: 'phone',
        vehicleMake: String(args.vehicleMake || ''),
        vehicleModel: String(args.vehicleModel || ''),
        vehicleYear: '',
        vehicleRegistration: String(args.vehicleRegistration || 'N/A').toUpperCase(),
        fuelType: 'diesel',
        mileage: '',
        transmission: 'manual',
        problemDescription: '',
        bookingDate: args.bookingDate,
        bookingTime: args.bookingTime,
        durationMinutes: 60,
        status: 'confirmed',
        customerNotes: String(args.customerNotes || 'Added manually by staff'),
        createdAt: new Date().toISOString()
      };
      db.addBooking(b);
      return { created: slimBooking(b) };
    }
    case 'update_booking': {
      const patch: any = {};
      if (args.status) patch.status = args.status;
      if (args.bookingDate) patch.bookingDate = args.bookingDate;
      if (args.bookingTime) patch.bookingTime = args.bookingTime;
      if (args.internalNotes) patch.internalNotes = args.internalNotes;
      const updated = db.updateBooking(String(args.reference), patch);
      return updated ? { updated: slimBooking(updated) } : { error: 'Booking not found' };
    }
    case 'list_blocked_dates':
      return db.getBlockedDates();
    case 'add_blocked_date': {
      const bd = { id: `bd-${Date.now()}`, date: args.date, reason: args.reason || 'Blocked via assistant' };
      db.addBlockedDate(bd);
      return { added: bd };
    }
    case 'get_stats': {
      const bookings = db.getBookings();
      const today = new Date().toISOString().split('T')[0];
      return {
        totalBookings: bookings.length,
        pending: bookings.filter((b: any) => b.status === 'pending').length,
        todayJobs: bookings.filter((b: any) => b.bookingDate === today && b.status !== 'cancelled').length,
        openEstimates: db.getEstimates().filter((e: any) => e.status !== 'closed').length
      };
    }
    default:
      return { error: `Unknown tool ${name}` };
  }
}

function slimBooking(b: any) {
  return {
    referenceNumber: b.referenceNumber,
    customerName: b.customerName,
    phone: b.phone,
    email: b.email,
    vehicleRegistration: b.vehicleRegistration,
    vehicle: `${b.vehicleMake} ${b.vehicleModel}`.trim(),
    serviceName: b.serviceName,
    bookingDate: b.bookingDate,
    bookingTime: b.bookingTime,
    status: b.status,
    internalNotes: b.internalNotes || ''
  };
}

export function resolveApiKey(): string {
  // Bring-your-own-key: staff can paste the key in Site Settings (stored in
  // the DB); falls back to the server environment variable.
  try {
    const fromSettings = (db.getSettings() as any).geminiApiKey;
    if (fromSettings) return fromSettings;
  } catch { /* fall through */ }
  return process.env.GEMINI_API_KEY || '';
}

export function assistantConfigured(): boolean {
  return Boolean(resolveApiKey());
}

export async function runAssistant(message: string, history: any[] = []): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: resolveApiKey() });

  const contents: any[] = [
    ...history.map((h: any) => ({ role: h.role === 'model' ? 'model' : 'user', parts: [{ text: h.text }] })),
    { role: 'user', parts: [{ text: message }] }
  ];

  for (let i = 0; i < 6; i++) {
    const response = await ai.models.generateContent({
      model: resolveModel(),
      contents,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: [{ functionDeclarations: FUNCTION_DECLARATIONS as any }]
      }
    });

    const calls = (response as any).functionCalls as any[] | undefined;
    const candidateContent = (response as any).candidates?.[0]?.content;

    if (!calls || calls.length === 0) {
      return response.text || 'Done.';
    }

    // Execute every requested tool and feed results back
    if (candidateContent) contents.push(candidateContent);
    const responseParts = calls.map((call: any) => ({
      functionResponse: {
        name: call.name,
        response: { result: executeTool(call.name, call.args || {}) }
      }
    }));
    contents.push({ role: 'user', parts: responseParts });
  }

  return 'I reached the action limit for one message — please check the portal to confirm what was done.';
}
