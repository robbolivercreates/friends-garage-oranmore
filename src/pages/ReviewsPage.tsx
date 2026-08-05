import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, CheckCircle, PenLine } from 'lucide-react';
import { Review } from '../types';
import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal';

interface ReviewsPageProps {
  reviews: Review[];
  onAddReview: (newReview: Partial<Review>) => void;
}

const Stars: React.FC<{ rating: number; className?: string }> = ({ rating, className = 'w-4 h-4' }) => (
  <div className="flex items-center gap-0.5 text-amber-400">
    {Array.from({ length: 5 }).map((_, i) => (
      <Star key={i} className={`${className} ${i < rating ? 'fill-amber-400' : 'text-ink-950/15'}`} />
    ))}
  </div>
);

export const ReviewsPage: React.FC<ReviewsPageProps> = ({ reviews, onAddReview }) => {
  const [showForm, setShowForm] = useState(false);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [serviceUsed, setServiceUsed] = useState('Full Servicing');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!author || !text) return;
    onAddReview({
      author,
      rating,
      text,
      serviceUsed
    });
    setSubmitted(true);
    setAuthor('');
    setText('');
  };

  const averageRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="text-ink-950">
      {/* Hero band */}
      <section className="relative overflow-hidden bg-ink-950 text-white grain pt-36 sm:pt-40 lg:pt-48 pb-24 lg:pb-28">
        <div className="glow-brand w-[28rem] h-[28rem] -top-32 -right-24" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 space-y-5">
          <Reveal inView={false}>
            <span className="eyebrow">Real Customer Testimonials</span>
          </Reveal>
          <Reveal inView={false} delay={0.1}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-display leading-[1.05] tracking-tight max-w-3xl">
              Customer reviews & <span className="text-brand-500">feedback</span>
            </h1>
          </Reveal>
          <Reveal inView={false} delay={0.2}>
            <p className="text-base sm:text-lg text-ink-200 max-w-2xl leading-relaxed">
              Authentic experiences from local Galway drivers who rely on Friends Garage for honest servicing and technical repairs.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Summary + write-review */}
      <section className="bg-paper py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          <Reveal>
            <div className="card-light p-8 sm:p-10 flex flex-col md:flex-row md:items-center gap-8 md:gap-12">
              <div className="flex items-center gap-6">
                <span className="font-mono text-6xl font-bold text-ink-950 leading-none">
                  {averageRating.toFixed(1)}
                </span>
                <div className="space-y-1.5">
                  <Stars rating={Math.round(averageRating)} className="w-5 h-5" />
                  <p className="text-sm text-ink-400">
                    Based on <span className="font-mono font-bold text-ink-950">{reviews.length}</span> review{reviews.length === 1 ? '' : 's'}
                  </p>
                </div>
              </div>
              <div className="md:ml-auto space-y-3 md:text-right">
                <p className="text-base text-ink-950 font-semibold font-display">Visited Friends Garage recently?</p>
                <p className="text-sm text-ink-400">Share your experience with our Oranmore mechanics.</p>
                <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
                  <PenLine className="w-4 h-4" />
                  {showForm ? 'Close Form' : 'Write a Review'}
                </button>
              </div>
            </div>
          </Reveal>

          {/* Submit review form */}
          <AnimatePresence initial={false}>
            {showForm && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="card-light p-8 sm:p-10 max-w-2xl mx-auto space-y-6"
              >
                <h3 className="font-bold text-xl font-display text-ink-950">Submit your feedback</h3>
                {!submitted ? (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="label">Your Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ciaran Daly"
                        value={author}
                        onChange={(e) => setAuthor(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Star Rating</label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            aria-label={`${n} star${n === 1 ? '' : 's'}`}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-7 h-7 transition-colors ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-ink-950/15'}`}
                            />
                          </button>
                        ))}
                        <span className="font-mono text-sm font-bold text-ink-950 ml-2">{rating}/5</span>
                      </div>
                    </div>

                    <div>
                      <label className="label">Service Performed</label>
                      <input
                        type="text"
                        placeholder="e.g. Brake Repair & Servicing"
                        value={serviceUsed}
                        onChange={(e) => setServiceUsed(e.target.value)}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Review Comments *</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Describe your service experience at Friends Garage..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        className="input"
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-dark w-full">
                      Submit Review
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 text-emerald-600 font-bold space-y-3">
                    <CheckCircle className="w-10 h-10 mx-auto" />
                    <p className="text-base">Thank you! Your feedback has been published.</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Review cards */}
          <motion.div
            variants={staggerParent}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {reviews.map((rev) => (
              <motion.article
                key={rev.id}
                variants={staggerChild}
                className="card-light p-7 flex flex-col gap-4 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <div className="flex items-center justify-between">
                  <Stars rating={rev.rating} />
                  <span className="text-xs bg-paper-dark text-ink-400 px-2.5 py-1 rounded-full font-semibold">
                    {rev.platform}
                  </span>
                </div>

                <p className="text-sm text-ink-400 leading-relaxed italic flex-1">
                  "{rev.text}"
                </p>

                <div className="pt-4 border-t border-ink-950/8 flex items-end justify-between gap-3">
                  <div>
                    <span className="font-bold text-ink-950 font-display block">{rev.author}</span>
                    {rev.serviceUsed && (
                      <span className="text-xs text-ink-400">{rev.serviceUsed}</span>
                    )}
                  </div>
                  <span className="font-mono text-xs text-ink-300 shrink-0">{rev.date}</span>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};
