import {$,btn,esc,request} from './ui.js';
import {clearMemo} from '../../src/memo.mjs';
import {clearRelationshipCache} from './case-space.js';

const key='xy_runtime_diagnostics';
const capacity=100;
const messages=new EventTarget();
let logs=[];
try{
 const saved=JSON.parse(localStorage.getItem(key)||'[]');
 if(Array.isArray(saved))logs=saved.filter(x=>x&&typeof x.message==='string').slice(-capacity);
}catch{}

function clean(value){
 return String(value??'未知错误')
  .replace(/(?:https?|firstlight|file):\/\/[^\s)]+/gi,'[资源地址]')
  .replace(/[\u0000-\u001f]/g,' ')
  .slice(0,280);
}
function write(kind,error){
 const entry={at:new Date().toISOString(),kind,message:clean(error?.message??error),stack:String(error?.stack??'').replace(/(?:https?|firstlight|file):\/\/[^\s)]+/gi,'[资源地址]').slice(0,8000)};
 logs.push(entry);
 if(logs.length>capacity)logs.shift();
 try{localStorage.setItem(key,JSON.stringify(logs));}catch{}
 messages.dispatchEvent(new Event('update'));
}
export function installDiagnostics(){
 window.addEventListener('error',event=>{
  const source=event.target?.tagName;
  write('页面错误',event.error||event.message||(source?'资源加载失败 · '+source:'未知页面错误'));
 },true);
 window.addEventListener('unhandledrejection',event=>write('未处理 Promise',event.reason));
}

const sample={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',dateStr:'2000-08-16',timeStr:'12:00',city:{label:'自检示例',lat:31.23,lon:121.47,tz:8}};
async function runChecks(){
 let reading;
 const checks=[
  ['本机存储',()=>{
   const probe='xy_diagnostics_probe';
   localStorage.setItem(probe,'ok');
   try{return localStorage.getItem(probe)==='ok';}finally{localStorage.removeItem(probe);}
  }],
  ['八字与紫微排盘',async()=>{
   reading=await request('/api/console/reading',{birth:sample});
   return reading.bazi.pillars.length===4&&reading.ziwei.palaces.length===12;
  }],
  ['西洋本命与行运',async()=>{
   const r=await request('/api/console/western',{birth:sample,mode:'transit',at:'2026-11-06T04:00:00Z'});
   return r.chart.planets.length>=10&&r.outer.planets.length>=10;
  }],
  ['今日星象',async()=>Number.isFinite((await request('/api/console/today-sky',{})).sun.longitude)],
  ['关系合盘',async()=>{
   const score=await request('/api/console/relationship',{a:sample,b:{...sample,Y:1998,dateStr:'1998-08-16'}});
   return score.percent>=0&&score.percent<=100;
  }]
 ];
 const results=[];
 for(const [label,check] of checks){
  let ok=false;
  const start=performance.now();
  try{ok=await check();}catch(error){write('自检异常',error);}
  results.push({label,ok,ms:Math.round(performance.now()-start)});
 }
 return results;
}

async function resetCaches(){
 clearMemo();
 clearRelationshipCache();
 if(!navigator.serviceWorker?.controller)return '本机排盘缓存已清理。';
 if(!navigator.onLine)return '本机排盘缓存已清理。离线外壳已保留。';
 const message=new MessageChannel();
 return new Promise(resolve=>{
  const finish=value=>{clearTimeout(timer);message.port1.close();resolve(value);};
  const timer=setTimeout(()=>finish('本机排盘缓存已清理，离线外壳未确认刷新。'),9000);
  message.port1.onmessage=event=>finish(event.data?.ok?'本机排盘缓存已清理，离线外壳已刷新。':'本机排盘缓存已清理，离线外壳已保留。');
  try{navigator.serviceWorker.controller.postMessage({type:'firstlight-refresh-cache'},[message.port2]);}
  catch{finish('本机排盘缓存已清理，离线外壳已保留。');}
 });
}

async function copyLogs(output){
 const native=window.webkit?.messageHandlers?.copyDiagnostics;
 if(native){native.postMessage(output.value);return true;}
 try{
  if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(output.value);return true;}
 }catch{}
 output.focus();output.select();
 try{return document.execCommand?.('copy')===true;}catch{return false;}
}
export function diagnosticsPanel(ctx){
 const d=ctx.sheet('toolSheet','🛠️ 运行诊断与日志',`<div class="tool-grid diagnostics-actions">
 ${btn('一键全机自检','data-check-device')}${btn('复制诊断包','data-copy-logs')}${btn('重置缓存','data-reset-cache')}</div>
 <p class="thin">自检使用示例资料，在本机运行。缓存重置保留案例、偏好与日志。</p>
 <p data-diagnostic-status role="status"></p><ul data-diagnostic-checks></ul>
 <label>最近 <span data-log-count></span> 条日志（最多 100 条）<textarea readonly rows="8" data-logs aria-label="运行日志"></textarea></label>`);
 const output=$('[data-logs]',d),status=$('[data-diagnostic-status]',d),checks=$('[data-diagnostic-checks]',d);
 const draw=()=>{
  if(!output.isConnected){messages.removeEventListener('update',draw);return;}
  $('[data-log-count]',d).textContent=logs.length;
  output.value=logs.map(l=>[l.at,l.kind,l.message].join(' · ')+(l.stack?'\n'+l.stack:'')).join('\n\n');
 };
 draw();
 messages.addEventListener('update',draw);
 d.addEventListener('close',()=>messages.removeEventListener('update',draw),{once:true});
 $('[data-check-device]',d).onclick=async e=>{
  const button=e.currentTarget;button.disabled=true;status.textContent='正在进行本机自检…';
  try{
   const result=await runChecks();
   ctx.state.lastDiagnostics=result;
   const passed=result.filter(r=>r.ok).length;
   checks.innerHTML=result.map(r=>`<li class="${r.ok?'diagnostic-pass':'diagnostic-fail'}">${r.ok?'✓':'!'} ${esc(r.label)} · ${r.ok?'通过':'失败'} · ${r.ms} ms</li>`).join('');
   status.textContent=`${passed}/${result.length} 项通过`;
   write('本机自检',status.textContent);
  }finally{button.disabled=false;}
 };
 $('[data-copy-logs]',d).onclick=async()=>{
  output.value=JSON.stringify({app:'FirstLght',at:new Date().toISOString(),viewport:{width:innerWidth,height:innerHeight},online:navigator.onLine,userAgent:navigator.userAgent,checks:ctx.state.lastDiagnostics||[],logs},null,2);
  status.textContent=await copyLogs(output)?'诊断包已复制。':'诊断包已选中，可以手动复制。';
 };
 $('[data-reset-cache]',d).onclick=async e=>{
  const button=e.currentTarget;button.disabled=true;
  try{status.textContent=await resetCaches();}
  finally{button.disabled=false;}
 };
}
