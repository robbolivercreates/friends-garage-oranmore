import React from 'react';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Instagram,
  ExternalLink,
  Lock,
  Wrench,
  Calendar
} from 'lucide-react';
import { Reveal } from './ui/Reveal';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
  setActiveTab: (tab: string) => void;
  onOpenAdminLogin: () => void;
  onOpenBooking: (serviceId?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  settings,
  setActiveTab,
  onOpenAdminLogin,
  onOpenBooking
}) => {
  const goTo = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo(0, 0);
  };

  const columnHeading =
    'font-display text-xs font-bold uppercase tracking-[0.22em] text-white';
  const footerLink =
    'block text-sm text-ink-300 hover:text-white hover:translate-x-0.5 transition-all duration-200 text-left';

  const serviceLinks = [
    'Full Maintenance Services',
    'Brake Repair, Pads & Rotors',
    'System Diagnosis & Repair',
    'Air Conditioning Services',
    'Tyres & Wheel Balancing'
  ];

  const companyLinks = [
    { id: 'about', label: 'About Us' },
    { id: 'team', label: 'Our Team' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' }
  ];

  return (
    <footer className="bg-ink-950 text-white border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-16 lg:pt-20 pb-28 lg:pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-10">
          {/* Column 1: Brand & Identity */}
          <Reveal delay={0}>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-[0_8px_24px_-8px_rgba(213,0,79,0.65)]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-display text-lg font-extrabold tracking-tight text-white block leading-none">
                    FRIENDS<span className="text-brand-500">.</span>GARAGE
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.3em] uppercase text-ink-300 block mt-1">
                    Oranmore • Galway
                  </span>
                </div>
              </div>

              <p className="text-sm text-ink-300 leading-relaxed max-w-xs">
                Trusted car servicing, repairs and diagnostics in Oranmore, Galway.
                Professional and honest mechanics delivering local automotive care
                for over 20 years.
              </p>

              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm text-ink-200 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3.5 py-2 rounded-xl transition-colors"
              >
                <Instagram className="w-4 h-4 text-brand-400" />
                <span>@{settings.instagram}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            </div>
          </Reveal>

          {/* Column 2: Services */}
          <Reveal delay={0.08}>
            <div className="space-y-5">
              <h3 className={columnHeading}>Our Services</h3>
              <ul className="space-y-2.5">
                {serviceLinks.map((label) => (
                  <li key={label}>
                    <button onClick={() => goTo('services')} className={footerLink}>
                      {label}
                    </button>
                  </li>
                ))}
                <li className="pt-1">
                  <button
                    onClick={() => goTo('roadside')}
                    className="block text-sm font-semibold text-brand-400 hover:text-brand-500 hover:translate-x-0.5 transition-all duration-200 text-left"
                  >
                    Roadside Emergency Assistance
                  </button>
                </li>
              </ul>
            </div>
          </Reveal>

          {/* Column 3: Company */}
          <Reveal delay={0.16}>
            <div className="space-y-5">
              <h3 className={columnHeading}>Company</h3>
              <ul className="space-y-2.5">
                {companyLinks.map((link) => (
                  <li key={link.id}>
                    <button onClick={() => goTo(link.id)} className={footerLink}>
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Column 4: Contact card */}
          <Reveal delay={0.24}>
            <div className="card-dark p-6 space-y-4">
              <h3 className={columnHeading}>Contact</h3>

              <ul className="space-y-3.5 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">{settings.address}</span>
                    <span className="text-ink-300 block">
                      {settings.addressLine2} · <span className="font-mono">{settings.eircode}</span>
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <div>
                    <a
                      href={`tel:${settings.phone.replace(/\s+/g, '')}`}
                      className="font-mono text-ink-200 hover:text-white transition-colors block"
                    >
                      {settings.phone}
                    </a>
                    <a
                      href={`tel:${settings.mobile.replace(/\s+/g, '')}`}
                      className="font-mono text-xs text-ink-300 hover:text-white transition-colors block mt-0.5"
                    >
                      {settings.mobile} (Mobile)
                    </a>
                  </div>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-brand-400 shrink-0" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-ink-200 hover:text-white transition-colors break-all"
                  >
                    {settings.email}
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-brand-400 mt-0.5 shrink-0" />
                  <div className="text-ink-300 space-y-0.5">
                    <div>
                      <span className="text-white font-semibold">Mon – Fri:</span>{' '}
                      {settings.weekdayHours}
                    </div>
                    <div>
                      <span className="text-white font-semibold">Sat:</span>{' '}
                      {settings.saturdayHoursNote}
                    </div>
                    <div>
                      <span className="text-white font-semibold">Sun:</span>{' '}
                      {settings.sundayHours}
                    </div>
                  </div>
                </li>
              </ul>

              <div className="pt-4 border-t border-white/10 space-y-3">
                <button
                  onClick={() => onOpenBooking()}
                  className="btn btn-primary w-full"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment Online</span>
                </button>
                <a
                  href="https://maps.google.com/?q=Deerpark+Industrial+Estate+Oranmore+Galway"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-300 hover:text-brand-400 transition-colors"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Get Google Directions</span>
                </a>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Bottom legal bar */}
        <div className="mt-14 pt-7 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-ink-300">
          <p>
            © {new Date().getFullYear()} Friends Garage Oranmore · Deerpark
            Industrial Estate, Galway. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <button onClick={() => goTo('privacy')} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button onClick={() => goTo('cookies')} className="hover:text-white transition-colors">
              Cookie Policy
            </button>
            <button onClick={() => goTo('terms')} className="hover:text-white transition-colors">
              Terms & Conditions
            </button>
            <span className="w-px h-3.5 bg-white/10" aria-hidden="true" />
            <button
              onClick={onOpenAdminLogin}
              className="flex items-center gap-1.5 font-semibold text-ink-400 hover:text-brand-400 transition-colors"
              title="Staff Portal Login"
            >
              <Lock className="w-3 h-3" />
              <span>Staff Login</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
