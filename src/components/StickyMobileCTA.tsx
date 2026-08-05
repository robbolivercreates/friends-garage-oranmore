import React from 'react';
import { Phone, Calendar, ShieldAlert } from 'lucide-react';

interface StickyMobileCTAProps {
  onOpenBooking: () => void;
  onOpenRoadside: () => void;
  phone: string;
}

export const StickyMobileCTA: React.FC<StickyMobileCTAProps> = ({
  onOpenBooking,
  onOpenRoadside,
  phone
}) => {
  const actionBase =
    'flex flex-col items-center justify-center gap-1.5 py-3.5 transition-colors duration-200';
  const actionLabel = 'text-[11px] font-bold uppercase tracking-[0.12em]';

  return (
    <div className="lg:hidden fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40">
      <div className="card-dark bg-ink-950/80! bg-none! backdrop-blur-xl grid grid-cols-3 divide-x divide-white/10 overflow-hidden">
        <a
          href={`tel:${phone.replace(/\s+/g, '')}`}
          className={`${actionBase} text-ink-200 hover:text-white hover:bg-white/5 active:bg-white/10`}
        >
          <Phone className="w-5 h-5 text-brand-400" />
          <span className={actionLabel}>Call</span>
        </a>

        <button
          onClick={onOpenBooking}
          className={`${actionBase} bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-600`}
        >
          <Calendar className="w-5 h-5" />
          <span className={actionLabel}>Book</span>
        </button>

        <button
          onClick={onOpenRoadside}
          className={`${actionBase} text-ink-200 hover:text-white hover:bg-white/5 active:bg-white/10`}
        >
          <ShieldAlert className="w-5 h-5 text-brand-400" />
          <span className={actionLabel}>Roadside</span>
        </button>
      </div>
    </div>
  );
};
