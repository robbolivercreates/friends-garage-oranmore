import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Phone,
  MapPin,
  Clock,
  Menu,
  X,
  Calendar,
  Wrench,
  FileText,
  ChevronRight
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenBooking: (serviceId?: string) => void;
  onOpenEstimate: () => void;
  onOpenCallback: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenBooking,
  onOpenEstimate,
  onOpenCallback
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'about', label: 'About Us' },
    { id: 'team', label: 'Our Team' },
    { id: 'roadside', label: 'Roadside Assistance' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' }
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      {/* Top utility bar — desktop only */}
      <div className="hidden md:block bg-ink-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-9 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6 text-ink-300">
            <a
              href="tel:+35391388596"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-mono tracking-tight">+353 (0) 91 388 596</span>
            </a>
            <a
              href="tel:+353858690104"
              className="flex items-center gap-2 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-mono tracking-tight">+353 85 869 0104</span>
              <span className="text-ink-400">(Mobile)</span>
            </a>
            <div className="hidden lg:flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-brand-400" />
              <span>Unit 5, Deerpark Ind. Est., Oranmore, Galway (H91 H31C)</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
              <span>Open Now · Mon–Fri 9am – 7pm</span>
            </div>
            <span className="w-px h-3.5 bg-white/10" aria-hidden="true" />
            <button
              onClick={onOpenCallback}
              className="font-semibold text-ink-200 hover:text-brand-400 transition-colors underline underline-offset-4 decoration-white/20 hover:decoration-brand-400"
            >
              Request Callback
            </button>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <nav
        className={`transition-all duration-300 ${
          isScrolled
            ? 'bg-ink-950/90 backdrop-blur-md border-b border-white/10 shadow-[0_16px_40px_-20px_rgba(0,0,0,0.8)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-[4.5rem] flex items-center justify-between gap-4">
          {/* Logo lockup */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-[0_8px_24px_-8px_rgba(213,0,79,0.65)] group-hover:scale-105 transition-transform duration-300">
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
          </button>

          {/* Desktop pill nav */}
          <div className="hidden xl:flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`relative px-2.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors duration-200 ${
                    isActive ? 'text-white' : 'text-ink-200 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-full bg-brand-500 shadow-[0_4px_16px_-4px_rgba(213,0,79,0.7)]"
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    />
                  )}
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenEstimate}
              className="btn btn-outline-light px-4! py-2!"
            >
              <FileText className="w-4 h-4 text-brand-400" />
              <span>Get Estimate</span>
            </button>

            <button
              onClick={() => onOpenBooking()}
              className="btn btn-primary px-5! py-2!"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </button>
          </div>

          {/* Mobile / tablet controls */}
          <div className="flex items-center gap-2 xl:hidden">
            <a
              href="tel:+35391388596"
              className="md:hidden p-2.5 rounded-xl text-brand-400 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Call the garage"
            >
              <Phone className="w-5 h-5" />
            </a>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="xl:hidden overflow-hidden bg-ink-950/95 backdrop-blur-md border-b border-white/10"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 py-5 space-y-5">
                <div className="flex flex-col">
                  {navItems.map((item, index) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`group flex items-center justify-between py-3 border-b border-white/5 text-left transition-colors ${
                          isActive ? 'text-white' : 'text-ink-200 hover:text-white'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <span
                            className={`font-mono text-[11px] ${
                              isActive ? 'text-brand-400' : 'text-ink-400'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="text-base font-semibold">{item.label}</span>
                        </span>
                        <span className="flex items-center gap-2.5">
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />}
                          <ChevronRight
                            className={`w-4 h-4 transition-colors ${
                              isActive ? 'text-brand-400' : 'text-ink-400 group-hover:text-white'
                            }`}
                          />
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenEstimate();
                    }}
                    className="btn btn-outline-light w-full"
                  >
                    <FileText className="w-4 h-4 text-brand-400" />
                    <span>Get Estimate</span>
                  </button>

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenBooking();
                    }}
                    className="btn btn-primary w-full"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Service</span>
                  </button>
                </div>

                <div className="card-dark p-4 flex flex-col gap-3 text-sm">
                  <div className="flex items-center gap-3 text-ink-200">
                    <MapPin className="w-4 h-4 text-brand-400 shrink-0" />
                    <span>Unit 5, Deerpark Ind. Est., Oranmore</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                    <span className="flex items-center gap-3 text-ink-300">
                      <Clock className="w-4 h-4 text-brand-400 shrink-0" />
                      Mon–Fri · 9:00 – 19:00
                    </span>
                    <a
                      href="tel:+35391388596"
                      className="font-bold text-brand-400 hover:text-brand-500 transition-colors"
                    >
                      Call Now
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
