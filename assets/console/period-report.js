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

// 八字时点七列详盘：本命四柱 + 大运 + 流年 + 流月，完整十神/藏干/星运/神煞/纳音。
// 对标专业盘的「上方选时点、下方出七列盘」交互：三组 select 可点切换，
// 切换时用内联脚本按当前 data 重算七列并重绘盘面（导出文档场景下退化为静态快照）。
// 关键修复：不再依赖后端返回的 data.selected（时点页只传 {month:N} 时它只有流月一列），
// 而是始终用 data.cycles/years/months 自组完整七列，默认取当前运/年/月。
function baziSnapshot(data,selection={}){
 const natal=(data?.pillars||[]).filter(Boolean);
 const cycles=data?.cycles||[],years=data?.years||[],months=data?.months||[];
 const nowY=new Date().getFullYear();
 const defLuck=(()=>{ // 当前大运：startYear <= 今年 < endYear
  const i=cycles.findIndex(c=>(c.startYear??9999)<=nowY&&nowY<(c.endYear??c.startYear+10));
  return i<0?0:i;
 })();
 const defYear=(()=>{const i=years.findIndex(y=>y.year===nowY);return i<0?Math.max(0,years.length-1):i;})();
 const defMonth=Math.max(0,months.findIndex(m=>m.date?.slice(0,10)<=new Date().toISOString().slice(0,10)));
 const li=Number.isInteger(selection.luck)?Math.min(selection.luck,cycles.length-1):defLuck;
 const yi=(selection.year!=null?years.findIndex(y=>y.year===Number(selection.year)):-1);
 const yIdx=yi<0?defYear:yi;
 const mIdx=Number.isInteger(selection.month)?Math.min(selection.month,months.length-1):defMonth;
 const pickFlow=(l,y,m)=>[cycles[l],years[y],months[m]].filter(p=>p&&p.stem&&p.branch).map(p=>({...p}));
 const build=(l,y,m)=>{
  const flow=pickFlow(l,y,m);
  return {base:{...data,pillars:[...natal,...flow]},cols:[...natal,...flow].length};
 };
 const b0=build(li,yIdx,mIdx);
 const gridHtml=g=>`<div class="bazi-grid rpt-bazi-grid" style="--bg-cols:${g.cols}">${baziGrid(g.base)}</div>`;
 const opt=(list,sel,fmt)=>list.map((x,i)=>`<option value="${i}"${i===sel?' selected':''}>${esc(fmt(x,i))}</option>`).join('');
 const cOpts=cycles.length?opt(cycles,li,(c,i)=>`第${i+1}步 ${c.stem||''}${c.branch||''}`):'<option>无大运</option>';
 const yOpts=years.length?opt(years,yIdx,(y)=>`${y.year} ${y.stem||''}${y.branch||''}`):'<option>无流年</option>';
 const mOpts=months.length?opt(months,mIdx,(m)=>`${m.label||m.date?.slice(5)||''} ${m.stem||''}${m.branch||''}`):'<option>无流月</option>';
 // 内联脚本所需的数据：本命四柱 + 三组运柱 + data 元字段（供 baziGrid 用）。
 // 数据挂全局，由 app.js 的事件委托负责重绘（innerHTML 注入的 <script> 不会执行）。
 const payload={natal,cycles,years,months,sel:{luck:li,year:yIdx,month:mIdx},
  meta:{voidBranches:data.voidBranches||[],dayMaster:data.dayMaster,strength:data.strength,relationships:data.relationships}};
 const uid='bf'+Math.random().toString(36).slice(2,8);
 (globalThis.__FL_BAZI_FLOW__||= {})[uid]=payload;
 return `<div class="snap-bazi" data-bazi-flow="${uid}">
  <div class="bazi-flow-picker card liquid-glass" role="group" aria-label="切换八字时点">
   <label>大运<select data-bf="luck" aria-label="切换大运">${cOpts}</select></label>
   <label>流年<select data-bf="year" aria-label="切换流年">${yOpts}</select></label>
   <label>流月<select data-bf="month" aria-label="切换流月">${mOpts}</select></label>
  </div>
  <div class="bf-grid-host" data-bf-grid>${gridHtml(b0)}</div>
  <p class="bf-snap-caption" data-bf-caption>当前落点：${esc(months[mIdx]?.label||'')} ${esc(months[mIdx]?.stem||'')}${esc(months[mIdx]?.branch||'')}。以下逐条推导该时点。</p>
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
  if(focus)meta.lead=`【时点专属详批】只围绕「${escS(label)}」展开：盘面快照 + 该时点逐条推导，正文随所选时点变化，不重复本命全文。${meta.lead||''}`;
  return {cover,...meta,body,sections,characters:textOf(sections)};
 };

 if(system==='bazi'){
  const data=await request('/api/console/bazi',{birth,selection,combine:false});
  const rep=buildBaziDeepReport(data);
  const sections=focus?focusedSections('bazi',scope,label,data):[...rep.sections.slice(),focusSection('bazi',scope,label,data)];
  return compose(sections,{title:`八字 · ${label}${focus?' · 时点详批':''}`,kind:'bazi',
   chartHtml:baziSnapshot(data,selection),chartTitle:`八字七列详盘 · ${label}`,
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

export {SCOPES,NAMES};
