import React, { useState } from 'react';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Truck,
  CheckCircle2,
  Navigation,
  AlertTriangle,
  TriangleAlert,
  CarFront,
  Siren
} from 'lucide-react';
import { SiteSettings } from '../types';
import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal';
import { SectionHeader } from '../components/ui/SectionHeader';
import { motion } from 'motion/react';

interface RoadsidePageProps {
  settings: SiteSettings;
}

const SAFETY_STEPS = [
  {
    icon: TriangleAlert,
    title: 'Switch on your hazards',
    desc: 'Activate your hazard warning lights immediately so approaching traffic can see you from a distance.'
  },
  {
    icon: CarFront,
    title: 'Get to a safe spot',
    desc: 'If the vehicle can roll, steer onto the hard shoulder or a lay-by, as far left as possible, wheels turned away from the road.'
  },
  {
    icon: AlertTriangle,
    title: 'Exit away from traffic',
    desc: 'Leave the vehicle via the passenger side and wait behind a barrier or well clear of the carriageway.'
  },
  {
    icon: PhoneCall,
    title: 'Call or dispatch us',
    desc: 'Ring our emergency mobile or send the dispatch form below with your location — keep your phone line free for our call-back.'
  }
];

export const RoadsidePage: React.FC<RoadsidePageProps> = ({ settings }) => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState('');
  const [geoLocating, setGeoLocating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    currentLocation: '',
    vehicleRegistration: '',
    vehicleMakeModel: '',
    problemType: 'breakdown' as const,
    vehicleCanMove: false,
    notes: ''
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(4);
        const lng = pos.coords.longitude.toFixed(4);
        setFormData(prev => ({
          ...prev,
          currentLocation: `GPS Coordinates: ${lat}, ${lng} (Near Oranmore / Galway)`
        }));
        setGeoLocating(false);
      },
      (err) => {
        console.error(err);
        alert('Could not detect location automatically. Please type your location or road name.');
        setGeoLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/roadside', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        const data = await res.json();
        setRefNumber(data.referenceNumber || 'EMG-2026-8812');
        setSubmitted(true);
      } else {
        alert('Could not dispatch request. Please call us directly at +353 85 869 0104.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting. Please call emergency mobile line directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-ink-950">
      {/* Urgent hero */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain pt-36 sm:pt-40 lg:pt-48 pb-24 lg:pb-32">
        <div className="glow-brand w-[34rem] h-[34rem] -top-40 left-1/2 -translate-x-1/2" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-8 text-center space-y-7">
          <Reveal inView={false}>
            <span className="inline-flex items-center gap-2 bg-brand-500/15 text-brand-400 border border-brand-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-[0.2em]">
              <Siren className="w-4 h-4" />
              Emergency Support — Galway & Oranmore
            </span>
          </Reveal>
          <Reveal inView={false} delay={0.1}>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold font-display leading-[1.02] tracking-tight">
              Broken <span className="text-brand-500">down?</span>
            </h1>
          </Reveal>
          <Reveal inView={false} delay={0.2}>
            <p className="text-base sm:text-lg text-ink-200 max-w-2xl mx-auto leading-relaxed">
              Flat battery, engine fault or flat tyre? Our mobile response van covers Oranmore, Galway City, Claregalway and the M6 / N18 corridors.
            </p>
          </Reveal>
          <Reveal inView={false} delay={0.3} className="flex flex-col sm:flex-row flex-wrap justify-center gap-4 pt-2">
            <a
              href={`tel:${settings.mobile.replace(/\s+/g, '')}`}
              className="btn btn-primary text-base sm:text-lg px-8 py-4"
            >
              <PhoneCall className="w-5 h-5" />
              Call {settings.mobile}
            </a>
            <a
              href={`tel:${settings.phone.replace(/\s+/g, '')}`}
              className="btn btn-outline-light px-8 py-4"
            >
              <PhoneCall className="w-4 h-4 text-brand-400" />
              Workshop {settings.phone}
            </a>
          </Reveal>
        </div>
      </section>

      {/* Dispatch form */}
      <section className="bg-ink-900 py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-4 md:px-8">
          {!submitted ? (
            <Reveal className="card-dark p-8 sm:p-10 space-y-8">
              <div className="border-b border-white/10 pb-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-500/15 text-brand-400 flex items-center justify-center shrink-0">
                  <Truck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold font-display text-white">Emergency dispatch request</h2>
                  <p className="text-sm text-ink-300">Fill in your current vehicle location for immediate triage.</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-dark">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Liam Flaherty"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 085 869 0104"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                </div>

                {/* Location Input with GPS trigger */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="label-dark mb-0">Current Vehicle Location *</label>
                    <button
                      type="button"
                      onClick={handleGetLocation}
                      disabled={geoLocating}
                      className="text-xs text-brand-400 hover:text-brand-500 flex items-center gap-1.5 font-bold transition-colors"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>{geoLocating ? 'Locating...' : 'Use My GPS Location'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. N18 near Oranmore exit, or Parkmore, Galway"
                    value={formData.currentLocation}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    className="input-dark"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-dark">Vehicle Registration *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 191-G-500"
                      value={formData.vehicleRegistration}
                      onChange={(e) => setFormData({ ...formData, vehicleRegistration: e.target.value })}
                      className="input-dark uppercase"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Vehicle Make & Model</label>
                    <input
                      type="text"
                      placeholder="e.g. BMW 320d"
                      value={formData.vehicleMakeModel}
                      onChange={(e) => setFormData({ ...formData, vehicleMakeModel: e.target.value })}
                      className="input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label-dark">Problem Type *</label>
                    <select
                      value={formData.problemType}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, problemType: e.target.value as typeof formData.problemType })}
                      className="input-dark"
                    >
                      <option value="battery">Flat Battery / Jump Start</option>
                      <option value="no_start">Vehicle Will Not Start</option>
                      <option value="breakdown">Engine Mechanical Breakdown</option>
                      <option value="towing">Flatbed Towing Required</option>
                      <option value="other">Other Emergency Issue</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-dark">Can Vehicle Be Moved Safely?</label>
                    <select
                      value={formData.vehicleCanMove ? 'yes' : 'no'}
                      onChange={(e) => setFormData({ ...formData, vehicleCanMove: e.target.value === 'yes' })}
                      className="input-dark"
                    >
                      <option value="no">No - Vehicle Completely Immobilised</option>
                      <option value="yes">Yes - Vehicle Can Roll / Steer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-dark">Additional Safety Notes</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Parked on hard shoulder, hazards on..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-dark"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full text-base py-4"
                >
                  {loading ? (
                    <span>Transmitting Location...</span>
                  ) : (
                    <>
                      <ShieldAlert className="w-5 h-5" />
                      <span>Dispatch Roadside Assistance Now</span>
                    </>
                  )}
                </button>
              </form>
            </Reveal>
          ) : (
            <Reveal inView={false} className="card-dark p-10 sm:p-12 text-center space-y-7">
              <div className="w-16 h-16 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <h2 className="text-3xl font-bold font-display text-white">Emergency request transmitted</h2>

              <div className="bg-ink-950/60 p-5 rounded-xl border border-white/10 max-w-sm mx-auto space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-300 block">Dispatch Reference</span>
                <span className="font-mono font-bold text-brand-400 text-2xl">{refNumber}</span>
              </div>

              <p className="text-sm text-ink-200 max-w-md mx-auto leading-relaxed">
                Our Oranmore response van has received your coordinates. Please keep your hazards on and remain in a safe location. A technician will call your mobile shortly.
              </p>

              <a
                href={`tel:${settings.mobile.replace(/\s+/g, '')}`}
                className="btn btn-primary"
              >
                <PhoneCall className="w-4 h-4" />
                Call Mobile Immediately ({settings.mobile})
              </a>
            </Reveal>
          )}
        </div>
      </section>

      {/* Safety steps + coverage */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <SectionHeader
            eyebrow="Stay Safe"
            title="What to do right now"
            subtitle="Four steps to keep you and your passengers safe while help is on the way."
          />
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {SAFETY_STEPS.map((step, i) => (
              <motion.div
                key={step.title}
                variants={staggerChild}
                className="card-light p-7 space-y-4 relative"
              >
                <span className="font-mono text-4xl font-bold text-ink-950/10 absolute top-5 right-6">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <step.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg font-display text-ink-950">{step.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <Reveal>
            <div className="card-light px-8 py-6 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
              <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
              <p className="text-base text-ink-950 font-semibold">
                Rapid response across <span className="font-mono">Oranmore · Galway City · Claregalway · M6 & N18</span>
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
