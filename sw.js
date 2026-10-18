// Service worker do Chama: deixa o app funcionar offline.
// Ao mudar qualquer arquivo do app, aumente a versão abaixo para forçar a atualização.
var VERSION = "chama-sw-v1";
var CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
  "./icons/favicon-32.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Responde do cache na hora e atualiza em segundo plano (vale para o app e para as fontes do Google).
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var ok = url.origin === location.origin || url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!ok) return;
  e.respondWith(
    caches.open(VERSION).then(function (cache) {
      return cache.match(req, { ignoreSearch: false }).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(function () {
          return hit || (req.mode === "navigate" ? cache.match("./index.html") : undefined);
        });
        return hit || net;
      });
    })
  );
});
