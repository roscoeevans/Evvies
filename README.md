# 🏆 The Evvies — Oscar Ballot 2026

A real-time Oscar prediction game built for friends & family. Fill your ballot before the ceremony, then watch the live leaderboard update as winners are announced.

## Features

### 🎬 Pre-Show
- **Profile setup** — name + avatar photo
- **24-category ballot** — beautiful two-line nominee labels with typographic hierarchy
- **Lock your picks** — review screen, then lock to submit
- **Pre-Show insights** — predicted Best Picture, Best Actor/Actress, sweep leader, strongest consensus, most divided
- **Category breakdown** — see how everyone voted with voter avatars per nominee
- **Participant cards** — all locked-in players displayed with avatars

### 📺 Live Show
- **Admin winner entry** — tap a category, select the winner, done
- **Real-time leaderboard** — scores update instantly via Supabase Realtime
- **"Just Announced" splash** — crimson-accented card showing the latest winner and who got it right
- **Awards Race chart** — horizontal bar chart tracking which films are dominating the night
- **Hot/Cold streaks** — 🔥 for 3+ correct in a row, 🧊 for cold streaks
- **Tap-to-expand ballots** — click any player to see their full ✅/❌/⏳ breakdown
- **Live insight cards** — Biggest Upset, Safest Pick, Points Still in Play

### 🎉 After Party
- **Grand Winner hero** — trophy animation, shimmer name, final score
- **Final standings** — all players ranked with gold/silver/bronze badges
- **Film of the Night** — awards race bar chart (crimson-to-gold gradient)
- **The Evvies** — fun accolades: Academy Whisperer, Tragic Favorite, Chaos Agent, The Streak, Craft Royalty, Above-the-Liner, Short Royalty
- **Complete Results** — all 24 category winners with who-got-it-right avatars

## Tech Stack

- **React 19** + TypeScript + Vite
- **Supabase** — Postgres database, real-time subscriptions, row-level security
- **Framer Motion** — animations throughout
- **Vanilla CSS** — custom design system (black, gold, crimson, ivory)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase URL and anon key

# Run development server
npm run dev
```

## App Phases

The app has 4 phases controlled by the admin:

| Phase | User Experience |
|-------|----------------|
| `setup` | Fill out profile and ballot |
| `locked` | No new ballots accepted |
| `live` | Live leaderboard, admin enters winners |
| `final` | After Party results page |

## Admin

Navigate to `/admin` for phase controls and `/admin/results` during the live show to enter winners as they're announced.

## Design

- Mobile-first, dark premium aesthetic
- Black + gold + crimson accent palette
- Glass-morphism cards, shimmer effects, staggered animations
- Google Fonts: Playfair Display (serif headings) + Inter (body)

---

*Built for Oscar Night 2026* ✦
