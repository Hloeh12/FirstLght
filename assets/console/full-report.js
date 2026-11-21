// 深度报告渲染层 v2：四体系专业详批（八字/紫微/印占用深度知识库，西洋逐星+格局检测）。
// 报告由当前盘面证据驱动、术语附白话、文末自动汇总术语小词典；不臆造无盘面依据的事件。
import {buildBaziDeepReport} from '../../www/js/deep-bazi.js';
import {buildZiweiDeepReport} from '../../www/js/deep-ziwei.js';
import {buildVedicDeepReport} from '../../www/js/deep-vedic.js';
import {buildWesternDeepReport} from '../../www/js/deep-west.js';
import {buildSynastryDeepReport} from '../../www/js/deep-synastry.js';
// v0.42.0：全报告补「本命总览盘」，与时点报告的「时点盘」形成明确对照。
import {baziGrid} from './bazi.js';
import {northIndianChart} from './vedic.js';
import {wheel} from './western.js';
import {divisional} from '../../src/vargas.mjs';

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
// 报告段落读感：超长段在中点断句处拆两段，每段只高亮开头短结论短语（与 ui.js 同口径）。
// 旧实现按「整句」高亮，中文长句靠逗号串联会把整段染粉，故改为短短语强调。
const RP_BREAK=/[：:。！？；;，,]/;
function rpEmphasis(text){
 const m=text.match(RP_BREAK);
 let end=m?m.index+1:Math.min(text.length,22);
 if(end<2)end=Math.min(text.length,22);
 if(end>22){const sub=text.slice(0,22);const cut=Math.max(sub.lastIndexOf('、'),sub.lastIndexOf(' '));end=cut>8?cut+1:22;}
 return end>=text.length?{key:text,rest:''}:{key:text.slice(0,end),rest:text.slice(end)};
}
/* v0.49.0 排版3：长段按语义切分，避免「一堵墙」。
   旧实现在整段中点拆成两段，宫位类段落仍是一屏 6-8 行黏在一起；
   现在先按语义标记（生年四化/地空/地劫/三方四正/调候/用神）独立成小节，
   再按 92 字打包成多段，每段只高亮开头结论短语。 */
const RP_SUB=/^(生年四化|地空入此宫|地劫入此宫|三方四正|调候|用神|大限|流年|流月|格局)/;
const RP_SENT=/[^。；！？]+[。；！？]?/g;
function rpSentences(text){
 const out=String(text||'').match(RP_SENT)||[String(text||'')];
 return out.map(s=>s.trim()).filter(Boolean);
}
function rpPack(sents,max){
 const out=[];let cur='';
 for(const s of sents){
  if(cur&&(cur.length+s.length)>max){out.push(cur);cur=s;}
  else cur+=s;
 }
 if(cur)out.push(cur);
 return out.length?out:[sents.join('')];
}
function renderPara(line){
 const text=String(line??'').trim();if(!text)return '';
 const sents=rpSentences(text);
 // 1) 语义小节起点独立成段；2) 其余句子打包，每段不超过 92 字。
 const groups=[];let buf=[];
 const flush=()=>{if(buf.length){groups.push(buf.join(''));buf=[];}};
 for(const s of sents){
  if(RP_SUB.test(s)){flush();groups.push(s);}
  else buf.push(s);
 }
 flush();
 const paras=[];
 for(const g of groups){
  const isSub=RP_SUB.test(g);
  if(isSub){paras.push({text:g,sub:true});continue;}
  for(const p of rpPack(rpSentences(g),92))paras.push({text:p,sub:false});
 }
 return paras.map(({text:seg,sub})=>{
  if(!seg.trim())return '';
  const{key,rest}=rpEmphasis(seg);
  return `<p class="rp-p${sub?' rp-p-sub':''}"><strong class="rp-key">${esc(key)}</strong>${esc(rest)}</p>`;
 }).join('');
}
/* 章节标题去重：深度库标题自带「一、二、」，而卡片又输出 01/02 徽标，会双重编号。
   统一剥掉中文序号，只保留 01 徽标 + 纯标题。 */
export function cleanSecTitle(title){
 return String(title||'').replace(/^\s*[（(]?[一二三四五六七八九十百零〇]+[）)]?\s*[、.．]\s*/,'').trim();
}
function sectionHtml(report){
 return report.sections.map((sec,i)=>`<section class="rpt-sec" id="rpt-sec-${i+1}" data-sec="${i+1}"><h3><span class="rpt-sec-no">${String(i+1).padStart(2,'0')}</span>${esc(cleanSecTitle(sec.title))}<button type="button" class="rpt-fav" data-fav-sec="${i+1}" aria-label="收藏本章" title="收藏本章">☆</button></h3>${sec.lines?.map(renderPara).join('')||''}${sec.table?`<div class="rpt-table-wrap">${sec.table}</div>`:''}${sec.html||''}</section>`).join('');
}
/* 目录：章节锚点导航 + 滚动进度 + 主题分区。让 7000+ 字报告可按区跳转、可看读到哪。 */
function sectionGroup(title){
 const t=String(title||'');
 if(/格局|命局|总览|根基|三垣|力量|五行|性格|命宫|三方|十二宫/.test(t))return '命局基础';
 if(/四化|飞星|神煞|Yoga|Shadbala|Ashtakavarga|相位|行星力量|分盘/.test(t))return '结构要件';
 if(/事业|财富|婚姻|感情|健康|六亲|调候|领域|人生/.test(t))return '人生专题';
 if(/大运|流年|流月|流日|小运|岁运|行运|Varshaphala|时点|逐运|逐月|逐年/.test(t))return '应期推演';
 if(/建议|总结|总则|趋吉|综合|指南|经营/.test(t))return '结论与建议';
 return '专项分析';
}
function tocHtml(report){
 if(!report.sections?.length)return '';
 let last=null,items='';
 report.sections.forEach((s,i)=>{
  const g=sectionGroup(s.title);
  if(g!==last){items+=`<div class="rpt-toc-group">${esc(g)}</div>`;last=g;}
  items+=`<button type="button" class="rpt-toc-item" data-toc="${i+1}" aria-label="跳转到 ${esc(s.title)}"><span class="rpt-toc-no">${String(i+1).padStart(2,'0')}</span>${esc(s.title.replace(/^[一二三四五六七八九十]+、/,''))}</button>`;
 });
 // v0.46：按用户要求取消正文中间的「目录 · 分区导航」入口条，目录改为只由右下角 FAB 唤起。
 // 这里保留隐藏的 details.rpt-toc 作为唯一章节数据源：app.js 克隆其中的 .rpt-toc-list 到浮层，
 // 两处高亮同源、契约钩子（details.rpt-toc / data-toc）不破，但正文不再出现可见入口条。
 return `<details class="rpt-toc" hidden aria-label="报告目录"><div class="rpt-toc-list" role="group" aria-label="章节选择">${items}</div></details>`;
}
const stripTags=s=>String(s).replace(/<[^>]*>/g,'');
const charactersOf=sections=>sections.reduce((n,x)=>n+(x.title?.length||0)+(x.lines||[]).join('').length+stripTags(x.table||'').length+stripTags(x.html||'').length,0);

/* v0.42.0 本命总览盘：全报告显示终身不变的本命盘；时点报告显示随时点变化的时点盘。
   两者口径必须在报告里写清，避免用户误以为「选不同时间盘面怎么一样/全报告和时点盘怎么不同」。 */
function natalCharts(state){
 const out={};
 try{
  const d=state.chartState?.bazi?.data||state.reading?.bazi||{};
  const pillars=(d.pillars||[]).filter(Boolean);
  if(pillars.length)out.bazi=`<div class="snap-bazi"><div class="bazi-grid" style="--bg-cols:${pillars.length}">${baziGrid({...d,pillars})}</div></div>`;
 }catch{}
 try{
  const v=state.reading?.vedic||{};
  if(v.planets?.length)out.vedic=`<div class="snap-vedic" data-snap-label="本命 D1">${northIndianChart(divisional(v,1))}</div>`;
 }catch{}
 try{
  const w=state.reading?.western||{};
  if(w.planets?.length&&w.axes)out.west=`<div class="snap-west" data-snap-label="本命盘">${wheel({chart:w,mode:'natal'})}</div>`;
 }catch{}
 return out;
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
 const natal=natalCharts(state);
 if(system==='bazi'){
  const data=baziReportData(state);
  const report=withGlossary(buildBaziDeepReport(data));
  const selected=(data.selected||[]).map(p=>(p.stem||'')+(p.branch||'')).join('、');
  return {cover,title:report.title,characters:charactersOf(report.sections),kind:'bazi',gege:report.gege,
   chartHtml:natal.bazi,chartTitle:'本命总览 · 八字四柱（终身不变）',
   chartCaption:'此为本命原局四柱，终身不变；若要查看某个大运/流年/流月叠加后的四柱，请用「时点」Tab 生成时点专项报告。',
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
   chartHtml:natal.vedic,chartTitle:'本命总览 · 印度占星 D1（终身不变）',
   chartCaption:'此为本命 D1 本命盘，终身不变；行运盘/返照盘随时点变化，请在「时点」Tab 按所选时间生成。',
   lead:`Lahiri 恒星黄道 · 整宫制。上升 ${esc(v.lagna||'待定')}，九曜 ${(v.planets||[]).length} 颗，Vimshottari 大运 ${(v.dashas||[]).length} 段，命格 ${esc((report.yogas||[]).length)} 组成立${v.varshaphala?`，岁运盘 ${v.varshaphala.year} 年已起`:`''`}。全文十四章：上升主轴、行星力量评级、Shadbala 六力审计、Ashtakavarga 八分点、Yoga 命格、九曜落宫、大运逐运详批、小运细分、Yogini 八女神短周期运、十三盘专项（D2–D60）、十二宫力量审计、岁运 Varshaphala、Jaimini 派专项（Karaka·Chara Dasha·Arudha）、人生格局总结。`,
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
 // 传入 analysis：dignity（庙旺弱陷）与命主星此前算了却被丢弃，接线后逐星判读不再是通用模板
 const report=withGlossary(buildWesternDeepReport(w,undefined,state.reading?.analysis||w.analysis));
 const ascText=typeof w.asc==='string'?w.asc:(w.asc?.sign||'待定');
 return {cover,title:report.title,characters:charactersOf(report.sections),kind:'west',
  chartHtml:natal.west,chartTitle:'本命总览 · 西洋本命盘（终身不变）',
  chartCaption:'此为本命盘，终身不变；行运/次限/返照外圈随时点变化，请在「时点」Tab 按所选时间生成。',
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
  ${report.chartHtml?`<section class="rpt-chart" aria-label="报告对应时点命盘"><h3 class="rpt-chart-title">${esc(report.chartTitle||'本报告的命盘快照')}</h3><div class="rpt-chart-stage">${report.chartHtml}</div>${report.chartCaption?`<p class="rpt-chart-caption">${esc(report.chartCaption)}</p>`:''}</section>`:''}
  ${tocHtml(report)}
  ${report.body}
  <footer class="rpt-foot">本报告依传统术数规则与当前命盘条件生成，仅作文化与自我观察参考，不构成事实预测、投资、法律或医疗建议。<br>留一束初光，照见当下的自己。</footer>
 </article>`;
}
