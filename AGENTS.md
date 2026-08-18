# AGENTS.md — Friends Garage Oranmore

Complete project documentation. Read this (plus `DESIGN_SYSTEM.md` for
anything visual) before modifying the project.

## What this is

Marketing + booking website for **Friends Garage**, a car-service garage in
Oranmore, Co. Galway, Ireland. Single-page app with online booking, estimate
requests, callbacks, roadside-assistance dispatch, reviews, and a staff
admin portal. Built to be delivered to a non-technical client.

## Commands

```bash
npm install        # install deps
npm run dev        # dev server — http://localhost:3000 (Express + Vite middleware, ONE port)
npm run lint       # TypeScript check (tsc --noEmit) — must stay clean
npm run build      # production build → dist/ + dist/server.cjs
npm start          # run production build (NODE_ENV=production path)
```

There is no test suite; verify changes by running the server and exercising
the API with curl and/or the UI (Playwright works well — headless Chromium).

## Architecture

- **Frontend:** React 19 + Vite 6 + Tailwind CSS v4 + Motion (`motion/react`)
  + lucide-react. TypeScript, `jsx: react-jsx`, NOT strict mode — but keep
  new code fully typed (no `any` leaks).
- **Routing:** NO react-router. `src/App.tsx` holds `activeTab` state and
  conditionally renders pages. All navigation is `setActiveTab(tabId)` +
  `window.scrollTo`. Valid tabs: home, services, about, team, booking,
  roadside, reviews, contact, privacy, cookies, terms, admin.
- **Backend:** Express in `server.ts` (same process serves the API and the
  frontend). Port 3000.
- **Database:** SQLite via `better-sqlite3` — file `data/friendsgarage.db`
  (WAL mode). ALL data access goes through `server/db.ts` — never read/write
  the DB file directly from `server.ts`. Seeds come from
  `src/data/initialData.ts`; a legacy `data/db.json` is auto-imported once
  (then renamed `.imported`).
- **Email:** `server/mailer.ts`. If `SMTP_HOST/USER/PASS` env vars are set →
  real email via nodemailer; otherwise every email is appended to
  `data/outbox.json` + console-logged (nothing is ever dropped). Emails are
  ALWAYS fired after the HTTP response (`void Promise.all([...]).catch(...)`)
  — mail must never block or fail a booking.

## File map

```
server.ts                 Express app: all REST endpoints, Vite/static middleware
server/db.ts              SQLite data layer (the ONLY db access point)
server/mailer.ts          Email templates + SMTP/outbox delivery
server/assistant.ts       Staff AI assistant (Gemini function calling, BYOK)
server/plates.ts          Irish+UK plate parser (pure functions, unit-tested)
server/vehicleProviders.ts Plate-lookup provider abstraction (NoOp default)
src/App.tsx               Tab router + global state + modals; chrome split
                          (marketing nav/footer hidden in the staff portal)
src/types.ts              Shared TS interfaces (Booking, ServiceItem, ...)
src/data/initialData.ts   Seed content: 11 services, 5 team members, reviews, settings
src/data/carData.ts       24 Irish-market makes → models → engines
src/config/assets.ts      IMAGES registry → /images/garage/*
src/index.css             Tailwind v4 @theme tokens + shared utilities/animations
src/components/           Navbar, Footer, TrustBar, StickyMobileCTA, modals, SEOHead
src/components/ui/        Reveal (scroll anim), SectionHeader, ServiceIcon — shared primitives
src/pages/                One file per tab; AdminDashboard.tsx is the staff portal
src/pages/admin/          api.ts (authed fetch), format.ts (fmtPhone/fmtDate),
                          WorkshopBoard.tsx (kanban), VehiclesPanel.tsx (vehicle DB)
tests/                    node:test gate (36 tests): plates units + API + vehicles
public/images/            All photography (see public/images/README.md)
public/videos/            Optional hero.mp4 (see public/videos/README.md)
public/progress.html      Live build-progress page
data/                     Runtime data (gitignored): friendsgarage.db, outbox.json
AUDIT.md                  Feature audit baseline (pre-elevation map)
DESIGN_SYSTEM.md          Visual language contract — REQUIRED reading for UI work
GUIA-DE-ATIVACAO.md       Client-facing activation guide (Portuguese)
```

## API endpoints (all under `/api`)

| Method & path | Purpose |
|---|---|
| GET `/health` | Healthcheck |
| GET `/services`, GET `/services/:slugOrId` | Services |
| GET `/team` | Team members |
| GET/POST `/reviews` | List / add review |
| GET/PATCH `/settings` | Site settings (merge patch) |
| GET `/availability?date=YYYY-MM-DD` | PUBLIC safe subset: blockedDates, takenSlots, bookedCount, maxDailyBookings |
| GET/POST `/bookings` | List / create (409 on Sunday, blocked date, slot clash, full day) |
| PATCH/DELETE `/bookings/:idOrRef` | Update (status change emails customer) / soft-cancel |
| GET/POST `/estimates` | Quote requests |
| GET/POST `/callbacks` | Callback requests |
| GET/POST `/roadside` | Emergency dispatch requests |
| GET/POST/DELETE `/blocked-dates[/:idOrDate]` | Staff-blocked days (write = staff only) |
| POST `/admin/login` | Passcode → 12h Bearer token (passcode from `ADMIN_PASSCODE` env) |
| POST `/admin/chat` | Staff AI assistant (Gemini function calling; needs `GEMINI_API_KEY`) |

**Auth model:** all endpoints that read or mutate customer data require
`Authorization: Bearer <token>` from `/api/admin/login`. Public: services,
team, reviews, settings GET, availability, and the public POST forms
(rate-limited 30/10min/IP, input-validated).

Reference numbers: `FG-2026-XXXX` bookings, `EST-`, `EMG-` (see
`generateRef` in server.ts).

## Hard rules for agents

1. **Component contracts are frozen.** Exported names + prop signatures in
   pages/components are consumed by `App.tsx` — change internals freely,
   never the interface.
2. **Data access only via `server/db.ts`.** New query → add a function there.
3. **Design system is mandatory** for UI work: tokens (`ink-*`, `brand-*`,
   `paper`) instead of hex, `font-display`/`font-mono` instead of arbitrary
   font stacks, shared classes (`.btn btn-primary`, `.card-dark`, `.eyebrow`,
   `.input`, `.input-dark`...), motion via `Reveal`/`staggerParent`.
   See `DESIGN_SYSTEM.md`.
4. **`.btn` CSS is unlayered** — Tailwind size overrides on buttons need the
   `!` important modifier (e.g. `!px-4 !py-2`).
5. **Never let email block requests** — fire-and-forget after `res.json()`.
6. **`/api/bookings` (GET) returns customer PII** — it powers the admin
   portal; public availability MUST go through `/api/availability` only.
7. **Keep en-IE / Irish context**: € pricing, Eircodes, NCT references,
   `toLocaleDateString('en-IE', ...)`.
8. Don't commit `data/`, `.env`. Staff passcode: `ADMIN_PASSCODE` env
   (never hardcode). New staff-only endpoint → add `requireAdmin`.
9. **Staff assistant**: `server/assistant.ts` holds the Gemini tool loop.
   New capability → add a function declaration + a case in `executeTool`
   (db access only via `server/db.ts`). Key/model resolution is BYOK:
   Site Settings (DB) → `GEMINI_API_KEY`/`GEMINI_MODEL` env → default
   `gemini-3.6-flash`. The public `/api/settings` MUST keep stripping
   `geminiApiKey`; staff read it via `/api/admin/settings`.
10. Staff can create bookings manually (admin form or assistant) using
    `override: true` + a valid token — the public availability checks are
    skipped ONLY for authenticated staff.

## Gotchas (learned the hard way)

- **Vite dev watcher**: `vite.config.ts` ignores `**/data/**` — without this,
  every booking write triggers a full page reload mid-session. Keep it.
- **Full-page Playwright screenshots** show `whileInView` sections as blank
  (observers never fired) — scroll through the page first, then screenshot.
- Full-page screenshots render `position:fixed` navbar mid-page — artifact,
  not a bug.
- Hero: `<video>` with `onError` fallback to image; in dev, a missing
  `/videos/hero.mp4` returns the SPA HTML and the error event fires on the
  `<source>` — both handlers are wired, keep both.
- Dates are stored as `YYYY-MM-DD` strings; day-of-week checks must use
  `new Date(date + 'T00:00:00')` to avoid timezone shifts.
- **Analytics**: `src/lib/analytics.ts` loads GTM (`VITE_GTM_ID`, build-time
  env) only after cookie consent; the CookieBanner dispatches
  `fg-consent-changed` on save. Meta Pixel goes inside the GTM container —
  no code changes.

## Elevation (Aug 2026) — workshop management layer

- **Kanban** (`WorkshopBoard`): 6 workflow columns (booked_in → diagnosing →
  waiting_parts → in_progress → quality_check → ready), arrow moves + jump
  menu, bay/technician inline assignment, overdue/aging/due-today chips,
  collect with confirm + undo toast, auto-refresh 30s. Data: bookings carry
  `workflowStatus`/`bay`/`technician` via PATCH merge; `GET /api/workshop`.
- **Vehicle database** (`VehiclesPanel`): instant plate search, first-visit
  entry with live parse autofill + make→model→engine dropdowns (carData.ts),
  profile with editable details, service history (parts/notes/technician),
  linked bookings, "Book this vehicle in" handoff. Auto-builds from bookings.
- **Plates**: `server/plates.ts` — Irish 2013+ / 1987-2012 / pre-87 + UK
  current/prefix; formatPlate pattern-formats even unknown plates.
- **Critic process**: 21 fresh-context review rounds vs Shopmonkey/Tekmetric/
  Trello standards; rounds 20-21 = two consecutive PASS verdicts.

## Current delivery state

- Fully working: booking wizard (live availability), estimates, callbacks,
  roadside, reviews, admin portal (confirm/cancel/notes/blocked dates/
  settings/CSV), WhatsApp deep links, branded email templates, SQLite
  persistence, local swappable images incl. real staff photos.
- Pending client action (see `GUIA-DE-ATIVACAO.md`): SMTP credentials for
  live email, hosting + domain, optional Google Calendar API sync.
- Optional client content: real garage photos (`public/images/garage/*`),
  hero video (`public/videos/hero.mp4`).
