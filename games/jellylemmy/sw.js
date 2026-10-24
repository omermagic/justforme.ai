"use strict";

const CACHE_NAME = "jelly-lemmy-v14";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=13",
  "./game.js?v=14",
  "./assets/lemmy-walk-v3-01.png?v=13",
  "./assets/lemmy-walk-v3-02.png?v=13",
  "./assets/lemmy-walk-v3-03.png?v=13",
  "./assets/lemmy-walk-v3-04.png?v=13",
  "./assets/lemmy-walk-v3-05.png?v=13",
  "./assets/lemmy-walk-v3-06.png?v=13",
  "./assets/lemmy-walk-v3-07.png?v=13",
  "./assets/lemmy-walk-v3-08.png?v=13",
  "./assets/lemmy-fall-v2-01.png?v=13",
  "./assets/lemmy-fall-v2-02.png?v=13",
  "./assets/lemmy-fall-v2-03.png?v=13",
  "./assets/lemmy-fall-v2-04.png?v=13",
  "./assets/lemmy-fall-v2-05.png?v=13",
  "./assets/lemmy-land-v2.png?v=13",
  "./assets/lemmy-step-v2-01.png?v=13",
  "./assets/lemmy-step-v2-02.png?v=13",
  "./assets/lemmy-step-v2-03.png?v=13",
  "./assets/lemmy-step-v2-04.png?v=13",
  "./assets/lemmy-build-up.png?v=13",
  "./assets/lemmy-build-2.png?v=13",
  "./assets/lemmy-build-3.png?v=13",
  "./assets/lemmy-build.png?v=13",
  "./assets/lemmy-bash.png?v=13",
  "./assets/lemmy-bash-2.png?v=13",
  "./assets/lemmy-bash-3.png?v=13",
  "./assets/lemmy-bash-strike.png?v=13",
  "./assets/plush-01-bunny.png?v=9",
  "./assets/plush-02-bear.png?v=9",
  "./assets/plush-03-frog.png?v=9",
  "./assets/plush-04-cat.png?v=9",
  "./assets/plush-05-duck.png?v=9",
  "./assets/plush-06-elephant.png?v=9",
  "./assets/plush-07-fox.png?v=9",
  "./assets/plush-08-penguin.png?v=9",
  "./assets/plush-09-dragon.png?v=9",
  "./assets/plush-10-puppy.png?v=9",
  "./assets/plush-11-mouse.png?v=9",
  "./assets/plush-12-whale.png?v=9",
  "./assets/plush-13-axolotl.png?v=9",
  "./assets/plush-14-panda.png?v=9",
  "./assets/plush-15-capybara.png?v=9",
  "./assets/plush-16-octopus.png?v=9",
  "./assets/plush-17-dinosaur.png?v=9",
  "./assets/plush-18-lamb.png?v=9",
  "./assets/plush-19-red-panda.png?v=9",
  "./assets/plush-20-unicorn.png?v=9",
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
