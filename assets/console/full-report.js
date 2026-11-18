// 深度报告渲染层 v2：四体系专业详批（八字/紫微/印占用深度知识库，西洋逐星+格局检测）。
// 报告由当前盘面证据驱动、术语附白话、文末自动汇总术语小词典；不臆造无盘面依据的事件。
import {buildBaziDeepReport} from '../../www/js/deep-bazi.js';
import {buildZiweiDeepReport} from '../../www/js/deep-ziwei.js';
import {buildVedicDeepReport} from '../../www/js/deep-vedic.js';
import {buildWesternDeepReport} from '../../www/js/deep-west.js';
import {buildSynastryDeepReport} from '../../www/js/deep-synastry.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pick=(...vals)=>vals.find(v=>v!==undefined&&v!==null&&!(Array.isArray(v)&&!v.length))??vals.at(-1);
const num=(v,d=0)=>Number.isFinite(Number(v))?Number(v).toFixed(d):'—';

// 相位释义（与 aspects.js 字典同源，内联以免报告模块依赖 DOM）
const ASPECT_MEANING={0:'能量合流、议题同步',60:'轻巧协作、需主动发起',90:'张力摩擦、促成调整',120:'和谐流通、天赋支持',180:'两端拉扯、关系镜像',30:'细节磨合',45:'持续小阻力',135:'节奏失衡',150:'别扭与牵扯'};
const meaningOf=a=>ASPECT_MEANING[a]||'须结合行星性质与落宫综合判读';

function baziReportData(state){
 const cs=state.chartState?.bazi?.data||{};
 const rd=state.reading?.bazi||{};
 const merged={...rd,...cs};
 const selected=pick(cs.selected,rd.selected,[]);
 return {
  ...merged,
  guidance:pick(cs.guidance,rd.guidance,{}),
  strength:pick(cs.strength,rd.strength,{}),
  natalStrength:pick(cs.natalStrength,rd.natalStrength,rd.strength,{}),
  pillars:pick(cs.pillars,rd.pillars,[]),
  relationships:pick(cs.relationships,rd.relationships,[]),
  dayMaster:pick(cs.dayMaster,rd.dayMaster,{}),
  trend:pick(cs.trend,rd.trend,null),
  voidBranches:pick(cs.voidBranches,rd.voidBranches,[]),
  cycles:pick(cs.cycles,rd.cycles,[]),
  years:pick(cs.years,rd.years,[]),
  months:pick(cs.months,rd.months,[]),
  days:pick(cs.days,rd.days,[]),
  selected
 };
}
function sectionHtml(report){
 return report.sections.map((sec,i)=>`<section class="rpt-sec" id="rpt-sec-${i+1}" data-sec="${i+1}"><h3><span class="rpt-sec-no">${String(i+1).padStart(2,'0')}</span>${esc(sec.title)}</h3>${sec.lines?.map(line=>`<p>${esc(line)}</p>`).join('')||''}${sec.table?`<div class="rpt-table-wrap">${sec.table}</div>`:''}${sec.html||''}</section>`).join('');
}
/* 目录：章节锚点导航 + 滚动进度。让 7000+ 字报告可跳章节、可看读到哪。 */
function tocHtml(report){
 if(!report.sections?.length)return '';
 const items=report.sections.map((s,i)=>`<button type="button" class="rpt-toc-item" data-toc="${i+1}" aria-label="跳转到 ${esc(s.title)}"><span class="rpt-toc-no">${String(i+1).padStart(2,'0')}</span>${esc(s.title.replace(/^[一二三四五六七八九十]+、/,''))}</button>`).join('');
 return `<details class="rpt-toc" aria-label="报告目录" open><summary class="rpt-toc-head"><span>目录</span><span class="rpt-progress" data-rpt-progress>0%</span></summary><div class="rpt-toc-list">${items}</div></details>`;
}
const stripTags=s=>String(s).replace(/<[^>]*>/g,'');
const charactersOf=sections=>sections.reduce((n,x)=>n+(x.title?.length||0)+(x.lines||[]).join('').length+stripTags(x.table||'').length+stripTags(x.html||'').length,0);

/* ---------------- 双人合盘：四层成篇报告 ---------------- */
export function buildSynastryKnowledgeReport(result,aName,bName){
 const r=result||{},fit=r.fit||r;
 const pct=pick(fit.percent,r.percent,'—');
 const insight=pick(fit.insights,r.insights,[]);
 const koota=r.vedic?.koota||r.koota||{};
 const kootaItems=pick(koota.items,r.kootaItems,[]);
 const inter=pick(r.western?.interAspects,r.interAspects,r.crossAspects,[]);
 const cross=pick(r.crossRelations,r.baziCross,[]);
 const composite=r.composite?.readings||r.composite||null;
 const A=aName||'甲方',B=bName||'乙方';
 const overview=[
  `合盘比较两人的出生盘，观察能量如何互相激发、支持或牵动。${A} 与 ${B} 的综合契合度指标为 ${pct}${pct==='—'?'':'%'}（${pick(fit.total,r.total,'—')}/${pick(fit.max,r.max,'—')} 项）。契合度是结构性参考，不等同关系成败，更不代表感情必然走向。`,
  fit.highlight?`当前最显著的契合线索：${fit.highlight}。`:'当前未给出单一最显著线索，须综合各层相位与导师核对。',
  ...insight.map(x=>`${x.name||'观察点'}：${x.text||''}`),
  `合盘的正确用法是"看互动模式"而非"定关系吉凶"：同一组相位在不同成熟度的人身上，可以表现为支持，也可以表现为摩擦。`
 ];
 const kootaRows=kootaItems.slice(0,8).map(x=>`<tr><td>${esc(x.zh||x.name||'—')}</td><td>${esc(x.score??'—')}</td><td>${esc((x.note||x.guidance||'').slice(0,60))}</td></tr>`).join('');
 const kootaTable=kootaRows?`<table class="rpt-table"><thead><tr><th>科目</th><th>得分</th><th>要点</th></tr></thead><tbody>${kootaRows}</tbody></table>`:'';
 const vedicLines=[
  `印度合盘以 Ashtakoota（八科）计分，满分 36 分，从心灵、智识、脾性、财富、子女、健康、友谊、亲密等维度评估两人能量的相容性。综合分 ${pick(koota.total,pct,'—')}，宜逐项查看强弱，而非只看总分。`,
  kootaItems.length?`上表列出得分较低的若干科目，这些是关系中需要更多经营与理解的领域；得分高的科目则是天然的资源与默契来源。`:'本盘未提供逐项八科明细，可在排盘页印度合盘视图核对。',
  `八科之外，还须看双方月亮星宿的宿主关系、七宫宫主的互动与 D9 分盘的彼此落点；这些决定关系能否从吸引走向长期承诺。`
 ];
 const interSorted=[...inter].sort((a,b)=>Math.abs(a.orb??99)-Math.abs(b.orb??99)).slice(0,10);
 const interRows=interSorted.map(x=>`<tr><td>${esc((x.a||x.p1||'A')+' '+(x.type||meaningOf(x.angle))+' '+(x.b||x.p2||'B'))}</td><td>${esc(x.angle??'—')}°</td><td>${num(x.orb,2)}°</td><td>${esc(meaningOf(x.angle))}</td></tr>`).join('');
 const interTable=interRows?`<table class="rpt-table"><thead><tr><th>跨盘相位</th><th>角度</th><th>容许度</th><th>主题</th></tr></thead><tbody>${interRows}</tbody></table>`:'';
 const aspectLines=[
  `跨盘相位（Synastry aspects）比较 ${A} 的行星与 ${B} 的行星之间的几何关系，是观察两人互动质感的核心。上表按容许度由紧到松列出主要跨盘相位及主题。`,
  `一方的行星落入另一方的宫位同样重要：例如太阳落对方一宫强化自我存在感，月亮落对方四宫带来家的安全感，金星落对方七宫增添亲密吸引。落宫与相位须合看。`,
  `张力相位（刑、冲）在合盘中往往表现为持续的吸引与摩擦并存，是关系活力的来源，但需要成熟的沟通来引导；和谐相位（六合、三合）带来自然的支持，也需主动经营才不致流于平淡。`,
  `组合中点盘（Composite）把两人能量合成为一张"关系自身的星盘"，回答"这段关系作为一个整体是什么样"；它与跨盘相位互补，前者看互动，后者看关系本体。`
 ];
 const crossRows=cross.slice(0,8).map(x=>`<tr><td>${esc(x.type||x.a||x.name||'—')}</td><td>${esc(x.pattern||x.b||x.relation||'—')}</td><td>${esc((x.pillars||[]).join('／')||x.note||x.guidance||'')}</td></tr>`).join('');
 const crossTable=crossRows?`<table class="rpt-table"><thead><tr><th>甲</th><th>关系</th><th>说明</th></tr></thead><tbody>${crossRows}</tbody></table>`:'';
 const closing=[
  cross.length?`八字跨盘关系补充了干支层面的互动线索（如天干五合、地支六冲），与占星星相互为参照：两者同时指向同一主题时，该主题的权重更高。`:'本盘未提供八字跨盘关系明细，可在排盘页合盘视图核对。',
  composite?'组合中点盘已生成：它描述关系整体的性格与课题，适合两人共同面对未来时参考。':'组合中点盘数据待生成（切换至 composite 模式可查看）。',
  `任何合盘指标都是"关系的可能性地图"，而非命运判决书。真实的关系质量取决于双方的沟通、尊重、边界与共同经营；本报告仅作传统文化与自我观察参考，不构成对关系走向的保证或心理、法律建议。`
 ];
 const sections=[
  {title:'一、契合度与互动总览',lines:overview},
  {title:'二、印度八科 compat 分析',lines:vedicLines,table:kootaTable},
  {title:'三、跨盘相位与组合中点盘',lines:aspectLines,table:interTable},
  {title:'四、干支互参与经营纲领',lines:closing,table:crossTable}
 ];
 return {title:'双人合盘 · 关系详参',sections,characters:charactersOf(sections)};
}

// 把生成器产出的 glossary 追加成文末「术语小词典」
function withGlossary(report){
 const entries=Object.entries(report.glossary||{}).filter(([,v])=>v);
 if(!entries.length)return report;
 report.sections.push({title:'附、术语小词典（白话版）',lines:entries.map(([k,v])=>`${k}：${v}`)});
 return report;
}

// 决定当前体系下能生成哪一份成篇报告
export function composeFullReport(state,names){
 const system=state.system;
 const profile=state.profile||{};
 const label=names?.[system]||({bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘'}[system]||system);
 const stamp=new Date().toLocaleString('zh-CN',{hour12:false});
 const cover={name:profile.name||'未命名命主',system:label,stamp};
 if(system==='bazi'){
  const data=baziReportData(state);
  const report=withGlossary(buildBaziDeepReport(data));
  const selected=(data.selected||[]).map(p=>(p.stem||'')+(p.branch||'')).join('、');
  return {cover,title:report.title,characters:charactersOf(report.sections),kind:'bazi',gege:report.gege,
   lead:`日主 ${esc(data.dayMaster?.stem||'—')}${esc(data.dayMaster?.element||'')} · ${esc(data.strength?.kind||'待定')} · 扶助 ${Number(data.strength?.support||0).toFixed(1)}% · 判定${esc(report.gege||'格局')}。全文十三章：命局格局、三垣与力量来源、性格、事业、财富、婚姻、健康、神煞、大运逐运详批、流年逐年详批、流月逐月详批、流日与流时择时${selected?`（当前选中：${esc(selected)}）`:''}——每个术语都附白话。`,
   body:sectionHtml(report),sections:report.sections};
 }
 if(system==='ziwei'){
  const chart=state.chartState?.ziwei?.chart||state.reading?.ziwei||{};
  const flow=state.chartState?.ziwei?.flow||null;
  const report=withGlossary(buildZiweiDeepReport(chart,flow));
  const life=(chart.palaces||[]).find(p=>p.name==='命宫');
  const lifeStars=life?.majorStars?.length?life.majorStars:life?.borrowedStars||[];
  return {cover,title:flow?`紫微 · ${flow.label||'流年'}详批`:'紫微斗数 · 全盘详批',characters:charactersOf(report.sections),kind:'ziwei',
   lead:`命宫在 ${esc(life?.earthlyBranch||'待定')}，${lifeStars.length?'主星 '+esc(lifeStars.map(s=>s.name).join('、')):'空宫借星'} · ${esc(chart.fiveElementsClass||'')}。全文十章：命盘总览、三方四正、十二宫逐宫详解、生年四化、大限逐限详批、流年逐流年详批（未来十年）${flow?'、所选流年指向性事件':''}、流月逐月详批（斗君起正月）、流日与流时、综合建议——流年命宫按年支定位、四化按年干飞布，逐年逐月可核。`,
   body:sectionHtml(report),sections:report.sections};
 }
 if(system==='vedic'){
  const v=state.reading?.vedic||{};
  const report=withGlossary(buildVedicDeepReport(v));
  return {cover,title:report.title,characters:charactersOf(report.sections),kind:'vedic',
   lead:`Lahiri 恒星黄道 · 整宫制。上升 ${esc(v.lagna||'待定')}，九曜 ${(v.planets||[]).length} 颗，Vimshottari 大运 ${(v.dashas||[]).length} 段，命格 ${esc((report.yogas||[]).length)} 组成立${v.varshaphala?`，岁运盘 ${v.varshaphala.year} 年已起`:`''`}。全文十二章：上升主轴、行星力量评级、Shadbala 六力审计、Ashtakavarga 八分点、Yoga 命格、九曜落宫、大运逐运详批、小运细分、D9/D10 分盘、十二宫力量审计、岁运 Varshaphala、人生格局总结。`,
   body:sectionHtml(report),sections:report.sections};
 }
 if(system==='synastry'){
  const syn=state.chartState?.synastry||{};
  const result=syn.result||syn;
  const otherCase=(state.cases||[]).find(c=>c.id===syn.other);
  const otherName=syn.otherName||syn.name||otherCase?.name||'另一方';
  const report=withGlossary(buildSynastryDeepReport(result,profile.name,otherName));
  return {cover,title:report.title,characters:report.characters,kind:'synastry',
   lead:`${esc(profile.name||'甲方')} 与 ${esc(otherName)} 的合盘：综合契合度 ${esc(result.fit?.percent??result.percent??'—')}%。全文九章：关系总览、日月金火五星对照、跨盘相位逐条详解、八科逐科化解、月亮星宿与 D9 互参、干支三镜合参、八字合婚专项、紫微合盘、经营指南——每组相位都写明「剧情怎么上演、怎么接招」。`,
   body:sectionHtml(report),sections:report.sections};
 }
 // west 及未知体系兜底：显式分支，避免未来新体系再误落本命模板
 const w=state.reading?.western||{};
 const report=withGlossary(buildWesternDeepReport(w));
 const ascText=typeof w.asc==='string'?w.asc:(w.asc?.sign||'待定');
 return {cover,title:report.title,characters:charactersOf(report.sections),kind:'west',
  lead:`太阳在${esc(w.planets?.find(p=>p.key==='sun')?.sign||'待定')}、月亮在${esc(w.planets?.find(p=>p.key==='moon')?.sign||'待定')}、上升${esc(ascText)}。全文五章：核心三要素、逐星解读、相位格局、盘面格局与元素失衡检测、领域速览——逐星成段、格局可核。`,
  body:sectionHtml(report),sections:report.sections};
}

export function reportHtml(report){
 const wordLine=report.characters?`<span class="rpt-meta">全文 ${report.characters} 字</span>`:'';
 return `<article class="rpt-doc" data-full-report data-report-kind="${report.kind}">
  <header class="rpt-cover">
   <p class="rpt-brand">FIRST LIGHT · 星谕初光</p>
   <h2 id="reportTitle">${esc(report.title)}</h2>
   <p class="rpt-owner">${esc(report.cover.name)} · ${esc(report.cover.system)}</p>
   <p class="rpt-stamp">生成于 ${esc(report.cover.stamp)} ${wordLine}</p>
  </header>
  <p class="rpt-lead">${report.lead}</p>
  ${tocHtml(report)}
  ${report.body}
  <footer class="rpt-foot">本报告依传统术数规则与当前命盘条件生成，仅作文化与自我观察参考，不构成事实预测、投资、法律或医疗建议。<br>留一束初光，照见当下的自己。</footer>
 </article>`;
}
