import React from 'react';
import { motion } from 'motion/react';

/**
 * Reveal — the standard scroll-in animation used across the whole site.
 * Fades up once when the element enters the viewport.
 */
interface RevealProps {
  children: React.ReactNode;
  /** Stagger delay in seconds */
  delay?: number;
  /** Vertical offset in px (default 28) */
  y?: number;
  className?: string;
  /** Set false to animate on mount instead of on scroll into view */
  inView?: boolean;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  delay = 0,
  y = 28,
  className,
  inView = true
}) => {
  const transition = { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const };
  if (!inView) {
    return (
      <motion.div
        className={className}
        initial={{ opacity: 0, y }}
        animate={{ opacity: 1, y: 0 }}
        transition={transition}
      >
        {children}
      </motion.div>
    );
  }
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={transition}
    >
      {children}
    </motion.div>
  );
};

/** Variants for staggered grids: parent gets `staggerParent`, children `staggerChild`. */
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } }
};

export const staggerChild = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const }
  }
};
