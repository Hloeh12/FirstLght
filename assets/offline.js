'use strict';
const name = 'firstlight-console-shell-v2';
const files = ['/', '/js/console.js', '/assets/console/design.css', '/assets/console/credits.html'];
self.addEventListener('install', event => event.waitUntil((async () => {
 const cache = await caches.open(name);
 await cache.addAll(files.map(path => new Request(path, {cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
 for (const key of await caches.keys()) {
  if (key !== name && /^(firstlight-console-(shell|data)-|firstlight-shell-)/.test(key)) await caches.delete(key);
 }
 await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
 const url = new URL(event.request.url);
 if (event.request.method !== 'GET' || url.origin !== self.location.origin || !files.includes(url.pathname)) return;
 event.respondWith(caches.match(url.pathname, {cacheName:name}).then(hit => hit ?? fetch(event.request)));
});
