import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
const DIR=process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)),'..','data');
fs.mkdirSync(DIR,{recursive:true});
const memo=new Map();
const MAX=60;
export function cacheKey(obj){return crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex').slice(0,16);}
export function memoize(key,fn){
 if(memo.has(key))return memo.get(key);
 const v=fn();
 memo.set(key,v);
 if(memo.size>MAX)memo.delete(memo.keys().next().value);
 return v;
}
export function saveRecord(record){
 const id=new Date().toISOString().replace(/[-:.TZ]/g,'').slice(0,14)+'-'+crypto.randomBytes(3).toString('hex');
 const file=path.join(DIR,id+'.json');
 fs.writeFileSync(file,JSON.stringify({id,createdAt:new Date().toISOString(),...record},null,1));
 return id;
}
export function listRecords(limit=20){
 return fs.readdirSync(DIR).filter(f=>f.endsWith('.json')).sort().reverse().slice(0,limit).map(f=>{
  const j=JSON.parse(fs.readFileSync(path.join(DIR,f),'utf8'));
  return {id:j.id,createdAt:j.createdAt,label:j.label,kind:j.kind};
 });
}
export function getRecord(id){
 if(!/^[0-9]{14}-[0-9a-f]{6}$/.test(id))throw new Error('无效记录 ID');
 return JSON.parse(fs.readFileSync(path.join(DIR,id+'.json'),'utf8'));
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
