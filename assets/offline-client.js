'use strict';

const readingCacheName='firstlight-readings-v2';
const offlineEndpoints=new Set([
 '/api/chart','/api/ziwei','/api/ziwei-flow','/api/bazi','/api/local-report','/api/energy','/api/timeline'
]);

async function readingRequest(path,body){
 const payload=JSON.stringify(body);
 let cache,key;
 if(offlineEndpoints.has(path)&&window.caches&&window.crypto?.subtle){
  try{
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(path+'\n'+payload));
   key='/offline-reading/'+Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('');
   cache=await caches.open(readingCacheName);
  }catch{}
 }
 try{
  const response=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:payload});
  if(response.status>=500)throw new Error('排盘服务暂不可用');
  const result=await response.json();
  if(cache&&response.ok&&!result.error){
   try{
    await cache.delete(key);
    await cache.put(key,new Response(JSON.stringify(result),{headers:{'content-type':'application/json'}}));
    const keys=await cache.keys();
    await Promise.all(keys.slice(0,Math.max(0,keys.length-60)).map(entry=>cache.delete(entry)));
   }catch{}
  }
  return result;
 }catch(error){
  if(cache){
   const saved=await cache.match(key).catch(()=>null);
   if(saved)return saved.json();
  }
  if(navigator.onLine===false)throw new Error('离线时可查看已经载入过的命盘与运限');
  throw error;
 }
}

if('serviceWorker' in navigator)navigator.serviceWorker.register('/offline.js').catch(()=>{});
