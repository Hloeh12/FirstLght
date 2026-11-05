import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chart, synastry } from './src/chart.mjs';
import { daily } from './src/daily.mjs';
import { ziweiFlow, ziweiChart } from './src/ziwei.mjs';
import { localTemplateReport } from './src/report-template.mjs';
import { energy } from './src/energy.mjs';
import { timeline } from './src/timeline.mjs';
import { toMarkdown, toHtml } from './src/export.mjs';
import { memoize, memoTTL, cacheKey, saveRecord, listRecords, getRecord, clearMemo } from './src/store.mjs';
import zlib from 'node:zlib';
import { validate } from './src/validate.mjs';
import { provinces, cities, counties, resolvePlace, searchPlaces, nearestPlace } from './src/geo.mjs';
import { baziFromInput } from './src/baziInput.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const send=(req,res,status,obj)=>{
 const body=Buffer.from(JSON.stringify(obj));
 const headers={'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type','x-compute-ms':String(Math.round(performance.now()-req._t0))};
 const ae=String(req.headers['accept-encoding']||'');
 if(body.length>1024&&/gzip/.test(ae)){const gz=zlib.gzipSync(body,{level:6});headers['content-encoding']='gzip';headers['vary']='Accept-Encoding';headers['content-length']=gz.length;res.writeHead(status,headers);return res.end(gz);}
 headers['content-length']=body.length;res.writeHead(status,headers);res.end(body);
};
const chartCached=(input)=>memoTTL('chart|'+cacheKey(input),10*60*1000,()=>chart(input));
const server=http.createServer(async(req,res)=>{
 req._t0=performance.now();
 if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
 const url=new URL(req.url,'http://localhost');
 if(req.method==='GET' && /^\/(src|assets|vendor)\//.test(url.pathname)){
  try{
   const relative=decodeURIComponent(url.pathname).slice(1);
   const target=path.resolve(root,relative);
   const allowed=['src','assets','vendor'].some(dir=>target.startsWith(path.join(root,dir)+path.sep));
   if(!allowed)return send(req,res,403,{error:'forbidden'});
   const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
   const body=await readFile(target);
   res.writeHead(200,{'content-type':types[path.extname(target)]||'application/octet-stream','x-content-type-options':'nosniff'});
   return res.end(body);
  }catch{return send(req,res,404,{error:'not found'});}
 }
 if(req.method==='GET'&&url.pathname==='/offline.js'){res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-cache'});return res.end(await readFile(path.join(root,'assets/offline.js')));}
 if(req.method==='GET'&&url.pathname==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(await readFile(path.join(root,'index.html')));}
 if(req.method==='GET'&&url.pathname==='/api')return send(req,res,200,{name:'xingyu-local-replica',version:'0.15.0',endpoints:{chart:'POST /api/chart',synastry:'POST /api/synastry/chart',daily:'POST /api/daily',energy:'POST /api/energy',localReport:'POST /api/local-report',timeline:'POST /api/timeline',ziweiFlow:'POST /api/ziwei-flow'},notImplemented:['/api/report','/api/synastry/report']});
 if(req.method==='GET'&&url.pathname==='/api/history'){try{return send(req,res,200,{items:listRecords(Number(url.searchParams.get('limit'))||20)});}catch(e){return send(req,res,500,{error:e.message});}}
 if(req.method==='GET'&&/^\/api\/history\/[0-9]{14}-[0-9a-f]{6}$/.test(url.pathname)){try{return send(req,res,200,getRecord(url.pathname.split('/').pop()));}catch(e){return send(req,res,404,{error:e.message});}}
 if(req.method==='GET'&&url.pathname.startsWith('/api/geo')){
  const q=url.searchParams;
  if(url.pathname==='/api/geo/reverse'){try{return send(req,res,200,nearestPlace(Number(q.get('lat')),Number(q.get('lon'))));}catch(e){return send(req,res,400,{error:e.message});}}
  if(url.pathname==='/api/geo/provinces')return send(req,res,200,{items:provinces()});
  if(url.pathname==='/api/geo/cities')return send(req,res,200,{items:cities(q.get('p'))});
  if(url.pathname==='/api/geo/counties')return send(req,res,200,{items:counties(q.get('c'))});
  if(url.pathname==='/api/geo/resolve'){const r=resolvePlace({p:q.get('p'),c:q.get('c'),d:q.get('d')});return r?send(req,res,200,r):send(req,res,404,{error:'未找到该地区坐标'});}
  if(url.pathname==='/api/geo/search')return send(req,res,200,{items:searchPlaces(q.get('q'))});
  return send(req,res,404,{error:'not found'});
 }
 if(req.method==='POST'&&url.pathname==='/api/bazi'){let raw='';for await(const c of req)raw+=c;try{return send(req,res,200,baziFromInput(JSON.parse(raw||'{}')));}catch(e){return send(req,res,400,{error:e.message});}}
 if(req.method==='POST'&&url.pathname==='/api/cache/clear'){clearMemo();return send(req,res,200,{ok:true});}
 if(req.method==='GET'&&url.pathname==='/api/validate')return send(req,res,200,validate());
 if(req.method==='GET'&&url.pathname==='/openapi.json'){return send(req,res,200,openapi());}
 if(req.method==='GET'&&url.pathname==='/health')return send(req,res,200,{ok:true,name:'xingyu-local-replica',version:'0.15.0',readyAt,warmMs,uptimeSec:Math.round(process.uptime())});
 if(req.method==='POST'&&['/api/chart','/api/daily','/api/synastry/chart','/api/local-report','/api/energy','/api/timeline'].includes(url.pathname)){
  let raw='';for await(const chunk of req)raw+=chunk;
  if(raw.length>100000)return send(req,res,413,{error:'request too large'});
  try{const data=JSON.parse(raw||'{}');if(url.pathname==='/api/daily')return send(req,res,200,daily(data));if(url.pathname==='/api/synastry/chart')return send(req,res,200,{ok:true,...synastry(data.a,data.b,data.mode||'synastry')});if(url.pathname==='/api/local-report')return send(req,res,200,localTemplateReport(chartCached(data)));if(url.pathname==='/api/timeline'){const key='tl|'+cacheKey({data,months:data.months||24});return send(req,res,200,memoize(key,()=>timeline(chartCached(data),{months:data.months||24})));}if(url.pathname==='/api/energy'){const c=chartCached(data);return send(req,res,200,energy(c.western,JSON.stringify(c.meta.input)));}return send(req,res,200,{ok:true,raw:chartCached(data),notice:'Independent implementation from publicly visible client algorithms; not the original server.'});}
  catch(e){return send(req,res,400,{error:e.message||'invalid input'});}
 }
 if(req.method==='POST'&&url.pathname==='/api/export'){let raw='';for await(const x of req)raw+=x;try{const d=JSON.parse(raw||'{}');const c=chartCached(d);const fmt=d.format==='html'?'html':'md';const text=fmt==='html'?toHtml(c):toMarkdown(c);if(d.save){const id=saveRecord({kind:'export',label:(d.city?.label||'')+' '+d.dateStr,format:fmt,text});return send(req,res,200,{ok:true,id});}res.writeHead(200,{'content-type':fmt==='html'?'text/html; charset=utf-8':'text/markdown; charset=utf-8','content-disposition':'inline'});return res.end(text);}catch(e){return send(req,res,400,{error:e.message});}}
 if(req.method==='POST'&&url.pathname==='/api/history'){let raw='';for await(const x of req)raw+=x;try{const d=JSON.parse(raw||'{}');const id=saveRecord({kind:d.kind||'chart',label:d.label||'',payload:d.payload||null});return send(req,res,200,{ok:true,id});}catch(e){return send(req,res,400,{error:e.message});}}
 if(req.method==='POST'&&url.pathname==='/api/synastry/report')return send(req,res,501,{error:'Synastry AI report not replicated: original server model/prompts are not public.'});
 if(req.method==='POST'&&url.pathname==='/api/report')return send(req,res,501,{error:'Report generation not replicated: original server model, prompts and tier routing are not public. This endpoint intentionally does not fabricate AI output.'});
 if(req.method==='POST'&&url.pathname==='/api/ziwei'){let raw='';for await(const x of req)raw+=x;try{const d=JSON.parse(raw||'{}');let dateStr=d.dateStr;if(d.calendar==='lunar'){const {lunarToSolar}=await import('./src/lunar.mjs');dateStr=lunarToSolar(Number(d.Y),Number(d.M),Number(d.D),!!d.leapMonth);if(!dateStr)throw new Error('农历日期无效');}
 return send(req,res,200,ziweiChart({...d,dateStr,timeIndex:d.timeIndex,gender:d.gender}));}catch(e){return send(req,res,400,{error:e.message});}}
 if(req.method==='POST'&&url.pathname==='/api/ziwei-flow'){let raw='';for await(const x of req)raw+=x;try{const d=JSON.parse(raw||'{}');return send(req,res,200,ziweiFlow({dateStr:d.dateStr,timeIndex:d.ziweiTimeIndex??d.timeIndex??0,gender:d.gender,flowYear:d.flowYear,astroType:d.astroType,scope:d.scope,month:d.month,day:d.day}));}catch(e){return send(req,res,400,{error:e.message});}}
 
 send(req,res,404,{error:'not found'});
});
function openapi(){
 const birthSchema={type:'object',required:['Y','M','D','city'],properties:{Y:{type:'integer'},M:{type:'integer'},D:{type:'integer'},h:{type:'integer',default:12},mi:{type:'integer',default:0},gender:{type:'string',enum:['男','女']},dateStr:{type:'string'},timeStr:{type:'string'},timeUnknown:{type:'boolean'},useSolarTime:{type:'boolean'},city:{type:'object',required:['lat','lon'],properties:{label:{type:'string'},lat:{type:'number'},lon:{type:'number'},tz:{type:'number',default:8}}}}};
 const op=(summary,req,resp)=>({summary,requestBody:{required:true,content:{'application/json':{schema:req}}},responses:{200:{description:'OK',content:{'application/json':{schema:resp}}}}});
 return {openapi:'3.0.3',info:{title:'星谕公开算法独立复刻',version:'0.15.0',description:'独立实现，非原站后端；规则来源为公开客户端脚本与公开发布库。'},paths:{
  '/api/chart':{post:op('三盘排盘',birthSchema,{type:'object'})},
  '/api/synastry/chart':{post:op('双人合盘',{type:'object',required:['a','b'],properties:{a:birthSchema,b:birthSchema,mode:{type:'string',enum:['synastry','composite','davison','midpoint']}}},{type:'object'})},
  '/api/daily':{post:op('每日运势',birthSchema,{type:'object'})},
  '/api/energy':{post:op('能量场',birthSchema,{type:'object'})},
  '/api/local-report':{post:op('模板报告',birthSchema,{type:'object'})},
  '/api/timeline':{post:op('三体系时间轴',{allOf:[birthSchema],type:'object',properties:{months:{type:'integer',default:24}}},{type:'object'})},
  '/api/ziwei-flow':{post:op('紫微流年',{type:'object',properties:{dateStr:{type:'string'},ziweiTimeIndex:{type:'integer'},gender:{type:'string'},flowYear:{type:'integer'},astroType:{type:'string',enum:['heaven','earth','human']},scope:{type:'string',enum:['decadal','yearly','monthly','daily']},month:{type:'integer',minimum:-12,maximum:12},day:{type:'integer',minimum:1,maximum:30}}},{type:'object'})},
  '/api/export':{post:op('导出 Markdown/HTML',{allOf:[birthSchema],type:'object',properties:{format:{type:'string',enum:['md','html']},save:{type:'boolean'}}},{type:'object'})},
  '/api/history':{get:{summary:'列出历史记录',responses:{200:{description:'OK'}}},post:{summary:'保存记录',responses:{200:{description:'OK'}}}},
  '/api/report':{post:{summary:'未实现：原站 AI 报告',responses:{501:{description:'Not Implemented'}}}},
  '/api/synastry/report':{post:{summary:'未实现：原站双人 AI 报告',responses:{501:{description:'Not Implemented'}}}}
 },components:{schemas:{BirthInput:birthSchema}}};
}
const port=Number(process.env.PORT||8765);
let readyAt=null,warmMs=null;
function warmUp(){
 const t=performance.now();
 try{
  const samples=[
   {Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{label:'warmup',lat:31.2304,lon:121.4737,tz:8}},
   {Y:1988,M:3,D:3,h:7,mi:20,gender:'男',city:{label:'warmup2',lat:39.9042,lon:116.4074,tz:8}},
   {Y:1975,M:11,D:8,h:18,mi:45,gender:'女',city:{label:'warmup3',lat:23.1291,lon:113.2644,tz:8}}
  ];
  for(const sample of samples){chartCached(sample);localTemplateReport(chartCached(sample));energy(chartCached(sample).western,'warm');toMarkdown(chartCached(sample));}
  timeline(chartCached(samples[0]),{months:6});
  readyAt=new Date().toISOString();
  warmMs=Math.round(performance.now()-t);
 }catch(e){console.error('warmup failed',e.message);}
}server.listen(port,'0.0.0.0',()=>{console.log(`local replica listening on ${port}`);setTimeout(warmUp,0);});
