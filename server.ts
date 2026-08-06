import express from 'express';
import path from 'path';
import crypto from 'crypto';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import * as db from './server/db.js';
import { runAssistant, assistantConfigured } from './server/assistant.js';
import {
  emailBookingReceivedCustomer,
  emailBookingReceivedGarage,
  emailBookingStatusCustomer,
  emailEstimateReceivedCustomer,
  emailEstimateReceivedGarage,
  emailCallbackGarage,
  emailRoadsideGarage,
  emailRoadsideCustomer
} from './server/mailer.js';

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // --- SECURITY HEADERS ---
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
    next();
  });

  // --- ADMIN AUTH (Bearer tokens, in-memory) ---
  const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'friends2026';
  if (!process.env.ADMIN_PASSCODE) {
    console.warn('[security] ADMIN_PASSCODE not set — using built-in default. Set it in .env before going live.');
  }
  const adminTokens = new Map<string, number>(); // token → expiry timestamp
  const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12h sessions

  const issueToken = () => {
    const token = crypto.randomBytes(24).toString('hex');
    adminTokens.set(token, Date.now() + TOKEN_TTL_MS);
    return token;
  };
  const isValidToken = (token: string | undefined) => {
    if (!token) return false;
    const exp = adminTokens.get(token);
    if (!exp) return false;
    if (exp < Date.now()) { adminTokens.delete(token); return false; }
    return true;
  };
  const requireAdmin: express.RequestHandler = (req, res, next) => {
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!isValidToken(token)) {
      return res.status(401).json({ error: 'Staff authentication required' });
    }
    next();
  };

  // --- RATE LIMITING (simple in-memory buckets for public write endpoints) ---
  const rateBuckets = new Map<string, { count: number; resetAt: number }>();
  const rateLimit = (max: number, windowMs: number): express.RequestHandler => (req, res, next) => {
    const key = `${req.ip}|${req.path}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || bucket.resetAt < now) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > max) {
      return res.status(429).json({ error: 'Too many requests. Please wait a few minutes and try again.' });
    }
    next();
  };
  const publicWriteLimit = rateLimit(30, 10 * 60 * 1000); // 30 writes / 10 min / IP / endpoint

  // Helper for generating ref numbers
  const generateRef = (prefix: string) => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${rand}`;
  };

  // Basic input hygiene for public forms
  const cleanStr = (v: any, max = 300) => String(v ?? '').slice(0, max).trim();
  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const isDateStr = (v: string) => /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v));
  const isTimeStr = (v: string) => /^\d{2}:\d{2}$/.test(v);

  // --- REST API ENDPOINTS ---

  // Healthcheck
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), garage: 'Friends Garage Oranmore' });
  });

  // Get Services
  app.get('/api/services', (req, res) => {
    res.json(db.getServices());
  });

  // Get Single Service
  app.get('/api/services/:slug', (req, res) => {
    const service = db.getService(req.params.slug);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  });

  // Get Team
  app.get('/api/team', (req, res) => {
    res.json(db.getTeam());
  });

  // Get Reviews
  app.get('/api/reviews', (req, res) => {
    res.json(db.getReviews());
  });

  // Add Review
  app.post('/api/reviews', publicWriteLimit, (req, res) => {
    const newReview = {
      id: `rev-${Date.now()}`,
      author: req.body.author || 'Anonymous',
      rating: Number(req.body.rating) || 5,
      text: req.body.text || '',
      date: new Date().toISOString().split('T')[0],
      platform: 'Direct Feedback' as const,
      serviceUsed: req.body.serviceUsed
    };
    db.addReview(newReview);
    res.status(201).json(newReview);
  });

  // Get Site Settings (public — sensitive staff fields stripped)
  app.get('/api/settings', (req, res) => {
    const { geminiApiKey, ...publicSettings } = db.getSettings() as any;
    res.json(publicSettings);
  });

  // Get FULL Site Settings (staff only — includes the AI key)
  app.get('/api/admin/settings', requireAdmin, (req, res) => {
    res.json(db.getSettings());
  });

  // Update Settings (staff only)
  app.patch('/api/settings', requireAdmin, (req, res) => {
    res.json(db.updateSettings(req.body));
  });

  // Public availability endpoint — safe subset (no customer data exposed)
  app.get('/api/availability', (req, res) => {
    res.json(db.getAvailability(req.query.date as string | undefined));
  });

  // Get Bookings (staff only — contains customer PII)
  app.get('/api/bookings', requireAdmin, (req, res) => {
    res.json(db.getBookings());
  });

  // Create Booking (public, rate-limited + validated)
  app.post('/api/bookings', publicWriteLimit, (req, res) => {
    const {
      serviceId,
      serviceName,
      customerName,
      email,
      phone,
      preferredContact,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleRegistration,
      fuelType,
      mileage,
      transmission,
      problemDescription,
      bookingDate,
      bookingTime,
      durationMinutes,
      customerNotes
    } = req.body;

    // Sanitise + validate
    const safeName = cleanStr(customerName, 120);
    const safeEmail = cleanStr(email, 160);
    const safePhone = cleanStr(phone, 40);
    if (!safeName || !safePhone || !safeEmail || !bookingDate || !bookingTime || !vehicleRegistration) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }
    if (!isEmail(safeEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!isDateStr(bookingDate) || !isTimeStr(bookingTime)) {
      return res.status(400).json({ error: 'Invalid date or time format.' });
    }

    // Staff with a valid session may override availability (manual phone bookings etc.)
    const staffOverride = req.body.override === true && isValidToken((req.headers.authorization || '').replace(/^Bearer\s+/i, ''));

    // --- Availability validation (mirrors what the booking form shows) ---
    if (!staffOverride) {
      const requestedDay = new Date(`${bookingDate}T00:00:00`).getDay();
      if (requestedDay === 0) {
        return res.status(409).json({ error: 'The garage is closed on Sundays. Please choose a Monday to Saturday date.' });
      }
      if (db.isDateBlocked(bookingDate)) {
        return res.status(409).json({ error: 'This date is unavailable (holiday / closed). Please choose another day.' });
      }
      if (db.isSlotTaken(bookingDate, bookingTime)) {
        return res.status(409).json({ error: 'That time slot has just been taken. Please pick another time.' });
      }
      const maxDaily = db.getSettings().maxDailyBookings || 12;
      if (db.dayBookingCount(bookingDate) >= maxDaily) {
        return res.status(409).json({ error: 'This day is fully booked. Please choose another date.' });
      }
    }

    const newBooking = {
      id: `b-${Date.now()}`,
      referenceNumber: generateRef('FG'),
      serviceId: cleanStr(serviceId, 80) || 'general',
      serviceName: cleanStr(serviceName, 160) || 'General Service',
      customerName: safeName,
      email: safeEmail,
      phone: safePhone,
      preferredContact: preferredContact || 'phone',
      vehicleMake: cleanStr(vehicleMake, 60),
      vehicleModel: cleanStr(vehicleModel, 60),
      vehicleYear: cleanStr(vehicleYear, 10),
      vehicleRegistration: cleanStr(vehicleRegistration, 20).toUpperCase(),
      fuelType: fuelType || 'diesel',
      mileage: cleanStr(mileage, 20),
      transmission: transmission || 'manual',
      problemDescription: cleanStr(problemDescription, 1000),
      bookingDate,
      bookingTime,
      durationMinutes: Number(durationMinutes) || 60,
      status: db.getSettings().autoConfirmBookings ? 'confirmed' : 'pending',
      customerNotes: cleanStr(customerNotes, 1000),
      createdAt: new Date().toISOString()
    };

    db.addBooking(newBooking);
    res.status(201).json(newBooking);

    // Fire notifications after responding — mail must never block a booking
    void Promise.all([
      emailBookingReceivedCustomer(newBooking),
      emailBookingReceivedGarage(newBooking)
    ]).catch(err => console.error('[mailer] booking notification failed', err));
  });

  // Update Booking status / notes / date (staff only)
  app.patch('/api/bookings/:id', requireAdmin, (req, res) => {
    const current = db.getBookings().find(b => b.id === req.params.id || b.referenceNumber === req.params.id);
    if (!current) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const previousStatus = current.status;
    const updated = db.updateBooking(req.params.id, req.body);
    res.json(updated);

    // Notify the customer when staff changes the booking status
    if (req.body.status && req.body.status !== previousStatus && updated.email) {
      void emailBookingStatusCustomer(updated)
        .catch(err => console.error('[mailer] status notification failed', err));
    }
  });

  // Delete / Cancel Booking (staff only)
  app.delete('/api/bookings/:id', requireAdmin, (req, res) => {
    const updated = db.updateBooking(req.params.id, { status: 'cancelled' });
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking marked as cancelled', booking: updated });
  });

  // Estimates API
  app.get('/api/estimates', requireAdmin, (req, res) => {
    res.json(db.getEstimates());
  });

  app.post('/api/estimates', publicWriteLimit, (req, res) => {
    const newEstimate = {
      id: `est-${Date.now()}`,
      referenceNumber: generateRef('EST'),
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      preferredContact: req.body.preferredContact || 'phone',
      vehicleRegistration: (req.body.vehicleRegistration || '').toUpperCase().trim(),
      vehicleMake: req.body.vehicleMake || '',
      vehicleModel: req.body.vehicleModel || '',
      vehicleYear: req.body.vehicleYear || '',
      mileage: req.body.mileage || '',
      serviceRequired: req.body.serviceRequired || 'General Estimate',
      problemDescription: req.body.problemDescription || '',
      preferredDate: req.body.preferredDate || '',
      fileUrls: req.body.fileUrls || [],
      status: 'new',
      createdAt: new Date().toISOString()
    };
    db.addEstimate(newEstimate);
    res.status(201).json(newEstimate);

    void Promise.all([
      emailEstimateReceivedCustomer(newEstimate),
      emailEstimateReceivedGarage(newEstimate)
    ]).catch(err => console.error('[mailer] estimate notification failed', err));
  });

  // Callback requests API
  app.get('/api/callbacks', requireAdmin, (req, res) => {
    res.json(db.getCallbacks());
  });

  app.post('/api/callbacks', publicWriteLimit, (req, res) => {
    const newCallback = {
      id: `cb-${Date.now()}`,
      name: req.body.name,
      phone: req.body.phone,
      email: req.body.email || '',
      preferredContactTime: req.body.preferredContactTime || 'Anytime',
      vehicleRegistration: (req.body.vehicleRegistration || '').toUpperCase().trim(),
      serviceNeeded: req.body.serviceNeeded || 'General Query',
      message: req.body.message || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    db.addCallback(newCallback);
    res.status(201).json(newCallback);

    void emailCallbackGarage(newCallback)
      .catch(err => console.error('[mailer] callback notification failed', err));
  });

  // Roadside Requests API
  app.get('/api/roadside', requireAdmin, (req, res) => {
    res.json(db.getRoadside());
  });

  app.post('/api/roadside', publicWriteLimit, (req, res) => {
    const newRoadside = {
      id: `rs-${Date.now()}`,
      referenceNumber: generateRef('EMG'),
      name: req.body.name,
      phone: req.body.phone,
      currentLocation: req.body.currentLocation || 'Oranmore / Galway',
      vehicleRegistration: (req.body.vehicleRegistration || '').toUpperCase().trim(),
      vehicleMakeModel: req.body.vehicleMakeModel || '',
      problemType: req.body.problemType || 'breakdown',
      vehicleCanMove: Boolean(req.body.vehicleCanMove),
      notes: req.body.notes || '',
      status: 'dispatched',
      createdAt: new Date().toISOString()
    };
    db.addRoadside(newRoadside);
    res.status(201).json(newRoadside);

    void Promise.all([
      emailRoadsideGarage(newRoadside),
      emailRoadsideCustomer(newRoadside)
    ]).catch(err => console.error('[mailer] roadside notification failed', err));
  });

  // Blocked Dates API
  app.get('/api/blocked-dates', (req, res) => {
    res.json(db.getBlockedDates());
  });

  app.post('/api/blocked-dates', requireAdmin, (req, res) => {
    const newBlocked = {
      id: `bd-${Date.now()}`,
      date: req.body.date,
      reason: req.body.reason || 'Closed / Holiday'
    };
    db.addBlockedDate(newBlocked);
    res.status(201).json(newBlocked);
  });

  app.delete('/api/blocked-dates/:id', requireAdmin, (req, res) => {
    db.deleteBlockedDate(req.params.id);
    res.json({ message: 'Blocked date removed' });
  });

  // Staff AI assistant (Gemini function calling over the workshop data)
  app.post('/api/admin/chat', requireAdmin, async (req, res) => {
    if (!assistantConfigured()) {
      return res.json({
        reply: 'AI assistant is not configured yet — add GEMINI_API_KEY to the server .env and restart. (All features remain available in the tabs above.)'
      });
    }
    try {
      const reply = await runAssistant(String(req.body.message || ''), Array.isArray(req.body.history) ? req.body.history : []);
      res.json({ reply });
    } catch (err) {
      console.error('[assistant] error', err);
      res.status(500).json({ reply: 'Sorry — the assistant hit an error. Try again in a moment.' });
    }
  });

  // Admin auth — issues a real session token (12h, in-memory)
  app.post('/api/admin/login', rateLimit(10, 10 * 60 * 1000), (req, res) => {
    const { passcode } = req.body;
    if (passcode && passcode === ADMIN_PASSCODE) {
      res.json({ success: true, token: issueToken(), role: 'manager', user: 'Wesley Da Silva' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid passcode' });
    }
  });

  // --- VITE / STATIC MIDDLEWARE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Friends Garage Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
