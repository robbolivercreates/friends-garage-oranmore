import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  X,
  Star,
  ListChecks,
  Wrench,
  Activity,
  Calendar,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ServiceItem } from '../types';
import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal';
import { ServiceIcon } from '../components/ui/ServiceIcon';

interface ServicesPageProps {
  services: ServiceItem[];
  onOpenBooking: (serviceId?: string) => void;
  onOpenEstimate: () => void;
  selectedServiceDetail: ServiceItem | null;
  setSelectedServiceDetail: (service: ServiceItem | null) => void;
}

const modalTransition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] as const };

export const ServicesPage: React.FC<ServicesPageProps> = ({
  services,
  onOpenBooking,
  onOpenEstimate,
  selectedServiceDetail,
  setSelectedServiceDetail
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'repairs', label: 'Repairs & Overhauls' },
    { id: 'diagnostics', label: 'Diagnostics & DPF' },
    { id: 'roadside', label: 'Roadside Emergency' },
    { id: 'performance', label: 'ECU Tuning' }
  ];

  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter(s => s.category === activeCategory);

  return (
    <div className="bg-paper min-h-screen text-ink-950">
      {/* Dark page header band */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain pt-32 sm:pt-36 md:pt-40 lg:pt-44 pb-16 lg:pb-20">
        <div className="glow-brand w-[28rem] h-[28rem] -top-32 -right-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 space-y-5">
          <Reveal inView={false}>
            <span className="eyebrow">Complete Garage Solutions</span>
          </Reveal>
          <Reveal inView={false} delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Automotive Services in <span className="text-brand-500">Oranmore, Galway</span>
            </h1>
          </Reveal>
          <Reveal inView={false} delay={0.2}>
            <p className="text-base sm:text-lg text-ink-200 max-w-2xl leading-relaxed">
              Explore our comprehensive range of car servicing, electronic diagnostics, brake overhauls, tyres, and roadside breakdown assistance.
            </p>
          </Reveal>

          {/* Category Filter Pills */}
          <Reveal inView={false} delay={0.3} className="pt-3 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'bg-brand-500 text-white shadow-lg'
                    : 'bg-white/5 text-ink-200 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </Reveal>
        </div>
      </section>

      {/* Services Grid Catalog */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <motion.div
            key={activeCategory}
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredServices.map((service) => (
              <motion.div
                key={service.id}
                variants={staggerChild}
                className="card-light p-6 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-ink-950 text-white flex items-center justify-center group-hover:bg-brand-500 transition-colors duration-300">
                      <ServiceIcon name={service.iconName} className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {service.popular && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2.5 py-1 rounded-full">
                          <Star className="w-3 h-3 fill-current" />
                          Popular
                        </span>
                      )}
                      <span className="text-xs font-bold font-mono text-ink-950 bg-paper-dark px-3 py-1 rounded-full">
                        {service.priceType === 'from' ? `From €${service.priceAmount}` : 'Request Quote'}
                      </span>
                    </div>
                  </div>

                  <h2 className="text-xl font-bold text-ink-950 group-hover:text-brand-500 transition-colors duration-300">
                    {service.name}
                  </h2>

                  <p className="text-sm text-ink-400 leading-relaxed">
                    {service.shortDescription}
                  </p>

                  {/* Key Features Preview */}
                  <div className="space-y-2 pt-1">
                    {service.features.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-ink-700">
                        <CheckCircle2 className="w-4 h-4 text-brand-500 shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-ink-400 pt-3 border-t border-ink-950/8">
                    <Clock className="w-4 h-4 text-brand-500" />
                    <span>Est. Duration: {service.estimatedDurationMinutes} mins</span>
                  </div>
                </div>

                <div className="pt-5 border-t border-ink-950/8 mt-6 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedServiceDetail(service)}
                    className="btn btn-outline-dark w-full"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => onOpenBooking(service.id)}
                    className="btn btn-primary w-full"
                  >
                    Book Service
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Individual Service Detail Modal */}
      <AnimatePresence>
        {selectedServiceDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={modalTransition}
              onClick={() => setSelectedServiceDetail(null)}
              className="fixed inset-0 bg-ink-950/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={modalTransition}
              className="card-dark relative max-w-3xl w-full my-8 p-6 sm:p-10 text-white space-y-8"
            >
              <button
                onClick={() => setSelectedServiceDetail(null)}
                className="absolute top-5 right-5 text-ink-300 hover:text-white transition-colors p-1"
                aria-label="Close service details"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-5 border-b border-white/10 pb-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-500 flex items-center justify-center shrink-0 shadow-lg">
                  <ServiceIcon name={selectedServiceDetail.iconName} className="w-7 h-7 text-white" />
                </div>
                <div className="space-y-1">
                  <span className="eyebrow eyebrow--plain">Service Breakdown</span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                    {selectedServiceDetail.name}
                  </h2>
                </div>
              </div>

              <p className="text-sm sm:text-base text-ink-200 leading-relaxed">
                {selectedServiceDetail.fullDescription}
              </p>

              {/* Features Included */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <ListChecks className="w-4 h-4 text-brand-400" />
                  What's Included in This Service
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedServiceDetail.features.map((feat, idx) => (
                    <div key={idx} className="bg-ink-950/40 p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                      <span className="text-sm text-ink-200">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Problems */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <Wrench className="w-4 h-4 text-brand-400" />
                  Common Problems We Fix
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedServiceDetail.commonProblems.map((problem, idx) => (
                    <div key={idx} className="bg-ink-950/40 p-3 rounded-xl border border-white/10 flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0 mt-1.5" />
                      <span className="text-sm text-ink-200">{problem}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signs / Symptoms */}
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
                  <Activity className="w-4 h-4 text-brand-400" />
                  Signs Your Vehicle Needs This Service
                </h3>
                <div className="space-y-2">
                  {selectedServiceDetail.symptoms.map((symp, idx) => (
                    <div key={idx} className="flex items-center gap-2.5 text-sm text-ink-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
                      <span>{symp}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer: price, duration & CTAs */}
              <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                <div className="flex items-center gap-8">
                  <div>
                    <span className="text-ink-300 block text-xs uppercase tracking-wider">Duration</span>
                    <span className="font-bold text-white text-base font-mono">{selectedServiceDetail.estimatedDurationMinutes} mins</span>
                  </div>
                  <div>
                    <span className="text-ink-300 block text-xs uppercase tracking-wider">Pricing</span>
                    <span className="font-bold text-brand-400 text-lg font-mono">
                      {selectedServiceDetail.priceType === 'from' ? `From €${selectedServiceDetail.priceAmount}` : 'Quote Required'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setSelectedServiceDetail(null);
                      onOpenEstimate();
                    }}
                    className="btn btn-outline-light"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Get Estimate</span>
                  </button>

                  <button
                    onClick={() => {
                      const serviceId = selectedServiceDetail.id;
                      setSelectedServiceDetail(null);
                      onOpenBooking(serviceId);
                    }}
                    className="btn btn-primary"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book This Service</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
