// 深度报告渲染层：把四层知识库报告复活为可生成、可导出、成篇的产品功能。
// 复用 www/js/rules.js 里经过测试 generator，只负责取数与排版，不重复造命理逻辑。
import {buildBaziKnowledgeReport,buildZiweiKnowledgeReport} from '../../www/js/rules.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// 从 4 个候选源里取第一个非空值
const pick=(...vals)=>vals.find(v=>v!==undefined&&v!==null&&!(Array.isArray(v)&&!v.length))??vals.at(-1);

function baziReportData(state){
 const cs=state.chartState?.bazi?.data||{};
 const rd=state.reading?.bazi||{};
 const merged={...rd,...cs};
 const selected=pick(cs.selected,rd.selected,[]);
 // buildBaziKnowledgeReport 依赖 guidance/strength/natalStrength/pillars/relationships/dayMaster/months
 return {
  ...merged,
  guidance:pick(cs.guidance,rd.guidance,{}),
  strength:pick(cs.strength,rd.strength,{}),
  natalStrength:pick(cs.natalStrength,rd.natalStrength,rd.strength,{}),
  pillars:pick(cs.pillars,rd.pillars,[]),
  relationships:pick(cs.relationships,rd.relationships,[]),
  dayMaster:pick(cs.dayMaster,rd.dayMaster,{}),
  selected,
  months:pick(cs.months,rd.months,[])
 };
}

function sectionHtml(report,tone){
 return report.sections.map((sec,i)=>`<section class="rpt-sec"><h3><span class="rpt-sec-no">${String(i+1).padStart(2,'0')}</span>${esc(sec.title)}</h3>${sec.lines.map(line=>`<p>${esc(line)}</p>`).join('')}</section>`).join('');
}

// 决定当前体系下能生成哪一份成篇报告
export function composeFullReport(state,names){
 const system=state.system;
 const profile=state.profile||{};
 const label=names?.[system]||({bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星'}[system]||system);
 const stamp=new Date().toLocaleString('zh-CN',{hour12:false});
 const cover={name:profile.name||'未命名命主',system:label,stamp};
 if(system==='bazi'){
  const data=baziReportData(state);
  const report=buildBaziKnowledgeReport(data);
  return {cover,title:report.title,characters:report.characters,kind:'bazi',
   lead:`日主 ${esc(data.dayMaster?.stem||'—')}${esc(data.dayMaster?.element||'')} · ${esc(data.strength?.kind||'待定')} · 扶助 ${Number(data.strength?.support||0).toFixed(1)}%。以下依当前命盘与所选时点生成，先论原局提纲，再及刑冲喜忌、生活指引与应期。`,
   body:sectionHtml(report)};
 }
 if(system==='ziwei'){
  const chart=state.chartState?.ziwei?.chart||state.reading?.ziwei||{};
  const flow=state.chartState?.ziwei?.flow||null;
  const report=buildZiweiKnowledgeReport(chart,flow||{});
  const life=(chart.palaces||[]).find(p=>p.name==='命宫');
  const lifeStars=life?.majorStars?.length?life.majorStars:life?.borrowedStars||[];
  return {cover,title:flow?`紫微 · ${flow.label||'流年'} 详参`:'紫微斗数 · 本命详参',characters:report.characters,kind:'ziwei',
   lead:`命宫在 ${esc(life?.earthlyBranch||'待定')}，${lifeStars.length?'主星 '+esc(lifeStars.map(s=>s.name).join('、')):'空宫借星'}。${flow?'以下结合所选运限与四化落宫，分四层展开。':'以下依本命命宫、三方四正与生年四化分四层展开。'}`,
   body:sectionHtml(report)};
 }
 // 西洋 / 印度：暂无经测试的四层 generator，输出结构化的数据摘要，明确不伪造断语
 const r=state.reading||{};
 if(system==='vedic'){
  const v=r.vedic||{},planets=v.planets||[];
  const rows=planets.map(p=>`<tr><td>${esc(p.name)}</td><td>${esc(p.sign)}</td><td>${esc(p.house)}</td><td>${esc(p.nakshatra||'—')}</td><td>${esc(p.pada??'—')}</td></tr>`).join('');
  return {cover,title:'印度占星 · 本命详参',characters:0,kind:'vedic',
   lead:`Lahiri 恒星黄道 · 整宫制。上升 ${esc(v.lagna||'待定')}。下列为九曜本命落点与星宿，供逐项核对；深度断语需结合大运与分盘，不在本摘要中臆造。`,
   body:`<section class="rpt-sec"><h3><span class="rpt-sec-no">01</span>九曜落宫与星宿</h3><table class="rpt-table"><thead><tr><th>行星</th><th>星座</th><th>宫位</th><th>星宿</th><th>Pada</th></tr></thead><tbody>${rows}</tbody></table></section>
   <section class="rpt-sec"><h3><span class="rpt-sec-no">02</span>判读纲领</h3><p>先以 D1 判断上升、月亮、太阳及宫主星，再以星宿主与相位确认主题；D9 用于关系成熟度，D10 用于事业表达，不脱离 D1 单独断事。请在排盘页切换四级 Dasha 与分盘，查看对应时点的专属推演。</p></section>`};
 }
 const w=r.western||{},planets=w.planets||[];
 const core=planets.filter(p=>['sun','moon'].includes(p.key)).map(p=>`${esc(p.name)} ${esc(p.sign)} 第${esc(p.house)}宫`).join(' · ');
 return {cover,title:'西洋占星 · 本命详参',characters:0,kind:'west',
  lead:`太阳、月亮与上升构成核心三要素：${core||'待定'} · 上升 ${esc(w.asc?.sign||'待定')}。下列为盘面摘要，深度行运断语请在排盘页选择推运后查看。`,
  body:`<section class="rpt-sec"><h3><span class="rpt-sec-no">01</span>核心结构与判读</h3><p>太阳位置描述持续投入的领域，月亮位置描述安全感与情绪习惯，上升描述进入环境的方式；三者不一致时代表内在需求与外在策略需要协调。相位须结合行星、容许度与落宫理解，不把单一相位当作事件。</p></section>`};
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
  ${report.body}
  <footer class="rpt-foot">本报告依传统术数规则与当前命盘条件生成，仅作文化与自我观察参考，不构成事实预测、投资、法律或医疗建议。<br>留一束初光，照见当下的自己。</footer>
 </article>`;
}
