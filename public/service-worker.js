// Recall service worker — app-shell caching (offline) + Web Push.
// Bump CACHE when you ship a new build to invalidate old assets.
const CACHE = "recall-v1";
// Base path must match app.json experiments.baseUrl and the GitHub Pages repo name.
const BASE = "/learn";
const APP_SHELL = [BASE + "/", BASE + "/manifest.webmanifest", BASE + "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

// Network-first for navigations (fresh app), cache-first for static assets.
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // don't cache remote images/APIs

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(BASE + "/", copy));
          return res;
        })
        .catch(() => caches.match(BASE + "/")),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }),
    ),
  );
});

// --- Web Push (daily review reminders) ---
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "Time to review", {
      body: data.body ?? "Cards are due — a quick session keeps them fresh.",
      icon: BASE + "/icons/icon-192.png",
      badge: BASE + "/icons/icon-192.png",
      data: { url: data.url ?? BASE + "/study" },
      tag: "daily-review",
      renotify: false,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
