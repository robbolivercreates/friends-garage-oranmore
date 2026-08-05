import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, X, KeyRound, Loader2 } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          localStorage.setItem('fg_admin_token', data.token);
          onLoginSuccess();
          onClose();
        } else {
          setError('Invalid passcode');
        }
      } else {
        setError('Invalid passcode. Access restricted to workshop staff.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          className="fixed inset-0 z-[70] bg-ink-950/70 backdrop-blur-sm flex p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="card-dark relative overflow-hidden max-w-sm w-full m-auto p-6 sm:p-8"
          >
            <div className="glow-brand w-64 h-64 -top-24 -right-24" />

            <form onSubmit={handleSubmit} className="relative space-y-5">
              <div className="text-center space-y-3 border-b border-white/10 pb-5">
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 mx-auto">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-white">Staff Admin Login</h3>
                  <p className="text-sm text-ink-300 mt-1">Enter your garage passcode to manage bookings and requests.</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="absolute top-0 right-0 p-2 -mr-2 -mt-2 rounded-lg text-ink-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div>
                <label className="label-dark">Staff Passcode</label>
                <input
                  type="password"
                  required
                  placeholder="e.g. admin123"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="input-dark text-center font-mono font-bold tracking-widest"
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 text-center font-semibold">
                  {error}
                </div>
              )}

              <div className="text-xs text-ink-300 text-center italic">
                Demo passcode: <span className="font-mono text-ink-200 font-bold not-italic">admin123</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full disabled:opacity-60 disabled:pointer-events-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    <span>Authenticate Staff Access</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
