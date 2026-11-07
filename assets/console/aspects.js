import {esc,btn} from './ui.js';
const major=new Set([0,60,90,120,180]);
const norm=x=>((x%360)+360)%360;
const minutes=x=>{const n=Math.round(Math.abs(x)*60);return Math.floor(n/60)+'°'+String(n%60).padStart(2,'0')+'′';};
export function filterAspects(list,filter='main'){
 return list.filter(x=>filter==='tight'?x.orb<2:filter==='applying'?x.applying===true:filter==='separating'?x.applying===false:filter==='all'||major.has(x.angle))
  .sort((a,b)=>a.orb-b.orb||a.a.localeCompare(b.a,'zh')||a.b.localeCompare(b.b,'zh'));
}
export function aspectBrowser(result,state={filter:'main',expanded:false}){
 const list=result.outer?result.cross:result.chart.aspects;
 const filtered=filterAspects(list,state.filter),shown=state.expanded?filtered:filtered.slice(0,12);
 const from=result.outer?.planets??result.chart.planets,to=result.chart.planets;
 const count=state.filter==='main'?list.length:filtered.length;
 return `<div class="aspect-browser" data-aspect-browser>
 <div class="aspect-filters" aria-label="相位过滤">${[['main','主要相位'],['tight','紧密容许度(<2°)'],['applying','入相位'],['separating','出相位'],['all','全部('+list.length+')']].map(([id,label])=>btn(label,`data-aspect-filter="${id}" aria-pressed="${state.filter===id}"`)).join('')}</div>
 <p class="thin" role="status">${state.expanded?'已展开':'精选最近'} ${shown.length} / ${filtered.length} 条${state.filter==='main'?'主要相位':''}</p>
 <div class="aspect-expansion"><div class="aspect-preview" id="aspectDetailList">${shown.map(x=>{
  const a=from.find(p=>p.key===x.aKey),b=to.find(p=>p.key===x.bKey),gap=a&&b?Math.min(norm(a.lon-b.lon),norm(b.lon-a.lon)):null;
  const phase=x.applying===true?'入相位':x.applying===false?'出相位':x.orb<1e-7?'精确相位':result.mode==='composite'?'中点盘不定义入出相位':'阶段未定';
  const sign=x.applying===true?'−':x.applying===false?'+':'';
  const type=[60,120].includes(x.angle)?'soft':[90,180,45,135].includes(x.angle)?'hard':'neutral';
  return `<div class="aspect-detail" data-applying="${x.applying===true}" data-aspect="${type}"><b>${esc((result.outer?'行运':'')+x.a+' '+x.type+' '+(result.outer?'本命':'')+x.b)}</b><span>标准角 ${minutes(x.angle)}${gap===null?'':' · 实际夹角 '+minutes(gap)}</span><span>Orb ${sign}${minutes(x.orb)} · ${phase}</span></div>`;
 }).join('')||'<p class="muted">此过滤条件下没有相位。</p>'}</div></div>
 ${count>12||state.expanded?btn(state.expanded?'收起 ▴':'查看完整 '+count+' 条相位明细 ▾',`class="aspect-toggle" data-aspect-toggle aria-expanded="${state.expanded}" aria-controls="aspectDetailList"`):''}</div>`;
}
export function bindAspectBrowser(root,result,state){
 const host=root.querySelector('[data-aspect-browser]');if(!host)return;
 host.onclick=event=>{
  const filter=event.target.closest('[data-aspect-filter]'),toggle=event.target.closest('[data-aspect-toggle]');if(!filter&&!toggle)return;
  const before=host.getBoundingClientRect().height;
  if(filter){state.filter=filter.dataset.aspectFilter;state.expanded=state.filter==='all';state.previousFilter='main';}
  else if(state.expanded){state.expanded=false;state.filter=state.previousFilter||'main';}
  else {state.previousFilter=state.filter;if(state.filter==='main')state.filter='all';state.expanded=true;}
  const wrapper=document.createElement('div');wrapper.innerHTML=aspectBrowser(result,state);
  host.innerHTML=wrapper.firstElementChild.innerHTML;
  const after=host.getBoundingClientRect().height;
  if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches&&before&&after&&host.animate){host.animate([{height:before+'px'},{height:after+'px'}],{duration:240,easing:'cubic-bezier(.2,.8,.25,1)'});}
  const focus=filter?host.querySelector(`[data-aspect-filter="${state.filter}"]`):host.querySelector('[data-aspect-toggle]');focus?.focus({preventScroll:true});
 };
}
