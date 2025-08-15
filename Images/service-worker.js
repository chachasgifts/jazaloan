const CACHE_NAME = "jaza-loan-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/Images/logo.png",
  "/Images/apple-touch-icon.png",
  "/Images/favicon.png",
  "/Images/favicon-96x96.png",
  "/Images/favicon.svg",
  "/Images/web-app-manifest-192x192.png",
  "/Images/web-app-manifest-512x512.png",
  "/style.css",
  "/script.js" // Add your calculator JS files here
];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

// Activate event
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
});

// Fetch event with offline fallback
self.addEventListener("fetch", event => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match("/offline.html"))
    );
  } else {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  }
});
