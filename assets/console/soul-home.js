import {$,esc,symbols} from './ui.js';
import {playSuccessSound,reducedMotion} from './feedback.js';

const pad=n=>String(n).padStart(2,'0');
const xy=(lon,r)=>[95+Math.sin(lon*Math.PI/180)*r,95-Math.cos(lon*Math.PI/180)*r];
function phaseBadge(sky){
 const cosine=Math.cos(sky.angle*Math.PI/180);
 const x=(Math.abs(cosine)*7).toFixed(3);
 const mirror=sky.angle>180?'translate(16 0) scale(-1 1)':'';
 return `<span class="chip moon-badge"><svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="7" fill="#d28db8"/>
 <path transform="${mirror}" fill="#fff2db" d="M8 1 A7 7 0 0 1 8 15 A${x} 7 0 0 ${cosine>0?0:1} 8 1Z"/></svg>${esc(sky.phase)}</span>`;
}
function compass(sky){
 const marker=(object,rad,icon,cls)=>{
  const [x,y]=xy(object.longitude,rad);
  return `<g class="${cls}"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y+4}">${icon}</text></g>`;
 };
 return `<svg class="sky-compass" viewBox="0 0 190 190" role="img" aria-label="太阳与月亮黄经小罗盘">
 <circle class="sky-ring" cx="95" cy="95" r="76"/><circle class="sky-ring inner" cx="95" cy="95" r="55"/>
 ${symbols.map((x,i)=>{const [a,b]=xy(i*30+15,65);return `<text x="${a}" y="${b+4}">${x}</text>`;}).join('')}
 <path d="M95 76 99 90 114 95 99 100 95 114 91 100 76 95 91 90Z" class="sky-spark"/>
 ${marker(sky.sun,79,'☉','sky-sun')}${marker(sky.moon,49,'☾','sky-moon')}</svg>`;
}
export function soulWidgets(){
 return `<article class="card soul-sky" data-today-sky><h2>今日即时星象</h2><p role="status">正在读取本地星历…</p></article>
 <article class="card soul-divination"><div><span class="kicker">DAILY INSPIRATION</span><h2>每日灵感占卜</h2><p>按东八区的日期与时辰，抽取一则灵感。</p></div>
 <button type="button" data-draw-guide class="crystal-button" aria-label="点亮水晶球，抽取今日灵性指引"><span aria-hidden="true">✦</span><small>点亮水晶球</small></button>
 <div data-guidance class="guidance" aria-live="polite"></div></article>`;
}
export function wireSoul(ctx){
 const host=$('[data-today-sky]',ctx.root),draw=$('[data-draw-guide]',ctx.root),out=$('[data-guidance]',ctx.root);
 let working=false;
 async function refresh(){
  if(!host.isConnected)return;
  try{
   const s=await ctx.request('/api/console/today-sky',{});
   if(!host.isConnected)return;
   const t=new Date(Date.parse(s.at)+8*3600000).toISOString().slice(11,16);
   host.innerHTML=`<div><span class="kicker">TODAY’S SKY · ${esc(s.day)}</span><h2>今日即时星象</h2>
   <p>☉ 太阳 ${esc(s.sun.sign)}座 ${s.sun.degree}°${pad(s.sun.minute)}′</p>
   <p>${phaseBadge(s)} 照亮约 ${s.litPercent}%</p><p class="thin">${esc(s.hint)}</p>
   <small>东八区 ${t} · 本机星历</small></div>${compass(s)}`;
  }catch(error){if(host.isConnected)host.textContent=error.message;}
 
 }
 refresh();
 const interval=setInterval(()=>{if(host.isConnected)refresh();else clearInterval(interval);},60000);
 draw.onclick=async()=>{
  if(working)return;
  working=true;draw.disabled=true;draw.classList.remove('lighting');void draw.offsetWidth;draw.classList.add('lighting');
  try{
   const g=await ctx.request('/api/console/daily-guidance',{});
   if(!reducedMotion())await new Promise(resolve=>setTimeout(resolve,280));
   if(!out.isConnected)return;
   out.innerHTML=`<h3>今日灵性指引 · ${esc(g.branch)}时</h3>
   <dl><div><dt>幸运色</dt><dd><i class="guide-swatch" style="background:${g.swatch}"></i>${esc(g.color)}</dd></div>
   <div><dt>开运方位</dt><dd>${esc(g.direction)}</dd></div><div><dt>适宜</dt><dd>${esc(g.good)}</dd></div>
   <div><dt>避讳</dt><dd>${esc(g.avoid)}</dd></div></dl><blockquote>${esc(g.motto)}</blockquote>`;
   playSuccessSound();
  }catch(error){if(out.isConnected)out.textContent=error.message;}
  finally{working=false;draw.disabled=false;}
 };
}
