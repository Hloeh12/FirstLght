import {wheel,planetList} from './western.js';
import {aspectBrowser,bindAspectBrowser} from './aspects.js';
import {bindWheel} from './wheel-gesture.js';
import {$,btn,esc,term,table,isoLocal} from './ui.js';
import {EVENTS as CAL_EVENT_META} from '../../src/almanac.mjs';
import {qiGuaByTime} from '../../src/liuyao.mjs';
import {naming} from './extras-naming.js';
import {decisionsFor,decisionAt,saveDecision,removeDecision} from './plan-book.js';

const stateFor=(ctx,id,defaults)=>ctx.state.chartState[id]??={...defaults,token:0,result:null,error:''};
async function load(ctx,id,s,path,body){
 const n=++s.token;s.pending=true;
 const status=$('[data-extra-status]',ctx.root);if(status)status.textContent='正在计算…';
 try{
  const result=await ctx.request(path,body);
  if(n!==s.token||ctx.state.chartState[id]!==s)return;
  s.result=result;s.error='';
 }catch(error){if(n===s.token){s.error=error.message;s.result=null;}}
 finally{if(n===s.token){s.pending=false;if(ctx.state.system===id&&ctx.state.tab==='chart'&&ctx.state.chartState[id]===s)extraView(ctx);}}
}
function qi(ctx){
 const id='qizheng',s=stateFor(ctx,id,{}),r=s.result;
 ctx.root.innerHTML=`<section id="qizheng"><h1>七政四余</h1><p data-extra-status role="status">${esc(s.error)}</p>
 ${r?`<article class="card"><h2>十一曜 · 二十八宿</h2>${table(['星曜','宿度','宫度','黄经','逆行'],r.stars.map(x=>[x.name,x.mansion+' '+x.mansionDegree.toFixed(2)+'°',x.house+'宫 '+x.houseDegree.toFixed(2)+'°',x.lon.toFixed(2)+'°',x.retro?'逆':'—']))}</article>
 <article class="card"><h2>合相与格局</h2>${r.conjunctions.map(x=>`<p>${esc(x.a+' · '+x.b)} 合相 ${x.orb.toFixed(2)}°</p>`).join('')||'<p>未见 3° 内合相。</p>'}
 ${r.patterns.map(x=>`<p>${x.house}宫会聚 · ${esc(x.stars.join('、'))}</p>`).join('')}<small>${esc(r.method)}</small></article>`:''}</section>`;
 if(!r&&!s.pending&&!s.error)load(ctx,id,s,'/api/console/qizheng',{birth:ctx.birth});
}
function hexagram(heading,h){
 return `<article class="card liquid-glass"><h2>${esc(heading)} · ${term(h.name,h.reading||'可结合卦象与所选爻位阅读。','《周易》'+h.name+'卦：'+h.guaci+(h.line?' '+h.line:''))}</h2>
 <div class="hexagram" role="img" aria-label="${esc(h.name+'六爻卦象')}">${[...h.lines].reverse().map(x=>`<span class="${x?'solid':'broken'}"></span>`).join('')}</div>
 <blockquote>${esc(h.guaci)}</blockquote>${h.line?`<p>${esc(h.line)}</p>`:''}<p>${esc(h.reading)}</p></article>`;
}

function liuyao(ctx){
 const b=ctx.state.birth;
 const date=b?`${b.Y}-${String(b.M).padStart(2,'0')}-${String(b.D).padStart(2,'0')}T12:00:00`:new Date().toISOString().slice(0,19);
 let r;try{r=qiGuaByTime({date});}catch(e){ctx.root.innerHTML='<p class="thin">起卦失败：'+esc(e.message)+'</p>';return;}
 const POS=['初','二','三','四','五','上'];
 ctx.root.innerHTML=`<div class="liuyao-view">
  <h3>六爻纳甲 · 时间起卦</h3>
  <p class="thin">起卦时间 ${esc(r.question_date)} · 本卦 ${esc(r.ben.name)}（${esc(r.ben.palace)}宫·${esc(r.ben.element)}）· 动爻第 ${r.move} 爻 · 世${POS[r.shi]}应${POS[r.ying]} · 变卦 ${esc(r.bian.name)}</p>
  <table><thead><tr><th>六兽</th><th>六亲</th><th>纳甲</th><th>爻位</th></tr></thead><tbody>
  ${r.ben.yao.map(y=>`<tr><td>${esc(y.animal)}</td><td><b>${esc(y.relative)}</b></td><td>${esc(y.gz)}</td><td>${POS[y.pos]}爻${y.pos+1===r.move?' ← 动':''}</td></tr>`).join('')}
  </tbody></table>
  <p class="thin">本卦属${esc(r.ben.palace)}宫，用神六亲按卦宫五行取；日辰${esc(r.question_date)}与爻支六冲处以「冲」标注，主应期。传统术数内容，仅供自我观察参考。</p>
 </div>`;
}
function yi(ctx){
 const id='yijing',s=stateFor(ctx,id,{year:new Date().getFullYear()}),r=s.result;
 ctx.root.innerHTML=`<section id="yijing"><div class="spread"><h1>易经推命</h1><div class="rail">${btn('上一年','data-year="-1"')}${btn(String(s.year),'disabled')}${btn('下一年','data-year="1"')}</div></div>
 <p data-extra-status role="status">${esc(s.error)}</p>
 ${r?.housing?`<article class="card"><h2>阳宅人间道 · ${esc(r.housing.hex.name)}</h2><p>${esc(r.housing.text)}</p><small>${esc(r.housing.method)}</small></article>`:''}${r?hexagram('先天 · 本卦',r.natal)+hexagram('后天 · 变卦',r.changed)+(r.annual?hexagram(r.year+' 流年 · 太岁'+r.annual.taisuibranch+' · '+r.annual.period,r.annual):'<p>'+esc(r.notice)+'</p>')+
 `<article class="card"><h3>天纪取数与元堂</h3>${table(['四柱','天干洛书','地支河图'],r.numbers.rows.map(x=>[x.pillar,x.stem,x.branch.join('、')]))}<p>天数 ${r.numbers.heaven.sum} → ${r.numbers.heaven.number}（${r.numbers.sky}） · 地数 ${r.numbers.earth.sum} → ${r.numbers.earth.number}（${r.numbers.land}）</p><p>${r.numbers.era} · 五数寄${r.numbers.lodging} · ${r.yangSeason?'阳令':'阴令'} · 元堂第${r.natal.origin+1}爻</p>${r.changed.special?'<p>'+esc(r.changed.special)+'</p>':''}</article><p class="thin">${esc(r.method)}</p><article class="card"><h2>六十四卦典籍</h2><label>选择卦<select data-hex>${r.library.map(x=>`<option value="${x.number}" ${x.number===s.hex?'selected':''}>${x.number} · ${esc(x.name)}</option>`).join('')}</select></label><div data-selected-hex></div></article>`:''}</section>`;
 for(const b of ctx.root.querySelectorAll('[data-year]'))b.onclick=()=>{s.year+=+b.dataset.year;load(ctx,id,s,'/api/console/yijing',{birth:ctx.birth,year:s.year});};
 if(r){
  const choose=$('[data-hex]',ctx.root);
  const show=()=>{s.hex=+choose.value;$('[data-selected-hex]',ctx.root).innerHTML=hexagram('卦辞',r.library.find(x=>x.number===s.hex));};
  choose.onchange=show;show();
 }
 if(!r&&!s.pending&&!s.error)load(ctx,id,s,'/api/console/yijing',{birth:ctx.birth,year:s.year});
}
const CAL_EVENTS=['general','contract','open','travel','move','wedding','medical','exam','negotiate','build','pray','burial'];
const CAL_LABELS=Object.fromEntries(Object.entries(CAL_EVENT_META).map(([k,v])=>[k,v.label]));
const signed=value=>(value>0?'+':'−')+Math.abs(value);
// v0.59.0：择日 → 时点盘 → 日程，三步在同一个卡片里走完。
// 卡片仍是「结论在上、证据在下」，新增的只有两件事：岁运背景行，以及可点的时辰格。
function favorChip(favor){
 return favor?`<i data-role="${esc(favor.role)}">${esc(favor.label)}</i>`:'';
}
function suiyunLine(x){
 const sy=x.suiYun;
 if(!sy)return '';
 const parts=[`<b>流年 ${esc(sy.year.gz)}${favorChip(sy.year.favor)}</b>`];
 if(sy.luck)parts.push(`<b>大运 ${esc(sy.luck.gz)}${favorChip(sy.luck.favor)}</b>`);
 const span=sy.luck?`<small>${sy.luck.startYear}–${sy.luck.endYear}</small>`:'';
 return `<p class="cal-sui"><span>岁运</span>${parts.join('')}${span}</p>`;
}
function calendar(ctx){
 const id='calendar',s=stateFor(ctx,id,{date:isoLocal(),days:7,event:'general',sort:'score',excludeClash:false,compare:false,picked:[]}),r=s.result;
 const list=(r?.dates||[]).filter(x=>!s.excludeClash||!x.minus.some(m=>/六冲|相刑|相害|相破|冲本命生肖/.test(m.k)));
 const ordered=[...list].sort(s.sort==='date'?(a,b)=>a.date.localeCompare(b.date):(a,b)=>b.score-a.score||a.date.localeCompare(b.date));
 const byScore=[...list].sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
 const top=byScore[0],basis=r?.basis;
 const picked=new Set(s.picked||[]);
 // 已存日程与已定方案都要在日卡片上出现：择日页不该只给建议，还要看得见「哪些已经定下来了」。
 const planMap=new Map();
 for(const item of ctx.almanacPlans?.()||[]){const list=planMap.get(item.date)||[];list.push(item);planMap.set(item.date,list);}
 const decOf=x=>{try{return ctx.state.profile?decisionAt(ctx.state.profile.id,s.event,x.date):null;}catch{return null;}};
 const basisLine=!r?'':basis
  ?`本命 ${esc(basis.dayMaster)}${esc(basis.use.join('、')?'·喜用 '+basis.use.join('、'):'')}${basis.avoid.length?' · 忌 '+esc(basis.avoid.join('、')):''} · ${esc(basis.source==='调候'?'调候口径（减半）':basis.source==='均衡'?'五行均衡':'扶抑口径')}`
  :'未关联案例：仅按公共黄历与建除取用，选一个案例可得到个性化评分';
 const tags=x=>[...x.plus.slice(0,2),...x.minus.slice(0,2)].map(t=>`<span class="cal-tag ${t.v>0?'up':'down'}">${esc(t.k)} ${signed(t.v)}</span>`).join('');
 const evidence=x=>`<ul class="cal-ev">${[...x.plus,...x.minus].map(t=>`<li class="${t.v>0?'up':'down'}"><span>${esc(t.k)}</span><b>${signed(t.v)}</b><small>${esc(t.why)}</small></li>`).join('')||'<li><span>当日无显著加减项</span></li>'}</ul>`;
 const hourCell=(date,h,isBest)=>`<button type="button" class="cal-hour" role="listitem" data-tier="${h.tier}" data-cal-hour="${date}|${h.branch}"${isBest?' data-best="1"':''} aria-label="${esc(date+' '+h.branch+'时 '+h.range+'，'+h.score+' 分 '+h.tier+'，点开看时点盘')}"><b>${esc(h.branch)}</b><small>${esc(h.range)}</small><span>${h.score}</span></button>`;
 const hours=x=>`<div class="cal-hours" role="list">${x.hours.map(h=>hourCell(x.date,h,x.bestHours.some(b=>b.branch===h.branch))).join('')}</div>`;
 const momentRail=x=>x.bestHours.length
  ?`<div class="cal-moments" role="group" aria-label="推荐时段，点开看时点盘">${x.bestHours.map(h=>`<button type="button" class="cal-moment" data-cal-moment="${x.date}|${h.branch}"><b>${esc(h.branch)}时</b><small>${esc(h.range)}</small><span>${h.score}</span></button>`).join('')}</div>`
  :'<p class="cal-best">当日无明显吉时，宜按事就人</p>';
 const pick=x=>x.bestHours[0]?.branch||'巳';
 // 对比模式只留一个动作：选中/取消。两个出口按钮此时反而抢注意力。
 const actions=x=>s.compare
  ?`<div class="cal-actions"><button type="button" class="cal-act${picked.has(x.date)?' on':''}" data-cal-pick="${x.date}">${picked.has(x.date)?'已选 · 点此取消':'加入对比'}</button></div>`
  :`<div class="cal-actions"><button type="button" class="cal-act primary" data-cal-moment="${x.date}|${pick(x)}">看这一刻的时点盘</button><button type="button" class="cal-act" data-cal-plan="${x.date}|${pick(x)}">存入日程</button></div>`;
 const card=x=>{const plans=planMap.get(x.date)||[],dec=decOf(x);return `<article class="cal-day" data-tier="${x.tier}"${picked.has(x.date)?' data-picked="1"':''}>
 <div class="cal-day-head"><div class="cal-date"><b>${x.date.slice(5)}</b><small>${esc(x.weekday+' · '+x.lunar)}</small></div>
 <div class="cal-gz"><b>${esc(x.gz)}</b><small>${esc(x.zhiXing+'日 · '+x.tianShen+'·'+x.tianShenLuck)}</small></div>
 <div class="cal-score"><b>${x.score}</b><span>${x.rank?'第'+x.rank+' · ':''}${x.tier}</span></div></div>
 <div class="cal-meter" role="img" aria-label="${x.score} 分"><i style="width:${x.score}%"></i></div>
 ${suiyunLine(x)}
 ${plans.length||dec?`<p class="cal-plan">${dec?`<b class="cal-plan-badge">方案 ${esc(dec.plan)}</b>`:''}${plans.map(r=>`<span>${esc(String(r.when).slice(11,16)+' '+String(r.event||'择日'))}</span>`).join('')}</p>`:''}
 <div class="cal-tags">${tags(x)||'<span class="cal-tag neu">无显著加减项</span>'}</div>
 ${momentRail(x)}${actions(x)}
 <details class="cal-detail"><summary>${x.plus.length+x.minus.length} 条评分依据 · 12 时辰可点</summary>
 ${evidence(x)}${hours(x)}
 <p class="cal-yiji">宜 ${esc(x.yi.join('、')||'—')}<br>忌 ${esc(x.ji.join('、')||'—')}</p>
 <p class="cal-sub">吉神 ${esc(x.good.join('、')||'—')} · 凶煞 ${esc(x.bad.join('、')||'—')} · 冲${esc(x.chong)} · 旬空 ${esc(x.xunKong)}${x.tenGod?' · 日干十神 '+esc(x.tenGod):''}</p>
 </details></article>`;};
 ctx.root.innerHTML=`<section id="calendar"><div class="spread"><h1>择日 · 择时</h1><div class="rail">${btn('年运轴','data-cal-agenda')}${btn('日程月历','data-cal-month')}${btn('方案存档','data-cal-book')}${btn('日期与筛选','data-calendar-filter')}</div></div>
 <p class="cal-basis">${basisLine}</p>
 <div class="cal-events" role="group" aria-label="择日事项">${CAL_EVENTS.map(k=>`<button type="button" class="cal-chip" data-cal-event="${k}" aria-pressed="${s.event===k}">${esc(CAL_LABELS[k]||k)}</button>`).join('')}</div>
 ${r?`<div class="cal-summary"><div><b>${esc(r.eventLabel)}</b><small>${esc(s.date)} 起 ${r.dates.length} 天${s.excludeClash?' · 已排除冲刑破害':''}</small></div>
 <div class="cal-summary-top">${top?`<span>最优 ${esc(top.date.slice(5))} ${top.weekday}</span><b>${top.score}</b><small>${esc(top.tier)}</small>`:''}</div></div>
 <div class="cal-sort" role="group" aria-label="排序"><button type="button" data-cal-sort="score" aria-pressed="${s.sort!=='date'}">按分数</button><button type="button" data-cal-sort="date" aria-pressed="${s.sort==='date'}">按日期</button><button type="button" data-cal-compare-mode aria-pressed="${s.compare}">选日对比</button></div>`:''}
 ${s.compare?`<div class="cal-cmpbar"><span>已选 <b>${picked.size}</b>/3 天${picked.size<2?' · 至少两天才能对比':''}</span><div class="rail">${picked.size?btn('清空','data-cal-clear'):''}${btn('并排对比','data-cal-compare class="primary"')}</div></div>`:''}
 <p data-extra-status role="status">${esc(s.error)}</p>
 ${ordered.map(card).join('')}
 ${r&&!list.length?'<p class="empty">当前条件下没有可推荐的日期，试试放宽排除项或延长天数。</p>':''}
 ${basis?.note?`<p class="thin">${esc(basis.note)}</p>`:''}
 ${r?`<p class="thin method">${esc(r.method)}</p>`:''}</section>`;
 for(const chip of ctx.root.querySelectorAll('[data-cal-event]')){
  chip.onclick=()=>{if(s.event===chip.dataset.calEvent)return;s.event=chip.dataset.calEvent;s.result=null;
   load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days,event:s.event,events:CAL_EVENTS});};
 }
 for(const b of ctx.root.querySelectorAll('[data-cal-sort]'))b.onclick=()=>{s.sort=b.dataset.calSort;calendar(ctx);};
 $('[data-cal-compare-mode]',ctx.root)?.addEventListener('click',()=>{
  s.compare=!s.compare;if(!s.compare)s.picked=[];
  if(s.compare&&(s.days??7)<3){s.days=7;s.result=null;calendar(ctx);
   load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days,event:s.event,events:CAL_EVENTS});return;}
  calendar(ctx);
 });
 $('[data-cal-agenda]',ctx.root).onclick=()=>agendaSheet(ctx,s);
 $('[data-cal-month]',ctx.root).onclick=()=>monthSheet(ctx,s);
 $('[data-cal-book]',ctx.root).onclick=()=>bookSheet(ctx,s);
 $('[data-cal-clear]',ctx.root)?.addEventListener('click',()=>{s.picked=[];calendar(ctx);});
 $('[data-cal-compare]',ctx.root)?.addEventListener('click',()=>compareSheet(ctx,s));
 for(const b of ctx.root.querySelectorAll('[data-cal-pick]')){
  b.onclick=()=>{
   const date=b.dataset.calPick,picks=s.picked||[];
   if(picks.includes(date))s.picked=picks.filter(x=>x!==date);
   else if(picks.length>=3)ctx.tell('最多并排三天，先取消一个再选');
   else s.picked=[...picks,date];
   calendar(ctx);
  };
 }
 const dayOf=date=>(r?.dates||[]).find(d=>d.date===date);
 const openHour=(date,branch)=>{const day=dayOf(date);const hour=day?.hours.find(h=>h.branch===branch);if(day&&hour)hourSheet(ctx,s,day,hour);};
 for(const b of ctx.root.querySelectorAll('[data-cal-hour]'))b.onclick=()=>{const [date,branch]=b.dataset.calHour.split('|');openHour(date,branch);};
 for(const b of ctx.root.querySelectorAll('[data-cal-moment]'))b.onclick=()=>{const [date,branch]=b.dataset.calMoment.split('|');openHour(date,branch);};
 for(const b of ctx.root.querySelectorAll('[data-cal-plan]'))b.onclick=()=>{const [date,branch]=b.dataset.calPlan.split('|');const day=dayOf(date);if(day)planSheet(ctx,s,day,branch);};
 $('[data-calendar-filter]',ctx.root).onclick=()=>{
  const dialog=ctx.sheet('toolSheet','择日条件',`<form class="form-grid"><label>起始日期<input type="date" name="date" value="${esc(s.date)}" required></label>
  <label>连续天数<input name="days" type="number" min="1" max="31" value="${s.days??7}" required></label>
  <label class="wide">事项<select name="event">${CAL_EVENTS.map(k=>`<option value="${k}" ${s.event===k?'selected':''}>${esc(CAL_LABELS[k]||k)}</option>`).join('')}</select></label>
  <label class="checks wide"><input type="checkbox" name="exclude" ${s.excludeClash?'checked':''}>排除冲、刑、破、害日</label><button class="primary wide">重新择日</button></form>`);
  $('form',dialog).onsubmit=e=>{
   e.preventDefault();const f=new FormData(e.currentTarget);
   s.date=f.get('date');s.days=+f.get('days');s.event=f.get('event');s.excludeClash=f.has('exclude');s.result=null;s.picked=[];ctx.close(dialog);
   load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days,event:s.event,events:CAL_EVENTS});
  };
 };
 if(!r&&!s.pending&&!s.error)load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days??7,event:s.event||'general',events:CAL_EVENTS});
}

// 并排对比：同一事项下选三天，先看分，再看「为什么差」——差异项才是决策依据，
// 所以共同项只列一次，差异项按影响大小排。
function compareSheet(ctx,s){
 const cands=(s.picked||[]).map(d=>(s.result?.dates||[]).find(x=>x.date===d)).filter(Boolean);
 if(cands.length<2){ctx.tell('至少选两天才能对比');return;}
 const label=s.result?.eventLabel||'择日';
 const pid=ctx.state.profile?.id;
 // 方案字母按对比里的名次给：A 是第一名，避免「方案 A」与「分数最高」两套顺序。
 const letterOf=date=>String.fromCharCode(65+[...cands].sort((a,b)=>(b.byEvent?.[s.event]?.score??b.score)-(a.byEvent?.[s.event]?.score??a.score)).findIndex(x=>x.date===date));
 const attr=(name,fn)=>`<tr><th>${esc(name)}</th>${cands.map(d=>`<td>${fn(d)}</td>`).join('')}</tr>`;
 const base=`<table class="cmp-table"><thead><tr><th></th>${cands.map(d=>`<th>${d.date.slice(5)}</th>`).join('')}</tr></thead><tbody>
 ${attr('干支',d=>`<b>${esc(d.gz)}</b>`)}
 ${attr('分档',d=>`<b class="cmp-${d.tier}">${d.score}</b> ${esc(d.tier)}`)}
 ${attr('建除',d=>esc(d.zhiXing+'日'))}
 ${attr('值神',d=>esc(d.tianShen+'·'+d.tianShenLuck))}
 ${attr('对比事项',d=>{const b=d.byEvent?.[s.event];return b?`${b.score} · ${esc(b.tier)}<small>${b.delta===0?'±0':signed(b.delta)}</small>`:'—';})}
 ${attr('推荐时段',d=>esc(d.bestHours[0]?d.bestHours[0].branch+'时 '+d.bestHours[0].range:'—'))}
 ${attr('冲·旬空',d=>esc((d.chong||'—')+' · '+(d.xunKong||'—')))}
 </tbody></table>`;
 // 12 事项 × 3 天：同一基盘换事项层，所以这张表是「这几天各适合做什么」的横向切片。
 const matrix=`<table class="cmp-table cmp-matrix"><thead><tr><th>事项</th>${cands.map(d=>`<th>${d.date.slice(5)}</th>`).join('')}</tr></thead><tbody>
 ${CAL_EVENTS.map(k=>{
  const vals=cands.map(d=>d.byEvent?.[k]?.score??null);
  const best=Math.max(...vals.filter(v=>v!=null));
  return `<tr${k===s.event?' class="on"':''}><th>${esc(CAL_LABELS[k]||k)}</th>${vals.map(v=>`<td${v===best?' class="best"':''}>${v??'—'}</td>`).join('')}</tr>`;
 }).join('')}</tbody></table>`;
 const maps=cands.map(d=>new Map([...d.plus,...d.minus].map(t=>[t.k,t.v])));
 const keys=[...new Set(cands.flatMap(d=>[...d.plus,...d.minus].map(t=>t.k)))];
 const common=keys.filter(k=>maps.every(m=>m.has(k)));
 const diff=keys.filter(k=>!common.includes(k)).sort((a,b)=>Math.max(...maps.map(m=>Math.abs(m.get(b)??0)))-Math.max(...maps.map(m=>Math.abs(m.get(a)??0))));
 const diffTable=diff.length?`<table class="cmp-table cmp-diff"><thead><tr><th>差异项</th>${cands.map(d=>`<th>${d.date.slice(5)}</th>`).join('')}</tr></thead><tbody>
 ${diff.map(k=>`<tr><th>${esc(k)}</th>${maps.map(m=>{const v=m.get(k);return v==null?'<td class="mut">—</td>':`<td class="${v>0?'up':'down'}">${signed(v)}</td>`;}).join('')}</tr>`).join('')}</tbody></table>`
  :'<p class="thin">这三天在证据层面完全一致，分数差异只来自同一批项的累积。</p>';
 const commonLine=common.length?`<p class="cmp-common">共同项 · ${esc(common.join('、'))}</p>`:'';
 const ranked=[...cands].sort((a,b)=>(b.byEvent?.[s.event]?.score??b.score)-(a.byEvent?.[s.event]?.score??a.score));
 const lead=ranked[0],gap=ranked.length>1?(ranked[0].byEvent?.[s.event]?.score??ranked[0].score)-(ranked[1].byEvent?.[s.event]?.score??ranked[1].score):0;
 const verdict=`<p class="cmp-verdict">按「${esc(label)}」看，<b>${esc(lead.date.slice(5))}</b> 最高${gap>0?`，领先 ${gap} 分`:'（并列）'}；共 ${diff.length} 条证据不同，影响最大的是「${esc(diff[0]||'无')}」。</p>`;
 const d=ctx.sheet('toolSheet',`并排对比 · ${label}`,`${verdict}<div class="cmp-scroll">${base}</div><h3 class="cmp-h">同一件事，这三天各适合做什么</h3><div class="cmp-scroll">${matrix}</div><p class="thin">分值仍是择日同一套公式（本命喜忌＋四柱冲合＋黄历事项＋建除值神＋岁运＋硬忌），只是把「事项层」换成十二件事分别算一遍。</p><h3 class="cmp-h">分数差在哪</h3>${diffTable}${commonLine}
 ${cands.map(x=>{const letter=letterOf(x.date),decided=pid?decisionAt(pid,s.event,x.date):null;
  return `<div class="cal-actions"><button type="button" class="cal-act" data-cmp-open="${x.date}">看 ${x.date.slice(5)} 的时点盘</button><button type="button" class="cal-act" data-cmp-plan="${x.date}">存入日程</button><button type="button" class="cal-act${decided?' on':''}" data-cmp-decide="${x.date}"${decided?' disabled':''}>${decided?'已定为方案 '+esc(decided.plan):'定为方案 '+letter}</button></div>`;}).join('')}
 <p class="thin" data-cmp-note>定为方案会把当时的评分证据一起存进「方案存档」；回看时按定案当时的口径展示，不被后来的算法改动悄悄改写。</p>`);
 for(const b of d.querySelectorAll('[data-cmp-open]'))b.onclick=()=>{
  const day=cands.find(x=>x.date===b.dataset.cmpOpen);const hour=day?.bestHours[0];
  if(!day||!hour)return;ctx.close(d);hourSheet(ctx,s,day,hour);
 };
 for(const b of d.querySelectorAll('[data-cmp-plan]'))b.onclick=()=>{
  const day=cands.find(x=>x.date===b.dataset.cmpPlan);if(!day)return;ctx.close(d);planSheet(ctx,s,day,day.bestHours[0]?.branch||'巳',day.bestHours[0]);
 };
 // 定为方案：只落盘，不改择日结果；分数取该事项在此日的分（与上面的结论一致，不用日总分冒充）。
 for(const b of d.querySelectorAll('[data-cmp-decide]'))b.onclick=()=>{
  const day=cands.find(x=>x.date===b.dataset.cmpDecide);if(!day)return;
  if(!pid){ctx.tell('请先激活一个案例，方案才存得下来');return;}
  const letter=letterOf(day.date),hour=day.bestHours[0]||null;
  try{
   saveDecision({caseId:pid,event:s.event,eventLabel:label,plan:letter,date:day.date,
    hourBranch:hour?.branch||'',clock:hour?.range?hour.range.slice(0,5):'',range:hour?.range||'',
    score:day.byEvent?.[s.event]?.score??day.score,tier:day.byEvent?.[s.event]?.tier??day.tier,gz:day.gz,raw:day.raw,
    evidence:{plus:day.plus,minus:day.minus},
    rivals:cands.map(x=>({date:x.date,score:x.byEvent?.[s.event]?.score??x.score,tier:x.byEvent?.[s.event]?.tier??x.tier,gz:x.gz})),
    method:s.result?.method});
  }catch(e){ctx.tell('方案存档失败：'+e.message);return;}
  b.disabled=true;b.classList.add('on');b.textContent='已定为方案 '+letter;
  const note=d.querySelector('[data-cmp-note]');
  if(note)note.textContent='已定为方案 '+letter+'：'+day.date+' 的证据快照已存入「方案存档」，回看时按当时口径展示。';
  // 列表在弹层背后，不重画就看不到「方案 A」标记；弹层本身不重绘，滚动位置不受影响。
  calendar(ctx);
  ctx.tell('已定为方案 '+letter);
 };
}

// 日程月历（v0.61.0）：把已存下来的择日日程铺到整月里，与流月吉凶同屏。
// 月历只回答两件事：这个月哪几天已经定下来了、这一天为什么是这一天。
const pad2=n=>String(n).padStart(2,'0');
const monthLength=ym=>{const [y,m]=ym.split('-').map(Number);return new Date(Date.UTC(y,m,0)).getUTCDate();};
const monthShift=(ym,delta)=>{const [y,m]=ym.split('-').map(Number);const d=new Date(Date.UTC(y,m-1+delta,1));return d.getUTCFullYear()+'-'+pad2(d.getUTCMonth()+1);};

async function monthSheet(ctx,s,ym){
 const month=ym||String(s.date).slice(0,7),first=month+'-01';
 const d=ctx.sheet('toolSheet',`${month.slice(0,4)} 年 ${Number(month.slice(5))} 月 · 日程月历`,'<p class="thin">正在铺开整月…</p>');
 const body=$('.sheet-body',d);
 let data=null,error='';
 try{data=await ctx.request('/api/console/calendar',{birth:ctx.birth,date:first,days:monthLength(month),event:s.event,events:CAL_EVENTS});}
 catch(e){error=e.message;}
 if(!data){body.innerHTML=`<p class="thin">${esc(error||'无法计算该月')}</p>`;return;}
 const days=data.dates,byDate=new Map(days.map(x=>[x.date,x]));
 const plans=ctx.almanacPlans?.()||[],plansOf=date=>plans.filter(r=>r.date===date);
 const pid=ctx.state.profile?.id,head=days[0];
 // 公历月会跨节气月（如 2026-11 从戊戌换到己亥），所以流月要按实际换月点分段，
 // 不能拿月初那天的月干支当作整月的月。喜忌同理，只作背景。
 const months=[];
 for(const x of days){
  const last=months.at(-1);
  if(!last||last.gz!==x.monthGz)months.push({gz:x.monthGz||'',favor:x.monthFavor,label:x.monthLabel||'',start:x.date,end:x.date,days:0});
  const cur=months.at(-1);cur.end=x.date;cur.days++;
 }
 const monthLine=months.map(m=>`${esc(m.gz)}${favorChip(m.favor)}`).join('<span class="calm-arrow" aria-hidden="true">→</span>');
 const monthNote=months.length>1?`本月跨 ${months.length} 个节气月：${months.map(m=>esc(m.label+' '+m.start.slice(5)+' 起')).join('、')}`:esc(head.monthLabel||'');
 const best=[...days].sort((a,b)=>b.score-a.score)[0],good=days.filter(x=>x.score>=68).length;
 const lead=new Date(Date.parse(first+'T00:00:00Z')).getUTCDay();
 const planTotal=days.reduce((n,x)=>n+plansOf(x.date).length,0);
 const planRow=(date,r)=>`<div class="calm-planrow"><b>${esc(date.slice(5)+' '+String(r.when).slice(11,16))}</b><span>${esc(String(r.event||'择日')+' · '+String(r.tier||'')+' '+(r.score??''))}</span></div>`;
 const detail=date=>{
  const x=byDate.get(date);
  if(!x)return '<p class="thin">这一天不在本月范围内。</p>';
  const ps=plansOf(date),dec=pid?decisionAt(pid,s.event,date):null;
  const items=[...x.plus,...x.minus].sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,5);
  return `<div class="calm-dhead"><div><b>${esc(date.slice(5))} ${esc(x.weekday)} · ${esc(x.gz)}日</b><small>${esc(x.lunar+' · '+x.zhiXing+'日 · '+x.tianShen+'·'+x.tianShenLuck)}</small></div><b class="calm-dscore">${x.score}</b><span class="calm-dtier">${esc(x.tier)}</span></div>
  <p class="cal-sui"><span>流月</span><b>${esc(x.monthGz||'')}${favorChip(x.monthFavor)}</b><small>${esc(x.monthLabel||'')}</small></p>
  <ul class="cal-ev">${items.map(t=>`<li class="${t.v>0?'up':'down'}"><span>${esc(t.k)}</span><b>${signed(t.v)}</b><small>${esc(t.why)}</small></li>`).join('')||'<li><span>当日无显著加减项</span></li>'}</ul>
  ${ps.length?`<div class="calm-planlist">${ps.map(r=>planRow(date,r)).join('')}</div>`:''}
  ${dec?`<p class="calm-decnote">已定方案 ${esc(dec.plan)} · 定于 ${esc(String(dec.at).slice(0,10))} · 当时 ${dec.score??'—'} 分</p>`:''}
  ${date<isoLocal()?`<p class="calm-past">这一天已经过去，只能回看；存入日程只对未来时段开放。</p>`:''}
  <div class="cal-actions"><button type="button" class="cal-act primary" data-calm-open="${date}">看时点盘</button>${date<isoLocal()?'':`<button type="button" class="cal-act" data-calm-plan="${date}">存日程</button>`}<button type="button" class="cal-act" data-calm-jump="${date}">到这一天择日</button></div>`;
 };
 // 月历骨架只画一次：点日期时只换下方详情，不整块重绘（否则滚动位置会被重置）。
 body.innerHTML=`<p class="cal-basis">${esc(data.eventLabel)} · 流月 ${monthLine} <small>${monthNote}</small> · 吉日（≥68）${good} 天 · 最优 ${best?esc(best.date.slice(5))+'（'+best.score+'）':'—'} · 已存日程 ${planTotal} 条</p>
 <p class="cal-agenda-note">流月干支旁的喜／忌只作背景，不参与当天分数；格内数字是该日分数，圆点为已存日程，字母是已定方案。</p>
 <div class="calm-head" aria-hidden="true">${['日','一','二','三','四','五','六'].map(w=>`<span>${w}</span>`).join('')}</div>
 <div class="calm-grid" role="group" aria-label="${esc(month)} 月历">${[...Array(lead)].map(()=>'<span class="calm-blank" aria-hidden="true"></span>').join('')}${days.map(x=>{
  const ps=plansOf(x.date),dec=pid?decisionAt(pid,s.event,x.date):null;
  return `<button type="button" class="calm-day" data-tier="${x.tier}" data-calm-day="${x.date}" aria-pressed="false" aria-label="${esc(x.date+' '+x.weekday+' '+x.score+' 分 '+x.tier+(ps.length?'，已存日程'+ps.length+'条':''))}"><b>${Number(x.date.slice(8))}</b><small>${x.score}</small><span class="calm-marks">${ps.length?'<i class="calm-dot"></i>':''}${dec?`<i class="calm-dec">${esc(dec.plan)}</i>`:''}</span></button>`;}).join('')}</div>
 <p class="calm-legend"><span data-tier="上吉">上吉</span><span data-tier="吉">吉</span><span data-tier="平">平</span><span data-tier="慎">慎</span><span data-tier="避">避</span><small>● 已存日程 · 字母 已定方案</small></p>
 <div data-calm-detail class="calm-detail"><p class="thin">点一天看它的分数、证据与已存日程。</p></div>
 <h3 class="cmp-h">本月已存日程 · ${planTotal} 条</h3>
 <div class="calm-planlist">${planTotal?days.flatMap(x=>plansOf(x.date).map(r=>planRow(x.date,r))).join(''):'<p class="thin">这个月还没有存过日程。在择日卡片上点「存入日程」即可。</p>'}</div>
 <div class="cal-actions"><button type="button" class="cal-act" data-calm-nav="${monthShift(month,-1)}">上一月</button><button type="button" class="cal-act" data-calm-nav="${monthShift(month,1)}">下一月</button><button type="button" class="cal-act primary" data-calm-today>回到 ${esc(String(s.date).slice(5))}</button></div>
 <p class="thin method">流月干支与喜忌来自同一份择日基盘（节气月，年界立春）；月历里的分数与列表里的分数完全一致，不另算一套。</p>`;
 const bindDetail=date=>{
  const x=byDate.get(date),h=x?.bestHours?.[0]?x.hours.find(v=>v.branch===x.bestHours[0].branch):null;
  $('[data-calm-open]',body)?.addEventListener('click',()=>{if(x&&h)hourSheet(ctx,s,x,h);else ctx.tell('这一天没有可推荐的时辰');});
  $('[data-calm-plan]',body)?.addEventListener('click',()=>{if(x)planSheet(ctx,s,x,h?.branch||'巳',h);});
  $('[data-calm-jump]',body)?.addEventListener('click',()=>{
   s.date=date;s.days=1;s.result=null;s.picked=[];ctx.close(d);calendar(ctx);
   load(ctx,'calendar',s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days,event:s.event||'general',events:CAL_EVENTS});
  });
 };
 const select=date=>{
  for(const b of body.querySelectorAll('[data-calm-day]'))b.setAttribute('aria-pressed',String(b.dataset.calmDay===date));
  const box=$('[data-calm-detail]',body);
  if(box){box.innerHTML=detail(date);bindDetail(date);}
 };
 for(const b of body.querySelectorAll('[data-calm-day]'))b.onclick=()=>select(b.dataset.calmDay);
 for(const b of body.querySelectorAll('[data-calm-nav]'))b.onclick=()=>{ctx.close(d);monthSheet(ctx,s,b.dataset.calmNav);};
 $('[data-calm-today]',body).onclick=()=>select(String(s.date));
 // 直接落在列表当前日期上，省一次点击；该日不在本月时保持提示态。
 if(byDate.has(String(s.date)))select(String(s.date));
}

// 方案存档（v0.61.0）：对比后定了 A/B/C，回看时要能复现「当时凭什么定它」。
// 所以每条都带快照证据与当时的候选集，不靠事后重算——重算会把当时的判断依据改写成今天的口径。
function bookSheet(ctx,s){
 const pid=ctx.state.profile?.id;
 if(!pid){ctx.tell('请先激活一个案例，再看方案存档');return;}
 let all=decisionsFor(pid);
 const events=[...new Set(all.map(x=>x.event))];
 let scope=events.includes(s.event)?s.event:(events[0]||null);
 const d=ctx.sheet('toolSheet','方案存档','<div data-book-body></div>');
 const body=$('[data-book-body]',d);
 const paint=()=>{
  const list=all.filter(x=>!scope||x.event===scope).sort((a,b)=>String(b.atUtc||b.at).localeCompare(String(a.atUtc||a.at)));
  body.innerHTML=`${events.length>1?`<div class="cal-events" role="group" aria-label="方案事项">${events.map(k=>`<button type="button" class="cal-chip" data-book-scope="${esc(k)}" aria-pressed="${scope===k}">${esc(CAL_LABELS[k]||k)}</button>`).join('')}</div>`:''}
  ${list.length?list.map(x=>{
   const ev=[...(x.evidence.plus||[]),...(x.evidence.minus||[])].sort((a,b)=>Math.abs(b.v)-Math.abs(a.v));
   const rivals=(x.rivals||[]).length>1?` · 当时候选 ${x.rivals.map(r=>esc(r.date.slice(5))+' '+r.score).join(' / ')}`:'';
   return `<article class="book-card" data-tier="${esc(x.tier)}">
   <div class="book-head"><b class="book-plan">方案 ${esc(x.plan)}</b><div><b>${esc(x.date.slice(5))} · ${esc(x.gz)}日</b><small>${esc(x.eventLabel)} · ${esc(x.tier)} ${x.score??'—'} 分${x.hourBranch?' · '+esc(x.hourBranch+'时')+(x.clock?' '+esc(x.clock):''):''}</small></div></div>
   <p class="book-meta">定于 ${esc(String(x.at||x.atUtc||'').slice(0,16).replace('T',' '))}${rivals}</p>
   <details class="book-ev"><summary>当时的评分证据 · ${ev.length} 条</summary>
    <ul class="cal-ev">${ev.map(t=>`<li class="${t.v>0?'up':'down'}"><span>${esc(t.k)}</span><b>${signed(t.v)}</b><small>${esc(t.why)}</small></li>`).join('')||'<li><span>无显著加减项</span></li>'}</ul>
    <p class="thin">证据是定案当时的快照；引擎日后调整权重或四化口径，也不会改写这条记录。</p>
   </details>
   <div class="cal-actions"><button type="button" class="cal-act primary" data-book-plan="${esc(x.id)}">存入日程</button><button type="button" class="cal-act" data-book-open="${esc(x.id)}">看时点盘</button><button type="button" class="cal-act" data-book-del="${esc(x.id)}">删除</button></div>
  </article>`;}).join(''):'<p class="thin">还没有定过方案。到择日页勾选两三天做「并排对比」，在结论下面点「定为方案 A/B」。</p>'}
  <p class="thin method">方案存档保存在本机、按案例区分；导出备份暂不包含这部分记录。</p>`;
  for(const b of body.querySelectorAll('[data-book-scope]'))b.onclick=()=>{scope=b.dataset.bookScope;paint();};
  for(const b of body.querySelectorAll('[data-book-plan]'))b.onclick=()=>{
   const x=list.find(v=>v.id===b.dataset.bookPlan);if(!x)return;
   const ok=ctx.addPlan({date:x.date,hourBranch:x.hourBranch||'巳',clock:x.clock||ctx.clockForBranch(x.hourBranch||'巳'),eventLabel:x.eventLabel,score:x.score,tier:x.tier,gz:x.gz});
   if(ok){ctx.close(d);calendar(ctx);}
  };
  for(const b of body.querySelectorAll('[data-book-open]'))b.onclick=()=>{
   const x=list.find(v=>v.id===b.dataset.bookOpen);if(!x)return;ctx.close(d);
   ctx.openMomentReport({date:x.date,hourBranch:x.hourBranch||'巳',label:`${x.date} ${x.hourBranch||'巳'}时 · 方案 ${x.plan}`});
  };
  for(const b of body.querySelectorAll('[data-book-del]'))b.onclick=()=>{
   removeDecision(b.dataset.bookDel);
   all=all.filter(v=>v.id!==b.dataset.bookDel);
   paint();
   ctx.tell('方案记录已删除');
  };
 };
 paint();
}

// 年运轴：把择日放回大运流年里。十二流月按节气切，每月给「本事项最优日」与「最宜三事」，
// 点月看全月、点事直接跳到那一天，避免在 365 天里盲翻。
async function agendaSheet(ctx,s){
 const year=Number(s.agendaYear||String(s.date).slice(0,4));
 const d=ctx.sheet('toolSheet',`${year} 年 · 运程轴`,'<p class="thin">正在计算全年十二流月…</p>');
 const body=$('.sheet-body',d);
 let data=null,error='';
 try{data=await ctx.request('/api/console/year-agenda',{birth:ctx.birth,year,events:CAL_EVENTS,event:s.event});}
 catch(e){error=e.message;}
 if(!data){body.innerHTML=`<p class="thin">${esc(error||'无法计算该年的运程轴')}</p>`;return;}
 let sel=data.months.findIndex(m=>m.start<=String(s.date)&&String(s.date)<=m.end);
 if(sel<0)sel=0;
 const paint=()=>{
  const m=data.months[sel];
  const luckTxt=data.luck?`大运 ${esc(data.luck.gz)}${favorChip(data.luck.favor)} ${data.luck.startYear}–${data.luck.endYear}`:'未定位到大运';
  body.innerHTML=`
  <p class="cal-basis">${esc(String(data.year))} 年 ${esc(data.yearGz.gz)}${favorChip(data.yearGz.favor)} · ${luckTxt}</p>
  <p class="cal-agenda-note">按节气切十二流月（立春到立春），分数与择日同一公式，只算到日不到时辰。</p>
  <div class="cal-months" role="group" aria-label="十二流月">${data.months.map((x,i)=>`<button type="button" class="cal-mth" data-agenda-month="${i}" aria-pressed="${i===sel}" data-favor="${x.favor.role}"><b>${esc(x.label)}</b><small>${esc(x.gz)}</small><span>${x.bestFor?x.bestFor.score:'—'}</span></button>`).join('')}</div>
  <div class="cal-mth-detail"><div><b>${esc(m.label)} ${esc(m.gz)}${favorChip(m.favor)}</b><small>${esc(m.start+' → '+m.end)} · ${esc(s.result?.eventLabel||'本事项')}最优 ${m.bestFor?esc(m.bestFor.date.slice(5))+'（'+m.bestFor.score+'）':'无'} · 吉日 ${m.goodFor} 天</small></div></div>
  <h3 class="cmp-h">本月最宜三事</h3>
  <div class="cal-agenda-top">${m.top.map(t=>`<button type="button" class="cal-ago" data-agenda-go="${t.date}"><b>${esc(t.label)}</b><small>${t.date.slice(5)} · ${esc(t.tier)}日</small><span>${t.score}</span></button>`).join('')||'<p class="thin">该月无明显可用之日</p>'}</div>
  <div class="cal-actions"><button type="button" class="cal-act primary" data-agenda-open="${m.start}">看这一整月</button><button type="button" class="cal-act" data-agenda-year="${data.year-1}">上一年</button><button type="button" class="cal-act" data-agenda-year="${data.year+1}">下一年</button></div>
  <p class="thin method">${esc(data.method)}</p>`;
  // 只滚这条横轴自身（不碰祖先滚动容器），否则打开就是「选中格在屏外」。
  const strip=body.querySelector('.cal-months'),on=strip?.querySelector('[aria-pressed="true"]');
  if(strip&&on)strip.scrollLeft=Math.max(0,on.offsetLeft-(strip.clientWidth-on.offsetWidth)/2);
  for(const b of body.querySelectorAll('[data-agenda-month]'))b.onclick=()=>{sel=+b.dataset.agendaMonth;paint();};
  for(const b of body.querySelectorAll('[data-agenda-go]'))b.onclick=()=>jump(b.dataset.agendaGo,7);
  // 按该流月的实际天数取窗：固定 31 天会把下个月的头一天也算进来。
  for(const b of body.querySelectorAll('[data-agenda-open]'))b.onclick=()=>{
   const mm=data.months[sel];
   const n=Math.round((Date.parse(mm.end+'T00:00:00Z')-Date.parse(mm.start+'T00:00:00Z'))/86400000)+1;
   jump(mm.start,Math.min(32,n));
  };
  for(const b of body.querySelectorAll('[data-agenda-year]'))b.onclick=()=>{s.agendaYear=+b.dataset.agendaYear;ctx.close(d);agendaSheet(ctx,s);};
 };
 const jump=(date,days)=>{
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date)))return;
  s.date=date;s.days=days;s.result=null;s.picked=[];ctx.close(d);
  load(ctx,'calendar',s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days,event:s.event||'general',events:CAL_EVENTS});
 };
 paint();
}

// 跨体系择时面板（v0.61.0）：三支各说各的，先给分与档，再给最能解释这一刻的一两条证据。
// 不给「综合分」——三套体系的权重互不承认，相加只会造出一个谁都不认的数字。
function crossBlock(r,hour){
 const side=(key,title)=>{
  const x=r[key];
  if(!x?.ok)return `<article class="xsys-card" data-sys="${key}"><header><b>${esc(title)}</b><span class="xsys-na">不可用</span></header><p class="xsys-line">${esc(x?.note||'该体系未返回结果')}</p></article>`;
  const ev=[...x.plus,...x.minus].sort((a,b)=>Math.abs(b.v)-Math.abs(a.v)).slice(0,4);
  return `<article class="xsys-card" data-sys="${key}" data-tier="${esc(x.tier)}">
   <header><b>${esc(title)}</b><span>${x.score} · ${esc(x.tier)}</span></header>
   <p class="xsys-line">${esc(x.summary)}</p>
   <ul class="cal-ev">${ev.map(t=>`<li class="${t.v>0?'up':'down'}"><span>${esc(t.k)}</span><b>${signed(t.v)}</b></li>`).join('')}</ul>
  </article>`;
 };
 const tiers=[hour.tier,r.ziwei?.tier,r.vedic?.tier].filter(Boolean);
 const good=tiers.filter(t=>t==='上吉'||t==='吉').length,bad=tiers.filter(t=>t==='慎'||t==='避').length;
 const line=`八字 ${esc(hour.tier)}、紫微 ${esc(r.ziwei?.tier||'—')}、印占 ${esc(r.vedic?.tier||'—')}`;
 const conv=good>=2&&!bad?`${line}：${good} 支同向偏吉，这一时辰可以定事。`
  :bad>=2&&!good?`${line}：${bad} 支偏阻，除非必要，另择时辰。`
  :good&&bad?`${line}：${good} 支偏吉、${bad} 支偏阻，方向不一致——以八字为主，另两系点出的代价要认下再定。`
  :`${line}：三支都属中平，可用但不突出，按事项轻重量力安排。`;
 return `<h3 class="cmp-h">其他体系怎么看这一刻</h3>
 <div class="xsys">${side('ziwei','紫微 · 流时')}${side('vedic','印度 · Muhurta')}</div>
 <p class="xsys-conv"><b>同向核对</b>${conv}</p>
 <p class="thin">${esc(r.method||'')}${r.note?' '+esc(r.note):''}</p>`;
}

// 时辰详情：先给这个时辰自己的加减分，再给两条出口——出时点盘 / 存日程。
function hourSheet(ctx,s,day,hour){
 const ev=s.result?.eventLabel||'择日';
 const luckTxt=day.suiYun?.luck?' · 大运 '+esc(day.suiYun.luck.gz):'';
 const d=ctx.sheet('toolSheet',`${day.date} · ${hour.branch}时`,`
 <div class="cal-hr-head"><div><b>${esc(hour.branch)}时</b><small>${esc(hour.range)} · ${esc(hour.time)} · 时值神 ${esc(hour.god)}（${esc(hour.traditional)}）</small></div>
 <div class="cal-hr-score"><b>${hour.score}</b><span>${esc(hour.tier)}</span></div></div>
 <ul class="cal-ev">${[...hour.plus,...hour.minus].map(t=>`<li class="${t.v>0?'up':'down'}"><span>${esc(t.k)}</span><b>${signed(t.v)}</b><small>${esc(t.why)}</small></li>`).join('')||'<li><span>该时辰无显著加减项</span></li>'}</ul>
 <p class="cal-yiji">日课 ${esc(day.gz)} · ${esc(day.zhiXing)}日 · ${esc(day.tianShen)}·${esc(day.tianShenLuck)}${luckTxt} · 流年 ${esc(day.suiYun?.year?.gz||'')}</p>
 <p class="cal-yiji">宜 ${esc(day.yi.join('、')||'—')}<br>忌 ${esc(day.ji.join('、')||'—')}</p>
 <div class="cal-actions"><button type="button" class="cal-act primary" data-hour-open>出这一刻的时点详批</button><button type="button" class="cal-act" data-hour-plan>加入日程提醒</button></div>
 <div class="xsys-host" data-xs role="status"><p class="thin">正在核对紫微流时与印占 Muhurta…</p></div>
 <p class="thin">时点详批会带上大运、流年、流月、流日、流时五层，按这一刻的干支重排，不是重复本命全文。</p>`);
 $('[data-hour-open]',d).onclick=()=>{ctx.close(d);ctx.openMomentReport({date:day.date,hourBranch:hour.branch,label:`${day.date} ${hour.branch}时`});};
 $('[data-hour-plan]',d).onclick=()=>{ctx.close(d);planSheet(ctx,s,day,hour.branch,hour);};
 // 跨体系：紫微与印占各自出结论，只并列不比合分——合成一个总分没有任何一支会承认。
 const host=$('[data-xs]',d);
 if(host){
  if(!ctx.birth||!ctx.state.profile)host.innerHTML='<p class="thin">关联案例后可看紫微与印占侧对这一刻的判断。</p>';
  else ctx.request('/api/console/timing-cross',{birth:ctx.birth,date:day.date,hourBranch:hour.branch,event:s.event||'general',ziweiSchool:ctx.state.settings?.ziweiSchool})
   .then(r=>{if(host.isConnected)host.innerHTML=crossBlock(r,hour);})
   .catch(e=>{if(host.isConnected)host.innerHTML=`<p class="thin">跨体系择时暂不可用：${esc(e.message)}</p>`;});
 }
}
// 存入日程：时间按该时辰中点预填，写入案例提醒（原生通知）与札记，形成可回看的日程。
function planSheet(ctx,s,day,branch,hour){
 if(!ctx.state.profile){ctx.tell('请先激活一个案例，再把择日结果存入日程');return;}
 const clock=hour?.range?hour.range.slice(0,5):ctx.clockForBranch(branch),ev=s.result?.eventLabel||'择日';
 // 从时辰详情进来时，日程要带该时辰的分与档；从卡片进来时才是当日分。
 const score=hour?.score??day.score,tier=hour?.tier??day.tier;
 const d=ctx.sheet('toolSheet','存入案例日程',`
 <form class="form-grid"><label>日期时间<input type="datetime-local" name="when" value="${esc(day.date+'T'+clock)}" min="${esc(day.date+'T00:00')}" max="${esc(day.date+'T23:59')}" required></label>
 <label>事项<input name="event" value="${esc(ev)}" maxlength="24" required></label>
 <p class="wide thin">${esc(day.date)} ${esc(branch)}时 · ${esc(day.gz)}日 · ${esc(tier)} ${score} 分${day.suiYun?.luck?` · 大运 ${esc(day.suiYun.luck.gz)}`:''}</p>
 <button class="primary wide">存入日程</button></form>
 <p class="thin">只保存所选的这一天（分数只对这天成立）；会同时写入「案例空间 · 提醒」与案例札记，已安装原生壳时会排一条本地通知。</p>`);
 $('form',d).onsubmit=e=>{
  e.preventDefault();
  const f=new FormData(e.currentTarget),when=String(f.get('when')||''),date=when.slice(0,10),time=when.slice(11,16);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)){ctx.tell('请选择有效日期');return;}
  // 分数只对所选那天成立：换日就必须回列表重选，否则会存下「某日分数 + 另一日日期」的错配。
  if(date!==day.date){ctx.tell('本次分数只对 '+day.date+' 成立，换日请回列表重新择日');return;}
  const ok=ctx.addPlan({date,hourBranch:branch,clock:time,eventLabel:String(f.get('event')||ev),score,tier,gz:day.gz});
  // 存好后立刻重画择日页：日卡片要显示「已存日程」，否则用户会以为没存上。
  if(ok){ctx.close(d);calendar(ctx);}
 };
}
// v0.76.0：紫微双圈叠加图。外圈=当前案例，内圈=第二人。
// 12 宫按地支（寅起）顺时针排布：宫名标在最外圈、A 主星占外环、B 主星占内环、
// 中心留白。命宫/夫妻宫用深色字 + 连线标记，两人命宫地支相位一眼可辨。
// 注意：此 SVG 不依赖 var(--*)（fill 的 CSS 初始值是黑色，未定义的变量会画成黑块），全部用显式色值。
const ZIWEI_BRANCHES='寅卯辰巳午未申酉戌亥子丑';
function ziweiTwinWheel(m,otherName){
 if(!m?.boards?.a?.length)return '';
 // v0.76.5：半径重排，解决 9/3 点钟方向「宫名×主星」径向相撞、相邻扇区「5 字主星」切向溢出。
 // 关键约束：宫名/主星文字保持水平居中于扇区角平分线，因此
 //   径向间距 > 两者半宽之和（水平方向最坏情况），且 > 两者半高之和（垂直方向最坏情况）。
 // 取 宫名 124 / A 主星 92 / B 主星 52、外圈 138 / 内圈 72 / 芯 32，两组间距 32 与 40，均满足。
 const cx=150,cy=150,R=138,r=72,cR=32,seg=360/12;
 const A='#a8326a',A_KEY='#d4537e',A_SPOUSE='#993556',B='#534ab7',B_KEY='#3c3489',B_SPOUSE='#7f77dd',LINE='rgba(120,86,104,.22)';
 const ang=b=>((ZIWEI_BRANCHES.indexOf(b)+12)%12)*seg-90;
 const at=(rad,a)=>[cx+Math.cos(a*Math.PI/180)*rad,cy+Math.sin(a*Math.PI/180)*rad];
 // v0.76.5 修 bug：原 P() 返回 "x,y" 字符串却被 P(...)[0]/[1] 取字符，导致分割线与命宫连线坐标全是 1~9 的垃圾值。
 // 现在统一改用数组点 pt()，并按「扇区角平分线」的半径落点取值。
 const pt=(rad,a)=>at(rad,a);
 const num=v=>v.toFixed(1);
 const midOf=b=>ang(b)+seg/2;
 const wedge=b=>`M ${pt(R,ang(b)).map(num).join(',')} A ${R} ${R} 0 0 1 ${pt(R,ang(b)+seg).map(num).join(',')} L ${pt(r,ang(b)+seg).map(num).join(',')} A ${r} ${r} 0 0 0 ${pt(r,ang(b)).map(num).join(',')} Z`;
 // 主星拆成「每行一颗」，5 字串宽 43 降到 2 字串宽 17，扇区弦宽即可容纳；超过两颗只留两颗并标省略。
 const starLines=(p,rad,color,weight)=>{
  let arr=(p?.majors||[]).filter(Boolean).slice(0,2);
  if(!arr.length)arr=['空宫'];
  else if((p.majors||[]).length>2)arr[arr.length-1]+='…';
  const [x,y]=pt(rad,midOf(p.branch));
  // 行距 11.3 > 8.5px 字实际 bbox 高 11.2，避免同一宫两行主星上下压字。
  const step=11.3,top=(arr.length-1)/2;
  return arr.map((s,i)=>`<text x="${num(x)}" y="${num(y+(i-top)*step)}" text-anchor="middle" dominant-baseline="central" style="font-size:8.5px;${weight?'font-weight:600;':''}fill:${color}">${esc(s)}</text>`).join('');
 };
 // 两命宫地支相位：0 同宫、6 对宫、4/8 三合、1/5/7/11 六合
 const idx=b=>(ZIWEI_BRANCHES.indexOf(b)+12)%12;
 const relOf=(a,b)=>{const d=Math.abs(idx(a)-idx(b))%12,k=d>6?12-d:d;return k===0?'同宫':k===6?'对宫':[4,8].includes(k)?'三合':[1,5,7,11].includes(k)?'六合':'无';};
 const aLife=m.boards.a.find(p=>p.life)?.branch,bLifeBranch=m.boards.b.find(p=>p.life)?.branch;
 const aSpouse=m.boards.a.find(p=>p.spouse)?.branch,bSpouseBranch=m.boards.b.find(p=>p.spouse)?.branch;
 const rel=aLife&&bLifeBranch?relOf(aLife,bLifeBranch):'无';
 // v0.76.5：改用「沿圆环的弧」表示两宫关系，取代原来横穿盘面的长弦（长弦会划过一片空扇区，像划痕）。
 // 命宫弧画在两带交界的 r 上（实线），夫妻宫弧画在外缘 R-4 上（虚线），两者都不穿过任何文字。
 const arc=(rad,from,to,color,dash,width)=>{
  if(!from||!to)return '';
  let a1=midOf(from),a2=midOf(to);
  let d=((a2-a1)%360+360)%360;
  if(d>180){const t=a1;a1=a2;a2=t;d=360-d;}
  const [x1,y1]=pt(rad,a1),[x2,y2]=pt(rad,a1+d);
  if(d<0.5){const [x,y]=pt(rad,a1);return `<circle cx="${num(x)}" cy="${num(y)}" r="4" fill="none" stroke="${color}" stroke-width="1.4"/>`;}
  return `<path d="M ${num(x1)},${num(y1)} A ${rad} ${rad} 0 ${d>180?1:0} 1 ${num(x2)},${num(y2)}" fill="none" stroke="${color}" stroke-width="${width||1.6}" ${dash?'stroke-dasharray="4 3"':''}/>`;
 };
 // 内圈 12 宫分界（cR→r 的短径向线）：让内圈也有明确的扇区感，而不是一圈漂浮文字。
 const innerRadial=m.boards.a.map(p=>{
  const a=ang(p.branch),[x1,y1]=pt(cR,a),[x2,y2]=pt(r,a);
  return `<line x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}" stroke="${LINE}" stroke-width="0.5"/>`;
 }).join('');
 const lifeLink=arc(r,aLife,bLifeBranch,rel==='同宫'?'rgba(212,83,126,.75)':'rgba(212,83,126,.55)',false,1.8);
 const spouseLink=arc(R-4,aSpouse,bSpouseBranch,'rgba(153,53,86,.38)',true,1.2);
 const wedgeHTML=m.boards.a.map(p=>`<path d="${wedge(p.branch)}" fill="${p.life?'rgba(244,192,209,.46)':p.spouse?'rgba(247,226,232,.44)':'rgba(255,255,255,.62)'}" stroke="${LINE}" stroke-width="0.5"/>`).join('');
 // 扇区分割线由 wedge 的 stroke 提供，原 radial() 生成的 12 条线是重复且有坐标 bug，已整体移除。
 const cells=m.boards.a.map(p=>{
  const bm=m.boards.b.find(x=>x.branch===p.branch);
  const [nx,ny]=pt(124,midOf(p.branch));
  const nameTxt=`<text x="${num(nx)}" y="${num(ny)}" text-anchor="middle" dominant-baseline="central" style="font-size:9px;font-weight:600;fill:rgba(120,86,104,.72)">${esc(ZIWEI_BRANCHES.indexOf(p.branch)+1+' '+p.name)}</text>`;
  return nameTxt
   +starLines(p,92,p.life?A_KEY:p.spouse?A_SPOUSE:A,p.life||p.spouse)
   +starLines(bm,52,bm?.life?B_KEY:bm?.spouse?B_SPOUSE:B,bm?.life||bm?.spouse);
 }).join('');
 const otherLbl=String(otherName||'第二人').slice(0,8);
 return `<div class="zi-twin-wrap"><svg viewBox="0 0 300 320" role="img" aria-label="紫微双圈叠加图" style="width:100%;max-width:340px;height:auto;display:block;margin:0 auto">
  <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${LINE}" stroke-width="0.8"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${LINE}" stroke-width="0.8"/>
  <circle cx="${cx}" cy="${cy}" r="${cR}" fill="#fffafc" stroke="${LINE}" stroke-width="0.8"/>
  ${wedgeHTML}${innerRadial}${lifeLink}${spouseLink}${cells}
  <text x="${cx}" y="${cy-7}" text-anchor="middle" dominant-baseline="central" style="font-size:11px;font-weight:600;fill:#4a4541">双人</text>
  <text x="${cx}" y="${cy+8}" text-anchor="middle" dominant-baseline="central" style="font-size:8px;fill:#8a7f76">同宫对照</text>
  <text x="95" y="304" text-anchor="middle" dominant-baseline="central" style="font-size:9.5px;fill:${A}">● 当前案例 · 外环</text>
  <text x="215" y="304" text-anchor="middle" dominant-baseline="central" style="font-size:9.5px;fill:${B}">● ${esc(otherLbl)} · 内环</text>
 </svg><p class="thin">外环 ${esc(aLife||'—')} 宫为当前案例命宫，内环 ${esc(bLifeBranch||'—')} 宫为第二人命宫；两人命宫按 ${esc(rel)} 相对。粉色弧连两人命宫（沿内圈），虚线弧连夫妻宫（沿外圈）。</p></div>`;
}
// v0.75.0：第二人允许两种来源——案例库里的案例，或一次性输入的生辰（s.otherInline）。
// 后者自带 birth 对象，直接送进接口，不用再走 normalized()。
const pairBirth=(ctx,other)=>other?.birth||ctx.normalized(other);
function calculatePair(ctx,s,other){
 s.other=other.id;s.result=null;s.error='';
 load(ctx,'synastry',s,'/api/synastry/chart',{a:ctx.birth,b:pairBirth(ctx,other),mode:s.mode||'synastry'});
}
function synastry(ctx){
 const id='synastry',s=stateFor(ctx,id,{mode:'synastry',aspects:{filter:'main',expanded:false},kootaDir:'forward',kootaOpen:false}),r=s.result;
 s.mode??='synastry';s.aspects??={filter:'main',expanded:false};s.kootaDir??='forward';s.kootaOpen??=false;
 const self=ctx.state.profile;
 if(!self){ctx.root.innerHTML='<section><h1>双人合盘</h1><p class="empty">请先排出第一个人的本命盘，再来做合盘。</p></section>';return;}
 const cases=ctx.state.cases.filter(c=>c.id!==self.id);
 const other=cases.find(c=>c.id===s.other)||(s.otherInline?.birth?{...s.otherInline,id:s.otherInline.id||'inline'}:null);
 ctx.root.innerHTML=`<section><div class="spread"><h1>双人合盘</h1>${btn(other?'更换第二人':'选择第二人','data-select-other')}</div>
 <div class="pair-mode-rail" aria-label="双人合盘盘类">${[['synastry','比较盘 Synastry'],['composite','组合中点盘 Composite'],['davison','戴维森中点 Davison']].map(([id,label])=>btn(label,`data-pair-mode="${id}" aria-pressed="${s.mode===id}"`)).join('')}</div>
 <p>${esc(self?.name||'当前案例')} × ${esc(other?.name||'待选择')}</p><p data-extra-status role="status">${esc(s.error)}</p>
 ${r?.composite?`<article class="card liquid-glass"><h2>组合中点盘</h2><div class="wheel-stage">${btn('ASC 复位','class="asc-reset" data-asc-reset')}${wheel(r.composite)}<div class="wheel-focus-card" data-wheel-card role="status" hidden></div></div><p class="thin">${esc(r.composite.method)}</p>${r.composite.ambiguity.map(x=>`<p>${esc(x)}</p>`).join('')}</article><article class="card pair-reading"><h2>关系本质 · 共同主题</h2>${r.composite.readings.map(x=>`<h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>`).join('')}</article><article class="card"><h2>组合星体与位置</h2>${planetList(r.composite.chart.planets)}</article><article class="card"><h2>组合核心相位</h2>${aspectBrowser(r.composite,s.aspects)}</article>`:''}
 ${s.mode==='davison'&&r?.western?.chart?`<article class="card liquid-glass"><h2>戴维森中点盘（Davison）</h2><p class="thin">取两人出生时刻的 UTC 中点，经纬度取平均，得到一段「关系本身的时间与地点」，以此排出中点盘。${esc(r.limitations||'')}</p><article class="card"><h2>中点星体与位置</h2>${planetList(r.western.chart.planets)}</article><article class="card"><h2>中点盘相位</h2>${table(['星体','相位','容许度'],r.western.chart.aspects.map(x=>[x.a+' · '+x.b,x.type,x.orb.toFixed(2)+'°']))}</article></article>`:''}
 ${r?`<article class="card"><h2>契合度 ${r.fit.percent}%</h2>${r.fit.insights.map(i=>`<p><b>${esc(i.name)}</b> · ${esc(i.text)}</p>`).join('')}<small>印度八项合盘双向平均；此分数不代表组合盘评分 · 传统参考</small></article>
 ${r.mangal?.ok?`<article class="card"><h2>火星煞 · Mangal Dosh</h2>${r.mangal.level==='calm'?'<p class="calm">双方火星均未落 1/4/7/8/12 宫，无火星煞之象。</p>':'<p>'+esc(r.mangal.a.text)+'</p><p>'+esc(r.mangal.b.text)+'</p>'}<p>${esc(r.mangal.text)}</p><small>${esc(r.mangal.method)}</small></article>`:''}
 ${r.baziMatch?.items?`<article class="card"><h2>八字合婚证据（非分数）</h2>${r.baziMatch.items.map(x=>`<p><b>${esc(x.name)}</b> · ${x.level==='support'?'助力':x.level==='challenge'?'需磨合':'中性'} · ${esc(x.text)}</p>`).join('')}<small>${esc(r.baziMatch.method)}</small></article>`:''}
 ${r.ziweiMatch?.ok?`<article class="card"><h2>紫微合盘 · 命宫与夫妻宫互参</h2>${ziweiTwinWheel(r.ziweiMatch,other?other.name:'第二人')}${r.ziweiMatch.items.map(x=>`<p><b>${esc(x.name)}</b> · ${esc(x.text)}</p>`).join('')}<small>${esc(r.ziweiMatch.method)}</small></article>`:''}
 <article class="card"><h2>八字跨盘干支</h2>${table(['关系','干支','双方柱位'],r.crossRelations.map(x=>[x.type,x.pattern,x.pillars.join('／')]))}</article>
 ${(s.mode==='synastry'||s.mode==='davison')?`<article class="card"><h2>跨盘主要相位</h2>${table(['当前案例','第二人','相位','容许度'],[...r.western.interAspects].sort((a,b)=>a.orb-b.orb).slice(0,s.showPairAspects?undefined:12).map(x=>[x.a,x.b,x.type,x.orb.toFixed(2)+'°']))}${r.western.interAspects.length>12?btn(s.showPairAspects?'收起 ▴':'查看完整 '+r.western.interAspects.length+' 条相位明细 ▾','data-pair-expand class="aspect-toggle"'):''}</article>`:''}
 ${r.vedic.koota?(()=>{const kt=(r.fit.kootaBoth?.[s.kootaDir])||{total:r.vedic.koota.total,max:r.vedic.koota.max,items:r.vedic.koota.items,percent:r.vedic.koota.percent,label:'当前案例 × 第二人'};const shown=kt.items.filter(x=>x.score<x.max/2).slice(0,4);const low=kt.items.filter(x=>x.score<x.max/2).length;const rows=s.kootaOpen?kt.items:shown;return `<article class="card"><h2>印度八项合婚 · ${kt.total}/${kt.max}（${kt.percent}%）</h2>
 ${r.fit.kootaBoth?`<div class="pair-mode-rail" aria-label="八科方向">${[['forward',(r.fit.kootaBoth.forward.label)+' · '+r.fit.kootaBoth.forward.percent+'%'],['reverse',(r.fit.kootaBoth.reverse.label)+' · '+r.fit.kootaBoth.reverse.percent+'%']].map(([d,l])=>btn(l,`data-koota-dir="${d}" aria-pressed="${s.kootaDir===d}"`)).join('')}</div>`:''}
 ${s.kootaOpen?table(['项目','得分','依据'],rows.map(x=>[({varna:'Varna',vashya:'Vashya',tara:'Tara',yoni:'Yoni',maitri:'Graha Maitri',gana:'Gana',bhakoot:'Bhakoot',nadi:'Nadi'}[x.key])+' '+x.zh,x.score+'/'+x.max,x.note])):(rows.length?`<div class="stack">${rows.map(x=>`<p><b>${({varna:'Varna',vashya:'Vashya',tara:'Tara',yoni:'Yoni',maitri:'Graha Maitri',gana:'Gana',bhakoot:'Bhakoot',nadi:'Nadi'}[x.key])} ${esc(x.zh)}</b> · ${x.score}/${x.max} · ${esc(x.note)}</p>`).join('')}</div>`:'<p>八科相对均衡，无明显偏低项。</p>')}
 ${low>0&&!s.kootaOpen?btn('展开全部 '+kt.items.length+' 科（含 '+low+' 科偏低）▾','data-koota-toggle'):''}${s.kootaOpen?btn('收起 ▴','data-koota-toggle'):''}
 <p>${esc(kt.guidance||'各项分数相对均衡，仍需重视双方的实际需求。')}</p><small>${esc(r.vedic.koota.note)}</small></article>`;})():''}`:''}</section>`;
 for(const b of ctx.root.querySelectorAll('[data-pair-mode]'))b.onclick=()=>{if(s.mode===b.dataset.pairMode)return;s.mode=b.dataset.pairMode;s.result=null;s.aspects={filter:'main',expanded:false};if(other)calculatePair(ctx,s,other);synastry(ctx);};
 const expand=$('[data-pair-expand]',ctx.root);if(expand)expand.onclick=()=>{s.showPairAspects=!s.showPairAspects;synastry(ctx);};
 const kootaToggle=$('[data-koota-toggle]',ctx.root);if(kootaToggle)kootaToggle.onclick=()=>{s.kootaOpen=!s.kootaOpen;synastry(ctx);};
 for(const b of ctx.root.querySelectorAll('[data-koota-dir]'))b.onclick=()=>{if(s.kootaDir===b.dataset.kootaDir)return;s.kootaDir=b.dataset.kootaDir;synastry(ctx);};
 if(r?.composite){
  bindAspectBrowser(ctx.root,r.composite,s.aspects);
  const stage=$('.wheel-stage',ctx.root),card=$('[data-wheel-card]',stage);
  bindWheel(stage,s,key=>{const p=r.composite.chart.planets.find(p=>'inner-'+p.key===key);card.hidden=!p;card.innerHTML=p?`<b>${esc(p.symbol+' '+p.name)}</b><span>${esc(p.sign)} · 第${p.house}宫</span>`:'';});
 }
 $('[data-select-other]',ctx.root).onclick=()=>{
  const d=ctx.sheet('toolSheet','选择第二人',`<div class="stack">${cases.map(c=>btn(c.name,`data-other="${esc(c.id)}"`)).join('')||'<p class="muted">案例库里还没有第二个人，直接用下面的「输入生辰」即可。</p>'}</div>
  <div class="tool-grid">${btn('＋ 直接输入生辰','class="primary" data-other-inline')}</div>
  <p class="thin">输入的生辰只用于这次合盘，不会写进案例库；之后想复用可以再存成案例。</p>`);
  for(const b of d.querySelectorAll('[data-other]'))b.onclick=()=>{
   const p=cases.find(c=>c.id===b.dataset.other);
   ctx.close(d);calculatePair(ctx,s,p);
  };
  // 合盘不该强迫用户先回案例页建人：这里直接开一张生辰表单，算完就回传。
  $('[data-other-inline]',d).onclick=()=>{
   ctx.close(d);
   ctx.birthSheet(null,{onBirth:(profile,birth)=>{
    const inline={id:'inline',name:profile.name,birth,fields:profile.fields};
    s.otherInline=inline;s.result=null;s.error='';
    calculatePair(ctx,s,inline);
   }});
  };
 };
 if(other&&!r&&!s.pending&&!s.error)calculatePair(ctx,s,other);
}
export function extraView(ctx){({qizheng:qi,yijing:yi,calendar,synastry,liuyao})[ctx.state.system]?.(ctx);}
