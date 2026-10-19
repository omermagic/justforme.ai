"use strict";

const CACHE_NAME = "ron-dragon-blocks-v9";
const GAME_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=9",
  "./game.js?v=9",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(GAME_ASSETS)));
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
      .then((networkResponse) => {
        if (networkResponse?.status === 200) {
          const cacheKey = event.request.mode === "navigate" ? "./index.html" : event.request;
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(cacheKey, copy));
        }
        return networkResponse;
      })
      .catch(() =>
        event.request.mode === "navigate"
          ? caches.match("./index.html")
          : caches.match(event.request),
      ),
  );
});
