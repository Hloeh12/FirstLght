import {BAZI_FLOW_RULES} from '../../www/js/rules.js';
globalThis.BAZI_FLOW_RULES = BAZI_FLOW_RULES;
import {reducedMotion} from './feedback.js';
import {$,btn,esc,term,row,bars,table,selectedRails,splitDate,periodSections} from './ui.js';
const setUp=ctx=>ctx.state.chartState.bazi??={data:ctx.state.reading.bazi,combine:false,pick:{},token:0,error:'',selected:[],pulse:false};
const stages={
 长生:'像新生一样，表示力量开始生长。',沐浴:'处于初生后的变化期，表示适应和转换。',冠带:'表示逐渐成形、开始显露。',临官:'表示条件齐备、开始承担职责。',帝旺:'表示力量处在高点。',衰:'表示达到高点后开始回落。',病:'表示力量受到牵制，适合观察休整需求。',死:'表示某一阶段结束。',墓:'表示力量归藏、暂未显露。',绝:'表示旧阶段与新阶段的转折。',胎:'表示新阶段开始孕育。',养:'表示积累条件，准备进入下一阶段。'
};
const stepText=kind=>kind==='身强'?'同我与生我权重超过 60%':kind==='身弱'?'同我与生我权重低于 40%':'同我与生我权重在 40% 至 60% 之间';
function correction(b){
 const c=b.correction,format=x=>(x>=0?'+':'')+Number(x).toFixed(1)+'m';
 const dst=b.timeCorrection?.dstApplied?'（夏令时-1h，标准时 '+[b.timeCorrection.standard.h,b.timeCorrection.standard.mi].map(n=>String(n).padStart(2,'0')).join(':')+'）':'';
 return c.corrected?`钟表 ${b.clock}${dst} → 经度差 ${format(c.longitudeCorrectionMinutes)} → 均时差 ${format(c.equationOfTimeMinutes)} → 真太阳时 ${String(c.hour).padStart(2,'0')}:${String(c.minute).padStart(2,'0')}（${b.hourBranch}时${c.dayOffset?'，跨 '+c.dayOffset+' 日':''}）`:'钟表时 '+b.clock+dst;
}
function pillar(p,voids,index){
 return `<div class="pillar" data-pillar="${index}">
 ${btn(p.name,'class="pillar-select" aria-pressed="false"')}<span class="element" data-e="${p.stemElement}">${term(p.tenGod)}</span>
 <strong class="element" data-e="${p.stemElement}" data-pillar-anchor="stem">${term(p.stem,p.name+'天干 '+p.stem+'属'+p.stemElement+'。')}</strong><strong class="element" data-e="${p.branchElement}" data-pillar-anchor="branch">${term(p.branch,p.name+'地支 '+p.branch+'属'+p.branchElement+'。')}</strong>
 <div>${p.hidden.map(h=>`<div class="element ${h.commanding?'commanding':''}" data-e="${h.element}">${h.commanding?'<small class="command-badge">司令</small>':''}${term(h.stem+' '+h.god,h.rank+'藏干 '+h.stem+'，属'+h.element+'，相对于日主为'+h.god+'。')}</div>`).join('')}</div>
 ${p.commander?`<span class="command-note">当令 ${esc(p.commander.stem)} · 交${esc(p.commander.term.name)}后 ${p.commander.elapsedDays.toFixed(2)}日</span>`:''}
 <span>${term(p.changsheng,stages[p.changsheng]+'。这是十二长生阶段，不表示寿命。')}</span>
 <span>${term(p.nayin,p.stem+p.branch+'的纳音为'+p.nayin+'。纳音是六十甲子的分类，可与实际五行强弱分别阅读。')}</span>
 ${voids.includes(p.branch)?term('空亡'):''}<div class="chips">${p.shensha.map(x=>term(x)).join('')}</div></div>`;
}
function relationships(data){
 return `<div class="chips">${data.relationships.map(r=>term(r.pattern+' '+r.type+' · '+r.pillars.join('／'),
  r.meaning+(r.element?' 传统取向为'+r.element+'。':''))).join('')||'<span class="muted">当前柱组未触发所列关系。</span>'}</div>`;
}
function details(d){
 return `<article class="card liquid-glass"><div class="spread"><h2>五行力量</h2><b>${d.strength.kind} · ${d.strength.support.toFixed(1)}%</b></div>
 ${bars(d.strength.percentages)}<p class="thin">喜用参考 ${d.strength.useful.join('、')||'五行扶助较均衡'} · 忌偏参考 ${d.strength.caution.join('、')||'不单列'}</p><small>${esc(d.strength.method)}</small></article>
 <article class="card"><h2>干支关系</h2>${relationships(d)}<p class="thin">日主通根 ${esc(d.roots.map(r=>r.pillar+r.branch+'藏'+r.stem).join('、')||'未见')} · 透干 ${esc(d.revealed.map(r=>r.rootAt+'藏'+r.stem+'透'+r.visibleAt).join('、')||'未见')} · 旬空 ${esc(d.voidBranches.join('、'))}</p></article>
 ${d.guidance?`<article class="card period-guidance" aria-live="polite"><h2>${esc(d.guidance.title)}</h2><p>${esc(d.guidance.summary)}</p>
 ${periodSections(d.guidance)}<small>传统干支规则与权重模型提供的观察参考。</small></article>`:''}
 ${d.selected.length?`<article class="card"><h2>当前运程</h2>${d.selected.map(p=>`<p>${esc(p.name+' '+p.stem+p.branch)} · ${term(p.tenGod)} · ${term(p.changsheng,stages[p.changsheng])} · ${term(p.nayin,'六十甲子的纳音分类。')}</p>`).join('')}</article>`:''}`;
}
function entryCard(d){
 const e=d.entry,a=e.duration;
 return `<article class="card liquid-glass luck-entry"><h2>精确起运与交运</h2><p>起运：出生后 ${a.years}年${a.months}个月${a.days}天${a.hours}小时 · ${esc(e.directionLabel)}</p>
 <p>首次交运：${esc(e.local)}（出生地历史UTC偏移 ${e.offsetMinutes/60}）</p><p>${esc(e.year)}年 ${esc(e.term)}后第 ${e.daysAfter} 天交运 · 每十回归年换运</p><small>${esc(e.method)}</small></article>`;
}
function timeline(d,pick){
 const year=d.years.map(y=>[y.year,y.year+' '+y.stem+y.branch]);
 return row('大运',[['natal','本命'],...d.cycles.map(p=>[p.index,p.age+'岁 '+p.stem+p.branch+' '+p.changsheng])],pick.luck??'natal')+
  row('流年',year,pick.year)+row('流月',d.months.map(m=>[m.index,m.label+' '+m.stem+m.branch]),pick.month)+
  row('流日',d.days.map(x=>[x.index,x.date.slice(5)+' '+x.stem+x.branch]),pick.day);
}
function drawRelations(ctx,s,animate){
 const board=$('.bazi-board',ctx.root),overlay=$('.bazi-overlay',board),box=overlay.getBoundingClientRect();
 const cells=[...board.querySelectorAll('[data-pillar]')],w=box.width||400,h=box.height||250;
 const active=s.selected.length===2
  ?s.data.relationships.filter(r=>r.ids.length===2&&r.ids.every(i=>s.selected.includes(i)))
  :s.combine&&s.pulse?s.data.relationships:[];
 const links=active.filter(r=>r.ids.length===2&&r.ids.every(i=>i<4)&&['天干五合','六冲'].includes(r.type));
 for(const [i,cell] of cells.entries()){
  const selected=s.selected.includes(i),clash=links.some(r=>r.type==='六冲'&&r.ids.includes(i));
  $('.pillar-select',cell).setAttribute('aria-pressed',String(selected));
  cell.classList.remove('pillar-clash');
  if(clash&&animate){void cell.offsetWidth;cell.classList.add('pillar-clash');}
 }
 overlay.setAttribute('viewBox',`0 0 ${w} ${h}`);
 const lines=links.map(r=>{
  const isClash=r.type==='六冲',anchor=isClash?'branch':'stem';
  const [a,b]=r.ids.map(i=>{
   const rect=$('[data-pillar-anchor="'+anchor+'"]',cells[i]).getBoundingClientRect();
   return box.width?[rect.left-box.left+rect.width/2,rect.top-box.top+rect.height/2]:[(i+.5)*100,isClash?90:53];
  });
  const arch=Math.max(12,Math.min(42,(b[0]-a[0])/4)),d=`M ${a.join(' ')} Q ${(a[0]+b[0])/2} ${Math.max(8,a[1]-arch*2)} ${b.join(' ')}`;
  const type=isClash?'clash':'merge';
  return `<path class="bazi-link ${type}" d="${d}" pathLength="1"/><path class="bazi-pulse ${type}${animate?' run':''}" d="${d}" pathLength="1"/>`;
 });
 overlay.innerHTML='<defs><linearGradient id="bazi-gold"><stop stop-color="#ff77aa"/><stop offset=".5" stop-color="#ffe7b1"/><stop offset="1" stop-color="#ff4f8b"/></linearGradient></defs>'+lines.join('');
 $('#pillarRelation',ctx.root).textContent=s.selected.length===2
  ?links.map(r=>r.pattern+' '+r.type+(r.type==='天干五合'&&s.data.strength.activated.some(x=>x.pattern===r.pattern&&x.ids.join()===r.ids.join())?' · 合化'+r.element:'')).join('、')||'所选两柱未形成天干五合或地支六冲'
  :'点选两柱，查看合冲连线';
}
let observer;
export function baziView(ctx){
 const s=setUp(ctx),d=s.data;
 observer?.disconnect();
 ctx.root.innerHTML=`<section aria-label="四柱八字">
 <div class="spread"><h1>四柱八字</h1>${btn('生克合化',`data-combine aria-pressed="${s.combine}"`)}</div>
 <div class="bazi-board"><div class="matrix">${d.pillars.map((p,i)=>pillar(p,d.voidBranches,i)).join('')}</div><svg class="bazi-overlay" aria-hidden="true"></svg></div>
 <p id="pillarRelation" class="thin" role="status"></p>${entryCard(d)}
 <div class="timeline" data-bazi-rails>${timeline(d,s.pick)}</div>
 <p id="baziStatus" class="muted" role="status"></p>
 <div class="bazi-crossfade"><div data-bazi-data>${details(d)}</div></div></section>`;
 $('[data-combine]',ctx.root).onclick=()=>update(ctx,s.pick,!s.combine);
 const rails=$('[data-bazi-rails]',ctx.root);
 rails.onclick=e=>{
  if(e.target.closest('[data-reset-period]')){update(ctx,{},s.combine);return;}
  const b=e.target.closest('[data-rail]');
  if(!b)return;
  const {rail:id,pick:v}=b.dataset,n=Number(v),{pick}=s;
  ctx.state.activeTimeSystem='bazi';
  update(ctx,id==='大运'?(v==='natal'?{}:{luck:n}):id==='流年'?{...pick,year:n,month:undefined,day:undefined}:id==='流月'?{...pick,month:n,day:undefined}:{...pick,day:n},s.combine);
 };
 for(const cell of ctx.root.querySelectorAll('[data-pillar]'))cell.onclick=e=>{
  if(e.target.closest('.term'))return;
  const index=Number(cell.dataset.pillar);
  s.selected=s.selected.includes(index)?s.selected.filter(i=>i!==index):[...s.selected.slice(-1),index];
  drawRelations(ctx,s,true);
 };
 selectedRails(ctx.root);
 drawRelations(ctx,s,false);
 if(typeof ResizeObserver!=='undefined'){
  const board=$('.bazi-board',ctx.root);
  observer=new ResizeObserver(()=>{if(board.isConnected)drawRelations(ctx,s,false);else observer?.disconnect();});
  observer.observe(board);
 }
}
function refresh(ctx,s){
 const root=ctx.root,rails=$('[data-bazi-rails]',root),current=$('[data-bazi-data]',root);
 const focused=document.activeElement?.closest('[data-rail]');
 const scrolls=[...rails.querySelectorAll('.rail')].map(r=>r.scrollLeft);
 rails.innerHTML=timeline(s.data,s.pick);
 [...rails.querySelectorAll('.rail')].forEach((r,i)=>{r.scrollLeft=scrolls[i]||0;});
 if(focused&&rails.contains(focused)===false)for(const b of rails.querySelectorAll('[data-rail]')){
  if(b.dataset.rail===focused.dataset.rail&&b.dataset.pick===focused.dataset.pick){b.focus({preventScroll:true});break;}
 }
 selectedRails(root);
 $('[data-combine]',root).setAttribute('aria-pressed',String(s.combine));
 current.getAnimations?.().forEach(a=>a.cancel());
 current.innerHTML=details(s.data);
 if(!reducedMotion()&&current.animate){
  current.animate([{opacity:.72,transform:'translateY(1px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'ease-out'});
 }
 drawRelations(ctx,s,true);
}
async function update(ctx,pick,combine){
 const s=setUp(ctx),token=++s.token;
 const status=$('#baziStatus',ctx.root);if(status)status.textContent='正在重算五行与干支关系…';
 try{
  const data=await ctx.request('/api/console/bazi',{birth:ctx.birth,selection:pick,combine});
  if(s.token!==token||ctx.state.chartState.bazi!==s)return;
  s.data=data;s.pick=pick;s.combine=combine;s.pulse=combine;s.error='';
 }catch(error){if(token===s.token)s.error=error.message;}
 if(s.token===token&&ctx.state.chartState.bazi===s&&ctx.state.tab==='chart'&&ctx.state.system==='bazi'){
  $('#baziStatus',ctx.root).textContent=s.error;
  if(!s.error)refresh(ctx,s);
 }
 if(s.token===token&&!s.error&&ctx.state.chartState.bazi===s&&ctx.state.system==='bazi')ctx.onSelectTimeNode('bazi');
}
const panels=['基础信息','五行关系','干支刑冲合会','天罡称骨','流年全排','快捷八字'];
export function baziTools(ctx,host){
 host.innerHTML='<div class="tool-grid">'+panels.slice(0,5).map((p,i)=>btn(p,`data-bazi-tool="${i}"`)).join('')+'</div>';
 for(const b of host.querySelectorAll('[data-bazi-tool]'))b.onclick=()=>showTool(ctx,+b.dataset.baziTool);
}
export const baziQuick=ctx=>showTool(ctx,5);
async function showTool(ctx,i){
 const d=setUp(ctx).data,b=d.info;
 const titles=panels[i];
 let content='';
 if(i===0)content=table(['项目','结果'],[
  ['公历',b.solar+' '+b.clock],['农历',b.lunar],['四柱',d.pillars.map(p=>p.stem+p.branch).join(' ')],
  ['交节司令',d.commander.stem+' · '+d.commander.term.name+' '+d.commander.term.utc+' · 交节后 '+d.commander.elapsedDays.toFixed(6)+' 日'],
  ['起运时刻',b.startUtc+'（UT）'],['起运年长',b.tropicalYearDays+' 日/回归年'],['起运',b.startAge+' 岁 · '+(b.forward?'顺行':'逆行')],['夏令时校正',b.timeCorrection.dstApplied?'夏令时-1h':'未应用'],['时间提示',b.timeCorrection.warning||'无切换歧义'],['交运取节',b.node.name+' '+b.node.at+'（东八区节气）'],
  ['校准',correction(b)],['晚子时',b.lateZishi==='current-day'?'归当日':'归次日']
 ]);
 if(i===1)content=`<h3>${d.strength.kind} · 扶助 ${d.strength.support.toFixed(1)}%</h3><p>${stepText(d.strength.kind)}。</p>${bars(d.strength.percentages)}
 ${table(['五行','权重'],Object.entries(d.strength.weights).map(([k,v])=>[k,v.toFixed(2)]))}
 <p>${esc(d.strength.method)}</p><p>喜用参考 ${d.strength.useful.join('、')||'未单列'} · 忌偏参考 ${d.strength.caution.join('、')||'未单列'}</p>
 <p>${d.strength.activated.length?'满足模型合化条件：'+esc(d.strength.activated.map(r=>r.pattern+'化'+r.element).join('、')):'本次没有应用合化转移。'}</p>`;
 if(i===2)content=table(['类型','组合','涉及柱','白话'],d.relationships.map(r=>[r.type,r.pattern,r.pillars.join('、'),r.meaning]));
 if(i===3)content='<p id="boneResult" role="status">正在计算称骨…</p>';
 if(i===4)content=table(['年份','干支','十神','长生','纳音'],d.years.map(y=>[y.year,y.stem+y.branch,y.tenGod,y.changsheng,y.nayin]));
 if(i===5)content=`<form id="convertCalendar" class="form-grid"><label>历法<select name="calendar"><option value="solar">公历</option><option value="lunar">农历</option></select></label><label>日期<input name="date" placeholder="YYYY-MM-DD" required></label><label class="checks"><input type="checkbox" name="leap">闰月</label><button>换算日期</button></form>
 <form id="reversePillars" class="form-grid"><label class="wide">四柱干支<input name="pillars" value="${esc(d.pillars.map(p=>p.stem+p.branch).join(' '))}" required></label><label>起始年份<input name="start" type="number" value="1900" required></label><label>结束年份<input name="end" type="number" value="2100" required></label><button class="wide">反查公历日期</button></form><div id="quickOutput" role="status"></div><small>干支反查采用出生地钟表时，起盘时可再校正真太阳时。</small>`;
 const dialog=ctx.sheet('toolSheet',titles,content);
 if(i===3){
  try{
   const r=await ctx.request('/api/console/bones',{birth:ctx.birth}),output=$('#boneResult',dialog);if(!output)return;
   output.outerHTML=`<h3>${Math.floor(r.qian/10)} 两 ${r.qian%10} 钱</h3><p>${r.parts.map(([k,v])=>k+' '+v+' 钱').join(' · ')}</p><blockquote>${esc(r.song)}</blockquote><p>${esc(r.reading)}</p><small>${esc(r.method)}</small>`;
  }catch(error){const output=$('#boneResult',dialog);if(output)output.textContent=error.message;}
 }
 if(i===5){
  const output=$('#quickOutput',dialog);
  $('#convertCalendar',dialog).onsubmit=async e=>{
   e.preventDefault();const f=new FormData(e.currentTarget);
   try{
    const r=await ctx.request('/api/console/convert',{...splitDate(f.get('date')),calendar:f.get('calendar'),leapMonth:f.has('leap')});
    output.innerHTML=`<p>公历 ${esc(r.solar)} · 农历 ${esc(r.lunar)} ${r.leap?'（闰月）':''}</p>${btn('使用该日期起盘','data-use-convert')}`;
    $('[data-use-convert]',output).onclick=()=>{ctx.close(dialog);ctx.birthSheet(null,{...ctx.birth,calendar:'solar',dateStr:r.solar});};
   }catch(error){output.textContent=error.message;}
  };
  $('#reversePillars',dialog).onsubmit=async e=>{
   e.preventDefault();const f=new FormData(e.currentTarget);output.textContent='正在反查…';
   try{
    const hits=await ctx.request('/api/console/reverse-bazi',{pillars:f.get('pillars').trim().split(/\s+/),start:+f.get('start'),end:+f.get('end'),lateZishi:ctx.birth.lateZishi});
    output.innerHTML='<div class="rail">'+hits.map((x,i)=>btn(x.date+' '+x.time,`data-hit="${i}"`)).join('')+'</div>';
    if(!hits.length)output.textContent='此区间无匹配时刻。';
    for(const b of output.querySelectorAll('[data-hit]'))b.onclick=()=>{
     const hit=hits[b.dataset.hit];ctx.close(dialog);ctx.birthSheet(null,{...ctx.birth,calendar:'solar',dateStr:hit.date,timeStr:hit.time});
    };
   }catch(error){output.textContent=error.message;}
  };
 }
}
