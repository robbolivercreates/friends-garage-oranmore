import React, { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, ExternalLink, CheckCircle, Smartphone } from 'lucide-react';
import { SiteSettings } from '../types';
import { Reveal } from '../components/ui/Reveal';

interface ContactPageProps {
  settings: SiteSettings;
}

export const ContactPage: React.FC<ContactPageProps> = ({ settings }) => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    registration: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="text-ink-950">
      {/* Hero band */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain pt-36 sm:pt-40 lg:pt-48 pb-24 lg:pb-28">
        <div className="glow-brand w-[28rem] h-[28rem] -top-32 -right-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 space-y-5">
          <Reveal inView={false}>
            <span className="eyebrow">Get In Touch</span>
          </Reveal>
          <Reveal inView={false} delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.05] tracking-tight max-w-3xl">
              Contact <span className="text-brand-500">Friends Garage</span>
            </h1>
          </Reveal>
          <Reveal inView={false} delay={0.2}>
            <p className="text-base sm:text-lg text-ink-200 max-w-2xl leading-relaxed">
              Located in Deerpark Industrial Estate, Oranmore. Call us, send a message, or visit our workshop.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Details + enquiry form */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Contact methods */}
          <div className="lg:col-span-5 space-y-5">
            <Reveal className="card-light p-7 flex items-start gap-5">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block">Landline</span>
                  <a href={`tel:${settings.phone.replace(/\s+/g, '')}`} className="font-mono font-bold text-lg text-ink-950 hover:text-brand-500 transition-colors">
                    {settings.phone}
                  </a>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block">Mobile</span>
                  <a href={`tel:${settings.mobile.replace(/\s+/g, '')}`} className="font-mono font-bold text-lg text-ink-950 hover:text-brand-500 transition-colors inline-flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-ink-300" />
                    {settings.mobile}
                  </a>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.05} className="card-light p-7 flex items-start gap-5">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block">Email Enquiries</span>
                <a href={`mailto:${settings.email}`} className="font-bold text-base text-ink-950 hover:text-brand-500 transition-colors break-all">
                  {settings.email}
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.1} className="card-light p-7 space-y-5">
              <div className="flex items-start gap-5">
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <span className="font-bold text-base text-ink-950 block">{settings.garageName}</span>
                  <span className="text-sm text-ink-400 block">{settings.address}</span>
                  <span className="text-sm text-ink-400 block">{settings.addressLine2}, Ireland</span>
                  <span className="text-sm text-ink-400 block">Eircode: <span className="font-mono font-semibold text-ink-950">{settings.eircode}</span></span>
                </div>
              </div>
              <a
                href="https://maps.google.com/?q=Deerpark+Industrial+Estate+Oranmore+Galway"
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline-dark w-full"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </Reveal>

            <Reveal delay={0.15} className="card-light p-7 flex items-start gap-5">
              <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block">Opening Hours</span>
                <dl className="text-sm space-y-2">
                  <div className="flex justify-between gap-4 pb-2 border-b border-ink-950/8">
                    <dt className="text-ink-400">Monday – Friday</dt>
                    <dd className="font-semibold text-ink-950 text-right">{settings.weekdayHours}</dd>
                  </div>
                  <div className="flex justify-between gap-4 pb-2 border-b border-ink-950/8">
                    <dt className="text-ink-400">Saturday</dt>
                    <dd className="font-semibold text-ink-950 text-right">{settings.saturdayHoursNote}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-400">Sunday</dt>
                    <dd className="font-semibold text-ink-950 text-right">{settings.sundayHours}</dd>
                  </div>
                </dl>
              </div>
            </Reveal>
          </div>

          {/* Enquiry form */}
          <Reveal delay={0.1} className="lg:col-span-7 card-light p-8 sm:p-10 space-y-6">
            <div className="space-y-1.5 border-b border-ink-950/8 pb-5">
              <h2 className="text-2xl font-bold font-display text-ink-950">Send us a message</h2>
              <p className="text-sm text-ink-400">Tell us about your vehicle and how we can help — we reply promptly.</p>
            </div>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. David Higgins"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 087 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="label">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. david@example.ie"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="label">Vehicle Reg (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 191-G-1200"
                      value={formData.registration}
                      onChange={(e) => setFormData({ ...formData, registration: e.target.value })}
                      className="input uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Your Enquiry / Message *</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="How can Friends Garage help you today?"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input"
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-primary w-full">
                  <Send className="w-4 h-4" />
                  Send Message to Workshop
                </button>
              </form>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold font-display text-ink-950">Message sent successfully</h3>
                <p className="text-sm text-ink-400 max-w-sm mx-auto leading-relaxed">
                  Thank you, {formData.name}. Our staff at Friends Garage in Oranmore will review your message and reply promptly.
                </p>
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* Map */}
      <section className="bg-paper pb-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <Reveal className="card-light p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-2">
              <span className="font-bold text-ink-950 font-display">Workshop Map: Deerpark Industrial Estate, Oranmore</span>
              <span className="font-mono text-sm text-ink-400">Co. Galway · {settings.eircode}</span>
            </div>

            <div className="w-full h-96 bg-paper-dark rounded-xl overflow-hidden border border-ink-950/8">
              <iframe
                title="Friends Garage Google Map Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9536.421832049185!2d-8.9284!3d53.2721!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x485b967888888888%3A0x8888888888888888!2sOranmore%2C%20Co.%20Galway!5e0!3m2!1sen!2sie!4v1600000000000!5m2!1sen!2sie"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
