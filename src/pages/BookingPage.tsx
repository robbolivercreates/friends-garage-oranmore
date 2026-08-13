import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Car,
  User,
  Check,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Download,
  ShieldCheck,
  PhoneCall,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceItem, SiteSettings, Booking } from '../types';
import { Reveal } from '../components/ui/Reveal';
import { ServiceIcon } from '../components/ui/ServiceIcon';

interface BookingPageProps {
  services: ServiceItem[];
  settings: SiteSettings;
  initialServiceId?: string;
  onBookingComplete?: (reference: string) => void;
}

const WIZARD_STEPS = [
  { n: 1, name: 'Service' },
  { n: 2, name: 'Vehicle' },
  { n: 3, name: 'Date & Time' },
  { n: 4, name: 'Contact' },
  { n: 5, name: 'Review' }
];

const stepVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 }
};

const stepTransition = { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const };

export const BookingPage: React.FC<BookingPageProps> = ({
  services,
  settings,
  initialServiceId,
  onBookingComplete
}) => {
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState<string>(
    initialServiceId || (services[0]?.id || 'full-maintenance')
  );

  const [vehicleMake, setVehicleMake] = useState<string>('');
  const [vehicleModel, setVehicleModel] = useState<string>('');
  const [vehicleYear, setVehicleYear] = useState<string>('');
  const [vehicleRegistration, setVehicleRegistration] = useState<string>('');
  const [fuelType, setFuelType] = useState<'petrol' | 'diesel' | 'hybrid' | 'electric'>('diesel');
  const [mileage, setMileage] = useState<string>('');
  const [transmission, setTransmission] = useState<'manual' | 'automatic'>('manual');
  const [problemDescription, setProblemDescription] = useState<string>('');

  const [bookingDate, setBookingDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0] // default to tomorrow
  );
  const [bookingTime, setBookingTime] = useState<string>('09:30');

  // Live availability (blocked dates set by staff + already-taken slots)
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [takenSlots, setTakenSlots] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/availability')
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setBlockedDates(data.blockedDates || []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!bookingDate) return;
    fetch(`/api/availability?date=${bookingDate}`)
      .then(r => (r.ok ? r.json() : null))
      .then(data => { if (data) setTakenSlots(data.takenSlots || []); })
      .catch(() => {});
  }, [bookingDate]);

  const isDateBlocked = blockedDates.includes(bookingDate);
  const isSunday = new Date(`${bookingDate}T00:00:00`).getDay() === 0;

  const [customerName, setCustomerName] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [preferredContact, setPreferredContact] = useState<'phone' | 'email' | 'whatsapp'>('phone');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  const selectedService = services.find(s => s.id === selectedServiceId) || services[0];

  const availableTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00'
  ];

  const handleNext = () => {
    // Validation per step
    if (step === 2) {
      if (!vehicleRegistration) {
        setError('Please enter your vehicle registration plate number.');
        return;
      }
    }
    if (step === 3) {
      if (!bookingDate || !bookingTime) {
        setError('Please select a valid date and time slot.');
        return;
      }
      if (isSunday) {
        setError('The garage is closed on Sundays. Please select a Monday to Saturday date.');
        return;
      }
      if (isDateBlocked) {
        setError('This date is unavailable (holiday / garage closed). Please choose another day.');
        return;
      }
      if (takenSlots.includes(bookingTime)) {
        setError('That time slot is already booked. Please pick another time.');
        return;
      }
    }
    if (step === 4) {
      if (!customerName || !customerPhone || !customerEmail) {
        setError('Please provide your name, phone number, and email address.');
        return;
      }
    }
    setError(null);
    setStep(prev => prev + 1);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => prev - 1);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleSubmitBooking = async () => {
    setLoading(true);
    setError(null);

    const payload = {
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      customerName,
      email: customerEmail,
      phone: customerPhone,
      preferredContact,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      vehicleRegistration: vehicleRegistration.toUpperCase().trim(),
      fuelType,
      mileage,
      transmission,
      problemDescription,
      bookingDate,
      bookingTime,
      durationMinutes: selectedService.estimatedDurationMinutes,
      customerNotes
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        setBookingConfirmed(result);
        setStep(6);
        if (onBookingComplete) {
          onBookingComplete(result.referenceNumber);
        }
      } else {
        const data = await res.json().catch(() => null);
        setError(data?.error || 'Error creating booking. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Generate downloadable ICS file for Google/Outlook Calendar
  const downloadCalendarEvent = () => {
    if (!bookingConfirmed) return;
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Friends Garage Oranmore//NONSGML v1.0//EN
BEGIN:VEVENT
SUMMARY:Car Service at Friends Garage (${bookingConfirmed.serviceName})
DESCRIPTION:Appointment at Friends Garage for vehicle ${bookingConfirmed.vehicleRegistration}. Ref: ${bookingConfirmed.referenceNumber}
LOCATION:Unit 5\, Deerpark Industrial Estate\, Carrowmoneash\, Oranmore\, Co. Galway H91 H31C
DTSTART:${bookingConfirmed.bookingDate.replace(/-/g, '')}T${bookingConfirmed.bookingTime.replace(':', '')}00Z
DURATION:PT${bookingConfirmed.durationMinutes}M
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `FriendsGarage-${bookingConfirmed.referenceNumber}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const errorBanner = error && (
    <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
      <AlertCircle className="w-4 h-4 shrink-0" />
      <span>{error}</span>
    </div>
  );

  return (
    <div className="bg-paper min-h-screen text-ink-950">
      {/* Dark page header band */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-16 lg:pb-20">
        <div className="glow-brand w-[28rem] h-[28rem] -top-32 -right-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 space-y-5">
          <Reveal inView={false}>
            <span className="eyebrow">Online Booking</span>
          </Reveal>
          <Reveal inView={false} delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Book a Service in <span className="text-brand-500">Oranmore</span>
            </h1>
          </Reveal>
          <Reveal inView={false} delay={0.2}>
            <p className="text-base sm:text-lg text-ink-200 max-w-2xl leading-relaxed">
              Fast, transparent scheduling directly with the Friends Garage workshop team.
              Five quick steps and your slot is requested — we confirm every appointment personally.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Wizard body */}
      <section className="py-14 lg:py-20">
        <div className="max-w-3xl mx-auto px-4 md:px-8 space-y-8">

          {/* Step progress bar */}
          {step <= 5 && (
            <Reveal inView={false} className="card-light px-5 py-6 sm:px-8">
              <div className="flex items-start">
                {WIZARD_STEPS.map((s, i) => (
                  <React.Fragment key={s.n}>
                    <div className="flex flex-col items-center gap-2 shrink-0 w-14 sm:w-20">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                          step > s.n
                            ? 'bg-emerald-500 text-white'
                            : step === s.n
                            ? 'bg-brand-500 text-white ring-4 ring-brand-500/20'
                            : 'bg-paper-dark text-ink-400 border border-ink-950/10'
                        }`}
                      >
                        {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                      </div>
                      <span
                        className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center ${
                          step === s.n ? 'text-ink-950' : step > s.n ? 'text-emerald-600' : 'text-ink-400'
                        }`}
                      >
                        {s.name}
                      </span>
                    </div>
                    {i < WIZARD_STEPS.length - 1 && (
                      <div className="flex-1 mt-4 sm:mt-5 px-1">
                        <div className={`h-0.5 rounded-full transition-colors duration-500 ${step > s.n ? 'bg-emerald-500' : 'bg-ink-950/10'}`} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </Reveal>
          )}

          {/* Step panels with transitions */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={stepVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={stepTransition}
            >
              {/* STEP 1: SELECT SERVICE */}
              {step === 1 && (
                <div className="card-light p-6 sm:p-10 space-y-8">
                  <div className="border-b border-ink-950/8 pb-5 space-y-1.5">
                    <h2 className="text-2xl font-extrabold text-ink-950">Select Your Service</h2>
                    <p className="text-sm text-ink-400">Choose from routine servicing, brake maintenance, diagnostics, or roadside support.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((serv) => {
                      const isSelected = selectedServiceId === serv.id;
                      return (
                        <button
                          type="button"
                          key={serv.id}
                          onClick={() => setSelectedServiceId(serv.id)}
                          className={`text-left p-5 rounded-2xl border-2 transition-all duration-300 space-y-3 ${
                            isSelected
                              ? 'border-brand-500 bg-brand-500/5 shadow-lg'
                              : 'border-ink-950/10 bg-white hover:border-ink-950/25 hover:-translate-y-0.5'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-brand-500 text-white' : 'bg-ink-950 text-white'}`}>
                              <ServiceIcon name={serv.iconName} className="w-5 h-5" />
                            </div>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-brand-500" />}
                          </div>

                          <h3 className="font-bold text-base text-ink-950">{serv.name}</h3>
                          <p className="text-sm text-ink-400 leading-relaxed line-clamp-2">{serv.shortDescription}</p>

                          <div className="flex items-center justify-between pt-3 border-t border-ink-950/8 text-sm">
                            <span className="text-ink-400">Priced after inspection</span>
                            <span className="font-mono font-bold text-brand-500">Quote</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button onClick={handleNext} className="btn btn-primary">
                      <span>Continue to Vehicle Details</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: VEHICLE DETAILS */}
              {step === 2 && (
                <div className="card-light p-6 sm:p-10 space-y-8">
                  <div className="border-b border-ink-950/8 pb-5 space-y-1.5">
                    <h2 className="text-2xl font-extrabold text-ink-950">Tell Us About Your Vehicle</h2>
                    <p className="text-sm text-ink-400">Entering your Irish registration plate helps us order parts and prepare in advance.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <label className="label">Vehicle Registration Plate *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. 201-G-4819 or 181-D-1200"
                        value={vehicleRegistration}
                        onChange={(e) => setVehicleRegistration(e.target.value)}
                        className="input uppercase font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="label">Make (e.g. Volkswagen, Ford)</label>
                      <input
                        type="text"
                        placeholder="e.g. Volkswagen"
                        value={vehicleMake}
                        onChange={(e) => setVehicleMake(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Model (e.g. Golf, Focus, A4)</label>
                      <input
                        type="text"
                        placeholder="e.g. Golf 2.0 TDI"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Year &amp; Mileage</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Year (2020)"
                          value={vehicleYear}
                          onChange={(e) => setVehicleYear(e.target.value)}
                          className="input"
                        />
                        <input
                          type="text"
                          placeholder="Mileage (km)"
                          value={mileage}
                          onChange={(e) => setMileage(e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="label">Fuel Type &amp; Transmission</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={fuelType}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFuelType(e.target.value as typeof fuelType)}
                          className="input"
                        >
                          <option value="diesel">Diesel</option>
                          <option value="petrol">Petrol</option>
                          <option value="hybrid">Hybrid</option>
                          <option value="electric">Electric</option>
                        </select>

                        <select
                          value={transmission}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTransmission(e.target.value as typeof transmission)}
                          className="input"
                        >
                          <option value="manual">Manual</option>
                          <option value="automatic">Automatic</option>
                        </select>
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label">Describe Any Specific Noise or Symptom</label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Squeaking noise when braking, annual NCT test coming up, check engine light..."
                        value={problemDescription}
                        onChange={(e) => setProblemDescription(e.target.value)}
                        className="input"
                      ></textarea>
                    </div>
                  </div>

                  {errorBanner}

                  <div className="pt-2 flex justify-between">
                    <button onClick={handlePrev} className="btn btn-outline-dark">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button onClick={handleNext} className="btn btn-primary">
                      <span>Select Date &amp; Time</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DATE & TIME */}
              {step === 3 && (
                <div className="card-light p-6 sm:p-10 space-y-8">
                  <div className="border-b border-ink-950/8 pb-5 space-y-1.5">
                    <h2 className="text-2xl font-extrabold text-ink-950">Select Preferred Date &amp; Time</h2>
                    <p className="text-sm text-ink-400">Workshop Hours: Mon–Fri 9:00 AM – 7:00 PM (Saturday hours TBC, Closed Sunday).</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="label">Select Date *</label>
                      <input
                        type="date"
                        required
                        min={new Date().toISOString().split('T')[0]}
                        value={bookingDate}
                        onChange={(e) => setBookingDate(e.target.value)}
                        className="input font-bold"
                      />
                      <div className="text-sm text-ink-400">
                        Selected Day: <span className="font-bold text-ink-950">{new Date(bookingDate).toLocaleDateString('en-IE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </div>
                      {isDateBlocked && (
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>The garage is closed on this date — please pick another day.</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <label className="label">Available Time Slots *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {availableTimeSlots.map((slot) => {
                          const isSelected = bookingTime === slot;
                          const isTaken = takenSlots.includes(slot);
                          return (
                            <button
                              key={slot}
                              type="button"
                              disabled={isTaken}
                              onClick={() => setBookingTime(slot)}
                              title={isTaken ? 'Already booked' : undefined}
                              className={`py-2.5 px-3 rounded-full font-mono font-bold text-sm border transition-all duration-200 ${
                                isTaken
                                  ? 'bg-paper-dark border-ink-950/8 text-ink-300 line-through cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-brand-500 text-white border-brand-500 shadow-md'
                                  : 'bg-white hover:bg-paper-dark border-ink-950/12 text-ink-700'
                              }`}
                            >
                              {slot}
                            </button>
                          );
                        })}
                      </div>
                      {takenSlots.length > 0 && (
                        <p className="text-xs text-ink-300">Crossed-out slots are already booked for this day.</p>
                      )}
                    </div>
                  </div>

                  <div className="bg-ink-950 text-white p-5 rounded-2xl flex items-start gap-4">
                    <Clock className="w-6 h-6 text-brand-400 shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <span className="font-bold block">This is a drop-off time *</span>
                      <span className="text-ink-200 leading-relaxed">
                        Please note that your vehicle may or may not be completed on the same day — please speak to our Customer Service Agent for more details.
                      </span>
                    </div>
                  </div>

                  {errorBanner}

                  <div className="pt-2 flex justify-between">
                    <button onClick={handlePrev} className="btn btn-outline-dark">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button onClick={handleNext} className="btn btn-primary">
                      <span>Enter Contact Info</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: CUSTOMER DETAILS */}
              {step === 4 && (
                <div className="card-light p-6 sm:p-10 space-y-8">
                  <div className="border-b border-ink-950/8 pb-5 space-y-1.5">
                    <h2 className="text-2xl font-extrabold text-ink-950">Your Contact Information</h2>
                    <p className="text-sm text-ink-400">We will send appointment updates and quote confirmations to these details.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="label">Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Sean O'Connor"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. 087 123 4567"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. sean@example.ie"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Preferred Contact Channel</label>
                      <select
                        value={preferredContact}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPreferredContact(e.target.value as typeof preferredContact)}
                        className="input"
                      >
                        <option value="phone">Phone Call</option>
                        <option value="whatsapp">WhatsApp Message</option>
                        <option value="email">Email</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label">Additional Drop-off Notes</label>
                      <textarea
                        rows={2}
                        placeholder="e.g. Need vehicle returned before 5pm, request call before ordering parts..."
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        className="input"
                      ></textarea>
                    </div>
                  </div>

                  {errorBanner}

                  <div className="pt-2 flex justify-between">
                    <button onClick={handlePrev} className="btn btn-outline-dark">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button onClick={handleNext} className="btn btn-primary">
                      <span>Review Booking Summary</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: BOOKING SUMMARY REVIEW */}
              {step === 5 && (
                <div className="card-light p-6 sm:p-10 space-y-8">
                  <div className="border-b border-ink-950/8 pb-5 space-y-1.5">
                    <h2 className="text-2xl font-extrabold text-ink-950">Review Booking Summary</h2>
                    <p className="text-sm text-ink-400">Please verify your service details before submitting to Friends Garage.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-paper border border-ink-950/8 rounded-2xl p-5 space-y-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
                        <ServiceIcon name={selectedService.iconName} className="w-4 h-4" />
                        Selected Service
                      </span>
                      <div className="font-bold text-ink-950 text-base">{selectedService.name}</div>
                      <div className="text-sm text-ink-400">{selectedService.shortDescription}</div>
                      <div className="text-sm text-ink-400 font-medium pt-2 border-t border-ink-950/8">
                        Priced individually — you'll receive a transparent quote before any work begins.
                      </div>
                    </div>

                    <div className="bg-paper border border-ink-950/8 rounded-2xl p-5 space-y-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
                        <Car className="w-4 h-4" />
                        Vehicle Information
                      </span>
                      <div className="font-bold text-ink-950 text-base uppercase font-mono">
                        {vehicleRegistration || 'Not specified'}
                      </div>
                      <div className="text-sm text-ink-400">
                        {vehicleMake} {vehicleModel} ({vehicleYear || 'N/A'})
                      </div>
                      <div className="text-sm text-ink-400 pt-2 border-t border-ink-950/8">
                        Fuel: {fuelType} | Transmission: {transmission}
                      </div>
                    </div>

                    <div className="bg-paper border border-ink-950/8 rounded-2xl p-5 space-y-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
                        <Calendar className="w-4 h-4" />
                        Date &amp; Time Slot
                      </span>
                      <div className="font-bold text-ink-950 text-base">
                        {new Date(bookingDate).toLocaleDateString('en-IE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                      <div className="text-sm text-ink-400">Time: <span className="font-mono font-bold text-ink-950">{bookingTime}</span></div>
                      <div className="text-sm text-ink-400 pt-2 border-t border-ink-950/8">
                        Location: Deerpark Industrial Estate, Oranmore
                      </div>
                    </div>

                    <div className="bg-paper border border-ink-950/8 rounded-2xl p-5 space-y-2.5">
                      <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-500">
                        <User className="w-4 h-4" />
                        Client Contact
                      </span>
                      <div className="font-bold text-ink-950 text-base">{customerName}</div>
                      <div className="text-sm text-ink-400">{customerPhone} | {customerEmail}</div>
                      <div className="text-sm text-ink-400 pt-2 border-t border-ink-950/8">
                        Channel: {preferredContact}
                      </div>
                    </div>
                  </div>

                  {errorBanner}

                  <div className="pt-4 flex justify-between items-center border-t border-ink-950/8">
                    <button onClick={handlePrev} className="btn btn-outline-dark">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      onClick={handleSubmitBooking}
                      disabled={loading}
                      className="btn btn-primary disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <span>Submitting Booking...</span>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>Confirm &amp; Send Booking Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 6: CONFIRMATION & REFERENCE */}
              {step === 6 && bookingConfirmed && (
                <div className="text-center space-y-8 py-6 sm:py-10">
                  <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center shadow-[0_0_70px_-12px_rgba(16,185,129,0.65)]">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>

                  <div className="space-y-4">
                    <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                      Booking Request Submitted
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold text-ink-950 leading-[1.08]">
                      Thank You, {bookingConfirmed.customerName}!
                    </h2>
                    <p className="text-base text-ink-400 max-w-lg mx-auto leading-relaxed">
                      Your appointment request has been received by Friends Garage in Oranmore. Our workshop team will review and confirm your slot.
                    </p>
                  </div>

                  <div className="card-dark max-w-md mx-auto p-8 space-y-3">
                    <span className="text-xs text-ink-300 block uppercase tracking-widest">Reference Number</span>
                    <span className="font-mono font-extrabold text-3xl sm:text-4xl text-brand-500 block tracking-wider">
                      {bookingConfirmed.referenceNumber}
                    </span>
                    <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-3 py-1.5 rounded-full">
                      Status: {bookingConfirmed.status}
                    </span>
                  </div>

                  <div className="pt-2 flex flex-wrap justify-center gap-3">
                    <button onClick={downloadCalendarEvent} className="btn btn-dark">
                      <Download className="w-4 h-4" />
                      <span>Add to Calendar (.ics)</span>
                    </button>

                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="btn btn-outline-dark"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Call Workshop ({settings.phone})</span>
                    </a>

                    <a
                      href={`https://wa.me/${settings.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Hi Friends Garage! I just booked ${bookingConfirmed.serviceName} (Ref: ${bookingConfirmed.referenceNumber}).`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-dark"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp Us</span>
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </section>
    </div>
  );
};
