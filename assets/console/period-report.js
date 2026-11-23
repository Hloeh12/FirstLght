// 时点专项报告工作台：在洞见页按「大运/流年/流月/流日」分别生成详细报告，
// 并把该时点的命盘快照直观嵌进报告正文——对标专业命理 App 的「选流年→出盘+出详批」体验。
// 全部离线：复用现有 deep-* 知识库与本机 API，不臆造事件、不设字数上限。
import {buildBaziDeepReport} from '../../www/js/deep-bazi.js';
import {buildZiweiDeepReport} from '../../www/js/deep-ziwei.js';
import {buildVedicDeepReport} from '../../www/js/deep-vedic.js';
import {buildWesternDeepReport} from '../../www/js/deep-west.js';
import {baziGrid} from './bazi.js';
import {northIndianChart} from './vedic.js';
import {wheel} from './western.js';
import {divisional} from '../../src/vargas.mjs';
import {focusSections} from './period-focus.mjs';
export {focusSections};
import {$,btn,esc,table,selectedRails,renderReportPara} from './ui.js';

const NAMES={bazi:'八字',ziwei:'紫微斗数',vedic:'印度占星',west:'西洋占星'};
const SCOPES={bazi:[['luck','大运'],['year','流年'],['month','流月'],['day','流日']],
 ziwei:[['decadal','大限'],['yearly','流年'],['monthly','流月'],['daily','流日']],
 vedic:[['maha','大运'],['antar','小运'],['year','流年']],
 west:[['transit','行运'],['secondary','次限'],['solar','日返'],['profection','小限']]};

/* ---------- 盘面快照：报告里直观显示的命盘（静态、可导出） ---------- */

// 紫微十二宫格快照（不依赖 ctx，直接基于 chart.palaces + flow）。飞星/连线交给交互盘，快照保证静态可读。
function ziweiSnapshot(chart,flow,profile){
 const branches='子丑寅卯辰巳午未申酉戌亥';
 const positions=[[4,3],[4,2],[4,1],[3,1],[2,1],[1,1],[1,2],[1,3],[1,4],[2,4],[3,4],[4,4]];
 const flowMark={命宫:'流命',官禄:'流官',财帛:'流财'};
 const palaces=(chart?.palaces||[]);
 const pal=branch=>palaces.find(p=>p.branch===branch);
 const flowOf=branch=>flow?.mutagens?.filter(m=>m.branch===branch)||[];
 const cells=palaces.map(p=>{
  const [r,c]=positions[p.branch]||[1,1];
  const majors=p.majorStars?.length?p.majorStars:(p.borrowedStars||[]);
  const borrowed=!p.majorStars?.length;
  const stars=majors.slice(0,4).map(s=>{
   const fm=flowOf(p.branch).filter(m=>m.star===s.name).map(m=>m.type).join('');
   return `<b data-e="${esc(s.element||'')}">${esc(s.name)}</b>${s.brightness?`<i>${esc(s.brightness)}</i>`:''}${fm?`<em class="snap-flow">${esc(fm)}</em>`:''}`;
  }).join('');
  const minor=(p.minorStars||[]).slice(0,3).map(s=>`<span>${esc(s.name)}</span>`).join('');
  const active=flow&&flowMark[flow.palaceNames?.[p.branch]];
  return `<div class="snap-zi-cell${borrowed?' borrowed':''}${active?' flow-active':''}" style="grid-row:${r};grid-column:${c}">
   <div class="snap-zi-stars">${stars||'<span class="snap-empty">空宫</span>'}</div>
   <div class="snap-zi-minor">${minor}</div>
   <div class="snap-zi-foot"><b>${esc(p.name)}</b><span>${esc(p.heavenlyStem||'')}${esc(p.earthlyBranch||p.branch)}</span></div>
   ${active?`<span class="snap-flow-tag">${esc(active)}</span>`:''}
  </div>`;
 }).join('');
 const center=`<div class="snap-zi-center"><b>${esc(profile?.name||'命主')}</b><span>${esc(chart?.fiveElementsClass||'')}</span><span>${esc(flow?(flow.label+' '+(flow.ganZhi||'')):'本命盘')}</span><small>${esc(flow?.date||chart?.effectiveDate||'')}</small></div>`;
 return `<div class="snap-board snap-zi">${cells}${center}</div>`;
}

/* v0.50.0 时点落点：从一份盘面数据反查「当前到底在看哪一刻」，
   统一给「时点杆 / 盘内 caption / 报告标题」三处使用，避免三套文案各说各话。 */
export function baziMoment(data,sel={}){
 const cycles=data?.cycles||[],years=data?.years||[],months=data?.months||[],days=data?.days||[],hours=data?.hours||[];
 const gz=p=>p&&p.stem?`${p.stem}${p.branch}`:'';
 const li=Number.isInteger(sel.luck)?sel.luck:null;
 const c=li!=null?cycles[li]:null;
 const yi=years.findIndex(y=>String(y.year)===String(sel.year));
 const y=yi<0?null:years[yi];
 const mi=Number.isInteger(sel.month)?sel.month:0;
 const m=months[mi]||null;
 // v0.59.0：择日页会带到「日 + 时辰」两层，落点必须能说到哪一天哪一个时辰，
 // 否则报告标题停在流月，用户看不出这是「那一时辰」的盘。
 const d=Number.isInteger(sel.day)?days[sel.day]||null:null;
 const hr=Number.isInteger(sel.hour)?hours[sel.hour]||null:null;
 const dayLabel=d?`${d.date.slice(5)} ${gz(d)}日`:'';
 const hourLabel=hr?`${hr.branch}时`:'';
 const nextStart=months[mi+1]?.date?.slice(5,10);
 const range=c&&c.startYear?`${c.startYear}–${c.endYear??c.startYear+9}`:'';
 return {
  // 落点卡主行：年·干支 + 月·干支，一眼确认是哪一年哪一月；带日/时时继续往后接
  title:[[y?`${y.year} ${gz(y)}年`:'',m?`${m.label||''} ${gz(m)}月`:''].filter(Boolean).join(' · '),dayLabel,hourLabel].filter(Boolean).join(' · '),
  // 次行：第几步大运 + 起止年（不再把节气区间挤在同一行，避免折成两截）
  sub:li!=null?`第${li+1}步 ${gz(c)}大运${range?' · '+range:''}`:'本命原局（未叠流运）',
  // 第三行：该月节气区间，单独成 chip
  span:m?.date?`节气 ${m.date.slice(5,10)}${nextStart?' → '+nextStart:''}`:'',
  // 兼容旧调用：合并成一行纯文本
  subLine:[
   li!=null?`第${li+1}步 ${gz(c)}大运${range?' '+range:''}`:'本命原局（未叠流运）',
   m?.date?`${m.date.slice(5,10)}${nextStart?'→'+nextStart:''}`:''
  ].filter(Boolean).join(' · '),
  // 报告标题/章节前缀用短式：长串会把封面标题挤成三行
  brief:[[y?`${y.year} ${gz(y)}年`:'',m?`${m.label||''}${gz(m)}月`:''].filter(Boolean).join(' '),dayLabel,hourLabel].filter(Boolean).join(' '),
  cue:[li!=null?`第${li+1}步大运`:'',y?`${y.year} 年`:'',hourLabel].filter(Boolean).join(' · ')
 };
}
// 供 app.js 级联重算后重建选项与盘面：把后端返回的 selected 反查成三组索引。
export function baziSelOf(data){
 const cycles=data?.cycles||[],years=data?.years||[],months=data?.months||[];
 const sel=data?.selected||[];
 const c=sel.find(p=>p?.name==='大运'),y=sel.find(p=>p?.name==='流年'),m=sel.find(p=>p?.name==='流月');
 const d=sel.find(p=>p?.name==='流日'),h=sel.find(p=>p?.name==='流时');
 const nowY=new Date().getFullYear();
 const luck=Number.isInteger(c?.index)?c.index:(()=>{
  const i=cycles.findIndex(x=>(x.startYear??9999)<=nowY&&nowY<(x.endYear??x.startYear+10));
  return i<0?0:i;
 })();
 const year=Number.isInteger(y?.year)?y.year:(years.find(x=>x.year===nowY)?.year??years[0]?.year);
 const month=Number.isInteger(m?.index)?m.index:0;
 // 日/时只有在确实被选中时才回填，否则盘面会平白多两列、而选择器又改不动它们。
 return {luck,year,month,
  day:Number.isInteger(d?.index)?d.index:null,
  hour:Number.isInteger(h?.index)?h.index:null};
}
/* v0.50.0：三组下拉与流月速选条的选项 HTML 统一由这里产出。
   初次渲染与切换后的级联重建共用同一份逻辑，避免两边选项口径漂移。 */
export function baziPickOptions(data,sel={}){
 const cycles=data?.cycles||[],years=data?.years||[],months=data?.months||[];
 // 报告内下拉宽度有限：去掉「（2017起）」这类冗余，只留「第几步 + 干支」，
 // 完整起止年交给上方落点卡显示，避免 option 文字被原生控件裁掉。
 const opt=(list,on,fmt)=>list.map((x,i)=>`<option value="${esc(String(x))}"${String(on)===String(x)?' selected':''}>${esc(fmt(i))}</option>`).join('');
 const cOpts=cycles.length?opt(cycles.map((_,i)=>i),sel.luck,(i)=>`第${i+1}步 ${cycles[i].stem||''}${cycles[i].branch||''}`):'<option>无大运</option>';
 const yOpts=years.length?opt(years.map(x=>x.year),sel.year,(i)=>`${years[i].year} ${years[i].stem||''}${years[i].branch||''}`):'<option>无流年</option>';
 const mOpts=months.length?opt(months.map((_,i)=>i),sel.month,(i)=>`${months[i].label||months[i].date?.slice(5)||''} ${months[i].stem||''}${months[i].branch||''}`):'<option>无流月</option>';
 const monthRail=months.map((m,i)=>`<button type="button" class="bf-month${i===sel.month?' on':''}" data-bf-month="${i}" aria-pressed="${i===sel.month}" title="${esc((m.label||'')+' '+m.stem+m.branch+(m.date?' · '+m.date.slice(0,10)+' 起':''))}"><b>${esc((m.stem||'')+(m.branch||''))}</b><small>${esc(m.label||'')}</small></button>`).join('');
 // 流年速览：当前这步大运的十年一字排开，点一下换年——十年一屏，比翻下拉更接近「时间轴」直觉。
 const yearRail=years.map(y=>`<button type="button" class="bf-year${String(y.year)===String(sel.year)?' on':''}" data-bf-year="${esc(String(y.year))}" aria-pressed="${String(y.year)===String(sel.year)}" title="${esc(y.year+' '+(y.stem||'')+(y.branch||'')+' 年')}"><b>${esc(String(y.year).slice(2))}</b><small>${esc((y.stem||'')+(y.branch||''))}</small></button>`).join('');
 return {cOpts,yOpts,mOpts,monthRail,yearRail};
}
// 八字时点详盘：本命四柱 + 大运/流年/流月（择日页进入时再叠流日/流时），完整十神/藏干/星运/神煞/纳音。
// v0.50.0：三组 select 改为真正级联——改大运 → 流年列表收窄到该运年份；改流年 → 流月重排；
// 任一处变更都回后端按新选择重算，所以盘面、落点文案、报告正文三者永远同源。
// v0.49 之前的版本只换大运那一列，流年/流月停在「今天」，于是出现「选了第8步、右边还是2026」。
function baziSnapshot(data,selection={},scope='luck'){
 const natal=(data?.pillars||[]).filter(Boolean);
 const cycles=data?.cycles||[],years=data?.years||[],months=data?.months||[];
 const sel=baziSelOf(data);
 const moment=baziMoment(data,sel);
 const pickFlow=(l,y,m)=>{
  const yi=years.findIndex(x=>String(x.year)===String(y));
  // 择日页带来的「流日 + 流时」也要落到盘上，否则说「看这一刻」却只画到流月。
  const day=Number.isInteger(sel.day)?(data?.days||[])[sel.day]:null;
  const hour=Number.isInteger(sel.hour)?(data?.hours||[])[sel.hour]:null;
  return [cycles[l],yi<0?null:years[yi],months[m],day,hour].filter(p=>p&&p.stem&&p.branch).map(p=>({...p}));
 };
 const gridOf=(l,y,m)=>{
  const pillars=[...natal,...pickFlow(l,y,m)];
  return `<div class="bazi-grid rpt-bazi-grid" style="--bg-cols:${pillars.length}">${baziGrid({...data,pillars})}</div>`;
 };
 const {cOpts,yOpts,mOpts,monthRail,yearRail}=baziPickOptions(data,sel);
 // 数据挂全局，由 app.js 的事件委托负责级联重算（innerHTML 注入的 <script> 不会执行）。
 const uid='bf'+Math.random().toString(36).slice(2,8);
 globalThis.__FL_BAZI_FLOW__={[uid]:{uid,scope,sel,data}};
 return `<div class="snap-bazi" data-bazi-flow="${uid}" data-bf-scope="${esc(scope)}">
  <div class="bf-clock card liquid-glass">
   <div class="bf-clock-top">
    <span class="bf-clock-kicker">当前时点</span>
    <button type="button" class="bf-now" data-bf-now>↺ 回到当下</button>
   </div>
   <b class="bf-clock-title" data-bf-moment>${esc(moment.title||'本命原局')}</b>
   <div class="bf-clock-meta">
    <span data-bf-moment-sub>${esc(moment.sub)}</span>
    ${moment.span?`<span class="bf-clock-span">${esc(moment.span)}</span>`:''}
   </div>
  </div>
  <div class="bf-picks" role="group" aria-label="切换八字时点">
   <div class="bf-luck-row">
    <button type="button" class="bf-step" data-bf-step="-1" aria-label="上一步大运">‹</button>
    <label class="bf-luck"><span class="bf-luck-label">大运</span><select data-bf="luck" aria-label="切换大运">${cOpts}</select></label>
    <button type="button" class="bf-step" data-bf-step="1" aria-label="下一步大运">›</button>
   </div>
   <label class="bf-year-pick">流年<select data-bf="year" aria-label="切换流年">${yOpts}</select></label>
   <label class="bf-month-pick">流月<select data-bf="month" aria-label="切换流月">${mOpts}</select></label>
  </div>
  <div class="bf-year-rail" role="group" aria-label="本步大运流年速览">${yearRail}</div>
  <div class="bf-month-rail" role="group" aria-label="本年流月速选">${monthRail}</div>
  <div class="bf-grid-host" data-bf-grid>${gridOf(sel.luck,sel.year,sel.month)}</div>
  <p class="bf-snap-caption" data-bf-caption>当前时点：${esc(moment.title)}（${esc(moment.sub)}）。盘面与下方逐条推导都已按这一刻重算。</p>
 </div>`;
}

// 印度盘快照：时点行运盘为主、本命 D1 作对照。分盘 SVG（已导出纯函数）。
// n=1 时优先画所选时刻的 atChart（恒星黄道整宫制 D1，随 at 变化），
// 这才是「该时点的命盘」；本命 D1 终身不变，只作底图对照。分盘（D2–D60）
// 由本命推演，仍取 v，保持分盘规则口径不变。
function vedicSnapshot(v,n,at){
 try{
  const useTransit=(!n||n===1)&&v.atChart;
  const base=useTransit?v.atChart:v;
  const d=divisional(base,n||1);
  const label=useTransit?'时点行运盘 D1':'本命分盘 D'+(n||1);
  return `<div class="snap-vedic${useTransit?' is-transit':''}" data-snap-label="${esc(label)}">${northIndianChart(d)}</div>`;
 }
 catch{return '<p class="snap-empty-note">当前数据不足以绘制印度盘。</p>';}
}

// 西洋盘快照：wheel（已导出纯函数），需要 {chart,outer,mode,cross}。
// westernPro 的行运盘字段是 outer（不是 transitChart）；现场实测取错字段导致
// 选任何时点都画成本命盘。改为优先用 w.outer 画本命/行运双圈，随 at 变化。
function westSnapshot(w,mode,at){
 try{
  const base={chart:w.chart,mode:'natal'};
  if(!mode||mode==='natal')return `<div class="snap-west">${wheel(base)}</div>`;
  if(w.outer)return `<div class="snap-west is-transit" data-snap-label="${esc(mode)} 行运">${wheel({chart:w.chart,outer:w.outer,mode,cross:w.cross||w.aspects||[]})}</div>`;
  // solar/lunar 返照等只剩 progressed 单盘：直接画返照盘本体，仍随时点变化。
  if(mode==='solar'||mode==='lunar')return `<div class="snap-west is-transit" data-snap-label="${esc(mode)} 返照">${wheel({chart:w.chart,mode})}</div>`;
  return `<div class="snap-west">${wheel(base)}</div>`;
 }catch{return '<p class="snap-empty-note">当前数据不足以绘制星盘（推运盘需先在排盘页生成一次）。</p>';}
}

export {ziweiSnapshot,baziSnapshot,vedicSnapshot,westSnapshot};

const escS=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick=(...v)=>v.find(x=>x!==undefined&&x!==null&&!(Array.isArray(x)&&!x.length))??v.at(-1);
const textOf=sections=>sections.reduce((n,x)=>n+(x.title?.length||0)+(x.lines||[]).join('').length+(x.html||'').replace(/<[^>]*>/g,'').length+(x.table||'').replace(/<[^>]*>/g,'').length,0);

/* 时点聚焦章节：正文全部交给 period-focus.mjs 的差异化内核——每一句都由所选时点的
   真实字段推导（八字干支/十神/长生/纳音/藏干/神煞/刑冲落点；紫微四化×落宫/禄存；
   印占 Dasha 主星/分盘；西洋推运行星×相位×宫位）。不同时点必然产出不同文本。
   本函数仅做数据整形与标题兼容（保留「时点聚焦」前缀供既有契约识别）。 */
function focusSection(system,scope,label,data){
 const secs=focusSections(system,scope,label,data);
 // 本命全报告模式：把多节压成一章专章（保留既有「时点聚焦」标题契约）
 const lines=secs.flatMap(s=>[`【${s.title}】`,...s.lines]);
 return {title:`时点聚焦｜${label}`,lines};
}
// 时点专属详批模式：把差异化章节作为独立章节铺开，不再重复本命全文。
function focusedSections(system,scope,label,data){
 return focusSections(system,scope,label,data).map(s=>({title:`${label} · ${s.title}`,lines:s.lines}));
}

/* 生成时点专项报告对象（供 openFullReport(report) 直接渲染/导出）。
   ctx: app.js 的 ctx；system: 体系；scope: 时点类型；selection: 时点索引参数；
   mode: 'focus'=时点专属详批（正文按所选时点逐条推导，不重复本命全文）；
         'full'=本命全报告 + 末章时点聚焦（默认，兼容旧调用）。 */
export async function buildPeriodReport(ctx,system,scope,selection,label,reportMode='full'){
 const birth=ctx.birth,request=ctx.request;
 const who=ctx.state.profile||{};
 const focus=reportMode==='focus';
 const cover={name:who.name||'命主',system:NAMES[system]||system,stamp:new Date().toLocaleString('zh-CN',{hour12:false})};
 const compose=(sections,meta)=>{
  const body=sectionsToHtml(sections);
  // 导语里的落点名必须与封面标题同源，否则会出现「标题 2067、导语说本命原局」的自相矛盾。
  const spot=meta.spot||label;
  if(focus)meta.lead=`【时点专属详批】只围绕「${escS(spot)}」展开：盘面快照 + 该时点逐条推导，正文随所选时点变化，不重复本命全文。${meta.lead||''}`;
  return {cover,...meta,body,sections,characters:textOf(sections)};
 };

 if(system==='bazi'){
  const data=await request('/api/console/bazi',{birth,selection,combine:false});
  const rep=buildBaziDeepReport(data);
  // v0.50.0：标题与章节名不再用页面传进来的粗标签（「大运 戊辰」），
  // 直接用盘面反查的真落点（年·干支·月），让用户一眼看到「哪一年哪个月」。
  const moment=baziMoment(data,baziSelOf(data));
  // 章节前缀与封面标题用短式（年月干支）：长串会把标题挤成三行、每章标题也一起变长。
  const spot=moment.brief||[moment.title,moment.sub].filter(Boolean).join(' · ')||label;
  const sections=focus?focusedSections('bazi',scope,spot,data):[...rep.sections.slice(),focusSection('bazi',scope,spot,data)];
  return compose(sections,{spot,title:`八字 · ${spot}${focus?'':' · 时点聚焦'}`,kind:'bazi',
   chartHtml:baziSnapshot(data,selection,scope),
   // 列数随选中层级变化（七列 / 八列 / 九列），标题不写死「七列」，否则择日进入时名不副实。
   chartTitle:`八字${(data.pillars||[]).filter(p=>p?.stem&&p?.branch).length+(data.selected||[]).filter(p=>p?.stem&&p?.branch).length}列详盘 · ${spot}`,
   // 说明文字放在盘内的 [data-bf-caption]，随切换器实时更新；此处留空避免重复两行。
   chartCaption:'',
   lead:`日主 ${escS(data.dayMaster?.stem||'—')}${escS(data.dayMaster?.element||'')} · ${escS(data.strength?.kind||'')}。`,gege:rep.gege});
 }

 if(system==='ziwei'){
  const chart=ctx.state.chartState?.ziwei?.chart||ctx.state.reading?.ziwei||{};
  const flow=await request('/api/ziwei-flow',{dateStr:chart.effectiveDate,timeIndex:chart.effectiveTimeIndex??0,gender:birth.gender,astroType:chart.astroType,
   ziweiSchool:birth.ziweiSchool||chart.school?.id,ziweiLeap:birth.ziweiLeap||chart.leapPolicy,
   flowYear:selection.year,scope:selection.scope||scope,month:selection.month,day:selection.day});
  const atZiwei=new Date(Date.UTC(Number(flow?.year||selection.year||new Date().getFullYear()),Number(flow?.month||1)-1,Number(flow?.day||15),12)).toISOString();
  const rep=buildZiweiDeepReport(chart,flow,atZiwei);
  const fd={flow,chart,lifePalace:(chart.palaces||[]).find(p=>p.name==='命宫')?.name||'命宫',palaceNames:flow.palaceNames,palaceNameOf:b=>(chart.palaces||[]).find(p=>p.branch===b)?.name};
  const sections=focus?focusedSections('ziwei',scope,label,fd):[...rep.sections.slice(),focusSection('ziwei',scope,label,fd)];
  const lifePalace=fd.lifePalace;
  return compose(sections,{title:`紫微斗数 · ${label}${focus?' · 时点详批':''}`,kind:'ziwei',
   chartHtml:ziweiSnapshot(chart,flow,who),chartTitle:`紫微命盘 · ${label}`,
   chartCaption:`${flow.ganZhi||''}${flow.date?' · '+flow.date:''} · 流命落${lifePalace}。四化落宫见盘面标记。`,
   lead:`命宫${escS((chart.palaces||[]).find(p=>p.name==='命宫')?.earthlyBranch||'待定')}宫 · ${escS(chart.fiveElementsClass||'')}。`});
 }

 if(system==='vedic'){
  const at=selection.at||new Date().toISOString();
  const v=await request('/api/console/vedic',{birth,at});
  const rep=buildVedicDeepReport(v);
  const fd={vedic:v,at};
  const sections=focus?focusedSections('vedic',scope,label,fd):[...rep.sections.slice(),focusSection('vedic',scope,label,fd)];
  const varga=selection.varga||1;
  const isTransitD1=varga===1&&v.atChart;
  return compose(sections,{title:`印度占星 · ${label}${focus?' · 时点详批':''}`,kind:'vedic',
   chartHtml:vedicSnapshot(v,varga,at),chartTitle:`${isTransitD1?'时点行运盘':'印度占星分盘'} D${varga} · ${label}`,
   chartCaption:isTransitD1
    ?`${String(at).slice(0,10)} · 该时刻天象在出生地所起 Lahiri 恒星黄道整宫制行运盘，随所选时点变化；本命 D1 上升 ${escS(v.lagna||'—')} 终身不变，见全报告总览。大运主星 ${escS(v.active?.lord||'—')}。`
    :`${String(at).slice(0,10)} · 本命分盘 D${varga}（由本命 D1 推演，不随流年变）。当前大运与岁运见正文。`,
   lead:`本命上升 ${escS(v.lagna||'待定')}，九曜 ${(v.planets||[]).length} 颗；${isTransitD1?'时点行运上升 '+escS(v.atChart?.lagna||'—'):'本命盘'}。`});
 }

 // west
 const at=selection.at||new Date().toISOString(),mode=selection.mode||'transit';
 const w=await request('/api/console/western',{birth,mode,at});
 const rep=buildWesternDeepReport(w.chart||w,at,w.chart?.analysis||w.analysis);
 const fd={western:w,mode,at};
 const sections=focus?focusedSections('west',scope,label,fd):[...rep.sections.slice(),focusSection('west',scope,label,fd)];
 const hasOuter=Boolean(w.outer);
 return compose(sections,{title:`西洋占星 · ${label}${focus?' · 时点详批':''}`,kind:'west',
  chartHtml:westSnapshot(w,mode,at),chartTitle:`${mode==='natal'?'本命盘':(hasOuter?'本命＋行运双圈盘':'推运盘')} · ${label}`,
  chartCaption:`${String(at).slice(0,16).replace('T',' ')} · ${NAMES.west} ${mode} 推运。${hasOuter?'外圈为所选时点行运行星（随时点变化），内圈为本命盘（终身不变），见全报告总览。':mode==='natal'?'本命盘终身不变。':'返照盘按所选时点起算，对照本命见正文。'}`,
  lead:`推运法 ${escS(mode)}，逐条给可核的星历证据。`});
}

function sectionsToHtml(sections){
 return sections.map((s,i)=>`<section class="rpt-sec" id="rpt-sec-${i+1}" data-sec="${i+1}"><h3><span class="rpt-sec-no">${String(i+1).padStart(2,'0')}</span>${escS(s.title)}</h3>${(s.lines||[]).map(renderReportPara).join('')}${s.table?`<div class="rpt-table-wrap">${s.table}</div>`:''}${s.html||''}</section>`).join('');
}

/* v0.50.0 报告内实时重算：切换时点后，只重取值、重排章节，不再整份重开报告。
   app.js 的 [data-bf] 委托调用这两个函数替换正文与目录。 */
export function focusSectionsFor(system,scope,label,data){return focusedSections(system,scope,label,data);}
export function focusBodyHtml(sections){return sectionsToHtml(sections);}

export {SCOPES,NAMES};
