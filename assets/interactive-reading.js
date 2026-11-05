(()=>{
const $=id=>document.getElementById(id);const icons=[
'<rect x="6" y="6" width="22" height="24" rx="6" fill="#ffc5da"/><path d="M11 6v24M15 15h8M15 20h6" stroke="#b94d7e"/><path d="M15 8c-9-10-10 5 0 1 10 4 10-11 0-1Z" fill="#ff76ac"/>',
'<path d="m9 28 14-14" stroke="#c080cf" stroke-width="5" stroke-linecap="round"/><path d="m24 3 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#ffc5df" stroke="#de75ab"/><circle cx="8" cy="10" r="2" fill="#e1b1fb"/>',
'<circle cx="18" cy="15" r="12" fill="#e5c9ff" stroke="#b983d8"/><path d="m17 7 2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" fill="white"/><path d="M9 28h18l3 5H6Z" fill="#ffaecb"/>',
'<circle cx="8" cy="9" r="6" fill="#ffc9dd"/><circle cx="28" cy="9" r="6" fill="#ffc9dd"/><path d="M3 19C0 4 36 4 33 19c4 18-34 18-30 0Z" fill="#ffe1ed" stroke="#dca0c0"/><circle cx="12" cy="18" r="1.7"/><circle cx="24" cy="18" r="1.7"/><ellipse cx="18" cy="23" rx="4" ry="3" fill="white"/><path d="m16 22 2 2 2-2" stroke="#b9769d" fill="none"/>'];
document.querySelectorAll('#tabBar button span').forEach((n,i)=>{n.innerHTML='<svg width="24" height="24" viewBox="0 0 36 36" aria-hidden="true">'+icons[i]+'</svg>'});document.querySelectorAll('.card,.shell-glass,.topbar-btn,.input-actions button').forEach(n=>n.classList.add('liquid-glass'));
const backdrop=document.createElement('div');backdrop.id='meaningBackdrop';backdrop.hidden=true;const sheet=document.createElement('div');sheet.id='meaningSheet';sheet.className='liquid-glass';sheet.hidden=true;sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','白话释义');document.body.append(backdrop,sheet);
function close(){sheet.hidden=true;backdrop.hidden=true}backdrop.onclick=close;document.addEventListener('closeContext',close);document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
const dict={日主:'日主是出生日的天干，是八字关系分析的参照点，不代表一个人的全部性格。',比肩:'同五行同阴阳，传统比喻为同伴、自主与竞争。',劫财:'同五行异阴阳，传统比喻为合作、资源分享与竞争。',食神:'日主所生且同阴阳，象征输出、表达与日常创造。',伤官:'日主所生且异阴阳，象征表达、创新与对规则的质疑。',偏财:'日主所克且同阴阳，作为外部资源与机会的传统比喻。',正财:'日主所克且异阴阳，作为资源管理与稳定投入的传统比喻。',七杀:'克日主且同阴阳，传统比喻为压力、行动和约束。',正官:'克日主且异阴阳，传统比喻为责任、秩序与规范。',偏印:'生日主且同阴阳，传统比喻为非标准学习与支持。',正印:'生日主且异阴阳，传统比喻为学习、照护与支持。',紫微:'紫微常被用作统筹、组织与主体性的象征。',天机:'天机常象征思考、策划与变化。',太阳:'太阳常象征公开表达、付出与外向活动。',武曲:'武曲常象征执行、管理与务实。',天同:'天同常象征感受、协调与安适。',廉贞:'廉贞常象征边界、自我要求与关系张力。',天府:'天府常象征储备、稳定与资源管理。',太阴:'太阴常象征内在感受、细致与积累。',贪狼:'贪狼常象征探索、交际与欲望。',巨门:'巨门常象征语言、辨析与疑问。',天相:'天相常象征协调、支持与规则。',天梁:'天梁常象征照护、原则与经验。',七杀:'七杀在紫微常象征开拓与决断；在八字指克日主且同阴阳的关系。',破军:'破军常象征改变、重组与突破。',禄:'化禄是四化中的资源、顺畅与吸引的传统符号。',权:'化权是四化中的主导、行动与推动的传统符号。',科:'化科是四化中的条理、声誉与表达的传统符号。',忌:'化忌是四化中的牵挂、集中与阻力的传统符号，不等于必然凶事。'};
function show(title,body){sheet.replaceChildren();const h=document.createElement('h3');h.textContent=title;const p=document.createElement('p');p.textContent=body;const note=document.createElement('p');note.className='note';note.textContent='以上为传统术语说明，不是个人事件预测。';const b=document.createElement('button');b.type='button';b.textContent='关闭';b.onclick=close;sheet.append(h,p,note,b);backdrop.hidden=false;sheet.hidden=false;b.focus()}
function term(text,explanation){const b=document.createElement('button');b.type='button';b.className='term';b.textContent=text;b.onclick=e=>{e.stopPropagation();show(text,explanation||dict[text]||'这是传统命理结构中的一个标签，需要结合出生时间、其他星曜与宫位条件理解，不能单独断定事件。')};return b}
const baseBazi=renderBazi;renderBazi=function(b){baseBazi(b);if(!b)return;const box=$('baziBox');box.classList.add('liquid-glass');box.querySelectorAll('td').forEach(td=>{const t=td.textContent;if(dict[t]){td.replaceChildren(term(t));}else if(b.pillars.some(p=>p.stem===t)){td.replaceChildren(term(t,'天干'+t+'；日柱天干为日主，其他天干与日主的关系称十神。'));}else if(td.innerHTML.includes('<br>')||t.includes('本气'))td.replaceChildren(term(t,'藏干表示地支内包含的天干，本气、中气、余气为常见的层次划分；后接名称是相对日主的十神。'));});
const more=document.createElement('div');for(const p of b.pillars){more.append(term(p.name+' · '+p.changsheng,'十二长生是日主在地支上的十二阶段象征。'+p.changsheng+'是其中一个阶段，不是生命长短的判断。'),term(p.name+' · '+p.nayin,'纳音是六十甲子成对对应的传统分类：'+p.stem+p.branch+'对应'+p.nayin+'；不等同于实际五行强弱。'));}more.append(term('神煞','当前尚未实现完整八字神煞计算。本处仅说明术语：神煞属于辅助标签，不会补造个人神煞结果。'));const details=box.querySelector('.chart-details')||box;details.append(more);
const structure=b.structure;
if(structure){
 const summary=document.createElement('div');
 summary.className='bazi-structure';
 const text=(value,tag='p')=>{const p=document.createElement(tag);p.textContent=value;summary.append(p);};
 text('四柱结构','strong');
 const links=document.createElement('div');
 links.className='bazi-relations';
 for(const r of structure.relationships){
  const badge=document.createElement('span');
  badge.className='tag';
  badge.textContent=r.type+' '+r.pattern+' · '+r.pillars.join('／');
  links.append(badge);
 }
 if(!links.childElementCount)text('四柱未见完整的已列合冲刑害组合。');
 summary.append(links);
 text('日主通根 · '+(structure.roots.map(r=>r.pillar+r.branch+'藏'+r.stem+'（'+r.rank+'）').join('、')||'四支未见同五行藏干'));
 text('藏干透出 · '+(structure.revealed.map(r=>r.rootAt+'藏'+r.stem+'透'+r.visibleAt).join('、')||'除日干外未见同字透出'));
 text('日柱旬空 · '+structure.voidBranches.join('、'));
 box.querySelectorAll('.pillar-cards > div').forEach((node,i)=>{
  if(!structure.voidBranches.includes(b.pillars[i].branch))return;
  const badge=document.createElement('small');
  badge.className='pillar-void';
  badge.textContent='空亡';
  node.append(badge);
 });
 box.querySelector('.pillar-cards').after(summary);
}
const controls=document.createElement('div');
controls.className='dynamic-controls';
controls.innerHTML='<label>大运<select id="dynamicLuck"><option value="">仅本命</option>'+b.luck.cycles.map((p,i)=>'<option value="'+i+'">'+p.stem+p.branch+' '+p.age+'岁</option>').join('')+'</select></label><label>流年<input id="dynamicYear" type="number" min="1800" max="2200" placeholder="留空仅本命"></label>';
const output=document.createElement('div');
output.id='dynamicPower';
output.setAttribute('role','status');
box.querySelector('.bazi-structure')?.after(controls,output);
if(!controls.isConnected)box.append(controls,output);
const luck=controls.querySelector('select'),year=controls.querySelector('input'),owner=chart;
let generation=0;
async function refresh(){
 const n=++generation;
 output.textContent='正在计算日元能量…';
 try{
  const req=owner?.birthRequest||inp();
  const r=await post('/api/bazi',{...req,h:req.timeUnknown?12:req.h,mi:req.timeUnknown?0:req.mi,luckIndex:luck.value,flowYear:year.value});
  if(n!==generation||chart!==owner)return;
  if(r.error)throw new Error(r.error);
  const d=r.dynamic;
  output.textContent='日元扶助 '+(d.supportRatio*100).toFixed(1)+'% · '+d.reference+'\n'
   +Object.entries(d.percentages).map(([k,v])=>k+' '+v+'%').join(' · ')+'\n'
   +(d.selected.map(p=>p.kind+' '+p.stem+p.branch).join(' · ')||'本命')+'\n'+d.method;
 }catch(e){if(n===generation&&chart===owner)output.textContent='暂时无法计算：'+e.message;}
}
function setYear(value){
 const i=b.luck.cycles.findIndex((p,index)=>p.startYear<=value&&value<(b.luck.cycles[index+1]?.startYear??p.startYear+10));
 year.value=value??'';
 luck.value=i<0?'':String(i);
 refresh();
}
controls.addEventListener('change',e=>{if(e.target===year&&year.value)setYear(+year.value);else refresh();});
box.updatePeriod=period=>setYear(period?.year??null);
refresh();
};
document.addEventListener('ziweiPeriod',e=>{
 $('baziBox').updatePeriod?.(e.detail);
 renderCrossInsights();
});


})();
// Radar uses existing eight-factor compatibility scores, not a new invented scale.
const sweetSynOriginal=renderSynastry;renderSynastry=function(r){sweetSynOriginal(r);const k=r.vedic?.koota;if(!k?.items?.length)return;const count=k.items.length,point=(i,f)=>{const a=-Math.PI/2+i*2*Math.PI/count;return [150+100*f*Math.cos(a),150+100*f*Math.sin(a)]};const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 300 300');svg.setAttribute('role','img');svg.setAttribute('aria-label','印度八科契合度雷达');for(const scale of [.25,.5,.75,1]){const p=document.createElementNS(svg.namespaceURI,'polygon');p.setAttribute('points',k.items.map((_,i)=>point(i,scale).join(',')).join(' '));p.setAttribute('fill','none');p.setAttribute('stroke','#efcede');svg.append(p)}const p=document.createElementNS(svg.namespaceURI,'polygon');p.setAttribute('points',k.items.map((x,i)=>point(i,x.max?x.score/x.max:0).join(',')).join(' '));p.setAttribute('fill','#ff78aa55');p.setAttribute('stroke','#ff4f8b');svg.append(p);k.items.forEach((x,i)=>{const t=document.createElementNS(svg.namespaceURI,'text'),[cx,cy]=point(i,1.3);t.setAttribute('x',cx);t.setAttribute('y',cy);t.setAttribute('font-size','10');t.setAttribute('text-anchor','middle');t.textContent=x.zh+' '+x.score+'/'+x.max;svg.append(t)});document.getElementById('synBox').prepend(svg);};

function renderCrossInsights(){
 const host=document.getElementById('crossInsights');
 host.replaceChildren();
 if(!chart)return;
 const {western,vedic,bazi,ziwei}=chart;
 const luminary=name=>western.planets.find(p=>p.name===name);
 const star=name=>ziwei?.palaces?.find(p=>p.name===name);
 const starText=name=>{
  const p=star(name);
  if(!p)return '紫微盘待载入';
  if(p.majorStars.length)return p.majorStars.map(s=>s.name+' '+s.brightness).join('、');
  return '借对宫 '+(p.borrowedStars.map(s=>s.name).join('、')||'空宫');
 };
 const insight=(title,signals,reading)=>{
  const card=document.createElement('article');
  card.className='card liquid-glass';
  const header=document.createElement('h3');
  header.textContent=title;
  card.append(header);
  for(const line of [...signals,reading]){
   const p=document.createElement('p');
   p.textContent=line;
   card.append(p);
  }
  host.append(card);
 };
 const day=bazi.dayMaster;
 const lead=luminary('太阳'),moon=luminary('月亮'),venus=luminary('金星'),mars=luminary('火星');
 const vedicMoon=vedic.planets.find(p=>p.key==='moon'||p.name==='月亮');
 const aspect=western.aspects.find(a=>[a.a,a.b].includes('金星')&&[a.a,a.b].includes('月亮'));
 const power=(bazi.strength.supportRatio*100).toFixed(1);
 insight('自我与行动',[
  '西方本命 · 太阳 '+lead.sign+'，第 '+lead.house+' 宫；火星 '+mars.sign+'，第 '+mars.house+' 宫。',
  '八字 · '+day.stem+day.element+'日主，扶助 '+power+'%，'+(bazi.structure?.roots.length?'可在地支见同五行根气。':'四支未见同五行根气。'),
  '紫微命宫 · '+starText('命宫')+'。'
 ],'对照时先分开看你习惯投入的领域、采取行动的方式，以及维持这个节奏所需的资源。火星落宫和紫微命宫提供两条不同的观察线索。');
 insight('工作与资源',[
  '西方本命 · 中天 '+western.mc.sign+'；二宫起点 '+western.cusps[1].toFixed(1)+'°。',
  '紫微 · 官禄 '+starText('官禄')+'；财帛 '+starText('财帛')+'。',
  '八字 · '+(bazi.structure?.relationships.map(r=>r.pattern+' '+r.type).join('、')||'四柱未标出已列的完整合冲刑害')+'。'
 ],'把官禄与中天用来比较工作职责，把财帛与二宫用来比较资源安排。若观察到工作顺手、资源紧张，可分别调整职责边界和预算节奏。');
 insight('情绪与关系',[
  '西方本命 · 月亮 '+moon.sign+'，金星 '+venus.sign+(aspect?'，两星形成'+aspect.type:'')+'。',
  '印度恒星盘 · 月亮 '+(vedicMoon?.sign||'—')+'，宿 '+(vedicMoon?.nakshatra||'—')+'。',
  '紫微夫妻宫 · '+starText('夫妻')+'。'
 ],'西方月亮与印度月宿都可作为观察情绪需求的线索，金星和夫妻宫则用于梳理长期相处方式。两套黄道的星座名称可不同，适合各自解读。');
}
