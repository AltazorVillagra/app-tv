// Service worker: permite instalar la app y que abra rápido.
// Siempre busca primero la versión nueva en internet (así tus canales
// nuevos aparecen altiro); si no hay conexión, usa la copia guardada.
const CACHE = "altazortv-v3";
const ARCHIVOS = [
  "./",
  "index.html",
  "estilos.css",
  "app.js",
  "canales.js",
  "manifest.webmanifest",
  "iconos/icono-192.png",
  "iconos/icono-512.png",
  "iconos/icono-maskable-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Las señales de video y todo lo que no sea de esta app pasan directo
  if (e.request.method !== "GET" || url.origin !== location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((resp) => {
        const copia = resp.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copia));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
