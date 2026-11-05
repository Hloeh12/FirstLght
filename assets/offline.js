'use strict';

const shellCache='firstlight-shell-v2';
const shellFiles=['/',
 '/assets/app-shell.css','/assets/offline-client.js','/assets/chart-views.js',
 '/assets/app-shell.js','/assets/ziwei-workbench.js','/assets/chart-share.js',
 '/assets/context-menu.js','/assets/interactive-reading.js'
];

self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(shellCache);
  await cache.addAll(shellFiles.map(path=>new Request(path,{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  const names=await caches.keys();
  await Promise.all(names.filter(name=>name.startsWith('firstlight-shell-')&&name!==shellCache).map(name=>caches.delete(name)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);
 if(event.request.method!=='GET'||url.origin!==self.location.origin||!shellFiles.includes(url.pathname))return;
 event.respondWith((async()=>{
  try{
   const response=await fetch(event.request);
   if(response.ok)return response;
  }catch{}
  const stored=await caches.match(url.pathname,{cacheName:shellCache});
  return stored||Response.error();
 })());
});
