import {btn,esc,stored} from './ui.js';
import {localRequest} from '../../src/console-engine.mjs';

export const relationships=['灵魂共振','宿命羁绊','业力债主','天选搭子','相爱相杀'];
const relationKey='xy_case_space';
export function caseSpace(){
 const data=stored(relationKey,{links:[],notes:{},reminders:{}});
 return {...data,links:data.links.map(({ids,type})=>({ids,type}))};
}
export const pairKey=ids=>JSON.stringify([...ids].sort());
export const relationStorageKey=relationKey;
const number=n=>typeof n==='number'&&Number.isFinite(n);
const scoreCache=new Map();
export const clearRelationshipCache=()=>scoreCache.clear();
// 本地强制重算契合度（跳过远程与缓存），供关系名片「重新计算」按钮使用。
export function recomputeFit(a,b){
 const key=JSON.stringify([a,b]);scoreCache.delete(key);
 return localRequest('/api/console/relationship',{a,b});
}

export async function linkedCases(profile,cases,links,request,normalize){
 const neighbors=new Map(cases.map(c=>[c.id,c]));
 return Promise.all(links.filter(l=>l.ids.includes(profile.id)).map(async l=>{
  const other=neighbors.get(l.ids.find(id=>id!==profile.id));
  if(!other)return null;
  let score=null,localFallback=false;
  try{
   const a=normalize(profile),b=normalize(other),key=JSON.stringify([a,b]);
   if(!scoreCache.has(key)){
    // 先试远程，失败则降级到同进程本地引擎（契合度八字/紫微/印占证据均在本地可算）。
    const promise=request('/api/console/relationship',{a,b})
     .catch(()=>localRequest('/api/console/relationship',{a,b}));
    scoreCache.set(key,promise);
    if(scoreCache.size>96)scoreCache.delete(scoreCache.keys().next().value);
   }
   score=await scoreCache.get(key);
  }catch{}
  return {other,type:l.type,score,localFallback:!score};
 })).then(items=>items.filter(Boolean).sort((a,b)=>(b.score?.percent??-1)-(a.score?.percent??-1)));
}

export function galaxy(profile,links,page=0){
 if(!links.length)return '<p class="muted">在案例详情里建立双向关系，即可生成关系轨道。</p>';
 const batch=links.slice(page*12,page*12+12);
 const rings=[55,89,124],groups=[[],[],[]];
 for(const l of batch){
  const value=l.score?.percent??-1;
  groups[value>=72?0:value>=48?1:2].push(l);
 }
 const points=groups.flatMap((group,j)=>group.map((l,i)=>{
  const angle=2*Math.PI*i/group.length+(j-1)*.31-Math.PI/2;
  return {...l,x:160+rings[j]*Math.cos(angle),y:153+rings[j]*Math.sin(angle)};
 }));
 const layers=rings.map(r=>`<circle class="galaxy-orbit" cx="160" cy="153" r="${r}"/>`).join('');
 return `<div class="galaxy">
 <svg viewBox="0 0 320 306" role="group" aria-label="以 ${esc(profile.name)} 为中心的关系星系">${layers}
 ${points.map(p=>`<line class="relation-link" x1="160" y1="153" x2="${p.x}" y2="${p.y}"/>`).join('')}
 <circle class="galaxy-core" cx="160" cy="153" r="23"/><text x="160" y="157" text-anchor="middle">我</text>
 ${points.map(p=>`<g class="galaxy-planet" role="button" tabindex="0" data-galaxy-case="${esc(p.other.id)}" aria-label="${esc(p.other.name+' · '+p.type+(p.score?' · 契合度 '+p.score.percent+'%':''))}">
 <title>${esc(p.other.name+' · '+p.type)}</title><circle class="relation-node" cx="${p.x}" cy="${p.y}" r="12.5"/>
 <text x="${p.x}" y="${p.y+3}" text-anchor="middle">${p.score?.percent??'–'}</text></g>`).join('')}</svg>
 <div class="stack">${batch.map(p=>`<div class="galaxy-item">${btn(p.other.name,'data-galaxy-case="'+esc(p.other.id)+'"')}<span>${esc(p.type)} · ${p.score?'契合度 '+p.score.percent+'%'+(p.score.highlight?' · '+esc(p.score.highlight):''):'契合度计算中，点开可重试'}</span></div>`).join('')}</div>
 ${links.length>12?`<div class="spread">${btn('上一页',page?'data-galaxy-page="'+(page-1)+'"':'disabled')}<small>${page+1} / ${Math.ceil(links.length/12)}</small>${btn('下一页',(page+1)*12<links.length?'data-galaxy-page="'+(page+1)+'"':'disabled')}</div>`:''}
 <small>契合度取印度八项合盘双向平均分，再折算为百分比；干支与相位另列为观察线索。</small></div>`;
}

// 五行气质：优势用「擅长」，课题用「留意」——都给可落地的行动建议，取代旧版单句空泛 motto。
const soul={
 木:{t:'向外生长',edge:'擅长规划与开拓：适合从零搭框架、带新方向',watch:'留意半途换目标：给自己一小片可持续生长的空间，先深耕一处'},
 火:{t:'温暖明亮',edge:'擅长感染与表达：适合台前、传播与凝聚人气',watch:'留意热度分配：把热情留给真正想照亮的事，别处处点火'},
 土:{t:'安定有序',edge:'擅长落实与守成：适合流程、财务与长期项目',watch:'留意过度求稳：用一个能重复的习惯，让愿望分步落到地面'},
 金:{t:'清醒有界',edge:'擅长判断与定型：适合规则、审美与质量把关',watch:'留意过硬过冷：做减法，让重要的东西有名字，也给关系留余地'},
 水:{t:'细察善变',edge:'擅长洞察与应变：适合研究、策略与复杂信息',watch:'留意方向反复：允许调整，同时守住自己的节奏与主线'}
};
const W5=['木','火','土','金','水'];
const W5COLOR={木:'var(--wood)',火:'var(--fire)',土:'var(--earth)',金:'var(--metal)',水:'var(--water)'};
export function soulCard(reading,name){
 if(!reading)return '<article class="card"><h2>本命守护气质图腾</h2><p class="muted">起盘或激活案例后解锁。</p></article>';
 const {dayMaster,strength}=reading.bazi;
 const pcts=strength?.percentages||{};
 const ranked=Object.entries(pcts).sort((a,b)=>b[1]-a[1]);
 const [element,pct]=ranked[0]||['木',0],weak=ranked.at(-1)?.[0]||'水';
 const info=soul[element]||soul.木,weakInfo=soul[weak]||soul.水,weakPct=ranked.at(-1)?.[1]||0;
 const sun=reading.western?.planets?.find(p=>p.key==='sun'),moon=reading.western?.planets?.find(p=>p.key==='moon');
 const bar=W5.map(w=>`<span class="soul-w5-seg" style="flex:${Math.max(2,Number(pcts[w]||0))};background:${W5COLOR[w]}" title="${w} ${Number(pcts[w]||0).toFixed(1)}%"></span>`).join('');
 return `<article class="card soul-card liquid-glass"><span class="kicker">SOUL PALETTE · ${esc(name||'命主')}</span><h2>${esc(dayMaster?.stem||'')}${esc(dayMaster?.element||'')} · ${esc(info.t)}</h2>
 <p class="soul-meta">日${esc(sun?.sign||'—')}月${esc(moon?.sign||'—')} · ${esc(strength?.kind||'')} · 主导 ${esc(element)} ${Number(pct).toFixed(1)}%</p>
 <div class="soul-w5" role="img" aria-label="五行权重分布">${bar}</div>
 <div class="soul-mini"><div><b>天生优势 · ${esc(element)}</b><p>${esc(info.edge)}</p></div><div><b>成长课题 · ${esc(weak)} ${Number(weakPct).toFixed(1)}%</b><p>${esc(weakInfo.watch)}</p></div></div></article>`;
}

export function mergeBackup(data,state,space){
 if(data?.format!=='firstlight-cases'||![2,3,4,5].includes(data.version)||!Array.isArray(data.cases)||data.cases.length>1000)throw Error('备份格式无效');
 const cases=[...state.cases],groups=new Set(state.groups),ids=new Set(cases.map(x=>x.id));
 const identifier=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,64}$/.test(id);
 const short=(x,n)=>typeof x==='string'&&x.trim()&&x.length<=n;
 const group=x=>short(x,12)&&!['客户','全部','我的','亲人','朋友','特别关注'].includes(x);
 for(const g of Array.isArray(data.groups)?data.groups:[])if(group(g))groups.add(g);
 for(const c of data.cases){
  const f=c?.fields;
  if(!identifier(c?.id)||!short(c.name,40)||!/^\d{4}-\d{2}-\d{2}$/.test(f?.dateStr)||
     !number(f?.city?.lat)||!number(f.city.lon)||Math.abs(f.city.lat)>90||Math.abs(f.city.lon)>180||
     (f.city.tz!==undefined&&(!number(f.city.tz)||f.city.tz< -12||f.city.tz>14)))throw Error('备份中存在无效出生资料');
  if(ids.has(c.id))continue;
  cases.push({...c,tags:Array.isArray(c.tags)?c.tags.filter(x=>short(x,150)):[]});
  ids.add(c.id);
  if(group(c.category))groups.add(c.category);
 }
 const links=[...space.links],seenLinks=new Set(links.map(x=>pairKey(x.ids))),notes={...space.notes};
 const reminders=Object.fromEntries(Object.entries(space.reminders).map(([id,items])=>[id,[...items]]));
 const reminderIds=new Set(Object.values(reminders).flat().map(x=>x.id));
 const incoming=data.space||{},newReminders=[];
 for(const l of Array.isArray(incoming.links)?incoming.links:[]){
  if(!Array.isArray(l?.ids)||l.ids.length!==2||l.ids[0]===l.ids[1]||!l.ids.every(id=>ids.has(id))||!short(l.type,24))continue;
  const key=pairKey(l.ids);
  if(seenLinks.has(key))continue;
  links.push({ids:[...l.ids].sort(),type:l.type});
  seenLinks.add(key);
 }
 for(const [id,note] of Object.entries(incoming.notes||{}))if(ids.has(id)&&!Object.hasOwn(notes,id)&&short(note,8000))notes[id]=note;
 for(const [id,items] of Object.entries(incoming.reminders||{})){
  if(!ids.has(id)||!Array.isArray(items))continue;
  for(const r of items){
   if(!identifier(r?.id)||reminderIds.has(r.id)||!short(r.message,80)||!short(r.when,32)||!Number.isFinite(Date.parse(r.when)))continue;
   const restored={id:r.id,message:r.message,when:r.when,delivered:!!r.delivered};
   // 择日日程的元数据随备份保留，否则导入后只剩一条「某时某刻」的提醒，看不出是哪种事项、多少分。
   if(r.kind==='almanac'){
    restored.kind='almanac';
    if(typeof r.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date))restored.date=r.date;
    if(short(r.event,24))restored.event=r.event;
    if(short(r.tier,4))restored.tier=r.tier;
    if(short(r.gz,4))restored.gz=r.gz;
    if(number(r.score))restored.score=r.score;
   }
   (reminders[id]??=[]).push(restored);reminderIds.add(r.id);newReminders.push(restored);
  }
 }
 const recent=[...new Set([...state.recent,...(Array.isArray(data.recent)?data.recent:[])])].filter(id=>ids.has(id)).slice(0,5);
 const profile=state.profile||cases.find(c=>c.id===data.activeId)||null;
 return {cases,groups:[...groups],recent,profile,space:{links,notes,reminders},newReminders};
}
