"use strict";

const CACHE_NAME = "shaked-land-eater-v9";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=3",
  "./game.js?v=9",
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
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response?.status === 200) {
          const key = event.request.mode === "navigate" ? "./index.html" : event.request;
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(key, copy));
        }
        return response;
      })
      .catch(() =>
        event.request.mode === "navigate" ? caches.match("./index.html") : caches.match(event.request),
      ),
  );
});
