import React from 'react';
import { motion } from 'motion/react';
import { Award, ShieldCheck, Cpu, MapPin } from 'lucide-react';
import { staggerParent, staggerChild } from './ui/Reveal';

export const TrustBar: React.FC = () => {
  const trustPoints = [
    {
      icon: Award,
      title: '20+ Years Experience',
      desc: 'Serving Oranmore & Galway drivers since 2004'
    },
    {
      icon: ShieldCheck,
      title: 'Qualified Mechanics',
      desc: 'Certified technicians and bodywork specialists'
    },
    {
      icon: Cpu,
      title: 'Fast Diagnostics',
      desc: 'Dealer-grade OBD-II system telemetry scanners'
    },
    {
      icon: MapPin,
      title: 'Local Galway Garage',
      desc: 'Unit 5, Deerpark Ind. Est., Oranmore'
    }
  ];

  return (
    <section className="bg-paper border-y border-ink-950/8 py-12 lg:py-16 relative z-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <motion.div
          variants={staggerParent}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10"
        >
          {trustPoints.map((point, index) => {
            const Icon = point.icon;
            return (
              <motion.div
                key={index}
                variants={staggerChild}
                className="flex flex-col gap-4 lg:border-l lg:border-ink-950/8 lg:pl-8 lg:first:border-l-0 lg:first:pl-0"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-mono text-lg lg:text-2xl font-bold text-ink-950 tracking-tight leading-tight">
                    {point.title}
                  </p>
                  <p className="mt-1.5 text-xs font-bold uppercase tracking-[0.14em] text-ink-400 leading-relaxed">
                    {point.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};
