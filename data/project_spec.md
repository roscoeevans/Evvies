# Evvies — Project Spec

## Stack
- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Backend / Data / Realtime / Storage**: Supabase
- **Hosting**: Netlify (Git-connected auto-deploy on `main`)
- **Identity**: Lightweight browser-based participant session + optional short PIN (no real auth)
- **Admin**: Hidden admin routes for phase control + winner entry

## Supabase Details
- **Project**: Evvies
- **Project ID**: `occrohxrtggrgwysqpkm`
- **Organization**: roscoeevans
- **Region**: us-west-2
- **Postgres**: v17

## App Phases
The app is governed by a single `app_phase` value:
1. **setup** — Ballots editable, participants join
2. **locked** — Ballots frozen, pre-show insights visible
3. **live** — Ceremony in progress, leaderboard active, admin enters winners
4. **final** — All 24 announced, After Party report visible

## Identity Model
- Person enters a name, optionally uploads a photo
- Optional 4-digit PIN for re-entry on another device
- App creates a participant record in Supabase
- Browser stores `participant_id` + `session_token` in localStorage
- "Not you?" button clears local session
- No email, no passwords, no magic links

## Routes
### Participant
- `/` — Profile Setup
- `/ballot/:categorySlug` — One category per page (24 total)
- `/ballot/review` — Review & lock ballot
- `/insights` — Pre-show prediction stats
- `/leaderboard` — Live ceremony scoreboard
- `/report` — After Party report

### Admin
- `/admin` — Phase controls (lock, start ceremony, end)
- `/admin/results` — Enter/edit winners

## Scoring
- Client-side computed in `scoring.ts`
- For each category: if prediction matches result → add point_value
- Total = sum across all categories
- Also: categories correct, remaining possible, tag-group breakdowns

## Design Direction
- Velvet black background
- Deep crimson accents
- Rich metallic gold for badges, borders, CTAs
- Warm ivory text on muted charcoal surfaces
- Serif headlines (Playfair Display) + sans-serif body (Inter)
- Glass-dark panels with gold hairline borders
- Smooth, elegant Framer Motion animations — never springy
- Spotlight/vignette textures on large areas, restrained everywhere else

## Data Model
### Tables
- **participants** — id, display_name, photo_url, pin, session_token, is_admin, ballot_completed_at, locked_at, created_at
- **categories** — id, name, slug, point_value, sort_order, ui_group, importance_tier, tags[]
- **nominees** — id, category_id, label, sort_order
- **predictions** — id, participant_id, category_id, nominee_id, created_at, updated_at (unique: participant + category)
- **results** — id, category_id, winning_nominee_id, announced_at, updated_at (unique: category)
- **settings** — key/value: app_phase, predictions_lock_at

## Categories
- 24 categories, 100 total points (see `oscar_ballot_2026.md`)
- 4 importance tiers with corresponding visual treatment
- UI groups: Marquee, Craft & Music, Feature Races, Shorts
