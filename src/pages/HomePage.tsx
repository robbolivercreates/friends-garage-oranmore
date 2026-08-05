import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Phone,
  FileText,
  ShieldCheck,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  Cpu,
  CheckCircle2,
  Users
} from 'lucide-react';
import { ServiceItem, TeamMember, Review, SiteSettings } from '../types';
import { TrustBar } from '../components/TrustBar';
import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ServiceIcon } from '../components/ui/ServiceIcon';
import { IMAGES } from '../config/assets';

interface HomePageProps {
  services: ServiceItem[];
  team: TeamMember[];
  reviews: Review[];
  settings: SiteSettings;
  setActiveTab: (tab: string) => void;
  onOpenBooking: (serviceId?: string) => void;
  onOpenEstimate: () => void;
  onOpenCallback: () => void;
  onSelectServiceDetail: (service: ServiceItem) => void;
}

const WHY_CHOOSE_FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Experienced Mechanics',
    text: 'Led by Wesley Da Silva with over 20 years in automotive engineering.'
  },
  {
    icon: FileText,
    title: 'Transparent Service',
    text: 'Clear quotes before work begins. No hidden charges or unexpected bills.'
  },
  {
    icon: Cpu,
    title: 'Professional Diagnostics',
    text: 'Dealer-grade scanners for fast and accurate fault identification.'
  },
  {
    icon: MapPin,
    title: 'Local & Reliable',
    text: 'Conveniently located in Oranmore with accessible customer parking.'
  }
];

const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    title: 'Choose Your Service',
    desc: 'Select from full servicing, brake repairs, diagnostics, tyres, or roadside assistance.'
  },
  {
    step: '02',
    title: 'Select Date & Time',
    desc: 'Pick a convenient slot during our workshop operating hours.'
  },
  {
    step: '03',
    title: 'Vehicle Details',
    desc: 'Provide your registration, make, model and describe any specific issue.'
  },
  {
    step: '04',
    title: 'Receive Confirmation',
    desc: 'Get an instant reference number and confirmation from our Oranmore team.'
  }
];

export const HomePage: React.FC<HomePageProps> = ({
  services,
  team,
  reviews,
  settings,
  setActiveTab,
  onOpenBooking,
  onOpenEstimate,
  onOpenCallback,
  onSelectServiceDetail
}) => {
  // Mini Booking Widget State
  const [quickService, setQuickService] = useState('full-maintenance');
  const [quickDate, setQuickDate] = useState('');
  const [quickReg, setQuickReg] = useState('');

  // Hero media: play /videos/hero.mp4 when present, otherwise the still image
  const [heroVideoOk, setHeroVideoOk] = useState(true);

  const handleQuickBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onOpenBooking(quickService);
  };

  const telHref = `tel:${settings.phone.replace(/\s+/g, '')}`;

  return (
    <div className="space-y-0 text-ink-950">
      {/* 1. HERO — cinematic full-viewport image hero */}
      <section className="grain relative min-h-screen bg-ink-950 text-white flex items-center overflow-hidden pt-32 sm:pt-36 pb-20">
        {/* Background media: video if /videos/hero.mp4 exists, else Ken Burns image */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {heroVideoOk ? (
            <video
              className="w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={IMAGES.garage.hero}
              onError={() => setHeroVideoOk(false)}
            >
              <source src="/videos/hero.mp4" type="video/mp4" onError={() => setHeroVideoOk(false)} />
            </video>
          ) : (
            <img
              src={IMAGES.garage.hero}
              alt="Friends Garage workshop in Oranmore, Galway"
              className="animate-kenburns w-full h-full object-cover"
            />
          )}
          {/* Layered ink scrims for legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/80 to-ink-950/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-transparent to-ink-950/60" />
        </div>

        <div className="glow-brand w-[28rem] h-[28rem] -top-24 -left-24" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-8">
            <Reveal inView={false} delay={0}>
              <div className="inline-flex items-center gap-2.5 bg-white/5 backdrop-blur-md border border-white/15 px-4 py-2 rounded-full text-sm text-ink-200">
                <span className="animate-pulse-dot w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="font-semibold text-white">Deerpark Industrial Estate, Oranmore, Galway</span>
              </div>
            </Reveal>

            <Reveal inView={false} delay={0.1}>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] text-white">
                Trusted Car Care in <span className="text-brand-500">Galway</span>
              </h1>
            </Reveal>

            <Reveal inView={false} delay={0.2}>
              <p className="text-base sm:text-lg text-ink-200 max-w-2xl font-light leading-relaxed">
                Professional servicing, repairs and diagnostics from experienced local mechanics in Oranmore. From routine maintenance to complex fault diagnosis, Friends Garage keeps your vehicle safe and reliable.
              </p>
            </Reveal>

            <Reveal inView={false} delay={0.3}>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onOpenBooking()} className="btn btn-primary">
                  <Calendar className="w-4 h-4" />
                  <span>Book an Appointment</span>
                </button>

                <button onClick={onOpenEstimate} className="btn btn-outline-light">
                  <FileText className="w-4 h-4 text-brand-400" />
                  <span>Get an Estimate</span>
                </button>

                <a href={telHref} className="btn btn-outline-light">
                  <Phone className="w-4 h-4 text-brand-400" />
                  <span>{settings.phone}</span>
                </a>
              </div>
            </Reveal>

            <Reveal inView={false} delay={0.4}>
              <div className="pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm text-ink-200">
                {['20+ Years Expertise', 'Qualified Mechanics', 'OBD-II Diagnostics', 'Honest Local Service'].map((proof) => (
                  <div key={proof} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                    <span>{proof}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Right Hero Glass Quick Booking Widget */}
          <div className="lg:col-span-5">
            <Reveal inView={false} delay={0.35}>
              <div className="card-dark backdrop-blur-xl bg-ink-800/70 p-6 sm:p-7 text-white space-y-5">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-lg">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-base font-display text-white">Quick Service Booking</h3>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full font-semibold">
                    Instant Availability
                  </span>
                </div>

                <form onSubmit={handleQuickBookingSubmit} className="space-y-4">
                  <div>
                    <label className="label-dark">Select Service Needed</label>
                    <select
                      value={quickService}
                      onChange={(e) => setQuickService(e.target.value)}
                      className="input-dark"
                    >
                      {services.map((s) => (
                        <option key={s.id} value={s.id} className="bg-ink-900">
                          {s.name} ({s.priceType === 'from' ? `From €${s.priceAmount}` : 'Quote'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label-dark">Vehicle Registration Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 201-G-4819"
                      value={quickReg}
                      onChange={(e) => setQuickReg(e.target.value)}
                      className="input-dark uppercase"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Preferred Date</label>
                    <input
                      type="date"
                      value={quickDate}
                      onChange={(e) => setQuickDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="input-dark [color-scheme:dark]"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full">
                    <span>Continue Booking Flow</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="text-sm text-ink-300 text-center pt-2 border-t border-white/10">
                  Or call our workshop directly:{' '}
                  <a href={telHref} className="text-brand-400 font-bold hover:text-brand-500 transition-colors">
                    {settings.phone}
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 2. SERVICES MARQUEE STRIP */}
      <section className="bg-ink-950 border-y border-white/10 py-5 overflow-hidden" aria-hidden="true">
        <div className="animate-marquee flex w-max items-center gap-8">
          {[...services, ...services].map((service, idx) => (
            <div key={`${service.id}-${idx}`} className="flex items-center gap-8 shrink-0">
              <span className="font-display text-sm sm:text-base font-bold uppercase tracking-[0.2em] text-ink-200 whitespace-nowrap">
                {service.name}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
            </div>
          ))}
        </div>
      </section>

      {/* 3. TRUST BAR */}
      <TrustBar />

      {/* 4. SERVICES OVERVIEW */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-14">
          <SectionHeader
            eyebrow="Professional Garage Solutions"
            title="Complete Car Care Under One Roof"
            subtitle="From routine maintenance to specialist diagnostics, our team in Oranmore is here to keep your vehicle running safely and reliably."
          />

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={staggerChild}
                className="card-light p-6 sm:p-7 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-ink-950 border border-ink-700 flex items-center justify-center text-brand-400 group-hover:bg-brand-500 group-hover:border-brand-500 group-hover:text-white transition-colors duration-300">
                      <ServiceIcon name={service.iconName} className="w-5 h-5" />
                    </div>

                    {service.popular && (
                      <span className="text-xs font-bold uppercase tracking-wider bg-brand-500/10 text-brand-500 px-2.5 py-1 rounded-full border border-brand-500/20">
                        Popular Choice
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl font-bold text-ink-950 font-display group-hover:text-brand-500 transition-colors">
                    {service.name}
                  </h3>

                  <p className="text-ink-400 text-sm leading-relaxed line-clamp-3">
                    {service.shortDescription}
                  </p>

                  <div className="text-sm text-ink-400 pt-3 border-t border-ink-950/8 flex items-center justify-between">
                    <span>Est. Time: <span className="font-mono">{service.estimatedDurationMinutes}</span> mins</span>
                    <span className="font-bold text-ink-950 font-mono">
                      {service.priceType === 'from' ? `From €${service.priceAmount}` : 'Quote'}
                    </span>
                  </div>
                </div>

                <div className="pt-5 flex items-center justify-between gap-2 border-t border-ink-950/8 mt-5">
                  <button
                    onClick={() => onSelectServiceDetail(service)}
                    className="text-sm font-semibold text-ink-400 hover:text-brand-500 flex items-center gap-1 transition-colors"
                  >
                    <span>Learn More</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenBooking(service.id)}
                    className="px-4 py-2.5 bg-ink-950 hover:bg-brand-500 text-white text-sm font-bold rounded-xl transition-colors duration-300"
                  >
                    Book This Service
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <Reveal className="text-center">
            <button
              onClick={() => { setActiveTab('services'); window.scrollTo(0, 0); }}
              className="btn btn-dark"
            >
              <span>Explore All Garage Services</span>
              <ArrowRight className="w-4 h-4 text-brand-400" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* 5. WHY CHOOSE US */}
      <section className="bg-ink-950 text-white py-24 lg:py-32 relative overflow-hidden">
        <div className="glow-brand w-96 h-96 -bottom-24 -right-24" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          <div className="lg:col-span-6 space-y-10">
            <SectionHeader
              eyebrow="The Friends Garage Difference"
              title="Why Drivers in Galway Trust Friends Garage"
              subtitle="We combine decades of hands-on mechanical experience with transparent pricing and state-of-the-art diagnostic technology in Deerpark Industrial Estate."
              theme="dark"
              align="left"
            />

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              {WHY_CHOOSE_FEATURES.map((feature) => (
                <motion.div key={feature.title} variants={staggerChild} className="card-dark p-5 space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-500/15 text-brand-400 flex items-center justify-center">
                    <feature.icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-base text-white font-display">{feature.title}</h4>
                  <p className="text-sm text-ink-300 leading-relaxed">{feature.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <div className="lg:col-span-6">
            <Reveal delay={0.15}>
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img
                  src={IMAGES.garage.workshop}
                  alt="Friends Garage Oranmore technical workshop"
                  className="w-full h-[420px] lg:h-[520px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />

                <div className="absolute bottom-5 left-5 right-5 card-dark backdrop-blur-md bg-ink-950/80 p-5 sm:p-6 space-y-2">
                  <p className="font-bold text-base sm:text-lg text-white font-display leading-snug">
                    "Our goal is long-term customer trust, not quick turnover."
                  </p>
                  <p className="text-brand-400 font-semibold text-sm">
                    — Wesley Da Silva, Founder & Master Technician
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. HOW IT WORKS */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-14">
          <SectionHeader
            eyebrow="Simple & Seamless"
            title="How Booking Works"
            subtitle="Schedule your vehicle repair or routine servicing in four straightforward steps."
          />

          <div className="relative">
            {/* Connecting line across the steps on large screens */}
            <div className="hidden lg:block absolute top-16 left-[12%] right-[12%] h-px bg-ink-950/10" aria-hidden="true" />

            <motion.div
              variants={staggerParent}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: '-60px' }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
            >
              {HOW_IT_WORKS_STEPS.map((s) => (
                <motion.div key={s.step} variants={staggerChild} className="card-light p-6 sm:p-7 relative space-y-4">
                  <span className="font-mono text-4xl font-black text-brand-500 block">
                    {s.step}
                  </span>
                  <h3 className="font-bold text-lg text-ink-950 font-display">
                    {s.title}
                  </h3>
                  <p className="text-sm text-ink-400 leading-relaxed">
                    {s.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>

          <Reveal className="text-center">
            <button onClick={() => onOpenBooking()} className="btn btn-primary">
              <Calendar className="w-4 h-4" />
              <span>Start Online Booking Now</span>
            </button>
          </Reveal>
        </div>
      </section>

      {/* 7. CUSTOMER REVIEWS PREVIEW */}
      <section className="bg-ink-900 text-white py-24 lg:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <SectionHeader
              eyebrow="Verified Customer Feedback"
              title="What Local Drivers Say"
              theme="dark"
              align="left"
            />

            <Reveal delay={0.1}>
              <button
                onClick={() => { setActiveTab('reviews'); window.scrollTo(0, 0); }}
                className="text-sm text-brand-400 hover:text-white font-bold flex items-center gap-1 transition-colors shrink-0"
              >
                <span>View All Customer Reviews</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </Reveal>
          </div>

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {reviews.slice(0, 3).map((rev) => (
              <motion.div key={rev.id} variants={staggerChild} className="card-dark p-6 sm:p-7 flex flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm sm:text-base text-ink-200 leading-relaxed italic">
                    "{rev.text}"
                  </p>
                </div>

                <div className="pt-5 border-t border-white/10 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-white font-display text-sm">{rev.author}</div>
                    <div className="text-xs text-ink-300 mt-0.5">{rev.serviceUsed}</div>
                  </div>
                  <span className="text-xs bg-white/5 text-ink-200 px-2.5 py-1 rounded-full border border-white/10 shrink-0">
                    {rev.platform}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 8. TEAM PREVIEW */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-14">
          <SectionHeader
            eyebrow="Dedicated Staff"
            title="Meet Our Workshop Team"
            subtitle="Experienced mechanics and advisors delivering honest car maintenance in Oranmore."
          />

          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {team.slice(0, 3).map((member) => (
              <motion.div
                key={member.id}
                variants={staggerChild}
                className="card-light overflow-hidden group"
              >
                <div className="aspect-[4/5] relative overflow-hidden">
                  <img
                    src={member.photoUrl}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30 to-transparent" />

                  {member.experienceYears && (
                    <span className="absolute top-4 right-4 text-xs font-bold font-mono bg-ink-950/70 backdrop-blur-sm text-white border border-white/15 px-2.5 py-1 rounded-full">
                      {member.experienceYears}+ yrs
                    </span>
                  )}

                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <h3 className="font-bold text-xl font-display">{member.name}</h3>
                    <p className="text-sm text-brand-400 font-semibold mt-1">{member.role}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {member.specialties.slice(0, 3).map((spec) => (
                        <span key={spec} className="text-xs bg-white/10 backdrop-blur-sm text-white px-2 py-0.5 rounded-md border border-white/10">
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <Reveal className="text-center">
            <button
              onClick={() => { setActiveTab('team'); window.scrollTo(0, 0); }}
              className="btn btn-dark"
            >
              <Users className="w-4 h-4 text-brand-400" />
              <span>Meet All Team Members</span>
            </button>
          </Reveal>
        </div>
      </section>

      {/* 9. FINAL CTA & REQUEST A CALLBACK */}
      <section className="grain bg-ink-950 text-white py-24 lg:py-32 border-t border-white/10 relative overflow-hidden">
        <div className="glow-brand w-[26rem] h-[26rem] -top-32 -right-32" />

        <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center relative z-10">
          <div className="lg:col-span-7 space-y-8">
            <SectionHeader
              eyebrow="Ready to Get Your Car Back on the Road?"
              title="Book Your Service Today or Speak Directly with Our Team"
              subtitle="Located in Deerpark Industrial Estate, Oranmore. We offer flexible drop-offs, fast diagnostics, and genuine client care."
              theme="dark"
              align="left"
            />

            <Reveal delay={0.1}>
              <div className="card-dark p-6 sm:p-7">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-white block text-base font-display">Workshop Location</span>
                      <span className="text-ink-200 text-sm">{settings.address}, {settings.addressLine2}</span>
                      <span className="text-ink-300 block text-sm">Eircode: {settings.eircode}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-bold text-white block text-base font-display">Opening Hours</span>
                      <span className="text-ink-200 text-sm">{settings.weekdayHours}</span>
                      <span className="text-ink-300 block text-sm">{settings.saturdayHoursNote}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => onOpenBooking()} className="btn btn-primary">
                  <Calendar className="w-4 h-4" />
                  <span>Book Appointment</span>
                </button>

                <a href={telHref} className="btn btn-outline-light">
                  <Phone className="w-4 h-4 text-brand-400" />
                  <span>Call {settings.phone}</span>
                </a>

                <a
                  href="https://maps.google.com/?q=Deerpark+Industrial+Estate+Oranmore+Galway"
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline-light"
                >
                  <MapPin className="w-4 h-4 text-brand-400" />
                  <span>Get Directions</span>
                </a>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-5">
            <Reveal delay={0.2}>
              <div className="card-dark p-6 sm:p-7 space-y-5">
                <div className="border-b border-white/10 pb-4 space-y-2">
                  <h3 className="font-bold text-xl font-display text-white">
                    Request a Quick Callback
                  </h3>
                  <p className="text-sm text-ink-300 leading-relaxed">
                    Leave your details below and a member of our team will call you back during business hours.
                  </p>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); onOpenCallback(); }} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    className="input-dark"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (e.g. 087 123 4567)"
                    className="input-dark"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Vehicle Reg (e.g. 201-G-4819)"
                    className="input-dark uppercase"
                  />
                  <button type="submit" className="btn btn-primary w-full">
                    <Phone className="w-4 h-4" />
                    <span>Request Callback</span>
                  </button>
                </form>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
};
