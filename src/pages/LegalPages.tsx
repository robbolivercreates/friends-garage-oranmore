import React from 'react';
import { Home } from 'lucide-react';
import { Reveal } from '../components/ui/Reveal';

interface LegalShellProps {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}

const LegalShell: React.FC<LegalShellProps> = ({ eyebrow, title, children }) => (
  <div className="text-ink-950">
    <section className="relative overflow-hidden bg-ink-950 text-white grain pt-36 sm:pt-40 lg:pt-48 pb-20 lg:pb-24">
      <div className="glow-brand w-96 h-96 -top-32 -right-24" />
      <div className="relative max-w-3xl mx-auto px-4 md:px-8 space-y-4">
        <Reveal inView={false}>
          <span className="eyebrow">{eyebrow}</span>
        </Reveal>
        <Reveal inView={false} delay={0.1}>
          <h1 className="text-4xl sm:text-5xl font-extrabold font-display leading-[1.05] tracking-tight">
            {title}
          </h1>
        </Reveal>
        <Reveal inView={false} delay={0.2}>
          <p className="text-sm text-ink-300">Last updated: July 2026 · Friends Garage, Oranmore, Galway</p>
        </Reveal>
      </div>
    </section>

    <section className="bg-paper py-16 lg:py-24">
      <Reveal className="max-w-3xl mx-auto px-4 md:px-8">
        <div className="card-light p-8 sm:p-12 space-y-5 text-base text-ink-400 leading-[1.8]">
          {children}
        </div>
      </Reveal>
    </section>
  </div>
);

const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="text-xl font-bold font-display text-ink-950 pt-4 first:pt-0">{children}</h2>
);

export const PrivacyPolicyPage: React.FC = () => (
  <LegalShell eyebrow="GDPR Compliance" title="Privacy Policy">
    <H2>1. Introduction</H2>
    <p>
      Friends Garage ("we", "our", "us"), located at Deerpark Industrial Estate, Oranmore, Co. Galway (H91 H31C), respects your privacy and is committed to protecting your personal data in accordance with Irish Data Protection Law and GDPR.
    </p>

    <H2>2. Data We Collect</H2>
    <p>
      When you book a service, request an estimate, or request a callback through our website, we collect: name, phone number, email address, vehicle registration plate, vehicle make/model/year, mileage, and problem notes.
    </p>

    <H2>3. How We Use Your Data</H2>
    <p>
      Your information is strictly used to process appointment bookings, prepare vehicle repair quotes, communicate job progress, and issue invoicing. We never sell or share your data with third-party advertisers.
    </p>

    <H2>4. Data Retention & Rights</H2>
    <p>
      Vehicle service records are retained for historical maintenance logs. You have the right to request access to, correction of, or deletion of your personal data by emailing info@friendsgarage.net.
    </p>
  </LegalShell>
);

export const CookiePolicyPage: React.FC = () => (
  <LegalShell eyebrow="Cookie Transparency" title="Cookie Policy">
    <H2>1. Essential Booking Cookies</H2>
    <p>
      We use session cookies to remember your selected service and vehicle registration details as you move through our multi-step booking system.
    </p>

    <H2>2. Performance & Maps</H2>
    <p>
      Third-party cookies (such as Google Maps) allow embedded directions to our workshop in Oranmore. You can disable non-essential cookies via our consent banner.
    </p>
  </LegalShell>
);

export const TermsConditionsPage: React.FC = () => (
  <LegalShell eyebrow="Garage Terms" title="Terms & Conditions">
    <H2>1. Appointment Confirmations</H2>
    <p>
      Online bookings represent a booking request until reviewed and confirmed by our workshop team. We reserve the right to reschedule in the event of unexpected emergency repairs or parts lead times.
    </p>

    <H2>2. Estimates & Work Authorization</H2>
    <p>
      All estimates provided online or verbally are subject to physical inspection. No additional repairs will be performed without prior customer authorization.
    </p>
  </LegalShell>
);

export const NotFoundPage: React.FC<{ setActiveTab: (tab: string) => void }> = ({ setActiveTab }) => (
  <div className="relative overflow-hidden bg-ink-950 text-white grain min-h-[80vh] flex items-center justify-center pt-32 pb-24">
    <div className="glow-brand w-[28rem] h-[28rem] -top-24 left-1/2 -translate-x-1/2" />
    <div className="relative max-w-md mx-auto px-4 text-center space-y-6">
      <Reveal inView={false}>
        <span className="font-mono text-7xl font-bold text-brand-500 block">404</span>
      </Reveal>
      <Reveal inView={false} delay={0.1}>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-display text-white">
          Page Not Found
        </h1>
      </Reveal>
      <Reveal inView={false} delay={0.2}>
        <p className="text-base text-ink-300 leading-relaxed">
          The page you requested could not be located on Friends Garage Oranmore.
        </p>
      </Reveal>
      <Reveal inView={false} delay={0.3}>
        <button
          onClick={() => { setActiveTab('home'); window.scrollTo(0, 0); }}
          className="btn btn-primary"
        >
          <Home className="w-4 h-4" />
          Return to Garage Home
        </button>
      </Reveal>
    </div>
  </div>
);
