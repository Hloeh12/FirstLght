import {wheel,planetList} from './western.js';
import {aspectBrowser,bindAspectBrowser} from './aspects.js';
import {bindWheel} from './wheel-gesture.js';
import {$,btn,esc,term,table,isoLocal} from './ui.js';
import {EVENTS as CAL_EVENT_META} from '../../src/almanac.mjs';

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
 const id='calendar',s=stateFor(ctx,id,{date:isoLocal(),days:7,event:'general',sort:'score',excludeClash:false}),r=s.result;
 const list=(r?.dates||[]).filter(x=>!s.excludeClash||!x.minus.some(m=>/六冲|相刑|相害|相破|冲本命生肖/.test(m.k)));
 const ordered=[...list].sort(s.sort==='date'?(a,b)=>a.date.localeCompare(b.date):(a,b)=>b.score-a.score||a.date.localeCompare(b.date));
 const byScore=[...list].sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));
 const top=byScore[0],basis=r?.basis;
 const basisLine=!r?'':basis
  ?`本命 ${esc(basis.dayMaster)}${esc(basis.use.join('、')?'·喜用 '+basis.use.join('、'):'')}${basis.avoid.length?' · 忌 '+esc(basis.avoid.join('、')):''} · ${esc(basis.source==='调候'?'调候口径（减半）':basis.source==='均衡'?'五行均衡':'扶抑口径')}`
  :'未关联案例：仅按公共黄历与建除取用，选一个案例可得到个性化评分';
 const tags=x=>[...x.plus.slice(0,2),...x.minus.slice(0,2)].map(t=>`<span class="cal-tag ${t.v>0?'up':'down'}">${esc(t.k)} ${signed(t.v)}</span>`).join('');
 const evidence=x=>`<ul class="cal-ev">${[...x.plus,...x.minus].map(t=>`<li class="${t.v>0?'up':'down'}"><span>${esc(t.k)}</span><b>${signed(t.v)}</b><small>${esc(t.why)}</small></li>`).join('')||'<li><span>当日无显著加减项</span></li>'}</ul>`;
 const hourCell=(date,h,isBest)=>`<button type="button" class="cal-hour" role="listitem" data-tier="${h.tier}" data-cal-hour="${date}|${h.branch}"${isBest?' data-best="1"':''} aria-label="${esc(date+' '+h.branch+'时 '+h.range+'，'+h.score+' 分 '+h.tier+'，点开看时点盘')}"><b>${esc(h.branch)}</b><small>${esc(h.range)}</small><span>${h.score}</span></button>`;
 const hours=x=>`<div class="cal-hours" role="list">${x.hours.map(h=>hourCell(x.date,h,x.bestHours.some(b=>b.branch===h.branch))).join('')}</div>`;
 const momentRail=x=>x.bestHours.length
  ?`<div class="cal-moments" role="group" aria-label="推荐时段，点开看该时辰时点盘">${x.bestHours.map(h=>`<button type="button" class="cal-moment" data-cal-moment="${x.date}|${h.branch}"><b>${esc(h.branch)}时</b><small>${esc(h.range)}</small><span>${h.score}</span></button>`).join('')}</div>`
  :'<p class="cal-best">当日无明显吉时，宜按事就人</p>';
 const pick=x=>x.bestHours[0]?.branch||'巳';
 const actions=x=>`<div class="cal-actions"><button type="button" class="cal-act primary" data-cal-moment="${x.date}|${pick(x)}">看这一刻的时点盘</button><button type="button" class="cal-act" data-cal-plan="${x.date}|${pick(x)}">存入日程</button></div>`;
 const card=x=>`<article class="cal-day" data-tier="${x.tier}">
 <div class="cal-day-head"><div class="cal-date"><b>${x.date.slice(5)}</b><small>${esc(x.weekday+' · '+x.lunar)}</small></div>
 <div class="cal-gz"><b>${esc(x.gz)}</b><small>${esc(x.zhiXing+'日 · '+x.tianShen+'·'+x.tianShenLuck)}</small></div>
 <div class="cal-score"><b>${x.score}</b><span>${x.rank?'第'+x.rank+' · ':''}${x.tier}</span></div></div>
 <div class="cal-meter" role="img" aria-label="${x.score} 分"><i style="width:${x.score}%"></i></div>
 ${suiyunLine(x)}
 <div class="cal-tags">${tags(x)||'<span class="cal-tag neu">无显著加减项</span>'}</div>
 ${momentRail(x)}${actions(x)}
 <details class="cal-detail"><summary>${x.plus.length+x.minus.length} 条评分依据 · 12 时辰可点</summary>
 ${evidence(x)}${hours(x)}
 <p class="cal-yiji">宜 ${esc(x.yi.join('、')||'—')}<br>忌 ${esc(x.ji.join('、')||'—')}</p>
 <p class="cal-sub">吉神 ${esc(x.good.join('、')||'—')} · 凶煞 ${esc(x.bad.join('、')||'—')} · 冲${esc(x.chong)} · 旬空 ${esc(x.xunKong)}${x.tenGod?' · 日干十神 '+esc(x.tenGod):''}</p>
 </details></article>`;
 ctx.root.innerHTML=`<section id="calendar"><div class="spread"><h1>择日 · 择时</h1>${btn('日期与筛选','data-calendar-filter')}</div>
 <p class="cal-basis">${basisLine}</p>
 <div class="cal-events" role="group" aria-label="择日事项">${CAL_EVENTS.map(k=>`<button type="button" class="cal-chip" data-cal-event="${k}" aria-pressed="${s.event===k}">${esc(CAL_LABELS[k]||k)}</button>`).join('')}</div>
 ${r?`<div class="cal-summary"><div><b>${esc(r.eventLabel)}</b><small>${esc(s.date)} 起 ${r.dates.length} 天${s.excludeClash?' · 已排除冲刑破害':''}</small></div>
 <div class="cal-summary-top">${top?`<span>最优 ${esc(top.date.slice(5))} ${top.weekday}</span><b>${top.score}</b><small>${esc(top.tier)}</small>`:''}</div></div>
 <div class="cal-sort" role="group" aria-label="排序"><button type="button" data-cal-sort="score" aria-pressed="${s.sort!=='date'}">按分数</button><button type="button" data-cal-sort="date" aria-pressed="${s.sort==='date'}">按日期</button></div>`:''}
 <p data-extra-status role="status">${esc(s.error)}</p>
 ${ordered.map(card).join('')}
 ${r&&!list.length?'<p class="empty">当前条件下没有可推荐的日期，试试放宽排除项或延长天数。</p>':''}
 ${basis?.note?`<p class="thin">${esc(basis.note)}</p>`:''}
 ${r?`<p class="thin method">${esc(r.method)}</p>`:''}</section>`;
 for(const chip of ctx.root.querySelectorAll('[data-cal-event]')){
  chip.onclick=()=>{if(s.event===chip.dataset.calEvent)return;s.event=chip.dataset.calEvent;s.result=null;
   load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days,event:s.event});};
 }
 for(const b of ctx.root.querySelectorAll('[data-cal-sort]'))b.onclick=()=>{s.sort=b.dataset.calSort;calendar(ctx);};
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
   s.date=f.get('date');s.days=+f.get('days');s.event=f.get('event');s.excludeClash=f.has('exclude');s.result=null;ctx.close(dialog);
   load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days,event:s.event});
  };
 };
 if(!r&&!s.pending&&!s.error)load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days??7,event:s.event||'general'});
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
 <p class="thin">时点详批会带上大运、流年、流月、流日、流时五层，按这一刻的干支重排，不是重复本命全文。</p>`);
 $('[data-hour-open]',d).onclick=()=>{ctx.close(d);ctx.openMomentReport({date:day.date,hourBranch:hour.branch,label:`${day.date} ${hour.branch}时`});};
 $('[data-hour-plan]',d).onclick=()=>{ctx.close(d);planSheet(ctx,s,day,hour.branch,hour);};
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
  if(ok)ctx.close(d);
 };
}
function calculatePair(ctx,s,other){
 s.other=other.id;s.result=null;s.error='';
 load(ctx,'synastry',s,'/api/synastry/chart',{a:ctx.birth,b:ctx.normalized(other),mode:s.mode||'synastry'});
}
function synastry(ctx){
 const id='synastry',s=stateFor(ctx,id,{mode:'synastry',aspects:{filter:'main',expanded:false}}),r=s.result;
 s.mode??='synastry';s.aspects??={filter:'main',expanded:false};
 const cases=ctx.state.cases.filter(c=>c.id!==ctx.state.profile.id);
 const other=cases.find(c=>c.id===s.other);
 ctx.root.innerHTML=`<section><div class="spread"><h1>双人合盘</h1>${btn(other?'更换第二人':'选择第二人','data-select-other')}</div>
 <div class="pair-mode-rail" aria-label="双人合盘盘类">${[['synastry','比较盘 Synastry'],['composite','组合中点盘 Composite']].map(([id,label])=>btn(label,`data-pair-mode="${id}" aria-pressed="${s.mode===id}"`)).join('')}</div>
 <p>${esc(ctx.state.profile.name)} × ${esc(other?.name||'待选择')}</p><p data-extra-status role="status">${esc(s.error)}</p>
 ${r?.composite?`<article class="card liquid-glass"><h2>组合中点盘</h2><div class="wheel-stage">${btn('ASC 复位','class="asc-reset" data-asc-reset')}${wheel(r.composite)}<div class="wheel-focus-card" data-wheel-card role="status" hidden></div></div><p class="thin">${esc(r.composite.method)}</p>${r.composite.ambiguity.map(x=>`<p>${esc(x)}</p>`).join('')}</article><article class="card pair-reading"><h2>关系本质 · 共同主题</h2>${r.composite.readings.map(x=>`<h3>${esc(x.title)}</h3><p>${esc(x.text)}</p>`).join('')}</article><article class="card"><h2>组合星体与位置</h2>${planetList(r.composite.chart.planets)}</article><article class="card"><h2>组合核心相位</h2>${aspectBrowser(r.composite,s.aspects)}</article>`:''}
 ${r?`<article class="card"><h2>契合度 ${r.fit.percent}%</h2>${r.fit.insights.map(i=>`<p><b>${esc(i.name)}</b> · ${esc(i.text)}</p>`).join('')}<small>印度八项合盘双向平均；此分数不代表组合盘评分 · 传统参考</small></article>
 ${r.baziMatch?.items?`<article class="card"><h2>八字合婚证据（非分数）</h2>${r.baziMatch.items.map(x=>`<p><b>${esc(x.name)}</b> · ${x.level==='support'?'助力':x.level==='challenge'?'需磨合':'中性'} · ${esc(x.text)}</p>`).join('')}<small>${esc(r.baziMatch.method)}</small></article>`:''}
 ${r.ziweiMatch?.ok?`<article class="card"><h2>紫微合盘 · 命宫与夫妻宫互参</h2>${r.ziweiMatch.items.map(x=>`<p><b>${esc(x.name)}</b> · ${esc(x.text)}</p>`).join('')}<small>${esc(r.ziweiMatch.method)}</small></article>`:''}
 <article class="card"><h2>八字跨盘干支</h2>${table(['关系','干支','双方柱位'],r.crossRelations.map(x=>[x.type,x.pattern,x.pillars.join('／')]))}</article>
 ${s.mode==='synastry'?`<article class="card"><h2>跨盘主要相位</h2>${table(['当前案例','第二人','相位','容许度'],[...r.western.interAspects].sort((a,b)=>a.orb-b.orb).slice(0,s.showPairAspects?undefined:12).map(x=>[x.a,x.b,x.type,x.orb.toFixed(2)+'°']))}${r.western.interAspects.length>12?btn(s.showPairAspects?'收起 ▴':'查看完整 '+r.western.interAspects.length+' 条相位明细 ▾','data-pair-expand class="aspect-toggle"'):''}</article>`:''}
 ${r.vedic.koota?`<article class="card"><h2>印度八项合婚（当前方向） · ${r.vedic.koota.total}/${r.vedic.koota.max}</h2>${table(['项目','得分','依据'],r.vedic.koota.items.map(x=>[({varna:'Varna',vashya:'Vashya',tara:'Tara',yoni:'Yoni',maitri:'Graha Maitri',gana:'Gana',bhakoot:'Bhakoot',nadi:'Nadi'}[x.key])+' '+x.zh,x.score+'/'+x.max,x.note]))}<p>综合得分率 ${r.vedic.koota.percent}%</p><p>${esc(r.vedic.koota.guidance||'各项分数相对均衡，仍需重视双方的实际需求。')}</p><small>${esc(r.vedic.koota.note)}</small></article>`:''}`:''}</section>`;
 for(const b of ctx.root.querySelectorAll('[data-pair-mode]'))b.onclick=()=>{if(s.mode===b.dataset.pairMode)return;s.mode=b.dataset.pairMode;s.result=null;s.aspects={filter:'main',expanded:false};if(other)calculatePair(ctx,s,other);synastry(ctx);};
 const expand=$('[data-pair-expand]',ctx.root);if(expand)expand.onclick=()=>{s.showPairAspects=!s.showPairAspects;synastry(ctx);};
 if(r?.composite){
  bindAspectBrowser(ctx.root,r.composite,s.aspects);
  const stage=$('.wheel-stage',ctx.root),card=$('[data-wheel-card]',stage);
  bindWheel(stage,s,key=>{const p=r.composite.chart.planets.find(p=>'inner-'+p.key===key);card.hidden=!p;card.innerHTML=p?`<b>${esc(p.symbol+' '+p.name)}</b><span>${esc(p.sign)} · 第${p.house}宫</span>`:'';});
 }
 $('[data-select-other]',ctx.root).onclick=()=>{
  const d=ctx.sheet('toolSheet','选择第二个案例',`<div class="stack">${cases.map(c=>btn(c.name,`data-other="${esc(c.id)}"`)).join('')||'<p>请先在案例页添加第二个人。</p>'}</div>`);
  for(const b of d.querySelectorAll('[data-other]'))b.onclick=()=>{
   const p=cases.find(c=>c.id===b.dataset.other);
   ctx.close(d);calculatePair(ctx,s,p);
  };
 };
 if(other&&!r&&!s.pending&&!s.error)calculatePair(ctx,s,other);
}
export function extraView(ctx){({qizheng:qi,yijing:yi,calendar,synastry})[ctx.state.system]?.(ctx);}
