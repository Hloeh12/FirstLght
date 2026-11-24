import {ZIWEI_FLOW_RULES as flowRules} from '../../www/js/rules.js';
import {formatLocalDisplayTime} from './now.js';
import {practicalZiwei} from '../../src/ziwei-practical.mjs';
import {playSuccessSound,reducedMotion} from './feedback.js';
import {$,btn,esc,term,row,selectedRails,table} from './ui.js';
import {bindSwipeTurn} from './swipe-turn.js';

globalThis.ZIWEI_FLOW_RULES = flowRules;
const branches='子丑寅卯辰巳午未申酉戌亥',stems='甲乙丙丁戊己庚辛壬癸';
const positions=[[4,3],[4,2],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4]];
const months=['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const monthName=n=>(n<0?'闰':'')+months[Math.abs(n)-1]+'月';
const names={heaven:'天盘',earth:'地盘',human:'人盘'};
const marks={命宫:'流命',官禄:'流官',财帛:'流财'};
const colors={禄:'#c68744',权:'#a666ad',科:'#c065a1',忌:'#c43b72'};
const themes={命宫:'处事节奏',父母:'长辈与支持关系',福德:'休息与内在需求',田宅:'居住与家中资源',官禄:'工作与职责',仆役:'人际与协作',迁移:'外部环境与出行',疾厄:'身心节奏',财帛:'收支与资源',子女:'照顾与创作',夫妻:'亲密关系',兄弟:'手足与同辈'};
const starThemes={紫微:'组织与统筹',天机:'思考和变通',太阳:'表达与公开行动',武曲:'执行和资源管理',天同:'协作与舒适',廉贞:'原则与边界',天府:'积累和稳健',太阴:'照料与细节',贪狼:'探索和往来',巨门:'沟通与辨析',天相:'协调和支持',天梁:'照护与经验',七杀:'决断和开拓',破军:'重组与调整'};
const cues={禄:'适合关注可用资源与合作机会',权:'适合明确责任后主动推进',科:'适合梳理信息和公开沟通',忌:'宜核对条件，预留反复与延误的余量'};
const timeLabels={decadal:'大限',yearly:'流年',monthly:'流月',daily:'流日'};
const currentYear=()=>new Date().getFullYear();
const yearName=y=>y+' '+stems[(y-4)%10]+branches[(y-4)%12];
const svgNS='http://www.w3.org/2000/svg';
function svg(tag,attributes){
 const n=document.createElementNS(svgNS,tag);
 for(const [k,v] of Object.entries(attributes))n.setAttribute(k,v);
 return n;
}
function current(ctx){
 return ctx.state.chartState.ziwei??={
  chart:ctx.state.reading.ziwei,selected:ctx.state.reading.ziwei.palaces.find(p=>p.name==='命宫').branch,
  mode:'triad',filter:'all',badge:null,flow:null,token:0,error:''
 };
}
const palace=(z,branch)=>z.palaces.find(p=>p.branch===branch);
const starInfo=s=>s.name+'常用于观察'+(starThemes[s.name]||'其所在宫位的辅助主题')+'。'+(s.brightness?'本宫亮度 '+s.brightness+'。':'');
const mutagenName=(flow,type)=>(flow?.scope==='monthly'?'月':flow?.scope==='daily'?'日':flow?.scope==='decadal'?'限':'流')+type;
function badge(text,type,branch,kind){
 const glyph=String(text).slice(-1);
 return btn(glyph,`class="badge" data-t="${type}" data-badge="${kind}" data-branch-target="${branch}" aria-label="${text}，${cues[type]}" title="${text}"`);
}
function timeBasis(ctx){
 const b=ctx.state.reading.bazi.info;
 const c=b.correction,signed=n=>(n>=0?'+':'')+Number(n).toFixed(1)+' 分';
 const pad=n=>String(n).padStart(2,'0');
 const hourIdx=(h,mi)=>Math.floor(((Number(h)*60+Number(mi||0)+60)%1440)/120);
 const std=b.timeCorrection?.standard||{};
 if(c.corrected){
  const crossPillar=[hourIdx(c.hour,c.minute)!==hourIdx(std.h??b.clock.slice(0,2),std.mi??b.clock.slice(3))&&'跨时柱',c.dayOffset&&(c.dayOffset>0?'跨次日日柱':'跨前日日柱')].filter(Boolean);
  return `<p class="time-basis-note" role="note"><b>时间口径：真太阳时 ${pad(c.hour)}:${pad(c.minute)}（${b.hourBranch}时）</b> · 钟表 ${esc(b.clock)}${b.timeCorrection.dstApplied?' · 夏令时已还原':''} → 经度 ${signed(c.longitudeCorrectionMinutes)} · 均时差 ${signed(c.equationOfTimeMinutes)}${crossPillar.length?` · <b class="tb-warn">${crossPillar.join('，')}</b>——已按真太阳时换柱`:''} · 晚子时${b.lateZishi==='current-day'?'归当日':'归次日'}</p>`;
 }
 return `<p class="time-basis-note" role="note"><b>时间口径：标准钟表时 ${esc(b.clock)}${b.timeCorrection.dstApplied?' · 夏令时已还原（标准时 '+pad(b.timeCorrection.standard.h)+':'+pad(b.timeCorrection.standard.mi)+'）':''}</b> · 真太阳时未启用</p>`;
}
function center(ctx,s){
 const b=ctx.state.reading.bazi.info,z=s.chart,p=ctx.state.profile;
 // v0.47.1：中宫去「白色大框」——旧版在此堆砌公历/农历/闰月/命主身主/起限/实用分类/四化共 12 行，
 // 在盘面正中形成一块满信息的不透明粉白大卡，视觉上压住盘面、用户称「白色大框不要」。
 // 现收敛为安静的四行核心标识：姓名·五行局 / 四柱 / 时点状态 / 日期，配合 CSS 透明无框底。
 return `<div class="zi-center ${s.mode==='triad'?'glow':''}">
  <strong class="zc-name">${esc(p.name)}</strong>
  <span class="zc-sub">${names[z.astroType]} · ${esc(z.fiveElementsClass)}</span>
  <p class="zc-pillars"><b>${esc(p.summary.pillars)}</b></p>
  <p class="zc-now">${esc(s.flow?timeLabels[s.flow.scope]+' '+s.flow.ganZhi:'本命总览')}</p>
  <p class="muted thin zc-stamp">${esc(s.flow?.date||(ctx.state.instantSnapshot?'即刻 '+formatLocalDisplayTime(p.fields):b.solar+' '+b.clock))}</p>
 </div>`;
}
const coreAssist=new Set(['左辅','右弼','文昌','文曲','天魁','天钺','擎羊','陀罗','火星','铃星','地空','地劫']);
function board(ctx,s){
 const z=s.chart,flow=s.flow,source=palace(z,s.selected);
 return `<div class="zi-board" aria-label="紫微十二宫盘面">${z.palaces.map(p=>{
  const [r,c]=positions[p.branch],main=p.majorStars;
  const trans=flow?.mutagens.filter(m=>m.branch===p.branch)||[];
  const annual=p.annualStars??[];
  const star=(x,primary=false,borrowed=false)=>`<div data-zi-star="${esc(x.name)}" ${borrowed?'data-borrowed':''} class="zi-star${primary?' primary-star':''}${borrowed?' zi-borrowed':''}">
   ${term(x.name,starInfo(x))}${x.brightness&&primary?`<small>${esc(x.brightness)}</small>`:''}
   ${x.mutagen?badge('生年'+x.mutagen,x.mutagen,p.branch,'natal'):''}
   ${trans.filter(m=>!borrowed&&m.star===x.name).map(m=>badge(mutagenName(flow,m.type),m.type,p.branch,'period')).join('')}</div>`;
  const auxiliary=p.minorStars.filter(x=>!annual.includes(x.name)||x.mutagen||trans.some(m=>m.star===x.name));
  const priority=x=>x.mutagen||trans.some(m=>m.star===x.name)||coreAssist.has(x.name);
  const assistants=[...auxiliary.filter(priority),...auxiliary.filter(x=>!priority(x))];
  const major=main.length?main.map(x=>star(x,true)).join(''):
   '<span class="zi-borrow-tag">借对宫</span>'+p.borrowedStars.map(x=>star(x,true,true)).join('');
  const active=flow&&marks[flow.palaceNames[p.branch]];
  const styles=['zi-cell',p.branch===s.selected?'selected':'',s.mode==='triad'&&source.relatedBranches.includes(p.branch)&&p.branch!==source.branch?'related':'',
   s.mode==='transform'&&p.stars.some(x=>x.siHua)?'transform':''].join(' ');
  return `<article class="${styles}" data-palace="${p.branch}" aria-label="${esc(p.name)}" tabindex="0" style="grid-row:${r};grid-column:${c}">
   <div class="zi-columns"><div class="zi-major">${major}</div><div class="zi-assist" aria-label="辅星">${assistants.map(x=>star(x)).join('')}</div></div>
   <footer class="zi-foot"><div class="zi-annual">${annual.map(name=>term(name,name+'是岁前或将前十二神之一，随盘局安列。')).join('')}</div>
   <div class="zi-palace-line">${btn(p.name,'class="term" data-palace-name')}${active?`<b class="zi-flow">${active}</b>`:''}</div>
   <div class="zi-age"><span>${esc(p.heavenlyStem+p.earthlyBranch)} ${p.isBodyPalace?'身':''}</span><small>${esc(p.decadal?.range?.join('–')||'')}岁</small></div></footer></article>`;
 }).join('')}<div class="zi-center-slot">${center(ctx,s)}</div><svg class="zi-overlay" aria-hidden="true" preserveAspectRatio="none"></svg></div>${timeBasis(ctx)}`;
}
function clearFlyingLayer(host, canvas){
 canvas.replaceChildren();
 for(const dot of host.querySelectorAll('.flight-target-dot'))dot.remove();
 for(const badge of host.querySelectorAll('.flight-target-pulse'))badge.classList.remove('flight-target-pulse');
}
function overlay(root,s,arrival=false){
 const host=$('.zi-board',root),canvas=$('.zi-overlay',host),r=canvas.getBoundingClientRect();
 const unit=!(r.width&&r.height),w=unit?400:r.width,h=unit?400:r.height;
 const size=w+'×'+h;
 if(canvas.dataset.size===size)return;
 canvas.dataset.size=size;
 canvas.setAttribute('viewBox',`0 0 ${w} ${h}`);
 clearFlyingLayer(host,canvas);
 const point=id=>{
  const cell=$('[data-palace="'+id+'"]',host),b=cell.getBoundingClientRect();
  if(!unit)return [b.left-r.left+b.width/2,b.top-r.top+b.height/2];
  return [(positions[id][1]-.5)*100,(positions[id][0]-.5)*100];
 };
 const p=palace(s.chart,s.selected);
 const source=s.badge?.kind==='natal'?[w/2,h/2]:s.badge?.kind==='period'?point(s.chart.palaces.find(p=>s.flow?.palaceNames[p.branch]==='命宫')?.branch??p.branch):point(s.selected);
 const start=s.mode==='triad'?point(s.selected):source;
 if(s.mode==='triad'){
  const [a,b,c]=p.relatedBranches.slice(1).map(point);
  canvas.append(svg('polygon',{class:'zi-triad',points:[start,a,b].map(x=>x.join(',')).join(' '),fill:'#ff77aa20'}));
  for(const [i,target] of [a,b,c].entries()){
   canvas.append(svg('path',{class:'zi-laser'+(i===2?' zi-opposition':''),pathLength:1,d:'M'+start.join(' ')+' L'+target.join(' ')}));
   canvas.append(svg('circle',{class:'zi-laser-node',cx:target[0],cy:target[1],r:4}));
  }
  canvas.append(svg('circle',{class:'zi-laser-node',cx:start[0],cy:start[1],r:5}));
 }
 if(s.mode==='triad'||s.mode==='transform'&&s.filter==='natal'&&!s.badge)return;
 const badgeMoves=s.badge?.kind==='natal'?s.chart.sihua.map(m=>({...m,branch:s.chart.palaces.find(x=>x.name===m.palace)?.branch})):s.flow?.mutagens;
 const moves=s.badge?(badgeMoves||[]).filter(m=>m.type===s.badge.type&&m.branch===s.selected):
  s.mode==='transform'&&s.filter==='self'?p.flying.filter(m=>m.branch===p.branch):p.flying;
 const defs=svg('defs',{}),capsules=[],ripples=[];
 canvas.append(defs);
 for(const [i,move] of moves.entries()){
  if(!Number.isInteger(move.branch))continue;
  const c=colors[move.type],id='tip-'+move.type;
  const marker=svg('marker',{id,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6,markerHeight:6,orient:'auto'});
  marker.append(svg('path',{class:'flight-tip',d:'M0 0 L10 5 L0 10 Z',fill:c}));defs.append(marker);
  const cell=$('[data-palace="'+move.branch+'"]',host);
  const target=[...cell.querySelectorAll('[data-zi-star]:not([data-borrowed])')].find(el=>el.dataset.ziStar===move.star);
  const existing=target?.querySelector('.badge[data-t="'+move.type+'"]');
  const tag=existing||target?.querySelector('.flight-target-dot')||document.createElement('span');
  if(target&&!tag.isConnected){
   tag.className='badge flight-target-dot';tag.dataset.t=move.type;tag.textContent='化'+move.type;
   tag.setAttribute('aria-label','飞入化'+move.type);target.append(tag);
  }
  tag.classList.remove('flight-target-pulse');
  tag.classList.add('flight-target-pulse');
  const box=tag.getBoundingClientRect(),clip=(target?.closest('.zi-assist')||cell).getBoundingClientRect();
  const visible=!unit&&box.width&&box.height&&box.top>=clip.top&&box.bottom<=clip.bottom;
  const end=visible?[box.left-r.left+box.width/2,box.top-r.top+box.height/2]:point(move.branch);
  const [x,y]=start,dx=end[0]-x,dy=end[1]-y,d=Math.hypot(dx,dy);
  const px=d?-dy/d:0,py=d?dx/d:0,spread=(i-1.5)*Math.min(w,h)*.11;
  const ix=x<w/2?1:-1,iy=y<h/2?1:-1;
  const a=d?[x+dx/d*9,y+dy/d*9]:[x+ix*7,y];
  const b=d?[end[0]-dx/d*(visible?2:9),end[1]-dy/d*(visible?2:9)]:[x,y+iy*8];
  const c1=d?[x+dx*.32+px*spread,y+dy*.32+py*spread]:[x+ix*(38+i*7),y-iy*14];
  const c2=d?[x+dx*.68+px*spread,y+dy*.68+py*spread]:[x-ix*14,y+iy*(39+i*7)];
  const gradient=svg('linearGradient',{id:'flight-'+i,gradientUnits:'userSpaceOnUse',x1:a[0],y1:a[1],x2:b[0],y2:b[1]});
  const warm=move.type==='禄'||move.type==='权';
  gradient.append(svg('stop',{offset:0,'stop-color':warm?'#ffd69f':'#ffb4d1','stop-opacity':'.52'}),
   svg('stop',{offset:'.55','stop-color':warm?'#df9a57':'#ff77aa','stop-opacity':'.86'}),
   svg('stop',{offset:1,'stop-color':c,'stop-opacity':'.93'}));
  defs.append(gradient);
  const path=`M${a.join(' ')} C${c1.join(' ')} ${c2.join(' ')} ${b.join(' ')}`;
  canvas.append(svg('path',{class:'zi-path flying-arc',pathLength:1,stroke:`url(#flight-${i})`,d:path,'marker-end':`url(#${id})`}));
  canvas.append(svg('path',{class:'zi-path flight-current',pathLength:1,stroke:warm?'#fff1d6':'#fff6fb',d:path}));
  if(!reducedMotion()){
   for(let j=0;j<3;j++){
    const particle=svg('circle',{class:'comet-head',r:[3,1.8,1][j],fill:'#fff9fd'});
    particle.style.setProperty('--trail-delay',j*18+'ms');
    particle.append(svg('animateMotion',{path,dur:'.35s',begin:j*18+'ms',fill:'remove',calcMode:'spline',keyTimes:'0;1',keySplines:'.18 .67 .36 1'}));
    canvas.append(particle);
   }
  }
  ripples.push(svg('circle',{class:'flight-ripple',cx:end[0],cy:end[1],r:12,stroke:c,fill:'none'}));
  const mid=[0,1].map(k=>(a[k]+3*c1[k]+3*c2[k]+b[k])/8);
  const cx=Math.min(w-45,Math.max(45,mid[0])),cy=Math.min(h-9,Math.max(9,mid[1]));
  const g=svg('g',{class:'flight-label',transform:`translate(${cx} ${cy})`});
  g.append(svg('rect',{x:-44,y:-8,width:88,height:16,rx:8,fill:'#fffafd',stroke:c,'stroke-width':.6}));
  const label=svg('text',{class:'zi-capsule','text-anchor':'middle','font-size':9,y:3,fill:c});
  label.textContent=(s.badge?.kind==='natal'?'生年':s.badge?.kind==='period'?s.flow.label:p.heavenlyStem+'干')+' → '+move.star+' 化'+move.type;
  g.append(label);capsules.push(g);
 }
 canvas.append(...ripples,...capsules);
 if(arrival&&ripples.length)setTimeout(()=>{if(canvas.isConnected)playSuccessSound();},reducedMotion()?0:280);
}
function railData(s){
 const birthYear=s.chart.decades[0].yearRange[0]-s.chart.decades[0].ageRange[0]+1;
 const first=s.chart.decades[0].ageRange[0];
 const decades=[{palaceName:'童限',ageRange:[1,first-1],yearRange:[birthYear,birthYear+first-2]},...s.chart.decades];
 const y=s.flow?.year??currentYear();
 const i=decades.findIndex(d=>d.yearRange[0]<=y&&d.yearRange[1]>=y);
 const d=decades[i<0?(y<birthYear?0:decades.length-1):i];
 const years=Array.from({length:d.yearRange[1]-d.yearRange[0]+1},(_,j)=>d.yearRange[0]+j);
 return {decades,d,years};
}
export function ziweiPeriodEvidence(chart, flow){
 if(!chart||!flow)return [];
 const rows=flow.mutagens.map(move=>{
  const target=palace(chart,move.branch);
  if(!target)return move.star+'化'+move.type+'：待定位。';
  const phase=flow.palaceNames[target.branch];
  return mutagenName(flow,move.type)+' · '+move.star+'入本命'+target.name+
   (phase?'（当期'+phase+'）':'')+'，观察'+(themes[phase]||themes[target.name]||target.name)+'。'+(flowRules.stars[move.star]?'以'+flowRules.stars[move.star]+'为具体观察点。':'')+flowRules.transformations[move.type];
 });
 const life=chart.palaces.find(p=>flow.palaceNames[p.branch]==='命宫');
 const stars=life?.majorStars.length?life.majorStars:life?.borrowedStars;
 if(stars?.length)rows.unshift('流命主星：'+stars.map(starInfo).join(' '));
 const patterns=practicalZiwei(chart,flow);
 rows.push(...patterns.map(p=>p.name+' · '+p.palace+'：'+p.text));
 return rows;
}

function detail(s){
 const z=s.chart,p=palace(z,s.selected),flow=s.flow;
 const other=p.relatedBranches.slice(1).map(i=>palace(z,i).name);
 const main=p.majorStars.length?p.majorStars:p.borrowedStars;
 const theme=themes[p.name]||p.name,neighbors=other.join('、');
 const related=flow?.palaceNames[p.branch];
 const entering=flow?.mutagens.filter(m=>m.branch===p.branch)||[];
 const opposing=flow?.mutagens.filter(m=>m.branch===(p.branch+6)%12)||[];
 const positives=flow?.mutagens.filter(m=>m.type!=='忌')||[];
 const risk=flow?.mutagens.find(m=>m.type==='忌');
 const weight='三方四正权重 '+p.triadWeight.toFixed(2)+' · 主星亮度权重 '+p.starWeight.toFixed(2)+'（'+(p.majorStars.length?'本宫':'借对宫')+'）';
 const heading=flow?flow.label+' '+flow.ganZhi+' · '+p.name:p.name+' · 本命观察';
 let description=flow
  ? [`选定 ${flow.date}，${p.name}在本时段对应${related||'原宫'}，先观察${theme}。`,
     entering.length?'本宫四化 '+entering.map(m=>m.star+'化'+m.type+'，'+cues[m.type]).join('；')+'。':'本宫本层无直接四化，可结合'+neighbors+'观察。',
     opposing.length?'对宫带入 '+opposing.map(m=>m.star+'化'+m.type).join('、')+'，宜核对两侧条件。':'',
     positives.length?'可用线索 '+positives.map(m=>(palace(z,m.branch)?.name||'待定位')+' '+m.star+'化'+m.type).join('、')+'。':'',
     risk?'留意 '+(palace(z,risk.branch)?.name||'待定位')+' '+risk.star+'化忌，'+cues.忌+'。':'']
  : [`${p.name}观察${theme}。${main.length?'可从'+main.map(x=>starThemes[x.name]||x.name).join('、')+'入手。':'主星资料待补。'}`,'三方 '+other.slice(0,2).join('、')+' · 对宫 '+other[2]+'。'];
 const flying=s.mode==='flying'||s.mode==='transform'&&s.filter!=='natal';
 const moves=(s.mode==='transform'&&s.filter==='self'?p.flying.filter(m=>m.branch===p.branch):p.flying).filter(m=>m.branch!==null);
 const grid=flying?table(['四化','入宫','三方照宫','对冲宫'],moves.map(m=>{
  const t=palace(z,m.branch),[a,b,o]=t.relatedBranches.slice(1).map(id=>palace(z,id).name);
  return [m.star+' 化'+m.type,t.name+(t===p?' · 自化':''),a+'、'+b,o];
 })):'';
 const ziHuaNote=p.ziHua?.length?`<p class="thin">本宫自化：${p.ziHua.map(h=>h.star+h.type).join('、')}——宫干引动落回本宫，力量内聚，事件多在本宫领域内部自行生灭。</p>`:'';
 const laiYinNote=z.laiyin?.laiYinPalace===p.name?'<p class="thin">此宫为来因宫：生年天干落此，是本盘缘起的出发点，格局与执念多由此宫展开。</p>':'';
 return `<article class="card liquid-glass zi-detail" aria-live="polite" data-period-guidance><h2>${esc(heading)}</h2>${[...description,...ziweiPeriodEvidence(z,flow)].filter(Boolean).map(x=>'<p>'+esc(x)+'</p>').join('')}${flying?'<h3>四化飞星明细</h3>'+grid:''}<small>${esc(weight)} · 传统术数观察 · 借星按借入宫重查亮度，并以 0.6 系数计入参考。</small></article>`;
}
/* v0.54.0 逐限翻页：左右滑动 = 上/下一个大限，与八字时点页同一套手势口径。
   基准取 railData() 算出的「当前这一段」（它已经按 flow.year 归到所在大限），
   不再从 flow.scope 反推——scope 为 yearly 时也该从该流年所在的大限往前走一步。 */
let turnDir=0;
function playTurn(ctx,dir){
 const el=$('.period-control',ctx.root);
 if(!el||reducedMotion())return;
 el.classList.remove('turn-next','turn-prev');
 void el.offsetWidth;
 el.classList.add(dir>0?'turn-next':'turn-prev');
 setTimeout(()=>el.classList.remove('turn-next','turn-prev'),460);
}
function turnDecade(ctx,dir){
 const s=current(ctx),{decades,d}=railData(s);
 if(!decades?.length||!d?.yearRange)return;
 const cur=d.yearRange[0];
 const i=decades.findIndex(x=>x.yearRange?.[0]===cur);
 const to=decades[(i<0?0:i)+dir];
 if(!to?.yearRange)return;
 turnDir=dir;
 ctx.state.activeTimeSystem='ziwei';
 setPeriod(ctx,{scope:'decadal',year:to.yearRange[0]});
}
let observer;
export function ziweiView(ctx,arrival=false){
 const s=current(ctx),z=s.chart,flow=s.flow,{decades,d,years}=railData(s);
 const baseYear=flow?.year??d.yearRange[0],baseMonth=flow?.month??1;
 const panel=ctx.root;
 observer?.disconnect();
 const mode=[['flying','飞星模式'],['triad','三合模式'],['transform','四化模式']];
 panel.innerHTML=`<section aria-label="紫微斗数">${ctx.birth?.timeUnknown?'<p class="time-unknown-note" role="note">出生时刻未知，命宫、身宫与生时星按正午 12:00 推定，仅供结构参考，不宜据此断具体应期；填入时刻后可重排。</p>':''}${board(ctx,s)}<article class="card" data-zi-laiyin>${z.laiyin?.laiYinPalace?`<h2>来因宫 · ${esc(z.laiyin.laiYinPalace)}</h2><p class="thin">生年天干落${esc(z.laiyin.laiYinPalace)}，此宫是本盘缘起；自化 ${z.laiyin.palaces.filter(q=>q.ziHua?.length).reduce((n,q)=>n+q.ziHua.length,0)} 处，详见各宫详情与四化模式。</p>`:''}</article>
 <article class="card" data-zi-practical>${practicalZiwei(s.chart,s.flow).map(x=>`<p><b>${esc(x.name+' · '+x.palace)}</b> ${esc(x.text)}</p>`).join('')||'<small>当前未触发双禄、禄冲或羊陀夹忌条件。</small>'}</article>
 <div class="segments liquid-glass" aria-label="紫微模式">${mode.map(([id,label])=>btn(label,`data-mode="${id}" aria-pressed="${id===s.mode}"`)).join('')}</div>
 ${s.mode==='transform'?'<div class="rail" aria-label="四化分析">'+[['natal','生年四化'],['self','自化分析'],['track','飞星轨迹']].map(([id,label])=>btn(label,`data-filter="${id}" aria-pressed="${s.filter===id}"`)).join('')+'</div>':''}
 <section class="period-control liquid-glass" data-swipe-turn="1"><div class="period-control-head"><div><h2>大限与流限</h2><p>点任一格即切换下方当前阶段的专属分析，也可左右滑动换大限。</p></div>${btn('↺ 本命','class="period-master-reset" data-reset-period')}</div><div class="timeline">${row('大限',decades.map(x=>[x.yearRange[0],x.ageRange.join('–')+'岁 '+x.palaceName]),flow?.scope==='decadal'?flow?.year:d.yearRange[0])}
 ${row('流年',[...years.map(y=>[y,yearName(y)])],flow?.scope==='decadal'?'':flow?.year)}
 ${row('流月',Array.from({length:12},(_,i)=>[i+1,monthName(i+1)]),flow?.month)}
 ${row('流日',flow?.days?.length?flow.days.map(x=>[x.day,x.day+'日 '+x.ganZhi]):Array.from({length:new Date(Date.UTC(baseYear,baseMonth,0)).getUTCDate()},(_,i)=>[i+1,(i+1)+'日']),flow?.day)}</div></section>
 <p id="ziStatus" role="status" class="muted">${esc(s.error)}</p><section class="period-result">${detail(s)}</section></section>`;
 overlay(panel,s,arrival);
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(()=>{if($('.zi-board',panel))overlay(panel,s);});observer.observe($('.zi-board',panel));}
 selectedRails(panel);
 for(const b of panel.querySelectorAll('[data-mode]'))b.onclick=()=>{
  s.badge=null;s.mode=b.dataset.mode;if(s.mode==='transform'&&s.filter==='all')s.filter='natal';ziweiView(ctx,s.mode==='flying');
 };
 for(const b of panel.querySelectorAll('[data-filter]'))b.onclick=()=>{s.badge=null;s.filter=b.dataset.filter;ziweiView(ctx,true);};
 for(const cell of panel.querySelectorAll('[data-palace]')){
  const choose=()=>{s.badge=null;s.selected=+cell.dataset.palace;ziweiView(ctx,true);};
  cell.onclick=e=>{if(!e.target.closest('[data-term],[data-badge]')){const name=e.target.closest('[data-palace-name]');choose();if(name)ctx.explain(name.textContent,'该宫常用来观察'+(themes[name.textContent]||'对应生活主题')+'。');}};
  cell.onkeydown=e=>{if(e.target===cell&&['Enter',' '].includes(e.key)){e.preventDefault();choose();}};
 }
 for(const b of panel.querySelectorAll('[data-badge]'))b.onclick=()=>{
  s.selected=+b.dataset.branchTarget;
  if(s.mode==='triad'){s.mode='transform';s.filter='natal';}
  s.badge={kind:b.dataset.badge,type:b.dataset.t};
  ziweiView(ctx,true);
  ctx.explain(b.textContent,cues[b.dataset.t]+'。四化属于当前所选命盘层。');

 };
 const reset=()=>{s.token++;s.flow=null;s.badge=null;s.error='';ziweiView(ctx);ctx.onSelectTimeNode('ziwei');};
 for(const b of panel.querySelectorAll('[data-reset-period]'))b.onclick=reset;
 for(const b of panel.querySelectorAll('[data-rail="大限"] [data-pick="natal"], [data-rail="流年"] [data-pick="natal"]'))b.onclick=reset;
 for(const b of panel.querySelectorAll('[data-rail]'))b.onclick=()=>{
  const v=b.dataset.pick;
  ctx.state.activeTimeSystem='ziwei';
  if(v==='natal'){reset();return;}
  const n=Number(v),key=b.dataset.rail;
  const p=key==='大限'?{scope:'decadal',year:n}:key==='流年'?{scope:'yearly',year:n}:
   key==='流月'?{scope:'monthly',year:baseYear,month:n}:{scope:'daily',year:baseYear,month:baseMonth,day:n};
  setPeriod(ctx,p);
 };
 bindSwipeTurn($('.period-control',panel),dir=>turnDecade(ctx,dir));
 if(turnDir){playTurn(ctx,turnDir);turnDir=0;}
}
async function setPeriod(ctx,p,type){
 const s=current(ctx),n=++s.token;
 const status=$('#ziStatus',ctx.root);if(status)status.textContent='正在更新盘面…';
 try{
  const birth=ctx.birth,z=s.chart;
  const target=type&&type!==z.astroType?await ctx.request('/api/ziwei',{
   ...birth,...Object.fromEntries(ctx.state.reading.bazi.info.solar.split('-').map((x,i)=>[['Y','M','D'][i],+x])),
   dateStr:ctx.state.reading.bazi.info.solar,calendar:'solar',astroType:type,city:birth.city,
   h:birth.timeUnknown?12:birth.h,mi:birth.timeUnknown?0:birth.mi
  }):z;
  const selection=p||(type==='human'?{scope:'decadal',year:railData({...s,chart:target}).d.yearRange[0]}:null);
  const flow=selection?await ctx.request('/api/ziwei-flow',{
   dateStr:target.effectiveDate,timeIndex:target.effectiveTimeIndex,gender:birth.gender,astroType:target.astroType,
   ziweiLeap:birth.ziweiLeap,ziweiSchool:birth.ziweiSchool,flowYear:selection.year,scope:selection.scope,month:selection.month,day:selection.day
  }):null;
  if(ctx.state.chartState.ziwei!==s||n!==s.token)return;
  s.chart=target;s.flow=flow;s.badge=null;s.error='';
 }catch(error){if(n===s.token)s.error=error.message;}
 if(ctx.state.chartState.ziwei===s&&n===s.token&&ctx.state.system==='ziwei'){if(ctx.state.tab==='chart')ziweiView(ctx);if(!s.error)ctx.onSelectTimeNode('ziwei');}
}
export function ziweiTools(ctx,host){
 const s=current(ctx);
 host.innerHTML=`<h3>天地人盘</h3><div class="tool-grid">${Object.entries(names).map(([id,title])=>btn(title,`data-type="${id}" aria-pressed="${s.chart.astroType===id}"`)).join('')}</div>
 <div class="tool-grid">${btn('飞星轨迹开关',`data-flight aria-pressed="${s.mode==='flying'}"`)}${btn('三方四正连线',`data-triad aria-pressed="${s.mode==='triad'}"`)}</div>`;
 for(const b of host.querySelectorAll('[data-type]'))b.onclick=()=>{ctx.close($('#toolSheet'));setPeriod(ctx,s.flow,b.dataset.type);};
 const mode=id=>{ctx.close($('#toolSheet'));s.badge=null;s.mode=id;if(id==='transform')s.filter='natal';ziweiView(ctx,id==='flying');};
 $('[data-flight]',host).onclick=()=>mode(s.mode==='flying'?'transform':'flying');
 $('[data-triad]',host).onclick=()=>mode(s.mode==='triad'?'transform':'triad');
}

export function ziweiPatterns(ctx){
 const chart=current(ctx).chart;
 const stars=chart.palaces.flatMap(x=>x.minorStars.filter(k=>['lucky','sha'].includes(k.type)).map(k=>[x.name,k.name]));
 const d=ctx.sheet('toolSheet','格局神煞',`<div class="chips">${chart.patterns.map(x=>term(x.name,x.description)).join('')||'暂无已识别格局'}</div><div class="stack">${stars.map(([name,star])=>'<p>'+esc(name)+' · '+term(star,starInfo({name:star}))+'</p>').join('')}</div>`);
 for(const b of d.querySelectorAll('[data-term]'))b.onclick=()=>ctx.explain(b.dataset.term,b.dataset.explain);
}
