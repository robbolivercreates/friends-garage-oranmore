# FRIENDS GARAGE — DESIGN SYSTEM (v2 "Precision Atelier")

This document is the single source of truth for the site's visual language.
Every page and component MUST follow it. The goal: a site that looks like a
€10k custom build — cinematic, confident, generous with space, precise with
detail. Think premium automotive atelier, not template.

---

## 1. Brand tokens (Tailwind v4 — already defined in `src/index.css` `@theme`)

Use these utility classes — **never hardcode hex values**:

| Token | Value | Usage |
|---|---|---|
| `ink-950` `#0A0B0E` | page dark bg, near-black |
| `ink-900` `#101216` | dark section bg |
| `ink-850` `#14161B` | alt dark bg |
| `ink-800` `#1A1D23` | raised dark panels |
| `ink-700` `#242832` | borders-on-dark, hover |
| `ink-600` `#2F333A` | muted dark surfaces |
| `ink-400` `#5A606C` | body text on light |
| `ink-300` `#8B919C` | secondary text on dark |
| `ink-200` `#B9BEC7` | body text on dark |
| `brand-500` `#D5004F` | primary accent (magenta red) |
| `brand-600` `#B80043` | accent hover |
| `brand-400` `#F0326F` | accent highlight on dark |
| `paper` `#F6F6F3` | light page bg (warm off-white) |
| `paper-dark` `#ECECE7` | alt light bg |

Fonts: `font-display` (Sora — headings), `font-body` (Plus Jakarta Sans —
body), `font-mono` (JetBrains Mono — reference numbers, stats, labels).
**Never** use `font-['Sora']` arbitrary values — use `font-display`.

---

## 2. Shared CSS utilities (already in `src/index.css`)

- `.eyebrow` — small-caps accent label with leading dash (use for every
  section kicker). `.eyebrow--plain` removes the dash.
- Buttons — ALWAYS combine base + variant: `className="btn btn-primary"`.
  Variants: `btn-primary` (brand gradient, glow), `btn-dark` (ink),
  `btn-outline-light` (glass, for dark bg), `btn-outline-dark` (for light bg).
- Forms: `.input` (light bg forms), `.input-dark` (dark bg forms),
  `.label`, `.label-dark`.
- Cards: `.card-light`, `.card-dark`.
- `.grain` — film-grain overlay for dark full-bleed sections (parent must be
  `relative overflow-hidden`).
- `.glow-brand` — absolute radial magenta glow accent (position with
  Tailwind, e.g. `<div className="glow-brand w-96 h-96 -top-20 -right-20" />`).
- Animations: `.animate-marquee` (infinite horizontal scroll strip),
  `.animate-kenburns` (slow hero zoom), `.animate-float-slow`,
  `.animate-pulse-dot` (green "open now" dot).

---

## 3. Shared React primitives (already exist — import them)

- `import { Reveal, staggerParent, staggerChild } from '../components/ui/Reveal'`
  — `Reveal` wraps any block for the standard scroll-in (fade + rise, once).
  Props: `delay` (s), `y` (px), `inView` (false = animate on mount).
  For grids: parent `<motion.div variants={staggerParent} initial="hidden"
  whileInView="show" viewport={{ once: true, margin: '-60px' }}>`, each child
  `<motion.div variants={staggerChild}>`.
- `import { SectionHeader } from '../components/ui/SectionHeader'` —
  props `{ eyebrow, title, subtitle?, theme?: 'light'|'dark', align?:
  'center'|'left', className? }`. Use for EVERY section header.
- `import { ServiceIcon } from '../components/ui/ServiceIcon'` —
  `<ServiceIcon name={service.iconName} className="w-5 h-5" />`.
- `import { IMAGES } from '../config/assets'` — all garage photos.
  Team photos come from `member.photoUrl` (now local `/images/team/*.jpg`).
- Motion: `import { motion, AnimatePresence } from 'motion/react'`
  (NOT `framer-motion`).

---

## 4. Layout grammar

- Page shell: sections on alternating `bg-paper` (light) and
  `bg-ink-950`/`bg-ink-900` (dark). Light pages feel airy; dark sections
  feel cinematic. Contrast is the luxury cue.
- Container: `max-w-7xl mx-auto px-4 md:px-8`.
- Section padding: `py-20 lg:py-28` (light), `py-24 lg:py-32` (dark).
- Border radius: `rounded-2xl` cards, `rounded-xl` inputs/buttons.
- Borders on dark: `border-white/10`. Borders on light: `border-ink-950/8`.
- Headings: `text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold
  leading-[1.08]` for section titles; hero display up to
  `text-5xl sm:text-6xl lg:text-7xl`.
- Body copy: `text-base` (min `text-sm`). `text-xs` ONLY for micro labels
  (badges, table captions). The old site overused tiny text — fix that.
- Accent usage is disciplined: one accent per view — an eyebrow, a keyword
  span (`text-brand-500`), or a primary CTA. Never all three shouting.

## 5. Motion grammar (subtle, expensive-feeling)

- Everything below the hero reveals on scroll via `Reveal` / stagger.
- Hero: headline lines slide up with slight stagger (`Reveal inView={false}`
  with delays 0/0.1/0.2), background image uses `.animate-kenburns`.
- Hover on cards: `hover:-translate-y-1` + shadow deepen, icon chip bg
  transitions to brand. Keep transitions 200–400ms,
  `ease-[cubic-bezier(0.22,1,0.36,1)]`.
- Numbers/stats: use `font-mono` for figures.
- Modals: `AnimatePresence` — backdrop fade, panel `scale 0.96→1, y 12→0`.
- NO bouncy springs, NO constant motion below the fold, NO parallax gimmicks.

## 6. Hard engineering rules

1. **Component contracts are frozen**: exported component names, prop names
   and types MUST NOT change — `src/App.tsx` consumes them. Restyle the
   internals freely; keep all data flow, API calls, validation and state
   logic functionally identical (you may improve UX details like inline
   error text instead of `alert()` where trivial).
2. Do NOT modify `src/App.tsx`, `server.ts`, `src/types.ts`,
   `src/data/initialData.ts`, `src/index.css`, or the `src/components/ui/`
   primitives — report any needed change instead.
3. TypeScript strictness: `npx tsc --noEmit` will be run over the whole
   project after integration — write clean typed code (no `any` leaks in
   new code, no unused imports).
4. Icons: `lucide-react` only.
5. All imagery local (`/images/...`) — no external stock URLs.
6. Content stays in English, Irish context (€, Eircode, NCT, en-IE dates).
