const memo=new Map();
const MAX=60;
export function cacheKey(obj){return JSON.stringify(obj);}
export function memoize(key,fn){
 if(memo.has(key))return memo.get(key);
 const v=fn();
 memo.set(key,v);
 if(memo.size>MAX)memo.delete(memo.keys().next().value);
 return v;
}
const ttlMap=new Map();
export function memoTTL(key,ttlMs,fn){
 const hit=ttlMap.get(key);
 const now=Date.now();
 if(hit&&now-hit.at<ttlMs)return hit.v;
 const v=fn();
 ttlMap.set(key,{at:now,v});
 if(ttlMap.size>120)ttlMap.delete(ttlMap.keys().next().value);
 return v;
}
export function clearMemo(){memo.clear();ttlMap.clear();}
