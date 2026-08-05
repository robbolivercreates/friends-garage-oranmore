/**
 * Analytics loader — Google Tag Manager with GDPR consent gating.
 *
 * Set VITE_GTM_ID (e.g. "GTM-XXXXXXX") in the environment before build/dev.
 * GTM only loads AFTER the visitor grants analytics/marketing consent in the
 * cookie banner (stored in localStorage 'fg_cookie_consent'). If the env var
 * is missing, this module is a no-op.
 *
 * Facebook/Meta Pixel: add it inside the GTM container (tag type "Custom
 * HTML" or the Meta Pixel template) — no code changes needed here.
 */

const GTM_ID = (import.meta.env.VITE_GTM_ID as string | undefined) || '';
const CONSENT_KEY = 'fg_cookie_consent';
const CONSENT_EVENT = 'fg-consent-changed';

let loaded = false;

function consentGranted(): boolean {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    const consent = JSON.parse(raw);
    return Boolean(consent.analytics || consent.marketing);
  } catch {
    return false;
  }
}

function loadGtm(): void {
  if (loaded || !GTM_ID) return;
  loaded = true;

  (window as any).dataLayer = (window as any).dataLayer || [];
  (window as any).dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);

  // Noscript fallback for non-JS environments
  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(GTM_ID)}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.prepend(noscript);
}

/** Call once at app startup. */
export function initAnalytics(): void {
  if (!GTM_ID) return;
  if (consentGranted()) loadGtm();
  window.addEventListener(CONSENT_EVENT, () => {
    if (consentGranted()) loadGtm();
  });
}
