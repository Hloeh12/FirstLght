// 深度报告渲染层：把知识库报告复活为可生成、可导出、成篇的产品功能。
// 八字/紫微复用 www/js/rules.js 里经过测试的 generator；西洋/印度/合盘在本文件内按运行时数据成篇，
// 全部只做结构化呈现与条件式解读，不臆造具体事件。
import {buildBaziKnowledgeReport,buildZiweiKnowledgeReport} from '../../www/js/rules.js';

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
  selected,
  months:pick(cs.months,rd.months,[])
 };
}

function sectionHtml(report){
 return report.sections.map((sec,i)=>`<section class="rpt-sec"><h3><span class="rpt-sec-no">${String(i+1).padStart(2,'0')}</span>${esc(sec.title)}</h3>${sec.lines.map(line=>`<p>${esc(line)}</p>`).join('')}${sec.table?sec.table:''}</section>`).join('');
}
const charactersOf=sections=>sections.reduce((n,x)=>n+x.title.length+x.lines.join('').length,0);

/* ---------------- 印度占星：四层成篇报告 ---------------- */
export function buildVedicKnowledgeReport(v){
 const planets=v?.planets||[],dashas=v?.dashas||[];
 const lagna=v?.lagna||'待定';
 const byName=n=>planets.find(p=>p.name===n);
 const moon=byName('月亮'),sun=byName('太阳');
 const active=dashas.find(d=>d.active)||dashas.find(d=>Date.parse(d.start)<=Date.now()&&Date.now()<Date.parse(d.end))||dashas[0];
 const nakOf=p=>p?`${p.nakshatra||'星宿待考'} · Pada ${p.pada??'—'}（宿主 ${p.nakLord||'—'}）`:'资料待考';
 const houseTheme=h=>({1:'自我与体魄',2:'财货与家声',3:'勇气与同业',4:'居所与心境',5:'智识与子女',6:'竞争与债务',7:'伴侣与合作',8:'隐秘与转化',9:'信念与远行',10:'事业与名誉',11:'社群与收益',12:'损耗与灵修'}[h]||'该宫主题');
 const lordOf=s=>({白羊:'火星',金牛:'金星',双子:'水星',巨蟹:'月亮',狮子:'太阳',处女:'水星',天秤:'金星',天蝎:'火星',射手:'木星',摩羯:'土星',水瓶:'土星',双鱼:'木星'})[String(s||'').replace('座','')]||'宫主待考';

 const structure=[
  `本命上升落于${lagna}，以整宫制立宫。上升是整张印占盘的定位锚点，决定宫位划分与大运观察的起点。`,
  `月亮位于${moon?.sign||'待定'}第${moon?.house||'—'}宫（${nakOf(moon)}），${houseTheme(moon?.house)}为其情绪与直觉着色；太阳位于${sun?.sign||'待定'}第${sun?.house||'—'}宫，代表自我意志与生命活力的展现场域。`,
  `上升主星${lordOf(lagna)}与月亮、太阳的相对落宫，是判断"自我—情绪—行动"三者是否协调的第一层依据：三者同宫或互照则主题集中，分散于对角宫则人生课题在不同场域轮替显现。`,
  `本模型采用 ${v?.ayan||'Lahiri'} 恒星黄道与平交点，岁差为本机近似值；若精度要求更高，应以专业星历软件复核出生经纬度与真太阳时后再行解读。`
 ];
 const grahaRows=planets.map(p=>`<tr><td>${esc(p.name)}${p.retro?' ℞':''}</td><td>${esc(p.sign)}</td><td>第${esc(p.house)}宫</td><td>${esc(p.nakshatra||'—')}${p.pada?' · P'+p.pada:''}</td><td>${esc(p.nakLord||'—')}</td></tr>`).join('');
 const grahaTable=`<table class="rpt-table"><thead><tr><th>行星</th><th>星座</th><th>宫位</th><th>星宿/宿度</th><th>宿主</th></tr></thead><tbody>${grahaRows}</tbody></table>`;
 const graha=[
  `九曜落宫是 D1 本命判断的主体。上表按宫位列出各行星的星座、星宿与宿主；行星落入第 1/5/9 宫传统上偏支持，落入第 6/8/12 宫偏磨练，但须合参宫主与相位，不可单以宫位吉凶定论。`,
  `星宿主（Nakṣatra lord）串联起行星之间的深层关联：同一宿主下的行星共享主题，宿主所在宫位则为这段主题的现实落点。逆行行星（℞）表示其能量表达更偏向内在与复盘，而非外放直进。`,
  `燃烧（行星过近太阳而失去力量）、行星战（两星相争）等状态会影响上述落点的实际表现；本盘状态检视可在排盘页"行星状态"一栏逐项核对，报告不脱离实际落宫空谈吉凶。`
 ];
 const dashaRows=dashas.slice(0,9).map(d=>`<tr><td>${esc(d.lord)}</td><td>${esc((d.start||'').slice(0,10))}</td><td>${esc((d.end||'').slice(0,10))}</td><td>${d.active?'当前':''}</td></tr>`).join('');
 const dashaTable=`<table class="rpt-table"><thead><tr><th>主运</th><th>起</th><th>讫</th><th>状态</th></tr></thead><tbody>${dashaRows}</tbody></table>`;
 const timing=[
  `Vimshottari 大运以月亮出生星宿的宿主起排，共 120 年、九曜依次主事。当前处于${active?.lord||'待定'}主运（${(active?.start||'').slice(0,10)} 至 ${(active?.end||'').slice(0,10)}），出生余额约 ${num(v?.balanceYears,2)} 年。`,
  `大运主题看主星的本命落宫与其所主之宫：主星落 1/5/9 宫偏支持，落 6/8/12 宫偏考验；副运（Antar）、细运（Pratyantar）、微运（Sookshma）逐级细化同一主题，四级共同触及的宫位才值得重点关注。`,
  `起运与换运时刻对应现实处境的转折窗口，但大运只标示"哪类主题被激活"，不保证具体事件。请在排盘页切换四级 Dasha，核对每一级主星是否重复指向同一宫主或星宿主，再作判断。`,
  `分盘参照：D9（Navāṃśa）用于关系与内在成熟度，D10（Daśāṃśa）用于事业表达，D7 用于子息。分盘只回答各自专项问题，D1 本命始终是前提，不可脱离 D1 单以分盘断事。`
 ];
 const guide=[
  `星宿是印占最细腻的心理与业力切面。月亮星宿揭示情绪惯性，上升星宿揭示人格面具，行星星宿揭示各功能的运作风格；同宿行星共享主题，可合并观察而非逐星罗列。`,
  `修行与调适建议遵循"补偿—平衡"原则：某元素或某宫过旺时，宜以对宫主题与相关行星的克制面向调节；过弱时则补足其宫主与宿主所主的日常习惯。此为传统文化参照，不替代心理、医疗或法律意见。`,
  `本报告依当前命盘的落宫、星宿与大运结构生成，重在结构解读与观察方法，不作吉凶断言或事件预测。真正的判断须结合当事人现实处境、自由意志与专业师者审定。`
 ];
 const sections=[
  {title:'一、上升结构与自我定位',lines:structure},
  {title:'二、九曜落宫与星宿',lines:graha,table:grahaTable},
  {title:'三、Vimshottari 大运时序',lines:timing,table:dashaTable},
  {title:'四、星宿指引与判读纲领',lines:guide}
 ];
 return {title:'印度占星 · Jyotish 本命详参',sections,characters:charactersOf(sections)};
}

/* ---------------- 西洋占星：四层成篇报告 ---------------- */
export function buildWesternKnowledgeReport(w){
 const planets=w?.planets||[],aspects=w?.aspects||[];
 const byKey=k=>planets.find(p=>p.key===k);
 const sun=byKey('sun'),moon=byKey('moon');
 const signName=v=>typeof v==='string'?v:(v?.sign||v?.name||'待定');
 const asc=signName(w?.asc),mc=signName(w?.mc);
 const core=[
  `太阳、月亮与上升构成人格的三大支柱：太阳在${sun?.sign||'待定'}第${sun?.house||'—'}宫，描述持续投入与自我表达的领域；月亮在${moon?.sign||'待定'}第${moon?.house||'—'}宫，描述安全感来源与情绪习惯；上升在${asc}，描述面对环境的直觉姿态。`,
  `三者落在不同的元素与宫位时，代表内在需求（月亮）、外在角色（上升）与意志目标（太阳）之间存在需要协调的张力；同元素或彼此和谐相位时，三者较易形成一致的方向感。`,
  `天顶（MC）在${mc}，指向事业与社会地位的呈现方向；上升—天顶轴线是整张盘的定位骨架，其余行星都相对这条轴线展开。`,
  `本盘采用 ${w?.houseSystem||'分宫制待考'}，行星度数与宫位以本机星历计算；若用于重要决策，建议以专业星历软件复核出生时间与地点。`
 ];
 const planetRows=planets.map(p=>`<tr><td>${esc(p.name)}${p.retro?' ℞':''}</td><td>${esc(p.sign)}</td><td>第${esc(p.house)}宫</td><td>${p.degree?.degrees??'—'}°${String(p.degree?.minutes??'').padStart(2,'0')}′</td></tr>`).join('');
 const planetTable=`<table class="rpt-table"><thead><tr><th>行星</th><th>星座</th><th>宫位</th><th>度数</th></tr></thead><tbody>${planetRows}</tbody></table>`;
 const placement=[
  `行星落宫说明能量在哪个生活场域展现，星座说明它以何种风格展现。上表按行星列出落点与度数，是解读命盘的基础材料；逆行（℞）表示该函数倾向内在化与反复打磨。`,
  `个人行星（日月水金火）勾勒日常性格与反应模式，社会行星（木土）勾勒成长与限制的课题，外行星（天海冥）勾勒世代与深层转化的背景。三者层级不同，不宜等量齐观。`,
  `空宫不表示缺憾：空宫议题由其宫主星所在宫位与相位来承接。判断重点始终是"宫主星去了哪里、与谁发生关系"，而非宫位里是否坐有行星。`
 ];
 const sorted=[...aspects].sort((a,b)=>(a.orb??99)-(b.orb??99)).slice(0,10);
 const aspRows=sorted.map(x=>`<tr><td>${esc(x.a)} ${esc(x.type||meaningOf(x.angle))} ${esc(x.b)}</td><td>${esc(x.angle??'—')}°</td><td>${num(x.orb,2)}°</td><td>${esc(meaningOf(x.angle))}</td></tr>`).join('');
 const aspTable=aspRows?`<table class="rpt-table"><thead><tr><th>相位</th><th>角度</th><th>容许度</th><th>主题</th></tr></thead><tbody>${aspRows}</tbody></table>`:'';
 const aspectLines=[
  `相位描述行星之间的几何关系，是命盘的"语法"。合相（0°）让能量融合同步，六合（60°）与三合（120°）带来协作与流动，刑相（90°）与对冲（180°）呈现张力与整合的课题。`,
  `容许度越小的相位越显著：上表按容许度由紧到松列出主要相位及其解读主题。张力相位不等于凶，它往往正是驱动成长与行动力的来源；和谐相位也不等于无需努力，顺境仍须落实才能兑现。`,
  `判断相位须同时看涉及的行星性质、容许度与落宫；单一相位不代表整个人的命运，多个相位指向同一主题时才会形成清晰的行为模式。`,
  `入相位（正在形成）与出相位（正在分离）力度不同，行运触发时刻亦有别；排盘页相位明细中列出了入出相状态，可结合推运时间进一步观察。`
 ];
 const closing=[
  `四元素与三形态的分布可从排盘页对应卡片查阅：火土风水的偏向描述能量是偏行动、稳定、思考还是情感，基本/固定/变动描述应对变化的风格。`,
  `推运（次限、行运、日返、月返）是在本命基础上的时间层，用来观察"何时"某些主题被激活；推运不能脱离本命单独解读，本命结构始终是判断的根基。`,
  `本报告依传统占星规则与当前盘面条件生成，仅作文化与自我观察参考，不构成事实预测、投资、法律或医疗建议。留一束初光，照见当下的自己。`
 ];
 const sections=[
  {title:'一、核心三要素与人格骨架',lines:core},
  {title:'二、行星落点与星座宫位',lines:placement,table:planetTable},
  {title:'三、相位格局与解读',lines:aspectLines,table:aspTable},
  {title:'四、元素分布与推运纲领',lines:closing}
 ];
 return {title:'西洋占星 · 本命详参',sections,characters:charactersOf(sections)};
}

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

// 决定当前体系下能生成哪一份成篇报告
export function composeFullReport(state,names){
 const system=state.system;
 const profile=state.profile||{};
 const label=names?.[system]||({bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘'}[system]||system);
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
 if(system==='vedic'){
  const v=state.reading?.vedic||{};
  const report=buildVedicKnowledgeReport(v);
  return {cover,title:report.title,characters:report.characters,kind:'vedic',
   lead:`Lahiri 恒星黄道 · 整宫制。上升 ${esc(v.lagna||'待定')}，九曜 ${(v.planets||[]).length} 颗，Vimshottari 大运 ${(v.dashas||[]).length} 段。以下分四层展开：上升结构、九曜星宿、大运时序与判读纲领。`,
   body:sectionHtml(report)};
 }
 if(system==='synastry'){
  const syn=state.chartState?.synastry||{};
  const result=syn.result||syn;
  const otherCase=(state.cases||[]).find(c=>c.id===syn.other);
  const otherName=syn.otherName||syn.name||otherCase?.name||'另一方';
  const report=buildSynastryKnowledgeReport(result,profile.name,otherName);
  return {cover,title:report.title,characters:report.characters,kind:'synastry',
   lead:`${esc(profile.name||'甲方')} 与 ${esc(otherName)} 的合盘：综合契合度 ${esc(result.fit?.percent??result.percent??'—')}%。以下从契合总览、印度八科、跨盘相位与干支互参四层展开，看互动模式而非断定关系走向。`,
   body:sectionHtml(report)};
 }
 // west 及未知体系兜底：显式分支，避免未来新体系再误落本命模板
 const w=state.reading?.western||{};
 const report=buildWesternKnowledgeReport(w);
 const ascText=typeof w.asc==='string'?w.asc:(w.asc?.sign||'待定');
 return {cover,title:report.title,characters:report.characters,kind:'west',
  lead:`太阳在${esc(w.planets?.find(p=>p.key==='sun')?.sign||'待定')}、月亮在${esc(w.planets?.find(p=>p.key==='moon')?.sign||'待定')}、上升${esc(ascText)}。以下分四层展开：核心三要素、行星落点、相位格局与推运纲领。`,
  body:sectionHtml(report)};
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
