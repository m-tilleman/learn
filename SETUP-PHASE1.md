# Phase 1 setup — real accounts & persistence (Supabase)

The app ships in **demo mode**: no backend, sample cards, no login. This works out of
the box (that's what's live at m-tilleman.github.io/learn today). Completing the steps
below switches it to **live mode**: real sign-in, and your cards / reviews / streak
persist and sync across devices via Supabase.

The code is already written and safe: with no keys set it stays in demo mode; the moment
valid keys are present it activates auth + persistence. Nothing to change in the app code.

## 1. Create the Supabase project (5 min)

1. Go to https://supabase.com → sign up (free tier is fine) → **New project**.
2. Pick a name and a database password. Wait ~2 min for it to provision.
3. In the project, open **SQL Editor** → **New query**, paste the entire contents of
   `supabase/schema.sql` from this repo, and **Run**. This creates the tables, indexes,
   and row-level-security policies.
4. Open **Settings → API** and copy two values:
   - **Project URL** (looks like `https://abcd1234.supabase.co`)
   - **anon public** key (a long JWT — safe to expose to the client; RLS protects data)

## 2. Turn on email auth

Supabase → **Authentication → Providers → Email** is on by default. For quick testing you
can disable "Confirm email" (Authentication → Providers → Email → uncheck *Confirm email*)
so new accounts work immediately; re-enable it for production.

## 3. Run it locally (verify before deploying)

```bash
cp .env.example .env
# put your two values in .env:
#   EXPO_PUBLIC_SUPABASE_URL=https://abcd1234.supabase.co
#   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
npm install
npm run web
```

You should now see a **sign-in screen**. Create an account, and you'll land on the app with
three seeded starter cards. Grade a few on the Study screen, refresh — your progress is saved
(reviews go to `review_logs`, due dates to `card_states`). You can confirm rows appear in
Supabase → **Table editor**.

## 4. Make the live site (m-tilleman.github.io/learn) go live

The GitHub Actions build reads the same two values from repo secrets:

1. On GitHub: repo **Settings → Secrets and variables → Actions → New repository secret**.
2. Add both:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Re-run the latest **Deploy to GitHub Pages** workflow (Actions tab → latest run → *Re-run all jobs*),
   or push any commit. The deployed site will now show the sign-in screen and persist data.

If the secrets are ever removed, the site simply reverts to demo mode.

## What's live after Phase 1

- Email sign-in / sign-up, session persists across reloads and devices.
- Study loop reads the due queue from your saved `card_states` and writes every grade to the
  append-only `review_logs`; the FSRS-6 scheduler sets the next due date.
- Offline grades are queued locally and flushed to Supabase on the next successful call.
- Scheduling settings (target retention, daily review limit, max interval) feed the live queue.

## Not yet (later phases)

- Ingestion (URL/PDF → cards) still simulates — that's **Phase 2**.
- Push notifications, AI answer-grading, FSRS re-optimization, native apps — Phases 3–5.
- Stats and the home "due today" counts still use sample numbers until wired to `review_logs`.
