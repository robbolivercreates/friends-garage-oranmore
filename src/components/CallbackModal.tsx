import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PhoneCall, CheckCircle, Loader2 } from 'lucide-react';

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CallbackModal: React.FC<CallbackModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredContactTime: 'Morning (9am - 12pm)',
    vehicleRegistration: '',
    serviceNeeded: 'General Inquiry',
    message: ''
  });

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

    try {
      const res = await fetch('/api/callbacks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        alert('Could not submit callback request. Please call us directly at +353 91 388 596.');
      }
    } catch (err) {
      console.error(err);
      alert('Error submitting request. Please try again.');
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
            className="card-dark relative overflow-hidden max-w-lg w-full m-auto p-6 sm:p-8"
          >
            <div className="glow-brand w-72 h-72 -top-28 -right-28" />

            {!submitted ? (
              <form onSubmit={handleSubmit} className="relative space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 shrink-0">
                      <PhoneCall className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">Request a Callback</h3>
                      <p className="text-sm text-ink-300 mt-0.5">Our Oranmore team will phone you back promptly.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="p-2 -mr-2 -mt-1 rounded-lg text-ink-300 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label-dark">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Burke"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 087 123 4567"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. john@example.ie"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Vehicle Registration</label>
                    <input
                      type="text"
                      placeholder="e.g. 201-G-1234"
                      value={formData.vehicleRegistration}
                      onChange={(e) => setFormData({ ...formData, vehicleRegistration: e.target.value })}
                      className="input-dark uppercase"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Preferred Time</label>
                    <select
                      value={formData.preferredContactTime}
                      onChange={(e) => setFormData({ ...formData, preferredContactTime: e.target.value })}
                      className="input-dark"
                    >
                      <option value="Morning (9am - 12pm)">Morning (9:00 AM – 12:00 PM)</option>
                      <option value="Afternoon (12pm - 4pm)">Afternoon (12:00 PM – 4:00 PM)</option>
                      <option value="Late Afternoon (4pm - 7pm)">Late Afternoon (4:00 PM – 7:00 PM)</option>
                      <option value="As Soon As Possible">As Soon As Possible</option>
                    </select>
                  </div>

                  <div>
                    <label className="label-dark">Service Needed</label>
                    <select
                      value={formData.serviceNeeded}
                      onChange={(e) => setFormData({ ...formData, serviceNeeded: e.target.value })}
                      className="input-dark"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Full Servicing">Full Servicing</option>
                      <option value="Brake Repair">Brake Repair & Pads</option>
                      <option value="System Diagnostics">System Diagnostics</option>
                      <option value="Roadside Emergency">Roadside Emergency</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-dark">Short Message / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Describe your car issue or query..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="input-dark resize-none"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="w-4 h-4" />
                      <span>Request Callback Now</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="relative text-center py-8 space-y-5">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-400 mx-auto flex items-center justify-center shadow-[0_0_48px_-10px_rgba(52,211,153,0.5)]">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-display text-2xl font-bold text-white">Callback Request Received</h3>
                  <p className="text-sm text-ink-300 mt-2 max-w-sm mx-auto leading-relaxed">
                    Thank you, {formData.name}. Our staff at Friends Garage Oranmore will review your details and contact you at <span className="text-white font-semibold">{formData.phone}</span> during your preferred time window.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSubmitted(false);
                    onClose();
                  }}
                  className="btn btn-outline-light w-full"
                >
                  Close Window
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
