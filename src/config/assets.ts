/**
 * Central image registry.
 *
 * TO REPLACE THE PLACEHOLDER PHOTOS WITH REAL ONES:
 * simply drop your files into `public/images/` using the exact same
 * filenames listed below — no code changes needed.
 * See `public/images/README.md` for details.
 */
export const IMAGES = {
  garage: {
    /** Cinematic hero backdrop — wide workshop shot, dark & moody works best */
    hero: '/images/garage/hero.jpg',
    /** "Why choose us" feature shot */
    workshop: '/images/garage/workshop.jpg',
    /** Diagnostics / technology shot */
    diagnostics: '/images/garage/diagnostics.jpg',
    /** About page — team at work / garage interior */
    teamAtWork: '/images/garage/team-at-work.jpg',
    /** About page — exterior / signage */
    exterior: '/images/garage/exterior.jpg'
  }
} as const;
