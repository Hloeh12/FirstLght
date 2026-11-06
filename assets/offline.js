'use strict';
const name='firstlight-console-shell-v1';
const files=['/','/assets/console/design.css',...['app','ui','ziwei','bazi','western','extras','share'].map(x=>'/assets/console/'+x+'.js')];
self.addEventListener('install',e=>e.waitUntil((async()=>{
 const cache=await caches.open(name);
 await cache.addAll(files.map(path=>new Request(path,{cache:'reload'})));
 await self.skipWaiting();
})()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
 for(const key of await caches.keys())if(key!==name&&(key.startsWith('firstlight-console-shell-')||key.startsWith('firstlight-shell-')))await caches.delete(key);
 await self.clients.claim();
})()));
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==self.location.origin||!files.includes(url.pathname))return;
 e.respondWith((async()=>{
  try{const response=await fetch(e.request);if(response.ok)return response;}catch{}
  return await caches.match(url.pathname,{cacheName:name})??Response.error();
 })());
});
