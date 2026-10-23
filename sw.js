// Urban Tissue Explorer service worker.
// App shell (page, libraries, icons) is precached so the app opens instantly and works offline;
// map tiles and analysis data always go straight to the network (large, range-requested, not ours to cache).
const VERSION = "ute-v15";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./vendor/maplibre-gl.js",
  "./vendor/maplibre-gl.css",
  "./vendor/geotiff.js",
  "./vendor/ee_api_js.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return; // tiles, PMTiles, GeoTIFFs: network only
  if (req.mode === "navigate") { // network-first for the page so updates arrive; fall back to the cached shell offline
    e.respondWith(fetch(req).then(r => { if (!r.ok) return r; const copy = r.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return r; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
