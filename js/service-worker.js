
const CACHE_NAME = "nutripro-v2";

const ARCHIVOS = [
    "/",
    "/index.html",
    "/manifest.json",
    "/css/styles.css",
    "/js/app.js"
];


// INSTALACIÓN

self.addEventListener("install", evento => {
    evento.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ARCHIVOS);
        })
    );

    self.skipWaiting();
});


// ACTIVACIÓN

self.addEventListener("activate", evento => {
    evento.waitUntil(
        caches.keys().then(nombres => {
            return Promise.all(
                nombres
                    .filter(nombre => nombre.startsWith("nutripro-") && nombre !== CACHE_NAME)
                    .map(nombre => caches.delete(nombre))
            );
        })
    );

    self.clients.claim();
});


// CONSULTAS DE ARCHIVOS

self.addEventListener("fetch", evento => {

    if (evento.request.method !== "GET") return;

    const url = new URL(evento.request.url);

    // No almacenar consultas externas, como Google Sheets.
    if (url.origin !== self.location.origin) return;

    evento.respondWith(
        fetch(evento.request)
            .then(respuesta => {

                if (respuesta.ok) {
                    const copia = respuesta.clone();

                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(evento.request, copia);
                    });
                }

                return respuesta;
            })
            .catch(async () => {

                const respuestaCache = await caches.match(evento.request);

                if (respuestaCache) return respuestaCache;

                if (evento.request.mode === "navigate") {
                    return caches.match("/index.html");
                }

                return Response.error();
            })
    );
});