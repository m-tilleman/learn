# Recall — starter scaffold

A cross-platform (Web → iOS → macOS) spaced-repetition learning app built on **Expo + React Native for Web** with a **Supabase** backend and an **FSRS-6** scheduler. This scaffold implements the core study loop against sample data; wire in Supabase to go live.

## Quick start

```bash
npm install
cp .env.example .env      # fill in Supabase + LLM keys
npm run web               # opens the PWA in your browser
# npm run ios / npm run android for native
```

Run the scheduler tests (no build step needed):

```bash
node --test src/lib/fsrs6.test.mjs
```

## What's implemented

| Area | File(s) |
|---|---|
| FSRS-6 scheduler (verified) | `src/lib/fsrs6.ts` · tests `src/lib/fsrs6.test.mjs` |
| Scheduler interface + SM-2 fallback | `src/lib/scheduler.ts` |
| Interleaved daily queue builder | `src/lib/queue.ts` |
| Study session state (Zustand) | `src/store/session.ts` |
| Screens (Expo Router) | `app/index.tsx` (Dashboard), `app/study.tsx`, `app/ingest.tsx`, `app/analytics.tsx`, `app/graph.tsx` |
| Supabase client | `src/lib/supabase.ts` |
| Postgres schema + RLS | `supabase/schema.sql` |
| Sync Edge Function (log-replay) | `supabase/functions/sync/index.ts` |
| Web Push service worker | `public/service-worker.js` |
| Sample data | `src/mock/data.ts` |

## Architecture in one paragraph

The **review log is the source of truth**. Every grade appends an immutable `review_logs` row; scheduler state (`card_states`: stability, difficulty, due date) is a *materialized view* recomputed by replaying the merged log. This makes offline multi-device sync conflict-free: logs merge by union, and replaying them deterministically yields identical state on every device.

## Wiring it up (next steps)

1. Create a Supabase project; run `supabase/schema.sql` in the SQL editor.
2. Put your project URL + anon key in `.env`.
3. Replace `src/mock/data.ts` reads with Supabase queries + a local DB (WatermelonDB / SQLite-wasm) for offline.
4. Build the ingestion pipeline (jobs worker calling your LLM) — see the TRD §3 and §8.3 for the prompt contract.
5. Deploy the sync function: `supabase functions deploy sync` (copy `src/lib/fsrs6.ts` into the function dir first).
6. Add Web Push (VAPID) + APNs and the notification cron — TRD §4.

## Design

The dashboard (`app/index.tsx`) renders the hero photo **"Water drop on green plant" by Liubov Ilchuk (Unsplash)** via `ImageBackground`, with a dark scrim and frosted-glass cards over it (`HERO_IMAGE` in `src/theme.ts`). Real backdrop blur works out of the box on web (`backdrop-filter`); on iOS/macOS add `@react-native-community/blur` and wrap the glass surfaces in `<BlurView>`. Swap `HERO_IMAGE` for any URL or a bundled `require('...')` asset.

See `Learning_App_TRD.md` for the full requirements document.
