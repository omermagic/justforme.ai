"use strict";

const CACHE_NAME = "jelly-lemmy-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=8",
  "./game.js?v=8",
  "./assets/lemmy-explorer.png?v=8",
  "./assets/lemmy-walk-2.png?v=8",
  "./assets/lemmy-walk-3.png?v=8",
  "./assets/lemmy-walk-b.png?v=8",
  "./assets/lemmy-takeoff.png?v=8",
  "./assets/lemmy-air.png?v=8",
  "./assets/lemmy-land.png?v=8",
  "./assets/lemmy-climb.png?v=8",
  "./assets/lemmy-climb-2.png?v=8",
  "./assets/lemmy-climb-3.png?v=8",
  "./assets/lemmy-climb-b.png?v=8",
  "./assets/lemmy-build-up.png?v=8",
  "./assets/lemmy-build-2.png?v=8",
  "./assets/lemmy-build-3.png?v=8",
  "./assets/lemmy-build.png?v=8",
  "./assets/lemmy-bash.png?v=8",
  "./assets/lemmy-bash-2.png?v=8",
  "./assets/lemmy-bash-3.png?v=8",
  "./assets/lemmy-bash-strike.png?v=8",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const key = event.request.mode === "navigate" ? "./index.html" : event.request;
          caches.open(CACHE_NAME).then((cache) => cache.put(key, response.clone()));
        }
        return response;
      })
      .catch(() => event.request.mode === "navigate" ? caches.match("./index.html") : caches.match(event.request)),
  );
});
