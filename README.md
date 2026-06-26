# Forge Rush

Forge Rush is a browser-based blacksmith idle/clicker game built with React, TypeScript, Vite, and Supabase. Players gather ore and wood, unlock gem polishing, craft items, sell inventory, buy upgrades, earn achievements, and compete on a reputation leaderboard.

The game is playable offline or without Supabase configuration. Local progress is saved in `localStorage`; Supabase only powers accounts and the online leaderboard.

## Install

```bash
npm install
```

## Run Locally

```bash
npm run dev
```

Vite will print a local URL, usually `http://localhost:5173/`.

## Build

```bash
npm run build
```

Preview the production build with:

```bash
npm run preview
```

## Environment Variables

Create a `.env.local` file for local development:

```bash
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Only use the Supabase anon key in the frontend. Do not add a service role key to this repo or to any Vite environment variable.

If these variables are missing, Forge Rush runs in guest mode. Auth and leaderboard controls show that Supabase is not configured, but the game remains playable.

## Supabase Setup

1. Create a Supabase project.
2. In Supabase Auth, enable email/password sign-in.
3. Open the Supabase SQL Editor.
4. Paste and run `supabase/schema.sql`.
5. Copy the project URL and anon key into `.env.local` or your deployment environment.

The schema creates:

- `profiles`: one username profile per authenticated user.
- `leaderboard`: public read access for top scores.
- `submit_score(...)`: an authenticated RPC that updates the current user's score.

The RPC never replaces a higher reputation with a lower submitted reputation. Other tracked stats use `greatest(...)` so older local progress cannot roll server stats backward.

## Deploy to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Set the framework preset to Vite if Vercel does not detect it.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel project environment variables.
5. Deploy.

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```

## Leaderboard

Logged-out players can view the leaderboard when Supabase is configured. Logged-in players sync reputation automatically on a debounce and can also use the manual Sync Score button. Network or Supabase errors are shown in the UI and do not stop local gameplay.

## Local Saves

Forge Rush stores immediate game progress in `localStorage`, including for logged-in users. This keeps the game responsive and playable offline. Corrupted or invalid save data is ignored or normalized so it cannot crash the page.

The Reset Save button asks for confirmation before clearing local progress. Server leaderboard scores are not deleted by resetting the local save.

## Adding Content

Add craftable items in `src/data/items.ts`. Each item needs an id, display name, resource cost, coin value, reputation gain, unlock requirement, icon, and rarity.

Add upgrades in `src/data/upgrades.ts`. Upgrade behavior is driven by `effectType` and applied in `src/utils/gameLogic.ts`.

Add achievements in `src/data/achievements.ts`. Each achievement has a `check(state)` predicate that returns true when it should unlock.

Shared game types live in `src/types/game.ts`.
