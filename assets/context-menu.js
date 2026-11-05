(()=>{
const el=id=>document.getElementById(id);let active='west',square=false;
const button=el('btnContextAction');
const shade=document.createElement('div');shade.id='contextShade';shade.hidden=true;const menu=document.createElement('div');menu.id='contextMenu';menu.hidden=true;menu.className='shell-glass';menu.setAttribute('role','dialog');menu.setAttribute('aria-label','盘面功能');document.body.append(shade,menu);
const options={bazi:['大运流年速查','五行强弱分布','地支十神藏干'],west:['本命圆盘/方盘切换','相位容许度调节','四元素占比'],synastry:['双人比较盘','中点盘','契合度雷达']};
function close(){menu.hidden=true;shade.hidden=true;button.setAttribute('aria-expanded','false')};document.addEventListener('closeContext',close);shade.onclick=close;document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
button.onclick=()=>{active=el('resultsHost').querySelector('section.on')?.id||'west';menu.replaceChildren();menu.classList.toggle('ziwei-menu',active==='ziwei');if(active==='ziwei')renderZiweiControls();else for(const [i,label] of (options[active]||['查看当前结果']).entries()){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{close();run(i).catch(e=>show('操作未完成：'+e.message))};menu.append(b)}menu.hidden=false;shade.hidden=false;button.setAttribute('aria-expanded','true')};
function show(text){let box=el('contextResult');if(!box){box=document.createElement('div');box.id='contextResult';box.className='card'}el(active)?.append(box);box.textContent=text;box.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
function requireChart(){if(!chart)throw new Error('请先生成命盘')}
function squareView(){const box=el('westBox'),svg=box.querySelector('svg');let grid=el('squareWest');if(!grid){grid=document.createElement('div');grid.id='squareWest';grid.className='square-west';for(let h=1;h<=12;h++){const cell=document.createElement('div');cell.textContent=h+' 宫\n'+chart.western.planets.filter(p=>p.house===h).map(p=>p.name+' '+p.sign).join('、');grid.append(cell)}svg?.parentNode.insertBefore(grid,svg)}square=!square;grid.hidden=!square;if(svg)svg.style.display=square?'none':'block'}
const ziweiBox=el('ziweiBox');
const starThemes={紫微:'统筹和决策',天机:'思考和变通',太阳:'表达和付出',武曲:'执行和资源管理',天同:'协调和安适',廉贞:'原则和边界',天府:'储备和稳定',太阴:'细致和积累',贪狼:'探索和交际',巨门:'表达和辨析',天相:'协调和支持',天梁:'照护和经验',七杀:'决断和开拓',破军:'改变和重组'};
const palaceThemes={
 命宫:'自我定位和处事方式',父母:'长辈、师长和支持关系',福德:'内在感受和休息方式',
 田宅:'居住环境和家庭资源',官禄:'工作方式和承担的职责',仆役:'团队、人脉和合作方式',
 迁移:'外部环境和跨地域发展',疾厄:'身心节奏和日常照护',财帛:'取得和运用资源的方式',
 子女:'照顾关系、创作与传承',夫妻:'亲密关系和长期合作',兄弟:'手足与同辈关系'
};
let ziweiOwner,selectedBranch,selectedYear,ziweiGeneration=0;
function syncZiweiOwner(){
 if(ziweiOwner===chart)return;
 ziweiOwner=chart;
 selectedBranch=undefined;
 selectedYear=null;
 ziweiGeneration++;
}
function selectPalace(branch){
 syncZiweiOwner();
 const z=chart?.ziwei;
 const palace=z?.palaces.find(p=>p.branch===branch);
 if(!palace)return;
 selectedBranch=branch;
 const grid=ziweiBox.querySelector('.zwgrid');
 if(!grid)return;
 for(const cell of grid.querySelectorAll('[data-branch]')){
  const id=+cell.dataset.branch;
  cell.classList.toggle('selected',id===branch);
  cell.classList.toggle('related',id!==branch&&palace.relatedBranches.includes(id));
  cell.setAttribute('aria-pressed',String(id===branch));
 }
 grid.querySelector('.context-lines')?.remove();
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 svg.classList.add('context-lines');
 svg.setAttribute('viewBox','0 0 4 4');
 svg.setAttribute('preserveAspectRatio','none');
 svg.setAttribute('aria-hidden','true');
 const center=id=>{
  const cell=grid.querySelector('[data-branch="'+id+'"]');
  return [Number(cell.style.gridColumn)-.5,Number(cell.style.gridRow)-.5].join(',');
 };
 for(const id of palace.relatedBranches.filter(id=>id!==branch)){
  const line=document.createElementNS(svg.namespaceURI,'path');
  line.setAttribute('d','M'+center(branch)+' L'+center(id));
  line.setAttribute('class','palace-link');
  svg.append(line);
 }
 grid.append(svg);
 const [triadA,triadB,opposite]=palace.relatedBranches.slice(1).map(id=>z.palaces.find(p=>p.branch===id));
 const main=p=>p.majorStars.map(s=>s.name+(s.brightness?'（'+s.brightness+'）':'')).join('、');
 const emphasis=(palace.majorStars.length?palace:opposite).majorStars.map(s=>starThemes[s.name]).filter(Boolean);
 const detail=el('zwDetail');
 detail.innerHTML='<h3>'+esc(palace.name)+' · 三方四正</h3>';
 for(const content of [
  '这一宫看'+(palaceThemes[palace.name]||'该宫对应的生活主题')+'。'+(main(palace)?'本宫主星为'+main(palace)+'。':'本宫无主星，可参看对宫'+opposite.name+'的主星'+(main(opposite)?'（'+main(opposite)+'）':'')+'。'),
  emphasis.length?'结合星曜看，可以从'+emphasis.join('、')+'这些角度理解'+(palaceThemes[palace.name]||'这一宫的主题')+'。':'',
  '对宫 '+opposite.name+' · 三合 '+triadA.name+'、'+triadB.name+'。把这四个宫位放在一起读，可看出各主题怎样相互牵动。',
  '辅曜 '+(palace.minorStars.map(s=>s.name+(s.mutagen?'化'+s.mutagen:'')).join('、')||'无')
 ].filter(Boolean)){
  const p=document.createElement('p');
  p.textContent=content;
  detail.append(p);
 }
}
ziweiBox.addEventListener('click',e=>{
 const cell=e.target.closest('[data-branch]');
 if(cell)selectPalace(+cell.dataset.branch);
});
ziweiBox.addEventListener('keydown',e=>{
 if(!e.target.matches('[data-branch]')||!['Enter',' '].includes(e.key))return;
 e.preventDefault();
 selectPalace(+e.target.dataset.branch);
});
function renderZiweiControls(){
 syncZiweiOwner();
 const z=chart?.ziwei;
 if(!z?.palaces){menu.textContent='正在载入紫微命盘';return;}
 const modes=document.createElement('div');
 modes.className='ziwei-modes';
 modes.setAttribute('role','group');
 modes.setAttribute('aria-label','盘式');
 for(const [type,title] of Object.entries({heaven:'天盘',earth:'地盘',human:'人盘'})){
  const b=document.createElement('button');
  b.type='button';
  b.textContent=title;
  b.setAttribute('aria-pressed',String(z.astroType===type));
  b.onclick=()=>updateZiwei(type,selectedYear);
  modes.append(b);
 }
 const timeline=document.createElement('div');
 timeline.className='ziwei-time';
 const birthYear=Number(z.effectiveDate.slice(0,4));
 const currentYear=Math.max(birthYear,new Date().getFullYear());
 const rangeButtons=(label,items,selected,click)=>{
  const group=document.createElement('div');
  group.className='ziwei-time-row';
  group.setAttribute('role','group');
  group.setAttribute('aria-label',label);
  for(const {title,year} of items){
   const b=document.createElement('button');
   b.type='button';
   b.textContent=title;
   b.setAttribute('aria-pressed',String(selected(year)));
   b.onclick=()=>click(year);
   group.append(b);
  }
  timeline.append(group);
  return group;
 };
 const decades=z.palaces.filter(p=>p.decadal?.range)
  .map(p=>({title:p.name+' '+p.decadal.range.join('–')+'岁',year:birthYear+p.decadal.range[0]-1}))
  .sort((a,b)=>a.year-b.year);
 const year=selectedYear??currentYear;
 const decadeStart=decades.filter(d=>d.year<=year).at(-1)?.year??birthYear;
 const firstYear=decadeStart+Math.floor((year-decadeStart)/10)*10;
 const years=Array.from({length:10},(_,i)=>({year:firstYear+i,title:String(firstYear+i)}));
 const jump=year=>updateZiwei(z.astroType,year);
 rangeButtons('大限',decades,y=>y===firstYear,jump);
 rangeButtons('流年',[{year:null,title:'本命'},...years],y=>y===selectedYear,jump);
 const status=document.createElement('p');
 status.id='ziweiControlsStatus';
 status.className='note';
 status.setAttribute('role','status');
 menu.append(modes,timeline,status);
 for(const row of timeline.children){
  const selected=row.querySelector('[aria-pressed="true"]');
  if(selected)row.scrollLeft=selected.offsetLeft-row.offsetLeft;
 }
}
function applyZiweiFlow(z,flow){
 ziweiBox.querySelectorAll('.flow-badges').forEach(n=>n.remove());
 el('zwFlowCaption').textContent=flow?flow.year+' '+flow.ganZhi+' · 流年':'';
 if(!flow)return;
 for(const palace of z.palaces){
  const labels=[];
  if(palace.earthlyBranch===flow.yearly.earthlyBranch)labels.push(['流年命宫','']);
  for(const [i,star] of flow.yearly.mutagen.entries()){
   if(palace.stars.some(s=>s.name===star))labels.push(['流'+'禄权科忌'[i],star]);
  }
  if(!labels.length)continue;
  const cell=ziweiBox.querySelector('[data-branch="'+palace.branch+'"]');
  const badges=document.createElement('div');
  badges.className='flow-badges';
  for(const [label,star] of labels){
   const badge=document.createElement('span');
   badge.className='flow-badge';
   badge.textContent=label;
   if(star){badge.title=star;badge.setAttribute('aria-label',star+' '+label);}
   badges.append(badge);
  }
  cell.append(badges);
 }
}
async function updateZiwei(astroType,year){
 syncZiweiOwner();
 const owner=chart,token=++ziweiGeneration,prev=owner.ziwei;
 const status=el('ziweiControlsStatus');
 status.textContent='正在更新紫微盘…';
 try{
  const req=owner.birthRequest;
  const z=astroType===prev.astroType?prev:await post('/api/ziwei',{
   ...req,h:req.timeUnknown?12:req.h,mi:req.timeUnknown?0:req.mi,
   timeIndex:owner.meta.input.ziweiTimeIndex,astroType
  });
  if(z.error)throw new Error(z.error);
  const flow=year===null?null:await post('/api/ziwei-flow',{
   dateStr:z.effectiveDate,timeIndex:z.effectiveTimeIndex,gender:req.gender,flowYear:year,astroType
  });
  if(flow?.error)throw new Error(flow.error);
  if(chart!==owner||token!==ziweiGeneration)return;
  selectedYear=year;
  owner.ziwei=z;
  if(z!==prev){renderZiwei(z);if(selectedBranch!==undefined)selectPalace(selectedBranch);}
  applyZiweiFlow(z,flow);
  if(!menu.hidden&&active==='ziwei'){
   menu.replaceChildren();
   renderZiweiControls();
   el('ziweiControlsStatus').textContent=flow?flow.year+' '+flow.ganZhi+' · '+flow.yearly.mutagen.map((s,i)=>s+'化'+'禄权科忌'[i]).join(' · '):'已显示本命盘';
  }
 }catch(error){
  if(chart===owner&&token===ziweiGeneration&&status.isConnected)status.textContent='更新失败：'+error.message;
 }
}
async function run(i){requireChart();if(active==='bazi'){const b=chart.bazi;if(i===0)show('起运 '+b.luck.startAge+' 岁\n'+b.luck.cycles.map(c=>c.startYear+' '+c.stem+c.branch+' '+c.age+'岁').join('\n')+'\n流年：'+b.flowYears.map(y=>y.year+' '+y.stem+y.branch).join('、'));if(i===1)show(Object.entries(b.elementPercentages).map(([k,v])=>k+' '+v+'%').join('\n')+'\n'+b.strength.reference+'（简化加权参考）');if(i===2)show(b.pillars.map(p=>p.name+' '+p.stem+p.branch+'：'+b.hiddenStems[p.name].map(s=>s.stem+' '+s.rank+' '+s.tenGod).join('、')).join('\n'));return;}
if(active==='west'){if(i===0)squareView();if(i===2)show(Object.entries(chart.analysis.elements.percentages).map(([k,v])=>k+' '+Math.round(v)+'%').join('\n'));if(i===1){let panel=el('orbSetting');if(panel){panel.remove();return;}panel=document.createElement('div');panel.id='orbSetting';panel.innerHTML='<label>相位最大容许度：<output>6</output>° <input type="range" min="1" max="10" step="0.5" value="6"></label><p class="note">仅调整当前西方盘的相位显示，不改变出生参数。</p>';el('westBox').prepend(panel);panel.querySelector('input').oninput=e=>{const limit=+e.target.value;const ps=chart.western.planets,list=[];for(let a=0;a<ps.length;a++)for(let b=a+1;b<ps.length;b++){let sep=Math.abs(ps[a].lon-ps[b].lon);sep=Math.min(sep,360-sep);for(const [angle,type] of [[0,'合相'],[60,'六分相'],[90,'四分相'],[120,'三分相'],[180,'对分相']])if(Math.abs(sep-angle)<=limit){list.push({a:ps[a].name,b:ps[b].name,angle,type,orb:Math.abs(sep-angle)});break;}}const west={...chart.western,aspects:list};renderWest(west,chart.analysis);el('westBox').prepend(panel);panel.querySelector('output').textContent=limit;};}return;}
if(active==='synastry'){if(i<2){el('mode').value=i===0?'synastry':'composite';el('btnSyn').click();}else{el('mode').value='synastry';el('btnSyn').click();show('正在计算双人比较盘；评分采用现有印度八科 36 分制，查看下方合盘结果。')}return;}show('当前功能结果已显示。')}
})();
