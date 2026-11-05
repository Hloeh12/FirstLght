'use strict';

const ziweiWorkbench=(()=>{
 const box=document.getElementById('ziweiBox');
 const svgNS='http://www.w3.org/2000/svg';
 const modes={triad:'三合总览',flying:'飞星四化',patterns:'格局神煞'};
 const colors={禄:'#137b67',权:'#ab6321',科:'#5152aa',忌:'#bd3364'};
 const themes={
  命宫:'自我定位与行动节奏',父母:'长辈与支持关系',福德:'休息与内在状态',田宅:'居住与家庭资源',
  官禄:'工作与职责',仆役:'团队与人际协作',迁移:'外部环境与出行',疾厄:'身心节奏与日常照护',
  财帛:'资源与收支安排',子女:'照顾与创作',夫妻:'亲密关系与长期合作',兄弟:'手足与同辈协作'
 };
 const monthNames=['正','二','三','四','五','六','七','八','九','十','冬','腊'];
 const stems='甲乙丙丁戊己庚辛壬癸',branches='子丑寅卯辰巳午未申酉戌亥';
 const monthName=m=>(m<0?'闰':'')+monthNames[Math.abs(m)-1]+'月';
 const yearName=y=>y+' '+stems[(y-4)%10]+branches[(y-4)%12];
 let owner,z,branch,mode,flow,decade,epoch=0;

 function initialDecade(){
  const year=new Date().getFullYear();
  return Math.max(0,z.decades.findIndex(d=>d.yearRange[0]<=year&&year<=d.yearRange[1]));
 }
 function mount(natal){
  box.removeAttribute('aria-busy');
  if(owner!==chart){
   owner=chart;
   branch=natal.palaces.find(p=>p.name==='命宫').branch;
   mode='triad';
   flow=null;
   epoch++;
  }
  z=natal;
  if(!flow)decade=initialDecade();
  render();
 }
 function element(tag,cls,text){
  const node=document.createElement(tag);
  if(cls)node.className=cls;
  if(text)node.textContent=text;
  return node;
 }
 function svgElement(tag,attrs){
  const node=document.createElementNS(svgNS,tag);
  for(const [key,value] of Object.entries(attrs))node.setAttribute(key,value);
  return node;
 }
 function plot(grid,p){
  const canvas=svgElement('svg',{class:'context-lines zw-overlay',viewBox:'0 0 400 400',preserveAspectRatio:'none','aria-hidden':'true'});
  const point=id=>{
   const cell=grid.querySelector('[data-branch="'+id+'"]');
   return [Number(cell.style.gridColumn)*100-50,Number(cell.style.gridRow)*100-50];
  };
  const [x,y]=point(p.branch);
  if(mode==='triad'){
   const [a,b,opposite]=p.relatedBranches.slice(1).map(point);
   canvas.append(svgElement('polygon',{class:'palace-link triad-polygon',points:[[x,y],a,b].map(v=>v.join(',')).join(' ')}),
    svgElement('path',{class:'palace-link opposition',d:`M${x} ${y} L${opposite.join(' ')}`}));
   grid.querySelector('.zwcenter').classList.add('triad-glow');
  }
  if(mode==='flying'){
   const defs=svgElement('defs',{});
   canvas.append(defs);
   const pills=[];
   for(const [i,move] of p.flying.entries()){
    if(move.branch===null)continue;
    const color=colors[move.type],id='flying-arrow-'+i;
    const arrow=svgElement('marker',{id,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto'});
    arrow.append(svgElement('path',{d:'M0 0 L10 5 L0 10 Z',fill:color}));
    defs.append(arrow);
    const [tx,ty]=point(move.branch);
    const dx=tx-x,dy=ty-y,distance=Math.hypot(dx,dy);
    const tilt=(i-1.5)*31, nx=distance?-dy/distance:0, ny=distance?dx/distance:0;
    const inwardX=x<200?1:-1,inwardY=y<200?1:-1;
    const start=distance?[x+dx/distance*12,y+dy/distance*12]:[x+inwardX*10,y];
    const end=distance?[tx-dx/distance*17,ty-dy/distance*17]:[x,y+inwardY*10];
    const c1=distance?[x+dx*.28+nx*tilt,y+dy*.28+ny*tilt]:[x+inwardX*(70+i*9),y-inwardY*25];
    const c2=distance?[x+dx*.72+nx*tilt,y+dy*.72+ny*tilt]:[x-inwardX*15,y+inwardY*(72+i*9)];
    const path=svgElement('path',{class:'flying-arc',d:`M${start.join(' ')} C${c1.join(' ')} ${c2.join(' ')} ${end.join(' ')}`,stroke:color,'marker-end':`url(#${id})`});
    canvas.append(path);
    const cx=Math.max(47,Math.min(353,(start[0]+3*c1[0]+3*c2[0]+end[0])/8));
    const cy=Math.max(12,Math.min(388,(start[1]+3*c1[1]+3*c2[1]+end[1])/8));
    const label=svgElement('g',{class:'flying-pill',transform:`translate(${cx} ${cy})`});
    label.append(svgElement('rect',{x:-46,y:-8,width:92,height:16,rx:8,fill:'#fffafd',stroke:color}));
    const text=svgElement('text',{'text-anchor':'middle',y:3,fill:color});
    text.textContent=p.heavenlyStem+'干 → '+move.star+' 化'+move.type;
    label.append(text);
    pills.push(label);
   }
   canvas.append(...pills);
  }
  grid.append(canvas);
 }
 function select(id){
  branch=id;
  const palace=z.palaces.find(p=>p.branch===id);
  const grid=box.querySelector('.zwgrid');
  for(const cell of grid.querySelectorAll('[data-branch]')){
   const target=+cell.dataset.branch;
   cell.classList.toggle('selected',target===id);
   cell.classList.toggle('related',mode==='triad'&&target!==id&&palace.relatedBranches.includes(target));
   cell.classList.toggle('flying-target',mode==='flying'&&palace.flying.some(m=>m.branch===target));
   cell.setAttribute('aria-pressed',String(target===id));
  }
  grid.querySelector('.zw-overlay')?.remove();
  grid.querySelector('.zwcenter').classList.remove('triad-glow');
  plot(grid,palace);
  renderPeriod(palace);
 }
 function renderPeriod(palace){
  const card=box.querySelector('#zwDetail');
  const add=(tag,text,cls)=>card.append(element(tag,cls,text));
  const period=flow?flow.label+' '+flow.ganZhi:'本命';
  const when=flow?.month?flow.year+'年 '+monthName(flow.month)+(flow.day?' '+flow.day+'日':''):flow?.year?String(flow.year):'';
  card.replaceChildren();
  add('div',[period,when].filter(Boolean).join(' · '),'zw-kicker');
  add('h3',flow?'当前时空 · 吉凶指引':palace.name+' · 本命观察');
  if(flow){
   const cues={禄:'可关注资源与合作机会',权:'可主动推进，但宜明确责任',科:'适合梳理信息、沟通与求证',忌:'先核对条件，给反复与延误留余量'};
   const life=Object.entries(flow.palaceNames).filter(([,name])=>['命宫','官禄','财帛'].includes(name))
    .map(([id,name])=>name+'落本命'+z.palaces.find(p=>p.branch===+id).name);
   add('p',life.join(' · '),'note');
   for(const m of flow.mutagens){
    const target=z.palaces.find(p=>p.branch===m.branch);
    add('p',m.star+'化'+m.type+' · '+(target?(themes[target.name]||target.name)+'方面，'+cues[m.type]+'。':'当前盘未定位该星。'));
   }
  }
  if(mode==='patterns'){
   for(const p of z.patterns)add('p',p.name+' · '+p.description);
   if(!z.patterns.length)add('p','当前规则未识别已实现的本命格局。');
   const stars=palace.minorStars.filter(s=>['lucky','sha'].includes(s.type));
   add('p',palace.name+'吉煞 · '+(stars.map(s=>s.name).join('、')||'无已标注的吉煞星'));
  }else if(mode==='flying'){
   const destinations=palace.flying.map(m=>{
    const target=z.palaces.find(p=>p.branch===m.branch);
    return m.star+'化'+m.type+' → '+(target?.name||'未定位')+(target===palace?'（自化）':'');
   });
   add('p',palace.name+' · '+palace.heavenlyStem+'干飞化');
   add('p',destinations.join(' · '),'note');
  }else{
   const related=palace.relatedBranches.slice(1).map(id=>z.palaces.find(p=>p.branch===id).name);
   add('p',palace.name+'观察'+themes[palace.name]+'。对宫 '+related[2]+' · 三合 '+related.slice(0,2).join('、')+'。');
  }
  add('p','传统术数解读，作为观察和安排的参考。','note');
 }
 function control(text,active,action){
  const b=element('button','',text);
  b.type='button';
  b.setAttribute('aria-pressed',String(active));
  b.onclick=action;
  return b;
 }
 function render(focus){
  box.innerHTML=drawZiweiGrid(z,flow);
  const controls=element('div','zw-mode liquid-glass');
  controls.setAttribute('aria-label','紫微显示模式');
  for(const [id,title] of Object.entries(modes)){
   const b=control(title,id===mode,()=>{
    mode=id;
    for(const item of controls.children)item.setAttribute('aria-pressed',String(item===b));
    select(branch);
   });
   controls.append(b);
  }
  const timeline=element('div','zw-timeline liquid-glass');
  const row=(label,entries,active,click)=>{
   const item=element('div','zw-rail');
   const scroller=element('div','zw-rail-scroll');
   scroller.setAttribute('role','group');
   scroller.setAttribute('aria-label',label);
   for(const [id,title] of entries){
    const b=control(title,id===active,()=>click(id,{label,id}));
    b.dataset.key=String(id);
    scroller.append(b);
   }
   if(!entries.length)scroller.append(element('span','note',label==='流月'?'选择流年后展开':'选择流月后展开'));
   item.append(element('strong','zw-rail-label',label),scroller);
   timeline.append(item);
   return scroller;
  };
  const [start,end]=z.decades[decade].yearRange;
  row('大限',z.decades.map((d,i)=>[i,d.ageRange.join('–')+'岁 · '+d.palaceName]),decade,
   (i,f)=>request({scope:'decadal',year:z.decades[i].yearRange[0]},f));
  row('流年',[[null,'本命'],...Array.from({length:end-start+1},(_,i)=>[start+i,yearName(start+i)])],flow?.scope==='decadal'?undefined:flow?.year??null,
   (year,f)=>year===null?reset(f):request({scope:'yearly',year},f));
  row('流月',flow&&flow.scope!=='decadal'?flow.months.map(m=>[m.month,monthName(m.month)]):[],flow?.month,
   (month,f)=>request({scope:'monthly',year:flow.year,month},f));
  row('流日',flow?.days.map(d=>[d.day,d.day+'日 '+d.ganZhi])||[],flow?.day,
   (day,f)=>request({scope:'daily',year:flow.year,month:flow.month,day},f));
  const status=element('p','note');
  status.id='ziweiControlsStatus';
  status.setAttribute('role','status');
  const card=element('article','zw-period liquid-glass');
  card.id='zwDetail';
  card.setAttribute('aria-live','polite');
  timeline.append(status);
  box.append(controls,timeline,card);
  select(branch);
  for(const scroller of timeline.querySelectorAll('.zw-rail-scroll')){
   const selected=scroller.querySelector('[aria-pressed="true"]');
   if(selected)scroller.scrollLeft=selected.offsetLeft-8;
   if(focus?.label===scroller.getAttribute('aria-label')){
    [...scroller.querySelectorAll('button')].find(b=>b.dataset.key===String(focus.id))?.focus({preventScroll:true});
   }
  }
 }
 function reset(focus){
  box.removeAttribute('aria-busy');
  epoch++;
  flow=null;
  render(focus);
  document.dispatchEvent(new CustomEvent('ziweiPeriod',{detail:null}));
 }
 async function request(selection,focus,astroType=z.astroType){
  const token=++epoch,current=owner;
  const status=box.querySelector('#ziweiControlsStatus');
  status.textContent='正在计算'+(astroType!==z.astroType?'新盘式':'所选时空')+'…';
  box.setAttribute('aria-busy','true');
  try{
   const birth=current.birthRequest;
   const next=astroType===z.astroType?z:await post('/api/ziwei',{
    ...birth,h:birth.timeUnknown?12:birth.h,mi:birth.timeUnknown?0:birth.mi,
    timeIndex:current.meta.input.ziweiTimeIndex,astroType
   });
   if(next.error)throw new Error(next.error);
   const result=selection?await post('/api/ziwei-flow',{
    dateStr:next.effectiveDate,timeIndex:next.effectiveTimeIndex,gender:birth.gender,astroType,
    flowYear:selection.year,scope:selection.scope,month:selection.month,day:selection.day
   }):null;
   if(result?.error)throw new Error(result.error);
   if(token!==epoch||chart!==current)return;
   z=next;
   current.ziwei=next;
   window.currentZiwei=next;
   flow=result;
   decade=result?Math.max(0,z.decades.findIndex(d=>d.yearRange[0]<=result.year&&d.yearRange[1]>=result.year)):initialDecade();
   render(focus);
   document.dispatchEvent(new CustomEvent('ziweiPeriod',{detail:result}));
  }catch(error){
   if(token===epoch&&chart===current)status.textContent='载入失败：'+error.message;
  }finally{
   if(token===epoch&&chart===current)box.removeAttribute('aria-busy');
  }
 }
 box.addEventListener('click',e=>{
  const cell=e.target.closest('[data-branch]');
  if(cell&&owner===chart)select(+cell.dataset.branch);
 });
 box.addEventListener('keydown',e=>{
  if(!e.target.matches('[data-branch]')||!['Enter',' '].includes(e.key)||owner!==chart)return;
  e.preventDefault();
  select(+e.target.dataset.branch);
 });
 return {
  mount,
  setType(type){if(z&&owner===chart&&type!==z.astroType)request(flow,null,type);},
  current(){return owner===chart?flow:null;}
 };
})();
function mountZiweiWorkbench(z){ziweiWorkbench.mount(z);}
function changeZiweiType(type){ziweiWorkbench.setType(type);}
