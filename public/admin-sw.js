// Admin Panel service worker (scope: /admin).
//
// Deliberately caches nothing. Every admin page is authenticated business data (finance, customers,
// partners), and a phone may be shared or lost, so no page or API response is ever written to Cache Storage.
// The worker exists so the browser treats the panel as an installable app, and to show a friendly offline
// screen when an in-app navigation cannot reach the network. The offline page is inlined here (rather than
// precached) so it cannot be evicted by another worker's cache cleanup.

const OFFLINE_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Offline | Shenjar Admin</title>
<style>
  body{margin:0;min-height:100vh;display:grid;place-items:center;padding:24px;box-sizing:border-box;
    background:#f4f7fa;color:#172e40;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;text-align:center}
  main{max-width:340px}
  h1{font-size:22px;margin:0 0 8px}
  p{margin:0 0 20px;font-size:14px;line-height:1.5;color:#637487}
  button{min-height:44px;padding:0 24px;border:0;border-radius:8px;background:#2e489f;color:#fff;font-size:14px;font-weight:600}
</style>
</head>
<body>
<main>
  <h1>You're offline</h1>
  <p>Shenjar Admin needs an internet connection to load your latest projects, finance and partner data. Check your connection and try again.</p>
  <button type="button" onclick="location.reload()">Try again</button>
</main>
</body>
</html>`;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  // Only full-page navigations get a fallback. Everything else (RSC/data fetches, Supabase, images,
  // scripts) goes straight to the network, untouched.
  if (request.mode !== "navigate") return;

  event.respondWith(
    fetch(request).catch(
      () =>
        new Response(OFFLINE_HTML, {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
        }),
    ),
  );
});
