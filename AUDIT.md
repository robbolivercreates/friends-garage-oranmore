# FEATURE AUDIT — Friends Garage Workshop System (Aug 2026)

Baseline before the Shopmonkey/Tekmetric elevation. Everything listed here
MUST keep working (protected by the test gate in `tests/`).

## Public website (customer-facing)

| Feature | Where | Notes |
|---|---|---|
| Cinematic homepage (video hero, marquee, services, why-us, steps, reviews, team, CTA) | `src/pages/HomePage.tsx` | Quick-booking widget → booking tab |
| Services catalogue + detail modal | `ServicesPage.tsx` | Quote-only pricing (no amounts/durations) |
| 5-step booking wizard | `BookingPage.tsx` | Live availability, taken slots crossed out, blocked dates, Sunday rule, drop-off note, ICS download, WhatsApp link |
| Estimate request modal | `EstimateModal.tsx` | Mandatory: name, phone, reg, issue. Optional email + file names |
| Callback request modal | `CallbackModal.tsx` | Time groups + best-effort note |
| Roadside dispatch page | `RoadsidePage.tsx` | GPS capture, editable hours note, urgent email |
| Reviews (list + submit) | `ReviewsPage.tsx` | Star picker |
| About / Team / Contact / Legal pages | `*Page.tsx` | Real photos, new address, map embed |
| Cookie consent (GDPR) + GTM loader | `CookieBanner.tsx`, `lib/analytics.ts` | GTM gated on consent |
| SEO head per tab | `SEOHead.tsx` | |

## Staff portal (`AdminDashboard.tsx`, passcode → 12h Bearer token)

| Feature | Notes |
|---|---|
| Stats row (bookings, pending, today's jobs, estimates) | |
| Bookings table: search, status filter, confirm/complete/cancel (undoable), inline reschedule, internal notes, WhatsApp deep links, CSV export | |
| Manual booking creation (staff availability override) | |
| Estimates / Callbacks / Roadside inboxes | status pills, WhatsApp |
| Blocked dates manager | feeds public availability |
| Site settings editor | hours, capacity, address, GTM note, roadside note, AI key (BYOK) |
| AI Assistant tab | Gemini function calling over DB (search/create/move/cancel/block/stats, bulk) |

## Backend (`server.ts`, `server/db.ts`, `server/mailer.ts`, `server/assistant.ts`)

- Express REST API, SQLite (WAL) via `server/db.ts` single access layer
- Auth: passcode → in-memory 12h tokens; all PII endpoints behind `requireAdmin`
- Rate limiting (30/10min/IP public writes), input sanitisation, security headers
- Availability engine: Sunday rule, blocked dates, slot clash, daily capacity, staff override
- Mailer: branded templates, customer+garage notifications, ICS attachments, outbox fallback when SMTP unset
- Public endpoints: services/team/reviews GET, settings GET (key stripped), availability, POST forms

## What Shopmonkey/Tekmetric have that we lack (gap list)

1. **Vehicle database** — self-building records keyed by plate with full service history ← Wave 1-2
2. **Workshop kanban** — live status of every job/bay at a glance ← Wave 3
3. **Workflow statuses** beyond booking status (in bay, waiting parts, QC, ready) ← Wave 3
4. **Technician assignment** per job ← Wave 3
5. **Plate intelligence** — Irish/UK parsing, year/county autofill ← Wave 1
6. **Parts used** per service record ← Wave 2
7. Test coverage for all of the above ← Wave 0
