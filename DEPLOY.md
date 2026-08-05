# Deploying Recall

Recall is web-first: `npm run build:web` produces a static site in `dist/` that installs as a PWA (add-to-home-screen, offline, push). Pick a host below. Native iOS/macOS builds come later via EAS.

## 0. One-time

```bash
npm install
cp .env.example .env     # add Supabase + LLM keys (optional to just demo the UI)
npm run preview          # local production build + serve at http://localhost:3000
```

`npm run preview` builds `dist/` and serves it exactly as it will run in production — good final check before deploying.

---

## GitHub Pages → https://m-tilleman.github.io/learn (your target)

The repo is preconfigured for this: `app.json` sets `experiments.baseUrl = "/learn"`, and `.github/workflows/deploy.yml` builds and publishes automatically on every push to `main`.

> Important: the repo must be named **`learn`** (lowercase) for the URL to be `.../learn`. If you name it something else, change `/learn` in five places: `app.json` (`experiments.baseUrl`), `public/manifest.webmanifest`, `public/service-worker.js` (`BASE`), and `app/+html.tsx` (manifest/icon links + SW registration).

### Fastest — with the GitHub CLI (`gh`)

From inside the `recall-app` folder:

```bash
git init -b main
git add -A
git commit -m "Recall — initial deploy"

gh repo create learn --public --source=. --remote=origin --push
# turn on Pages via GitHub Actions:
gh api -X POST repos/m-tilleman/learn/pages -f build_type=workflow
```

That's it. The Actions run builds the site and publishes it; in ~1–2 minutes it's live at **https://m-tilleman.github.io/learn**. Watch progress with `gh run watch` or on the repo's Actions tab. Every future `git push` redeploys.

### Without the CLI

1. On github.com → New repository → name it exactly `learn`, Public, don't add a README. Create.
2. In the `recall-app` folder:
   ```bash
   git init -b main
   git add -A
   git commit -m "Recall — initial deploy"
   git remote add origin https://github.com/m-tilleman/learn.git
   git push -u origin main
   ```
3. On the repo → Settings → Pages → under "Build and deployment", set **Source: GitHub Actions**.
4. The workflow runs automatically (Actions tab). When it finishes, the site is live at https://m-tilleman.github.io/learn.

---

## 1. Vercel (recommended — easiest)

**Option A — dashboard (no CLI):**
1. Push this folder to a GitHub/GitLab repo.
2. On vercel.com → New Project → import the repo.
3. Vercel reads `vercel.json` automatically (build `npm run build:web`, output `dist`). Click Deploy.
4. Add your env vars (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) in Project → Settings → Environment Variables, then redeploy.

**Option B — CLI:**
```bash
npm i -g vercel
vercel            # first run links/creates the project
vercel --prod     # ship to production
```

You get a `https://your-app.vercel.app` URL. Every git push auto-deploys.

---

## 2. Netlify

**Dashboard:** New site → import repo → Netlify reads `netlify.toml` (build `npm run build:web`, publish `dist`). Add env vars under Site settings → Environment. Deploy.

**CLI:**
```bash
npm i -g netlify-cli
netlify deploy --build            # draft URL
netlify deploy --build --prod     # production
```

---

## 3. Cloudflare Pages / GitHub Pages / any static host

Build locally and upload `dist/`:
```bash
npm run build:web
# then drag-drop dist/ into the host, or:
npx wrangler pages deploy dist    # Cloudflare Pages
```
Set the SPA fallback (serve `index.html` for unknown routes) and add a `no-cache` header on `/service-worker.js`. GitHub Pages: push `dist/` to a `gh-pages` branch.

---

## 4. Self-host with Docker

```bash
docker build -t recall .
docker run -p 8080:80 recall      # open http://localhost:8080
```
The image builds the static export and serves it with nginx (SPA fallback + correct cache headers are in `nginx.conf`). Deploy the image to Fly.io, Railway, Render, ECS, etc.

---

## 5. Backend (Supabase)

The UI runs on mock data without a backend. To go live:
```bash
npm i -g supabase
supabase link --project-ref <your-ref>
supabase db push                                  # applies supabase/schema.sql
cp src/lib/fsrs6.ts supabase/functions/sync/      # sync fn imports it
supabase functions deploy sync
```
Put the project URL + anon key in your host's env vars (and locally in `.env`).

---

## 6. Native iOS / macOS (later)

Same codebase, built with EAS:
```bash
npm i -g eas-cli
eas login
eas build:configure
eas build -p ios --profile production     # App Store / TestFlight
eas submit -p ios
```
macOS ships via Mac Catalyst from the iOS target. Remote push needs an APNs key uploaded to your Expo project; Web Push (already wired via `public/service-worker.js`) needs VAPID keys set on your notification sender.

---

## Verifying the PWA install

After deploying, open the site in Chrome → DevTools → Application:
- **Manifest** should list "Recall" with the green droplet icons.
- **Service Workers** should show `service-worker.js` activated.
- An install icon appears in the address bar; on iOS use Share → Add to Home Screen.
- Toggle offline in DevTools and reload — the app shell still loads.
