import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Eye, Wrench, HeartHandshake, Calendar, Users } from 'lucide-react';
import { SiteSettings } from '../types';
import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal';
import { SectionHeader } from '../components/ui/SectionHeader';
import { IMAGES } from '../config/assets';

interface AboutPageProps {
  settings: SiteSettings;
  setActiveTab: (tab: string) => void;
  onOpenBooking: () => void;
}

const VALUES = [
  {
    icon: HeartHandshake,
    title: 'Honesty First',
    desc: 'No unnecessary work and no hidden costs. If your car does not need it, we will tell you straight.'
  },
  {
    icon: Eye,
    title: 'Full Transparency',
    desc: 'We explain every fault clearly and agree the scope and price before any repair begins.'
  },
  {
    icon: Wrench,
    title: 'Technical Expertise',
    desc: 'Dealer-level diagnostic scanners, premium fluids and high-grade parts on every job.'
  },
  {
    icon: MapPin,
    title: 'Proudly Local',
    desc: 'Your family garage for Oranmore, Claregalway and Galway City — for years to come.'
  }
];

export const AboutPage: React.FC<AboutPageProps> = ({ settings, setActiveTab, onOpenBooking }) => {
  return (
    <div className="text-ink-950">
      {/* Hero band */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain pt-36 sm:pt-40 lg:pt-48 pb-24 lg:pb-28">
        <div className="glow-brand w-[28rem] h-[28rem] -top-32 -right-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 space-y-5">
          <Reveal inView={false}>
            <span className="eyebrow">About Friends Garage</span>
          </Reveal>
          <Reveal inView={false} delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.05] tracking-tight max-w-3xl">
              Over 20 years of automotive care in <span className="text-brand-500">Oranmore</span>
            </h1>
          </Reveal>
          <Reveal inView={false} delay={0.2}>
            <p className="text-base sm:text-lg text-ink-200 max-w-2xl leading-relaxed">
              Founded on honest craftsmanship, transparent customer service and technical accuracy — dealer-grade standards with the warmth of a local business.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Story & image collage */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-6">
            <SectionHeader
              align="left"
              eyebrow="Our Story & Heritage"
              title={<>Founded by <span className="text-brand-500">Wesley Da Silva</span></>}
            />
            <Reveal className="space-y-4 text-base text-ink-400 leading-relaxed">
              <p>
                Friends Garage was established by Wesley Da Silva with a clear vision: to bring honest, reliable, and professional automotive servicing to drivers across Oranmore, Galway City, and surrounding communities.
              </p>
              <p>
                Born in Brazil, Wesley made Galway his home over two decades ago. Throughout his career, he has built a reputation for deep technical knowledge, master-level engine diagnostics, and an unwavering commitment to client satisfaction.
              </p>
              <p>
                Today, Friends Garage operates out of Deerpark Industrial Estate in Oranmore. Supported by experienced technicians, advisors, and bodywork specialists, the garage delivers dealer-grade repair standards with the warm, approachable feel of a local business.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={0.1} className="relative pb-10 pl-0 sm:pl-10">
              <div className="rounded-2xl overflow-hidden border border-ink-950/10 shadow-2xl">
                <img
                  src={IMAGES.garage.teamAtWork}
                  alt="The Friends Garage team at work in the Oranmore workshop"
                  className="w-full h-[380px] sm:h-[460px] object-cover"
                />
              </div>
              <div className="absolute -bottom-2 left-0 sm:-left-2 w-40 sm:w-56 rounded-2xl overflow-hidden border-4 border-paper shadow-xl hidden sm:block">
                <img
                  src={IMAGES.garage.exterior}
                  alt="Friends Garage exterior, Deerpark Industrial Estate, Oranmore"
                  className="w-full h-28 sm:h-36 object-cover"
                />
              </div>
              <div className="card-light absolute -top-5 right-3 sm:-right-3 px-5 py-4 text-center shadow-xl">
                <span className="font-mono text-3xl font-bold text-brand-500 block leading-none">20+</span>
                <span className="text-xs font-semibold text-ink-400 tracking-wide uppercase">Years Experience</span>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Core values */}
      <section className="bg-paper-dark py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <SectionHeader
            eyebrow="Guiding Principles"
            title="The values behind every repair"
            subtitle="Four simple commitments that shape how we look after you and your car."
          />
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {VALUES.map((v) => (
              <motion.div
                key={v.title}
                variants={staggerChild}
                className="card-light p-8 space-y-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div className="w-11 h-11 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
                  <v.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-lg font-display text-ink-950">{v.title}</h3>
                <p className="text-sm text-ink-400 leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Stats row */}
          <Reveal>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-ink-950/8 rounded-2xl overflow-hidden border border-ink-950/8">
              {[
                { figure: '20+', label: 'Years industry experience' },
                { figure: '100%', label: 'Transparent pricing policy' },
                { figure: settings.eircode, label: 'Eircode — Deerpark, Oranmore' }
              ].map((s) => (
                <div key={s.label} className="bg-white px-8 py-8 text-center space-y-1.5">
                  <span className="font-mono text-3xl sm:text-4xl font-bold text-ink-950 block">{s.figure}</span>
                  <span className="text-sm text-ink-400 block">{s.label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* CTA band */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain py-24 lg:py-32">
        <div className="glow-brand w-96 h-96 -bottom-32 -left-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 text-center space-y-8">
          <SectionHeader
            theme="dark"
            eyebrow="Visit Us In Oranmore"
            title="Come and see the workshop"
            subtitle={`Friends Garage, Deerpark Industrial Estate, Oranmore, Co. Galway (Eircode: ${settings.eircode}). Convenient access from the N18, M6 and Galway City.`}
          />
          <Reveal delay={0.15} className="flex flex-wrap justify-center gap-4">
            <button onClick={onOpenBooking} className="btn btn-primary">
              <Calendar className="w-4 h-4" />
              Book an Appointment
            </button>
            <button
              onClick={() => { setActiveTab('team'); window.scrollTo(0, 0); }}
              className="btn btn-outline-light"
            >
              <Users className="w-4 h-4" />
              Meet Our Mechanics
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
