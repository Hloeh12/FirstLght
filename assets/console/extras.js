import {wheel,planetList} from './western.js';
import {aspectBrowser,bindAspectBrowser} from './aspects.js';
import {bindWheel} from './wheel-gesture.js';
import {$,btn,esc,term,table,isoLocal} from './ui.js';

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
 return `<article class="card liquid-glass"><h2>${esc(heading)} · ${term(h.name,h.guaci+' '+(h.reading||''))}</h2>
 <div class="hexagram" role="img" aria-label="${esc(h.name+'六爻卦象')}">${[...h.lines].reverse().map(x=>`<span class="${x?'solid':'broken'}"></span>`).join('')}</div>
 <blockquote>${esc(h.guaci)}</blockquote>${h.line?`<p>${esc(h.line)}</p>`:''}<p>${esc(h.reading)}</p></article>`;
}
function yi(ctx){
 const id='yijing',s=stateFor(ctx,id,{year:new Date().getFullYear()}),r=s.result;
 ctx.root.innerHTML=`<section id="yijing"><div class="spread"><h1>易经推命</h1><div class="rail">${btn('上一年','data-year="-1"')}${btn(String(s.year),'disabled')}${btn('下一年','data-year="1"')}</div></div>
 <p data-extra-status role="status">${esc(s.error)}</p>
 ${r?hexagram('先天 · 本卦',r.natal)+hexagram('后天 · 变卦',r.changed)+(r.annual?hexagram(r.year+' 流年 · 太岁'+r.annual.taisuibranch+' · '+r.annual.period,r.annual):'<p>'+esc(r.notice)+'</p>')+
 `<article class="card"><h3>天纪取数与元堂</h3>${table(['四柱','天干洛书','地支河图'],r.numbers.rows.map(x=>[x.pillar,x.stem,x.branch.join('、')]))}<p>天数 ${r.numbers.heaven.sum} → ${r.numbers.heaven.number}（${r.numbers.sky}） · 地数 ${r.numbers.earth.sum} → ${r.numbers.earth.number}（${r.numbers.land}）</p><p>${r.numbers.era} · 五数寄${r.numbers.lodging} · ${r.yangSeason?'阳令':'阴令'} · 元堂第${r.natal.origin+1}爻</p>${r.changed.special?'<p>'+esc(r.changed.special)+'</p>':''}</article><p class="thin">${esc(r.method)}</p><article class="card"><h2>六十四卦典籍</h2><label>选择卦<select data-hex>${r.library.map(x=>`<option value="${x.number}" ${x.number===s.hex?'selected':''}>${x.number} · ${esc(x.name)}</option>`).join('')}</select></label><div data-selected-hex></div></article>`:''}</section>`;
 for(const b of ctx.root.querySelectorAll('[data-year]'))b.onclick=()=>{s.year+=+b.dataset.year;load(ctx,id,s,'/api/console/yijing',{birth:ctx.birth,year:s.year});};
 if(r){
  const choose=$('[data-hex]',ctx.root);
  const show=()=>{s.hex=+choose.value;$('[data-selected-hex]',ctx.root).innerHTML=hexagram('卦辞',r.library.find(x=>x.number===s.hex));};
  choose.onchange=show;show();
 }
 if(!r&&!s.pending&&!s.error)load(ctx,id,s,'/api/console/yijing',{birth:ctx.birth,year:s.year});
}
function calendar(ctx){
 const id='calendar',s=stateFor(ctx,id,{date:isoLocal(),filters:{}}),r=s.result;
 const list=r?.dates.filter(x=>(!s.filters.event||x.yi.some(t=>t.includes(s.filters.event)))&&(!s.filters.good||x.good.some(t=>t.includes(s.filters.good)))&&
  (!s.filters.avoid||!x.links.some(l=>['六冲','相刑','相害','相破'].includes(l.type))))||[];
 ctx.root.innerHTML=`<section id="calendar"><div class="spread"><h1>万年历择日</h1>${btn('设置日期与筛选','data-calendar-filter')}</div>
 <p class="muted">${esc(s.date)} 起 · ${ctx.birth?'结合当前案例日时冲合':'公共黄历'}</p><p data-extra-status role="status">${esc(s.error)}</p>
 ${r?list.map(x=>`<details class="card" ${list.length===1?'open':''}><summary><b>${x.date}</b> · ${esc(x.lunar+' '+x.gz)} · 参考分 ${x.score}</summary>
 <p>宜 ${esc(x.yi.join('、'))}</p><p>忌 ${esc(x.ji.join('、'))}</p><p>吉神 ${esc(x.good.join('、'))}</p><p>凶煞 ${esc(x.bad.join('、'))}</p>
 <p>个人关系 ${esc(x.links.map(l=>l.pattern+l.type+' '+l.pillars.join('／')).join('；')||'无')}</p>
 ${table(['时辰','干支','值神','吉凶','个人关系','参考分'],x.hours.map(h=>[h.branch,h.time,h.god,h.traditional,h.links.join('、')||'—',h.score]))}</details>`).join('')+'<p class="thin">'+esc(r.method)+'</p>':''}
 ${r&&!list.length?'<p class="empty">当前筛选范围内没有匹配日期。</p>':''}</section>`;
 $('[data-calendar-filter]',ctx.root).onclick=()=>{
  const dialog=ctx.sheet('toolSheet','择日条件',`<form class="form-grid"><label>起始日期<input type="date" name="date" value="${esc(s.date)}" required></label>
  <label>连续天数<input name="days" type="number" min="1" max="31" value="${s.days??7}" required></label><label>宜事关键词<input name="event" value="${esc(s.filters.event)}" placeholder="如 出行"></label>
  <label>吉神关键词<input name="good" value="${esc(s.filters.good)}"></label><label class="checks wide"><input type="checkbox" name="avoid" ${s.filters.avoid?'checked':''}>排除冲、刑、破、害</label><button class="primary wide">查找日期</button></form>`);
  $('form',dialog).onsubmit=e=>{
   e.preventDefault();const f=new FormData(e.currentTarget);s.date=f.get('date');s.days=+f.get('days');s.filters={event:f.get('event').trim(),good:f.get('good').trim(),avoid:f.has('avoid')};ctx.close(dialog);
   load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days});
  };
 };
 if(!r&&!s.pending&&!s.error)load(ctx,id,s,'/api/console/calendar',{birth:ctx.birth,date:s.date,days:s.days??1});
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
 <article class="card"><h2>八字跨盘干支</h2>${table(['关系','干支','双方柱位'],r.crossRelations.map(x=>[x.type,x.pattern,x.pillars.join('／')]))}</article>
 ${s.mode==='synastry'?`<article class="card"><h2>跨盘主要相位</h2>${table(['当前案例','第二人','相位','容许度'],[...r.western.interAspects].sort((a,b)=>a.orb-b.orb).slice(0,s.showPairAspects?undefined:12).map(x=>[x.a,x.b,x.type,x.orb.toFixed(2)+'°']))}${r.western.interAspects.length>12?btn(s.showPairAspects?'收起 ▴':'查看完整 '+r.western.interAspects.length+' 条相位明细 ▾','data-pair-expand class="aspect-toggle"'):''}</article>`:''}
 ${r.vedic.koota?`<article class="card"><h2>印度八项合婚（当前方向） · ${r.vedic.koota.total}/${r.vedic.koota.max}</h2>${table(['项目','得分'],r.vedic.koota.items.map(x=>[x.zh,x.score+'/'+x.max]))}</article>`:''}`:''}</section>`;
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
