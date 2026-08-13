import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Upload, CheckCircle, Trash2, Loader2 } from 'lucide-react';

interface EstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EstimateModal: React.FC<EstimateModalProps> = ({ isOpen, onClose }) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reference, setReference] = useState('');
  const [files, setFiles] = useState<{ name: string; size: string }[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredContact: 'phone' as const,
    vehicleRegistration: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    mileage: '',
    serviceRequired: 'Full Servicing & Inspection',
    problemDescription: '',
    preferredDate: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files as FileList).map((file: File) => ({
        name: file.name,
        size: `${(file.size / 1024).toFixed(0)} KB`
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          fileUrls: files.map(f => f.name)
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReference(data.referenceNumber || 'EST-2026-1049');
        setSubmitted(true);
      } else {
        alert('Could not submit estimate request. Please try again or call us.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error. Please try again.');
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
            className="card-dark relative overflow-hidden max-w-xl w-full m-auto p-6 sm:p-8"
          >
            <div className="glow-brand w-72 h-72 -top-28 -right-28" />

            {!submitted ? (
              <form onSubmit={handleSubmit} className="relative space-y-5">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-xl font-bold text-white">Request an Estimate</h3>
                      <p className="text-sm text-ink-300 mt-0.5">Receive a detailed repair or service quote from our Oranmore technicians.</p>
                      <p className="text-xs text-brand-400 mt-1 font-semibold">Fields marked * are mandatory.</p>
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
                      placeholder="e.g. Mary Higgins"
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
                      placeholder="e.g. 085 869 0104"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Email Address (optional)</label>
                    <input
                      type="email"
                      placeholder="e.g. mary@example.ie"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Vehicle Registration *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 182-G-982"
                      value={formData.vehicleRegistration}
                      onChange={(e) => setFormData({ ...formData, vehicleRegistration: e.target.value })}
                      className="input-dark uppercase"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Vehicle Make & Model</label>
                    <input
                      type="text"
                      placeholder="e.g. Audi A4 2.0 TDI"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      className="input-dark"
                    />
                  </div>

                  <div>
                    <label className="label-dark">Vehicle Year & Mileage</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Year (e.g. 2018)"
                        value={formData.vehicleYear}
                        onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                        className="input-dark"
                      />
                      <input
                        type="text"
                        placeholder="Mileage (km)"
                        value={formData.mileage}
                        onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                        className="input-dark"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label-dark">Required Service / Problem Scope *</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe what work or diagnosis you need estimated (e.g. clutch replacement, brake pads, noise when steering)..."
                    value={formData.problemDescription}
                    onChange={(e) => setFormData({ ...formData, problemDescription: e.target.value })}
                    className="input-dark resize-none"
                  ></textarea>
                </div>

                {/* Photo & Document Upload Handler */}
                <div className="space-y-3">
                  <label className="label-dark">Upload Photos or Documents (Optional — Max 10MB)</label>
                  <div className="border border-dashed border-white/15 hover:border-brand-500/60 bg-ink-950/40 p-5 rounded-xl text-center cursor-pointer transition-colors relative">
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileAdd}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <Upload className="w-6 h-6 text-brand-400 mx-auto mb-2" />
                    <span className="text-sm text-ink-200 font-medium block">Click or drag images/PDFs here</span>
                    <span className="text-xs text-ink-300">NCT failure sheet, dashboard lights, or vehicle photos</span>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      {files.map((file, i) => (
                        <div key={i} className="bg-ink-950/60 px-3 py-2 rounded-lg border border-white/10 flex items-center justify-between">
                          <span className="text-xs text-ink-200 truncate max-w-[260px]">
                            {file.name} <span className="font-mono text-ink-300">({file.size})</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            aria-label="Remove file"
                            className="text-red-400 hover:text-red-300 p-1 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full disabled:opacity-60 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Quote Request...</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Submit Estimate Request</span>
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
                  <h3 className="font-display text-2xl font-bold text-white">Estimate Request Received</h3>
                  <p className="text-sm text-ink-300 mt-2 max-w-sm mx-auto leading-relaxed">
                    Thank you — our technical team at Friends Garage in Oranmore will review your vehicle specs and issue a detailed quote shortly.
                  </p>
                </div>
                <div className="inline-block bg-ink-950/60 border border-white/10 rounded-xl px-5 py-3">
                  <span className="block text-xs uppercase tracking-widest text-ink-300 mb-1">Reference Number</span>
                  <span className="font-mono font-bold text-lg text-brand-400">{reference}</span>
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
