// app/+html.tsx — customizes the web HTML shell for every page (web only).
// Adds PWA manifest, theme color, iOS meta, and service-worker registration.
import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        <title>Recall — learn & retain</title>
        <meta name="description" content="Turn any source into a science-backed spaced-repetition learning system." />

        {/* Paths are prefixed with the GitHub Pages base path (/learn). If you
            deploy at the domain root or rename the repo, change /learn here,
            in app.json (experiments.baseUrl), manifest.webmanifest, and service-worker.js. */}
        <link rel="manifest" href="/learn/manifest.webmanifest" />
        <meta name="theme-color" content="#2F6B3F" />

        <link rel="icon" href="/learn/icons/favicon.png" />
        <link rel="apple-touch-icon" href="/learn/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Recall" />

        <ScrollViewStyleReset />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/learn/service-worker.js').catch(function () {});
                });
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
