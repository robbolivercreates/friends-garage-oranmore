import React from 'react';
import { motion } from 'motion/react';
import { Calendar } from 'lucide-react';
import { TeamMember } from '../types';
import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal';
import { SectionHeader } from '../components/ui/SectionHeader';

interface TeamPageProps {
  team: TeamMember[];
  onOpenBooking: () => void;
}

export const TeamPage: React.FC<TeamPageProps> = ({ team, onOpenBooking }) => {
  return (
    <div className="text-ink-950">
      {/* Hero band */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain pt-36 sm:pt-40 lg:pt-48 pb-24 lg:pb-28">
        <div className="glow-brand w-[28rem] h-[28rem] -top-32 -right-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 space-y-5">
          <Reveal inView={false}>
            <span className="eyebrow">Expert Mechanics & Staff</span>
          </Reveal>
          <Reveal inView={false} delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.05] tracking-tight max-w-3xl">
              Meet the Friends Garage <span className="text-brand-500">team</span>
            </h1>
          </Reveal>
          <Reveal inView={false} delay={0.2}>
            <p className="text-base sm:text-lg text-ink-200 max-w-2xl leading-relaxed">
              Our qualified technicians, engineers, and advisors bring decades of combined experience to every vehicle we service in Oranmore.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Team grid */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {team.map((member) => (
              <motion.article
                key={member.id}
                variants={staggerChild}
                className="card-light overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                  {typeof member.experienceYears === 'number' && (
                    <span className="absolute top-4 right-4 font-mono text-xs font-bold bg-ink-950/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full border border-white/15">
                      {member.experienceYears}+ yrs
                    </span>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-6 space-y-1">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand-400">
                      {member.role}
                    </span>
                    <h3 className="text-2xl font-bold font-display text-white">{member.name}</h3>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  <p className="text-sm text-ink-400 leading-relaxed">{member.bio}</p>
                  <div className="space-y-2.5 pt-4 border-t border-ink-950/8">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-400 block">
                      Core Specialties
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {member.specialties.map((spec, i) => (
                        <span key={i} className="text-xs bg-paper-dark text-ink-700 font-medium px-2.5 py-1 rounded-lg">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Booking CTA */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain py-24 lg:py-32">
        <div className="glow-brand w-96 h-96 -bottom-32 -right-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 text-center space-y-8">
          <SectionHeader
            theme="dark"
            eyebrow="Book With The Team"
            title="Your car is in good hands"
            subtitle="Choose a service and a time that suits you — the workshop team will confirm your appointment promptly."
          />
          <Reveal delay={0.15}>
            <button onClick={onOpenBooking} className="btn btn-primary">
              <Calendar className="w-4 h-4" />
              Book a Service
            </button>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
