import express from 'express';
import path from 'path';
import 'dotenv/config';
import { createServer as createViteServer } from 'vite';
import * as db from './server/db.js';
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
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Helper for generating ref numbers
  const generateRef = (prefix: string) => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-2026-${rand}`;
  };

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
  app.post('/api/reviews', (req, res) => {
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

  // Get Site Settings
  app.get('/api/settings', (req, res) => {
    res.json(db.getSettings());
  });

  // Update Settings
  app.patch('/api/settings', (req, res) => {
    res.json(db.updateSettings(req.body));
  });

  // Public availability endpoint — safe subset (no customer data exposed)
  app.get('/api/availability', (req, res) => {
    res.json(db.getAvailability(req.query.date as string | undefined));
  });

  // Get Bookings
  app.get('/api/bookings', (req, res) => {
    res.json(db.getBookings());
  });

  // Create Booking
  app.post('/api/bookings', (req, res) => {
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

    if (!customerName || !phone || !email || !bookingDate || !bookingTime || !vehicleRegistration) {
      return res.status(400).json({ error: 'Missing required booking fields' });
    }

    // --- Availability validation (mirrors what the booking form shows) ---
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

    const newBooking = {
      id: `b-${Date.now()}`,
      referenceNumber: generateRef('FG'),
      serviceId: serviceId || 'general',
      serviceName: serviceName || 'General Service',
      customerName,
      email,
      phone,
      preferredContact: preferredContact || 'phone',
      vehicleMake: vehicleMake || '',
      vehicleModel: vehicleModel || '',
      vehicleYear: vehicleYear || '',
      vehicleRegistration: vehicleRegistration.toUpperCase().trim(),
      fuelType: fuelType || 'diesel',
      mileage: mileage || '',
      transmission: transmission || 'manual',
      problemDescription: problemDescription || '',
      bookingDate,
      bookingTime,
      durationMinutes: Number(durationMinutes) || 60,
      status: db.getSettings().autoConfirmBookings ? 'confirmed' : 'pending',
      customerNotes: customerNotes || '',
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

  // Update Booking status / notes / date
  app.patch('/api/bookings/:id', (req, res) => {
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

  // Delete / Cancel Booking
  app.delete('/api/bookings/:id', (req, res) => {
    const updated = db.updateBooking(req.params.id, { status: 'cancelled' });
    if (!updated) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking marked as cancelled', booking: updated });
  });

  // Estimates API
  app.get('/api/estimates', (req, res) => {
    res.json(db.getEstimates());
  });

  app.post('/api/estimates', (req, res) => {
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
  app.get('/api/callbacks', (req, res) => {
    res.json(db.getCallbacks());
  });

  app.post('/api/callbacks', (req, res) => {
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
  app.get('/api/roadside', (req, res) => {
    res.json(db.getRoadside());
  });

  app.post('/api/roadside', (req, res) => {
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

  app.post('/api/blocked-dates', (req, res) => {
    const newBlocked = {
      id: `bd-${Date.now()}`,
      date: req.body.date,
      reason: req.body.reason || 'Closed / Holiday'
    };
    db.addBlockedDate(newBlocked);
    res.status(201).json(newBlocked);
  });

  app.delete('/api/blocked-dates/:id', (req, res) => {
    db.deleteBlockedDate(req.params.id);
    res.json({ message: 'Blocked date removed' });
  });

  // Admin auth check endpoint
  app.post('/api/admin/login', (req, res) => {
    const { passcode } = req.body;
    // Simple passcode check for demo admin access
    if (passcode === 'admin123' || passcode === 'friends2026') {
      res.json({ success: true, token: 'fg-admin-token-2026', role: 'manager', user: 'Wesley Da Silva' });
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
