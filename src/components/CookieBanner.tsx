import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, X, Settings } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: true,
    marketing: false
  });

  useEffect(() => {
    const consent = localStorage.getItem('fg_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!showPreferencesModal) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPreferencesModal(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showPreferencesModal]);

  const saveConsent = (value: { necessary: boolean; analytics: boolean; marketing: boolean }) => {
    localStorage.setItem('fg_cookie_consent', JSON.stringify(value));
    // Notify the analytics loader (src/lib/analytics.ts)
    window.dispatchEvent(new Event('fg-consent-changed'));
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, analytics: true, marketing: true });
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleRejectNonEssential = () => {
    saveConsent({ necessary: true, analytics: false, marketing: false });
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
    setShowBanner(false);
    setShowPreferencesModal(false);
  };

  return (
    <>
      {/* Floating consent bar */}
      <AnimatePresence>
        {showBanner && !showPreferencesModal && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:max-w-md z-[60] card-dark backdrop-blur-md p-5"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-sm font-bold text-white">
                  Privacy & Cookies
                </div>
                <p className="text-sm text-ink-300 leading-relaxed mt-1">
                  We use essential cookies for appointment booking and analytics to keep your garage experience smooth and secure.
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <button
                    onClick={handleAcceptAll}
                    className="btn btn-primary !px-4 !py-2 !text-xs"
                  >
                    Accept All
                  </button>
                  <button
                    onClick={handleRejectNonEssential}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-ink-200 border border-white/15 hover:bg-white/5 hover:border-white/25 transition-colors"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => setShowPreferencesModal(true)}
                    className="text-xs text-ink-300 hover:text-white underline underline-offset-2 transition-colors"
                  >
                    Manage preferences
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preferences Modal */}
      <AnimatePresence>
        {showPreferencesModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowPreferencesModal(false); }}
            className="fixed inset-0 z-[70] bg-ink-950/70 backdrop-blur-sm flex p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="card-dark relative overflow-hidden max-w-lg w-full m-auto p-6 sm:p-8 space-y-5"
            >
              <div className="glow-brand w-72 h-72 -top-28 -right-28" />

              <div className="relative flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 shrink-0">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-white">Cookie Preference Center</h2>
                    <p className="text-sm text-ink-300 mt-0.5">Choose which cookies you allow us to use.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreferencesModal(false)}
                  aria-label="Close"
                  className="p-2 -mr-2 -mt-1 rounded-lg text-ink-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="relative text-sm text-ink-300 leading-relaxed">
                Essential cookies are required to process online service appointments and security verification.
              </p>

              <div className="relative space-y-3">
                <div className="bg-ink-950/60 p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">Strictly Necessary</div>
                    <div className="text-xs text-ink-300 mt-0.5">Required for appointment booking & security.</div>
                  </div>
                  <input type="checkbox" checked disabled className="w-4 h-4 accent-brand-500 shrink-0" />
                </div>

                <div className="bg-ink-950/60 p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">Performance Analytics</div>
                    <div className="text-xs text-ink-300 mt-0.5">Anonymous usage metrics to improve booking page speed.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="w-4 h-4 accent-brand-500 cursor-pointer shrink-0"
                  />
                </div>

                <div className="bg-ink-950/60 p-4 rounded-xl border border-white/10 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold text-white">Marketing & Maps</div>
                    <div className="text-xs text-ink-300 mt-0.5">Enables embedded Google Maps directions in Oranmore.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="w-4 h-4 accent-brand-500 cursor-pointer shrink-0"
                  />
                </div>
              </div>

              <button
                onClick={handleSavePreferences}
                className="relative btn btn-primary w-full"
              >
                Save Cookie Preferences
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
