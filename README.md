# Friends Garage — Oranmore, Co. Galway

The official website for **Friends Garage**, Deerpark Industrial Estate,
Oranmore, Co. Galway (H91 H31C) — car servicing, repairs, diagnostics,
tyres, ECU remapping, DPF services and 24/7-style roadside assistance.

A bespoke, animation-rich single-page app with a fully working booking
system, estimate requests, callback requests, roadside dispatch and a
staff admin portal.

## Tech Stack

- **Frontend:** React 19, Vite 6, Tailwind CSS v4, Motion (`motion/react`),
  lucide-react
- **Backend:** Express (in `server.ts`) — REST API persisted to
  **SQLite** (`data/friendsgarage.db`, auto-created and seeded on first run;
  a legacy `data/db.json` is imported automatically if present)
- **Language:** TypeScript end-to-end

## Run Locally

**Prerequisite:** Node.js 18+

```bash
npm install
npm run dev        # http://localhost:3000  (API + frontend on one port)
```

Production:

```bash
npm run build
npm start          # serves the built app from dist/
```

Type-check: `npm run lint`

## Features

| Area | Details |
|---|---|
| Online booking | 5-step wizard (service → vehicle → date/time → contact → review), reference number, `.ics` calendar download |
| Get an Estimate | Modal form → `/api/estimates` |
| Request Callback | Modal form → `/api/callbacks` |
| Roadside Assistance | Emergency dispatch form → `/api/roadside` |
| Reviews | Listing + customer submission → `/api/reviews` |
| Staff Portal | Manage bookings (confirm/cancel/notes), estimates, callbacks, roadside jobs, site settings, blocked dates, CSV export |

**Staff login:** footer → "Staff Login" — passcode `friends2026`
(change it in `server.ts`, endpoint `/api/admin/login`).

## How the Booking Flow Works (End to End)

1. **Customer books** on the site → instantly gets an on-screen reference
   number, a downloadable calendar file, **and a branded confirmation email**
   ("Booking received", with the calendar invite attached).
2. **The garage is notified by email** immediately (new booking / estimate /
   callback / roadside alert) at `GARAGE_NOTIFY_EMAIL`.
3. The request appears as **pending** in the Staff Portal
   (footer → Staff Login).
4. **Staff confirms / reschedules / cancels** in the portal → the customer
   **automatically receives a status email** (confirmed bookings include the
   calendar invite).
5. Same loop for estimates (customer ack + garage alert), callbacks and
   roadside emergencies (garage gets a 🚨 urgent alert).

### Availability management (garage side)

- The booking form **only offers real availability**: days blocked by staff
  (Staff Portal → Blocked Dates) are rejected with a clear message, already
  booked time slots appear crossed out, and the server double-checks every
  submission (Sunday closure, blocked dates, slot clashes, daily capacity
  from Settings → `maxDailyBookings`).
- Every booking, estimate, callback and roadside card in the portal has a
  green **WhatsApp button** — one tap opens a WhatsApp chat with that
  customer with a pre-written message (works on any phone with WhatsApp,
  no paid API needed). Irish numbers are auto-converted to international
  format. Customers also get a "WhatsApp Us" button on their booking
  confirmation screen.

### Enabling real email delivery

Emails are sent via SMTP (`server/mailer.ts`). Copy `.env.example` to `.env`
and fill in the `SMTP_*` values — a Gmail account with an App Password works
out of the box (instructions inside `.env.example`).

**Until SMTP is configured nothing breaks and nothing is lost:** every email
is written to `data/outbox.json` and logged in the server console, so you can
inspect the full flow today and switch on live delivery whenever you're ready.


## Replacing the Placeholder Photos

All imagery lives in `public/images/` with fixed filenames — overwrite the
files, keep the names, done. See **`public/images/README.md`** for the full
mapping (5 team portraits + 5 garage shots). No code changes needed.

- Team portraits: `public/images/team/{wesley,yvonne,mathew,flavio,gaspar}.jpg`
- Garage shots: `public/images/garage/{hero,workshop,diagnostics,team-at-work,exterior}.jpg`

## Design System

`DESIGN_SYSTEM.md` documents the brand tokens, shared utilities
(`btn btn-primary`, `card-dark`, `eyebrow`, …) and motion primitives
(`Reveal`, `SectionHeader`, `ServiceIcon`) used across every page. Follow
it when adding new sections.

## Project Structure

```
server.ts               Express API + Vite middleware (dev) / static (prod)
data/db.json            Runtime database (auto-created, gitignored)
src/
  App.tsx               Tab router + global state + modals
  config/assets.ts      Central image registry
  data/initialData.ts   Seed services / team / reviews / settings
  components/           Navbar, Footer, modals, banners…
  components/ui/        Reveal, SectionHeader, ServiceIcon primitives
  pages/                Home, Services, Booking, About, Team, Reviews,
                        Contact, Roadside, Admin, Legal
public/images/          All site photography (swappable placeholders)
```
