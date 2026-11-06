import {$,btn,esc,term,row,bars,table,selectedRails,splitDate} from './ui.js';
const setUp=ctx=>ctx.state.chartState.bazi??={data:ctx.state.reading.bazi,combine:false,pick:{},token:0,error:''};
const stages={
 长生:'像新生一样，表示力量开始生长。',沐浴:'处于初生后的变化期，表示适应和转换。',冠带:'表示逐渐成形、开始显露。',临官:'表示条件齐备、开始承担职责。',帝旺:'表示力量处在高点。',衰:'表示达到高点后开始回落。',病:'表示力量受到牵制，适合观察休整需求。',死:'表示某一阶段结束。',墓:'表示力量归藏、暂未显露。',绝:'表示旧阶段与新阶段的转折。',胎:'表示新阶段开始孕育。',养:'表示积累条件，准备进入下一阶段。'
};
const stepText=kind=>kind==='身强'?'同我与生我权重超过 60%':kind==='身弱'?'同我与生我权重低于 40%':'同我与生我权重在 40% 至 60% 之间';
function correction(b){
 const c=b.correction,format=x=>(x>=0?'+':'')+Number(x).toFixed(1)+'m';
 return c.corrected?`钟表 ${b.clock} → 经度差 ${format(c.longitudeCorrectionMinutes)} → 均时差 ${format(c.equationOfTimeMinutes)} → 真太阳时 ${String(c.hour).padStart(2,'0')}:${String(c.minute).padStart(2,'0')}（${b.hourBranch}时${c.dayOffset?'，跨 '+c.dayOffset+' 日':''}）`:'钟表时 '+b.clock;
}
function pillar(p,voids){
 return `<div class="pillar">
 <b>${esc(p.name)}</b><span class="element" data-e="${p.stemElement}">${term(p.tenGod)}</span>
 <strong class="element" data-e="${p.stemElement}">${esc(p.stem)}</strong><strong class="element" data-e="${p.branchElement}">${esc(p.branch)}</strong>
 <div>${p.hidden.map(h=>`<div class="element" data-e="${h.element}">${term(h.stem+' '+h.god,h.rank+'藏干 '+h.stem+'，属'+h.element+'，相对于日主为'+h.god+'。')}</div>`).join('')}</div>
 <span>${term(p.changsheng,stages[p.changsheng]+'。这是十二长生阶段，不表示寿命。')}</span>
 <span>${term(p.nayin,p.stem+p.branch+'的纳音为'+p.nayin+'。纳音是六十甲子的分类，可与实际五行强弱分别阅读。')}</span>
 ${voids.includes(p.branch)?term('空亡'):''}<div class="chips">${p.shensha.map(x=>term(x)).join('')}</div></div>`;
}
function relationships(data){
 return `<div class="chips">${data.relationships.map(r=>term(r.pattern+' '+r.type+' · '+r.pillars.join('／'),
  r.meaning+(r.element?' 传统取向为'+r.element+'。':''))).join('')||'<span class="muted">当前柱组未触发所列关系。</span>'}</div>`;
}
export function baziView(ctx){
 const s=setUp(ctx),d=s.data,{pick}=s;
 const year=d.years.map(y=>[y.year,y.year+' '+y.stem+y.branch]);
 ctx.root.innerHTML=`<section aria-label="四柱八字">
 <div class="spread"><h1>四柱八字</h1>${btn('生克合化',`data-combine aria-pressed="${s.combine}"`)}</div>
 <div class="matrix">${d.pillars.map(p=>pillar(p,d.voidBranches)).join('')}</div>
 <article class="card liquid-glass" style="margin-top:8px"><div class="spread"><h2>五行力量</h2><b>${d.strength.kind} · ${d.strength.support.toFixed(1)}%</b></div>
 ${bars(d.strength.percentages)}<p class="thin">喜用参考 ${d.strength.useful.join('、')||'五行扶助较均衡'} · 忌偏参考 ${d.strength.caution.join('、')||'不单列'}</p><small>${esc(d.strength.method)}</small></article>
 <article class="card"><h2>干支关系</h2>${relationships(d)}<p class="thin">日主通根 ${esc(d.roots.map(r=>r.pillar+r.branch+'藏'+r.stem).join('、')||'未见')} · 透干 ${esc(d.revealed.map(r=>r.rootAt+'藏'+r.stem+'透'+r.visibleAt).join('、')||'未见')} · 旬空 ${esc(d.voidBranches.join('、'))}</p></article>
 <div class="timeline">${row('大运',[['natal','本命'],...d.cycles.map(p=>[p.index,p.age+'岁 '+p.stem+p.branch+' '+p.changsheng])],pick.luck??'natal')}
 ${row('流年',year,pick.year)}${row('流月',d.months.map(m=>[m.index,m.label+' '+m.stem+m.branch]),pick.month)}</div>
 <p id="baziStatus" class="muted" role="status">${esc(s.error)}</p>
 ${d.selected.length?`<article class="card"><h2>当前运程</h2>${d.selected.map(p=>`<p>${esc(p.name+' '+p.stem+p.branch)} · ${term(p.tenGod)} · ${term(p.changsheng,stages[p.changsheng])} · ${term(p.nayin,'六十甲子的纳音分类。')}</p>`).join('')}</article>`:''}</section>`;
 $('[data-combine]',ctx.root).onclick=()=>update(ctx,pick,!s.combine);
 selectedRails(ctx.root);
 for(const b of ctx.root.querySelectorAll('[data-rail]'))b.onclick=()=>{
  const id=b.dataset.rail,v=b.dataset.pick,n=Number(v);
  update(ctx,id==='大运'?(v==='natal'?{}:{luck:n}):id==='流年'?{...pick,year:n,month:undefined}:{...pick,month:n},s.combine);
 };
}
async function update(ctx,pick,combine){
 const s=setUp(ctx),token=++s.token;
 const status=$('#baziStatus',ctx.root);if(status)status.textContent='正在重算五行与干支关系…';
 try{
  const data=await ctx.request('/api/console/bazi',{birth:ctx.birth,selection:pick,combine});
  if(s.token!==token||ctx.state.chartState.bazi!==s)return;
  s.data=data;s.pick=pick;s.combine=combine;s.error='';
 }catch(error){if(token===s.token)s.error=error.message;}
 if(s.token===token&&ctx.state.chartState.bazi===s&&ctx.state.tab==='chart'&&ctx.state.system==='bazi')baziView(ctx);
}
const panels=['基础信息','五行关系','干支关系','天罡称骨','流年全排','快捷八字'];
export function baziTools(ctx,host){
 host.innerHTML='<div class="tool-grid">'+panels.map((p,i)=>btn(p,`data-bazi-tool="${i}"`)).join('')+'</div>';
 for(const b of host.querySelectorAll('[data-bazi-tool]'))b.onclick=()=>showTool(ctx,+b.dataset.baziTool);
}
async function showTool(ctx,i){
 const d=setUp(ctx).data,b=d.info;
 const titles=panels[i];
 let content='';
 if(i===0)content=table(['项目','结果'],[
  ['公历',b.solar+' '+b.clock],['农历',b.lunar],['四柱',d.pillars.map(p=>p.stem+p.branch).join(' ')],
  ['起运',b.startAge+' 岁 · '+(b.forward?'顺行':'逆行')],['交运取节',b.node.name+' '+b.node.at+'（东八区节气）'],
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
