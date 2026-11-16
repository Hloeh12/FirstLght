import {esc,btn} from './ui.js';
const major=new Set([0,60,90,120,180]);
// 相位释义字典：把几何角度翻译成可读的关系主题，避免只给冰冷数字。
const ASPECT_MEANING={
 0:{tag:'融合',text:'两股能量合流、同步强化，议题被推到同一舞台；合相不必然为吉，须看行星性质与宫位。'},
 60:{tag:'协同',text:'六合带来轻盈的机会与合作契机，彼此补给却需要主动发起，属于需要经营才生效的助力。'},
 90:{tag:'张力',text:'刑相是推力与摩擦，暴露目标冲突与结构调整的需求；宜把张力转化为行动，而非压抑或对抗。'},
 120:{tag:'流畅',text:'三合是和谐流动，天赋与支持较易自然浮现；顺境仍须落实，避免流于空转与理所当然。'},
 180:{tag:'对峙',text:'对冲呈现两端拉扯与关系镜像，易在亲密与合作议题上投射；成熟处理是整合而非选边。'},
 30:{tag:'微调',text:'半六合提示细部的磨合与习惯调整，影响较轻，可作辅助参考。'},
 45:{tag:'摩擦',text:'半刑带来持续的小阻力与不耐，适合循序渐进地修正细节。'},
 135:{tag:'失衡',text:'补八分相延续刑相张力又夹杂对抗，需留意节奏失衡与反复。'},
 150:{tag:'牵扯',text:'梅花相制造难以名状的别扭与调整压力，多体现在日常协作的细节里。'}
};
export const aspectMeaning=angle=>ASPECT_MEANING[angle]||{tag:'相位',text:'此角度的传统释义资料待补，先结合行星、容许度与落宫综合判读。'};
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
  const meaning=aspectMeaning(x.angle);
  return `<div class="aspect-detail" data-applying="${x.applying===true}" data-aspect="${type}"><b>${esc((result.outer?'行运':'')+x.a+' '+x.type+' '+(result.outer?'本命':'')+x.b)}<em class="aspect-tag">${esc(meaning.tag)}</em></b><span>标准角 ${minutes(x.angle)}${gap===null?'':' · 实际夹角 '+minutes(gap)}</span><span>Orb ${sign}${minutes(x.orb)} · ${phase}</span><p class="aspect-meaning">${esc(meaning.text)}</p></div>`;
 }).join('')||'<p class="muted">此过滤条件下没有相位。</p>'}</div></div>
 ${count>12||state.expanded?btn(state.expanded?'收起 ▴':'查看完整 '+count+' 条相位明细 ▾',`class="aspect-toggle" data-aspect-toggle aria-expanded="${state.expanded}" aria-controls="aspectDetailList"`):''}</div>`;
}
export function bindAspectBrowser(root,result,state){
 const host=root.querySelector('[data-aspect-browser]');if(!host)return;
 host.onclick=event=>{
  const filter=event.target.closest('[data-aspect-filter]'),toggle=event.target.closest('[data-aspect-toggle]');if(!filter&&!toggle)return;
  if(filter){state.filter=filter.dataset.aspectFilter;state.expanded=state.filter==='all';state.previousFilter='main';}
  else if(state.expanded){state.expanded=false;state.filter=state.previousFilter||'main';}
  else {state.previousFilter=state.filter;if(state.filter==='main')state.filter='all';state.expanded=true;}
  const wrapper=document.createElement('div');wrapper.innerHTML=aspectBrowser(result,state);
  host.innerHTML=wrapper.firstElementChild.innerHTML;
  if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){
   host.querySelector('.aspect-preview').animate?.([{opacity:.65},{opacity:1}],{duration:180,easing:'ease-out'});
  }
  const focus=filter?host.querySelector(`[data-aspect-filter="${state.filter}"]`):host.querySelector('[data-aspect-toggle]');focus?.focus({preventScroll:true});
 };
}
