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
import {$,btn,esc,table,selectedRails} from './ui.js';

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

// 八字四柱快照：复用 baziGrid（纯函数），入参即引擎数据。
function baziSnapshot(data){
 return `<div class="snap-bazi">${baziGrid(data)}</div>`;
}

// 印度盘快照：分盘 SVG（已导出纯函数）。
function vedicSnapshot(v,n){
 try{const d=divisional(v,n||1);return `<div class="snap-vedic">${northIndianChart(d)}</div>`;}
 catch{return '<p class="snap-empty-note">当前数据不足以绘制印度盘。</p>';}
}

// 西洋盘快照：wheel（已导出纯函数），需要 {chart,outer,mode}。
function westSnapshot(w,mode,at){
 try{
  const arg=mode&&mode!=='natal'&&w.transitChart?{chart:w.chart,outer:w.transitChart,mode,cross:w.cross||w.aspects||[]}:{chart:w.chart,mode:'natal'};
  return `<div class="snap-west">${wheel(arg)}</div>`;
 }catch{return '<p class="snap-empty-note">当前数据不足以绘制星盘（推运盘需先在排盘页生成一次）。</p>';}
}

export {ziweiSnapshot,baziSnapshot,vedicSnapshot,westSnapshot};

const escS=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick=(...v)=>v.find(x=>x!==undefined&&x!==null&&!(Array.isArray(x)&&!x.length))??v.at(-1);
const textOf=sections=>sections.reduce((n,x)=>n+(x.title?.length||0)+(x.lines||[]).join('').length+(x.html||'').replace(/<[^>]*>/g,'').length+(x.table||'').replace(/<[^>]*>/g,'').length,0);

/* 时点聚焦章节：把所选大运/流年/流月/流日的证据写成专章，确保报告正文真正反映时点，
   而不是只把本命报告换个封面。八字用所选干支+十神+与原局刑冲；紫微用流命落宫+四化；
   印占用当前 Dasha 主星；西洋用推运类型与时刻。均为规则证据，不臆造事件。 */
function focusSection(system,scope,label,data){
 const L=[];
 if(system==='bazi'){
  const sel=data.selected||[],cur=sel[sel.length-1]||{};
  const rel=(data.relationships||[]).slice(0,6).map(r=>r.pattern+r.type).join('、');
  L.push(`【时点】${label}；当前落点 ${sel.map(p=>p.stem+p.branch).join(' → ')||'本命原局'}。`);
  if(cur.tenGod)L.push(`透出十神为${cur.tenGod}：${cur.tenGod==='正官'?'责任、规则与名誉被点名，宜循正规渠道推进':cur.tenGod==='七杀'?'竞争与压力同步上升，宜设边界、忌硬扛':cur.tenGod==='正财'||cur.tenGod==='偏财'?'资源与现金流成为焦点，量入为出':cur.tenGod==='食神'||cur.tenGod==='伤官'?'表达与作品被激活，宜输出、忌口舌':cur.tenGod==='正印'||cur.tenGod==='偏印'?'学习与贵人支持增强，宜进修、忌空想':cur.tenGod==='比肩'||cur.tenGod==='劫财'?'同辈竞争与协作并行，合伙须先明权责':'主题随干支五行展开'}。`);
  if(data.strength)L.push(`此步扶助权重 ${Number(data.strength.support||0).toFixed(1)}%（原局 ${Number(data.natalStrength?.support||data.strength.support||0).toFixed(1)}%），喜用参考 ${(data.strength.useful||[]).join('、')||'均衡'}——时点取舍仍以原局喜忌为准，不因单步干支改弦更张。`);
  L.push(`原局干支关系：${rel||'未见直接刑冲合会'}。时点引动哪一支，就核对那一柱所主的人事，不把单一合冲当作结果。`);
  L.push(`落地建议：把${label}的资源、期限与可撤回选项写清；冲合只是观察窗口，现实未见其应就不必牵强附会。`);
 }else if(system==='ziwei'){
  const flow=data.flow||{};
  const mut=(flow.mutagens||[]).slice(0,8).map(m=>`${m.star}化${m.type}入${data.palaceNameOf?.(m.branch)||'某宫'}`).join('、');
  L.push(`【时点】${label}（${flow.ganZhi||''}${flow.date?' · '+flow.date:''}）；流命落本命${data.lifePalace||'待定'}宫。`);
  if(mut)L.push(`四化飞布：${mut}。化禄看资源入口，化权看责任与执行，化科看文书与缓冲，化忌看反复与边界；须同看落宫、对宫与三方。`);
  L.push(`读法：以流命宫为主星结构，叠看大限宫与本命命宫；流年是节奏、本命是底盘，不用一颗流年化忌否定本命根基。`);
  L.push(`落地建议：把要事排进禄化之宫的领域，把收尾与核对排进忌化之宫；宫位主题是现实核对范围，不是事件必然发生。`);
 }else if(system==='vedic'){
  const v=data.vedic||{};
  const at=data.at||v.at;
  const dasha=(v.dashas||[]).find(d=>d.active);
  L.push(`【时点】${label}${at?' · '+String(at).slice(0,10):''}；Lahiri 恒星黄道 · 整宫制。`);
  if(dasha)L.push(`当前主运 ${dasha.lord}（${String(dasha.start||'').slice(0,10)} 起），该运主题按主星所落宫位与其力量展开；副运切换时比较主星是否同指一宫，只在可核实的宫位重合上增强判断。`);
  if(v.varshaphala)L.push(`岁运 Varshaphala 年 ${v.varshaphala.year||''} 已起——以太阳返照盘看该年重心，仍回扣 D1 本命根基。`);
  L.push(`读法：D1 定底盘、D9 看关系成熟度、D10 看事业表达、分盘与岁运看阶段；不脱离 D1 单独以分盘断事。`);
 }else{
  const w=data.western||{};
  L.push(`【时点】${label}${data.at?' · '+String(data.at).slice(0,16).replace('T',' '):''}；推运类型 ${data.mode||'行运'}。`);
  L.push(`读法：${data.mode==='secondary'?'次限一日推一年，看阶段性内在成长':data.mode==='solar'?'日返以生日太阳回归时刻立盘，管这一年':data.mode==='profection'?'小限按年龄轮值宫主星，看年度主题':data.mode==='transit'?'行运看当下行星过境本命宫位，看短期触发':'按所选推运法看该时点与本命的相位关系'}。推运星须对照本命星位，容许度内才计；单一相位不当事件。`);
  L.push(`落地建议：把推运点到的宫位领域作为近期复盘重点，结合现实的资源、期限与关系核对，不据星象做重大决定。`);
 }
 L.push('本报告为传统术数的规则化观察，不构成事实预测、投资、法律或医疗意见。');
 return {title:`时点聚焦｜${label}`,lines:L};
}

/* 生成时点专项报告对象（供 openFullReport(report) 直接渲染/导出）。
   ctx: app.js 的 ctx；system: 体系；scope: 时点类型；selection: 时点索引参数。 */
export async function buildPeriodReport(ctx,system,scope,selection,label){
 const birth=ctx.birth,request=ctx.request;
 const who=ctx.state.profile||{};
 const cover={name:who.name||'命主',system:NAMES[system]||system,stamp:new Date().toLocaleString('zh-CN',{hour12:false})};
 let sections=[],chartHtml='',chartTitle='',chartCaption='',title='',lead='';

 if(system==='bazi'){
  const data=await request('/api/console/bazi',{birth,selection,combine:false});
  const rep=buildBaziDeepReport(data);
  sections=rep.sections.slice();
  chartHtml=baziSnapshot(data);
  chartTitle=`八字四柱 · ${label}`;
  chartCaption=`当前落点：${(data.selected||[]).map(p=>p.stem+p.branch).join(' → ')||'本命原局'}。时点分析见末章「时点聚焦」。`;
  title=`八字 · ${label}专项详批`;
  lead=`日主 ${escS(data.dayMaster?.stem||'—')}${escS(data.dayMaster?.element||'')} · ${escS(data.strength?.kind||'')}。全文 ${sections.length+1} 章：本命格局、力量来源、性格事业财富婚姻健康、大运流年流月流日逐层，以及本次所选「${escS(label)}」的时点聚焦——术语附白话。`;
  sections.push(focusSection('bazi',scope,label,data));
  return {cover,title,kind:'bazi',chartHtml,chartTitle,chartCaption,lead,body:sectionsToHtml(sections),sections,characters:textOf(sections),gege:rep.gege};
 }

 if(system==='ziwei'){
  const chart=ctx.state.chartState?.ziwei?.chart||ctx.state.reading?.ziwei||{};
  const flow=await request('/api/ziwei-flow',{dateStr:chart.effectiveDate,timeIndex:chart.effectiveTimeIndex??0,gender:birth.gender,astroType:chart.astroType,
   ziweiSchool:birth.ziweiSchool||chart.school?.id,ziweiLeap:birth.ziweiLeap||chart.leapPolicy,
   flowYear:selection.year,scope:selection.scope||scope,month:selection.month,day:selection.day});
  const rep=buildZiweiDeepReport(chart,flow);
  sections=rep.sections.slice();
  const lifePalace=(chart.palaces||[]).find(p=>p.name==='命宫')?.name||'命宫';
  chartHtml=ziweiSnapshot(chart,flow,who);
  chartTitle=`紫微命盘 · ${label}`;
  chartCaption=`${flow.ganZhi||''}${flow.date?' · '+flow.date:''} · 流命落${lifePalace}。四化落宫见盘面标记与末章时点聚焦。`;
  title=`紫微斗数 · ${label}专项详批`;
  lead=`命宫${escS((chart.palaces||[]).find(p=>p.name==='命宫')?.earthlyBranch||'待定')}宫 · ${escS(chart.fiveElementsClass||'')}。全文 ${sections.length+1} 章：命盘总览、三方四正、十二宫、四化、大限流年流月流日逐层，以及本次「${escS(label)}」的时点聚焦。`;
  sections.push(focusSection('ziwei',scope,label,{flow,lifePalace,palaceNameOf:b=>(chart.palaces||[]).find(p=>p.branch===b)?.name}));
  return {cover,title,kind:'ziwei',chartHtml,chartTitle,chartCaption,lead,body:sectionsToHtml(sections),sections,characters:textOf(sections)};
 }

 if(system==='vedic'){
  const at=selection.at||new Date().toISOString();
  const v=await request('/api/console/vedic',{birth,at});
  const rep=buildVedicDeepReport(v);
  sections=rep.sections.slice();
  chartHtml=vedicSnapshot(v,selection.varga||1);
  chartTitle=`印度占星 D${selection.varga||1} · ${label}`;
  chartCaption=`${String(at).slice(0,10)} · Lahiri 恒星黄道 · 整宫制。当前大运与岁运见末章时点聚焦。`;
  title=`印度占星 · ${label}专项详批`;
  lead=`上升 ${escS(v.lagna||'待定')}，九曜 ${(v.planets||[]).length} 颗。全文 ${sections.length+1} 章：上升主轴、行星力量、Shadbala、Ashtakavarga、Yoga、大运小运、分盘、岁运，以及本次「${escS(label)}」时点聚焦。`;
  sections.push(focusSection('vedic',scope,label,{vedic:v,at}));
  return {cover,title,kind:'vedic',chartHtml,chartTitle,chartCaption,lead,body:sectionsToHtml(sections),sections,characters:textOf(sections)};
 }

 // west
 const at=selection.at||new Date().toISOString(),mode=selection.mode||'transit';
 const w=await request('/api/console/western',{birth,mode,at});
 const rep=buildWesternDeepReport(w.chart||w);
 sections=rep.sections.slice();
 chartHtml=westSnapshot(w,mode,at);
 chartTitle=`西洋星盘 · ${label}`;
 chartCaption=`${String(at).slice(0,16).replace('T',' ')} · ${NAMES.west} ${mode} 推运。推运对照本命见末章时点聚焦。`;
 title=`西洋占星 · ${label}专项详批`;
 lead=`全文 ${sections.length+1} 章：核心三要素、逐星解读、相位格局、元素失衡、当下行运，以及本次「${escS(label)}」时点聚焦——逐条给可核的星历证据。`;
 sections.push(focusSection('west',scope,label,{western:w,mode,at}));
 return {cover,title,kind:'west',chartHtml,chartTitle,chartCaption,lead,body:sectionsToHtml(sections),sections,characters:textOf(sections)};
}

function sectionsToHtml(sections){
 return sections.map((s,i)=>`<section class="rpt-sec" id="rpt-sec-${i+1}" data-sec="${i+1}"><h3><span class="rpt-sec-no">${String(i+1).padStart(2,'0')}</span>${escS(s.title)}</h3>${(s.lines||[]).map(l=>`<p>${escS(l)}</p>`).join('')}${s.table?`<div class="rpt-table-wrap">${s.table}</div>`:''}${s.html||''}</section>`).join('');
}

export {SCOPES,NAMES};
