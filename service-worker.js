const CACHE_NAME = "nutripro-v1";

const ARCHIVOS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./css/styles.css",
    "./js/app.js"
];

self.addEventListener("install", evento => {
    evento.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ARCHIVOS);
        })
    );
});

self.addEventListener("fetch", evento => {
    evento.respondWith(
        caches.match(evento.request).then(respuesta => {
            return respuesta || fetch(evento.request);
        })
    );
});