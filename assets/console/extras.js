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
 ${r?hexagram('先天 · 本卦',r.natal)+hexagram('后天 · 变卦',r.changed)+hexagram(r.year+' 流年',r.annual)+
 `<p class="thin">${esc(r.method)}</p><article class="card"><h2>六十四卦典籍</h2><label>选择卦<select data-hex>${r.library.map(x=>`<option value="${x.number}" ${x.number===s.hex?'selected':''}>${x.number} · ${esc(x.name)}</option>`).join('')}</select></label><div data-selected-hex></div></article>`:''}</section>`;
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
function synastry(ctx){
 const id='synastry',s=stateFor(ctx,id,{}),r=s.result;
 const cases=ctx.state.cases.filter(c=>c.id!==ctx.state.profile.id);
 const other=cases.find(c=>c.id===s.other);
 ctx.root.innerHTML=`<section><div class="spread"><h1>双人合盘</h1>${btn(other?'更换第二人':'选择第二人','data-select-other')}</div>
 <p>${esc(ctx.state.profile.name)} × ${esc(other?.name||'待选择')}</p><p data-extra-status role="status">${esc(s.error)}</p>
 ${r?`<article class="card"><h2>跨盘相位</h2>${table(['当前案例','第二人','相位','容许度'],r.western.interAspects.map(x=>[x.a,x.b,x.type,x.orb.toFixed(2)+'°']))}</article>
 ${r.vedic.koota?`<article class="card"><h2>印度八项合婚 · ${r.vedic.koota.total}/${r.vedic.koota.max}</h2>${table(['项目','得分'],r.vedic.koota.items.map(x=>[x.zh,x.score+'/'+x.max]))}</article>`:''}`:''}</section>`;
 $('[data-select-other]',ctx.root).onclick=()=>{
  const d=ctx.sheet('toolSheet','选择第二个案例',`<div class="stack">${cases.map(c=>btn(c.name,`data-other="${esc(c.id)}"`)).join('')||'<p>请先在案例页添加第二个人。</p>'}</div>`);
  for(const b of d.querySelectorAll('[data-other]'))b.onclick=()=>{
   const p=cases.find(c=>c.id===b.dataset.other);
   s.other=p.id;ctx.close(d);load(ctx,id,s,'/api/synastry/chart',{a:ctx.birth,b:ctx.normalized(p),mode:'synastry'});
  };
 };
}
export function extraView(ctx){({qizheng:qi,yijing:yi,calendar,synastry})[ctx.state.system]?.(ctx);}
