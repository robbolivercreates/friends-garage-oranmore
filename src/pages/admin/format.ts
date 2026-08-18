/** Shared display helpers for the staff portal. */

/** Normalise Irish phone display to one local format staff actually dial. */
export const fmtPhone = (raw: string): string => {
  const d = (raw || '').replace(/\D/g, '');
  if (d.startsWith('353') && d.length >= 11) return fmtPhone('0' + d.slice(3));
  if (d.startsWith('0') && d.length >= 9) return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`.trim();
  return raw;
};

/** en-IE short date: 2026-08-07 → 7 Aug 2026 */
export const fmtDate = (iso: string): string =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
