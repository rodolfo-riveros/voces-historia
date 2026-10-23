// Service worker mínimo: guarda solo los archivos estáticos para abrir rápido.
// La API (/api/...) nunca se guarda: siempre va a la red.
// Al cambiar el código, sube VERSION aquí y el ?v= de index.html.
const VERSION = "voces-v7";
const ARCHIVOS = [
  "/", "/index.html", "/style.css", "/app.js", "/avatares.js", "/ambiente.js", "/oido.js", "/manifest.json",
  "/fonts/baloo2.woff2", "/fonts/nunito.woff2", "/icons/icono.svg", "/icons/icono-192.png", "/icons/icono-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/") || url.pathname === "/health") return;
  // Red primero (para ver siempre la última versión); si no hay red, lo guardado.
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copia));
        }
        return r;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match("/index.html")))
  );
});
