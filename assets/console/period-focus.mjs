// 时点专项报告的「差异化正文内核」：纯函数、无 DOM 依赖，浏览器与测试共用。
// 设计原则：每一句都由所选时点的真实字段推导，不同时点必然产出不同文本；
// 只做规则证据与可核对的观察，不臆造事件、不承诺结果。
import {classicsReading} from '../../src/bazi-classics.mjs';

const S = v => String(v ?? '');
const pct = n => Number(n || 0).toFixed(1);
const flat = (...xs) => xs.flat().filter(x => x !== undefined && x !== null && x !== '');
const GOOD = '禄权科忌';

// 十神 → 可核对的行为倾向（作为时点定性的第一句，后续仍回扣分宫与用神）
const GOD = {
 正官:'主规则、责任与名誉，宜循正规渠道、把权责写清',
 七杀:'主压力与竞争，宜设边界、分步推进，忌硬扛',
 正财:'主稳定资源与现金流，宜量入为出、凭证务实',
 偏财:'主流动机会与资源周转，宜核算风险、不贪快',
 食神:'主输出与创造，宜稳定产出、忌过度铺陈',
 伤官:'主表达与突破常规，宜用以作品说话、忌口舌',
 正印:'主正规支持与学习，宜进修、借力制度与前辈',
 偏印:'主非标准学习与专注，宜深钻、忌空想偏执',
 比肩:'主同辈与自主，宜独立承担、明确分工',
 劫财:'主共享与竞争并行，合伙须先明权责与退出',
};

// 长生十二宫 → 气势阶段（用于区分同一十神在不同支的状态）
const STAGE = {
 长生:'气势初生，宜培育',沐浴:'气势未稳、易生浮动，宜整理',冠带:'渐入成形，宜立规矩',
 临官:'当事可任，宜担责',帝旺:'气势最盛，宜用其长、防过刚',衰:'气势转缓，宜守成复盘',
 病:'气有偏滞，宜修补、忌冒进',死:'气势收敛，宜结束旧局再谋划',墓:'气藏待发，宜整理归档',
 绝:'旧势已尽，宜另起炉灶',胎:'新机暗蓄，宜准备不宜强求',养:'涵养待时，宜积累',
};

function bazi(scope,label,data){
 const sel=(data.selected||[]).filter(Boolean);
 const cur=[...sel].reverse().find(p=>['流日','流月','流年','大运'].includes(S(p.name)))||sel.at(-1)||null;
 const guide=data.guidance||{},st=data.strength||{},nat=data.natalStrength||st;
 const out=[];
 if(!cur){
  out.push({title:'时点说明',lines:[
   `当前选择为本命原局（${S(label)}），未叠加流运干支。`,
   `以下按原局陈述，不夹带短期流年流月；若要逐条看某个时点，请在上方改选具体大运 / 流年 / 流月 / 流日。`
  ]});
  return out;
 }
 const gz=S(cur.stem)+S(cur.branch);
 // 1) 时点定性：干支 × 十神 × 长生 × 纳音，随每个时点变化
 out.push({title:`时点定性 · ${gz} ${S(cur.name||'')}`,lines:[
  `本步干支 ${gz}：天干 ${S(cur.stem)}（${S(cur.stemElement||'')}）为${S(cur.tenGod||'—')}${GOD[S(cur.tenGod)]?'，'+GOD[S(cur.tenGod)]:''}。`,
  `地支 ${S(cur.branch)}（${S(cur.branchElement||'')}），日主在此处${S(cur.changsheng||'—')}${STAGE[S(cur.changsheng)]?'——'+STAGE[S(cur.changsheng)]:''}${cur.nayin?'；纳音'+S(cur.nayin):''}。`
 ]});
 // 2) 藏干与神煞：直接取该时点柱的藏干十神与神煞
 const hidden=(cur.hidden||[]).map(h=>`${S(h.stem)}${h.god?'（'+S(h.god)+'·'+S(h.rank||'')+'）':''}`);
 const sha=(cur.shensha||[]).map(s=>S(s?.name||s));
 out.push({title:'藏干与神煞',lines:[
  hidden.length?`本步地支藏干：${hidden.join('、')}。藏干提示这一阶段被引动的潜在主题，须待流日或现实事项引动才显。`:'本步地支未列藏干细分。',
  sha.length?`传统神煞标记：${sha.join('、')}。神煞只作辅助提示，须回到五行生克与宫位才能定性。`:'本步未命中神煞规则表。'
 ]});
 // 3) 引动本命的具体关系：按涉及哪一柱、为喜为忌逐条展开
 const inf=(guide.influences||[]).filter(x=>x?.text);
 out.push({title:'引动本命的具体关系',lines: inf.length
  ? inf.map(x=>x.text)
  : [`本期未见直接牵动原局天干地支的合冲刑害；吉凶以日主旺衰与月令气势为准，不凭单一干支下结论。`]});
 // 4) 扶抑与喜忌：该时点重算后的扶助度 vs 原局
 out.push({title:'扶抑与喜忌',lines:[
  `并入本步后日主扶助参考 ${pct(st.support)}%（原局 ${pct(nat.support)}%，${S(nat.kind||'—')}）。`,
  `喜用参考 ${(st.useful||[]).join('、')||'均衡'}，忌偏参考 ${(st.caution||[]).join('、')||'未单列'}；时点取舍仍以原局喜忌为准，不因一步干支改弦更张。`,
  st.roles?.note?`角色划分：${S(st.roles.note)}`:''
 ]});
 // 4.5) v0.41.0 古籍深挖：以五部子平原著为据，按十神配置分别推事业/正财/偏财/感情与应期。
 //      凡古籍无据者不妄断——内核对条件不足的主题只列观察点，不造事件。
 {
  const byName=n=>sel.find(p=>S(p.name)===n);
  const luck=byName('大运'),year=byName('流年'),day=byName('流日');
  const curElem=S(cur.stemElement||cur.branchElement||'');
  const curBranchElem=S(cur.branchElement||'');
  const useful=st.useful||nat.useful||[],caution=st.caution||nat.caution||[];
  const avoid=st.roles?.avoid||[],enemy=st.roles?.enemy||[];
  // 仇神(enemy)/忌神(avoid)与忌神同侧；比劫idle归中性。干支任一落喜用即按喜用论。
  const bad=[...caution,...avoid,...enemy];
  const role=(useful.includes(curElem)||useful.includes(curBranchElem))?'useful'
   :(bad.includes(curElem)||bad.includes(curBranchElem))?'caution':'neutral';
  const natalPillars=data.pillars||[];
  // 调候补论：优先用内核 tiaoHou 字段现算 note；无字段时按本命月支兜底提示，不妄断具体用神。
  const th=data.tiaoHou;
  const tiaoNote=th?.note||(natalPillars[1]?.branch?`月令 ${natalPillars[1].branch} 定寒暖燥湿；调候与扶抑互补，本盘未提供逐月调候明细，此处不指定具体用神。`:'');
  out.push(...classicsReading({
   god:S(cur.tenGod||'正官'),role,strengthKind:S(st.kind||nat.kind||'中和'),
   gz:S(cur.stem)+S(cur.branch),monthBranch:S(natalPillars[1]?.branch||''),
   luckName:'大运',luckGZ:luck?S(luck.stem)+S(luck.branch):'',
   yearName:'流年',yearGZ:year?S(year.stem)+S(year.branch):'',
   dayName:'流日',dayGZ:day?S(day.stem)+S(day.branch):'',
   tiaoHouNote:tiaoNote
  }));
 }
 // 5~7) 事业 / 财帛 / 情缘，直接取按时点喜忌定制的建议
 for(const a of (guide.advice||[]))out.push({title:S(a.topic||'专项建议'),lines:[S(a.text)]});
 // 8) 分层时点：多步同选时逐层
 if(sel.length>1)out.push({title:'分层时点',lines:[
  `本次叠加顺序：${sel.map(p=>`${S(p.name)} ${S(p.stem)}${S(p.branch)}${p.tenGod?'（'+S(p.tenGod)+'）':''}`).join(' → ')}。`,
  `以最细一层为触发、以大运为环境；层与层同指一事时才提高可信度，彼此矛盾时以月令与原局喜忌裁断。`
 ]});
 out.push({title:'读法与边界',lines:[
  `本报告依传统子平规则与当前命盘条件生成，属可核对的规则化观察，不构成事实预测、投资或医疗意见。`
 ]});
 return out;
}

function ziwei(scope,label,data){
 const f=data.flow||{},pal=data.palaceNames||{},chart=data.chart||{};
 const out=[];
 const nameOf=b=>pal[b]||'某宫';
 out.push({title:`时点定性 · ${S(f.ganZhi||'')} ${S(f.label||'')}`,lines:[
  `本步 ${S(f.label||S(scope))} ${S(f.year||'')}${f.month?' 年'+f.month+'月':''}${f.day?' '+f.day+'日':''}，干支 ${S(f.ganZhi||'—')}${f.date?'（公历 '+S(f.date)+'）':''}。`,
  `流命宫落本命${S(data.lifePalace||'命宫')}；这一宫的主星结构决定本阶段看问题的角度，大限为环境、流年为节奏。`
 ]});
 // 四化 × 落宫：每颗化星与落宫都来自所选时点天干
 const mut=(f.mutagens||[]).filter(m=>m.star);
 out.push({title:'四化飞布 · 星×宫',lines: mut.length
  ? mut.map(m=>`${S(m.star)}化${S(m.type)}入${m.branch===null||m.branch===undefined?'未定宫':nameOf(m.branch)}，${m.type==='禄'?'看资源入口与机会':m.type==='权'?'看责任、执行与主导':m.type==='科'?'看文书、名誉与缓冲':'看反复、牵挂与边界'}；须同看该宫、对宫与三方。`)
  : [`本步四化规则表未检出落宫，先以流命宫主星与本命四化为据。`]});
 // 禄存：随流年天干而变，进一步区分同宫不同年
 if(f.yearlyLuCunBranch!==null&&f.yearlyLuCunBranch!==undefined)out.push({title:'禄存落宫',lines:[
  `流年禄存在${nameOf(f.yearlyLuCunBranch)}。禄存为保守型资源位，与化禄同看可辨「外来机会」与「自有积累」之别。`
 ]});
 // 流命宫主星：从本命盘按支取，令报告随落宫变化
 const lifeBranch=Object.keys(pal).find(b=>pal[b]==='命宫');
 const lp=(chart.palaces||[]).find(p=>String(p.branch)===String(lifeBranch));
 const stars=lp?(lp.majorStars||lp.borrowedStars||[]):[];
 if(stars.length)out.push({title:'流命宫主星',lines:[
  `流命宫主星：${stars.map(s=>`${S(s.name)}${s.brightness?'（'+S(s.brightness)+'）':''}`).join('、')}。${stars.length>1?'双星同宫须并看两星性质，不单取一星断事。':'单星坐宫，性质较集中，仍须看会照。'}`
 ]});
 if(f.scope==='monthly'||f.scope==='daily')out.push({title:'流月流日细分',lines:[
  `本步细分到${S(f.scope==='daily'?'流日':'流月')}（${f.scope==='daily'?'农历'+S(f.month)+'月'+S(f.day)+'日':S(f.year)+'年'+S(f.month)+'月'}），最小单位用于择时与核对日程，不改流年总体格局。`,
  `流日干支逐日不同，四化亦随之变化；只看当日触发，不用单日化忌否定整月。`
 ]});
 out.push({title:'读法与边界',lines:[
  `以流命宫为主星结构，叠看大限宫与本命命宫；四化看星落何宫，宫位主题是现实核对范围，不是事件必然发生。`,
  `本报告依传统斗数规则生成，不构成事实预测、投资、法律或医疗意见。`
 ]});
 return out;
}

/* 宫位主题 / 行星性质：时点盘的逐行星解读字典（精简副本，独立于 deep-vedic 的前端实现） */
const V_HOUSE={1:'自我与体魄',2:'财货与家声',3:'勇气与同业',4:'居所与心境',5:'智识与子女',6:'竞争与债务',7:'伴侣与合作',8:'隐秘与转化',9:'信念与远行',10:'事业与名誉',11:'社群与收益',12:'损耗与灵修'};
const V_NATURE={太阳:'生命力、自我与权威',月亮:'心智、情绪与记忆',火星:'行动、竞争与胆识',水星:'智力、表达与商业',木星:'智慧、扩张与贵人',金星:'美、爱与享受',土星:'纪律、时间与考验',罗睺:'欲望、颠覆与外来机遇',计都:'超脱、灵性与旧业'};
const W_HOUSE=['自我与形象','财帛与价值','沟通与同辈','家宅与根基','创造与表达','工作与健康','伴侣与合作','转化与共财','信念与远行','事业与名望','社群与收益','潜意识与幕后'];
const W_NATURE={太阳:'自我与生命力',月亮:'情绪与安全感',水星:'思维与沟通',金星:'爱与审美',火星:'行动与欲望',木星:'扩张与信念',土星:'结构与考验',天王星:'变革与突破',海王星:'梦想与消融',冥王星:'转化与掌控',北交点:'成长方向',南交点:'旧有惯性'};

function vedic(scope,label,data){
 const v=data.vedic||{},at=S(data.at||v.at||'').slice(0,10);
 const active=v.active||null,dasha=(v.dashas||[]).find(d=>d.active)||active;
 const transit=v.atChart||null; // 该时点的行运 D1（随所选时刻变化）
 const out=[];
 // 1) 时点定性：本命 vs 时点行运盘，随时点变化
 out.push({title:`时点定性 · ${S(label)}`,lines:[
  `参考时刻 ${at||'当前'}；口径为 Lahiri 恒星黄道 · 整宫制。本命上升 ${S(v.lagna||'—')} 终身不变。`,
  transit?`该时刻在出生地另起一张行运盘：时点上升 ${S(transit.lagna||'—')}。行运盘回答「此刻天象落在我哪一宫」，本命盘回答「我是谁」，两张必须叠看，不能只看行运。`:'本次未取得时点行运盘，以下以本命盘与主运为准。'
 ]});
 // 2) 时点行运盘逐行星落宫：每颗星给落宫主题、星座、逆行、宿
 if(transit&&(transit.planets||[]).length){
  const rows=transit.planets.map(p=>{
   const h=Number(p.house)||0;
   return `${S(p.name)}${p.retro?'℞':''}落第 ${S(p.house)} 宫（${V_HOUSE[h]||'—'}）· ${S(p.sign)}${p.nakshatra?' · '+S(p.nakshatra)+'宿':''}${p.nakLord?'（宿主'+S(p.nakLord)+'）':''}`;
  });
  out.push({title:'时点行运盘 · 逐行星落宫',lines:[
   ...rows,
   `读法：行星落宫指出「此刻哪块生活被点亮」；${V_NATURE['木星']}落宫多为助力，${V_NATURE['土星']}、${V_NATURE['火星']}落宫多带考验与行动压力，影曜（罗睺/计都）落宫则强调非常规的牵引。逆行表示主题反复、宜核对不宜急定。`
  ]});
 }
 // 3) 过境对照：本命行星与时点行星的宫位差异，指出「哪颗星换了宫」
 if(transit&&(v.planets||[]).length&&(transit.planets||[]).length){
  const moved=(transit.planets||[]).map(tp=>{
   const bp=(v.planets||[]).find(p=>p.key===tp.key||p.name===tp.name);
   if(!bp||Number(bp.house)===Number(tp.house))return null;
   return `${S(tp.name)} 从本命第 ${S(bp.house)} 宫（${V_HOUSE[Number(bp.house)]||'—'}）过境到时点第 ${S(tp.house)} 宫（${V_HOUSE[Number(tp.house)]||'—'}）`;
  }).filter(Boolean);
  out.push({title:'过境对照 · 换宫的行星',lines: moved.length
   ? [...moved.slice(0,9),`换宫的行星是本次时点最值得关注的触发点：过境到角宫（1/4/7/10）主题更外显，过境到续宫（2/5/8/11）多关乎资源与积累，过境到果宫（3/6/9/12）偏日常与幕后。`]
   : ['本次时点盘的行星落宫与本命相同，未见明显换宫；此阶段以主运与岁运为主题，过境触发相对平静。']
  });
 }
 // 4) 主运星深度：落宫 + Shadbala 力量 + 功能吉凶
 if(dasha){const lord=(v.planets||[]).find(p=>p.name===dasha.lord||p.key===dasha.lord);
  const sb=(v.shadbala?.rows||[]).find(r=>r.name===dasha.lord);
  out.push({title:`主运星深度 · ${S(dasha.lord)}`,lines:[
   lord?`${S(dasha.lord)}在本命第 ${S(lord.house)} 宫（${V_HOUSE[Number(lord.house)]||'—'}）、${S(lord.sign)}，${lord.retro?'逆行，主题反复且需多次核对':'顺行'}；星宿 ${S(lord.nakshatra||'')} Pada ${S(lord.pada||'')}，宿主 ${S(lord.nakLord||'—')}。`:'主运星本命落宫数据未列全，以宫主关系推断。',
   `时段 ${S(dasha.start||'').slice(0,10)} 至 ${S(dasha.end||'').slice(0,10)}（约 ${S(dasha.years)} 年）。主运星所落之宫，是这一阶段持续兑现的主战场。`,
   sb?`力量参考 Shadbala：${S(dasha.lord)}合计 ${Number(sb.rupas||0).toFixed(2)} Rupa，在七曜中列第 ${Number(sb.rank||0)} 位，最大短板在${S(sb.weakestPart?.[0]||'—')}。${Number(sb.rank||7)<=3?'位次靠前——所主领域较能主动兑现，可作这一阶段的资源入口。':Number(sb.rank||7)>=6?'位次靠后——所主领域更依赖外部资源与长期积累，不宜硬碰硬。':'位次居中——主题能否兑现更看过境触发与个人经营。'}`:'本盘未提供 Shadbala 分项，力量强弱以庙旺与宫主关系定性。',
   sb?`读法边界：本表未计 Kala Bala 的 Nathonnatha/Ayana 等分项，采用本实现量纲，不能拿它对经典「达标线」下绝对结论——请按七曜相对位次与分项短板读取。`:''
  ]});
 }
 // 5) 岁运 Varshaphala：返照盘上升与关键落宫
 if(v.varshaphala){
  const vc=v.varshaphala.chart||{},vp=vc.planets||[];
  out.push({title:`岁运 Varshaphala · ${S(v.varshaphala.year||at.slice(0,4))} 年`,lines:[
   `${S(v.varshaphala.year||'')} 年太阳返照盘：上升 ${S(vc.lagna||'—')}，虚岁 ${S(v.varshaphala.age||'—')}。返照盘看该年重心，D1 本命为根，不脱离本命单独以岁运断事。`,
   vp.length?`返照盘要点：${vp.slice(0,6).map(p=>`${S(p.name)}第${S(p.house)}宫（${V_HOUSE[Number(p.house)]||'—'}）`).join('、')}。与行运盘、主运同主题处，是该年较明确的着力点。`:'返照盘未列出行星落宫细项，以返照上升与 D1 叠看为主。'
  ]});
 }
 out.push({title:'读法与边界',lines:[
  `三盘叠看：D1 定「我是谁」、时点行运盘定「此刻触发哪一宫」、Varshaphala 定「这一年主轴」；主运星定「这一阶段的大背景」。四者同指向的主题最值得核对，冲突处宜保守。`,
  `本报告依 Lahiri 恒星黄道整宫制、Vimshottari 主运与 Shadbala 规则生成，只作传统术数文化观察，不构成事实预测、投资或医疗意见。`
 ]});
 return out;
}

function west(scope,label,data){
 const w=data.western||{},mode=S(data.mode||w.mode||'transit'),at=S(data.at||'').slice(0,16).replace('T',' ');
 const outer=w.outer||w.chart||null; // 行运盘（随时点变化）；本命盘为 w.chart
 const natal=w.chart||null;
 const out=[];
 const modeText={secondary:'次限（一日推一年，看阶段性内在成长）',solar:'太阳返照（生辰太阳回归时刻立盘，主一年）',
  profection:'小限（按年龄轮值宫主星，看年度主题）',transit:'行运（当下行星过境本命宫位，看短期触发）',
  lunar:'月亮返照（月度情绪与生活节奏）',firdaria:'法达（按行星主时分段）'}[mode]||'推运';
 out.push({title:`时点定性 · ${S(label)}`,lines:[
  `参考时刻 ${at||'当前'}；推运法 ${modeText}。`,
  natal?`本命盘为根（终身不变），行运盘为「此刻天象」：两者叠看才构成可核对的证据——行运星落到本命哪一宫、与本命星成何相位，才是本时点的重点。`:'本次未取得本命盘细项，以下以行运盘与相位为准。'
 ]});
 // 2) 行运行星逐颗落本命宫：每颗给宫位主题、星座、逆行、尊贵度
 if(outer&&(outer.planets||[]).length){
  const rows=(outer.planets||[]).filter(p=>p&&p.key&&p.key!=='northnode'&&p.key!=='southnode').map(p=>{
   const h=Number(p.house)||0;
   return `${S(p.name)}${p.retro?'℞':''}落本命第 ${S(p.house)} 宫（${W_HOUSE[h-1]||'—'}）· ${S(p.sign)}${p.degree?' '+p.degree.degrees+'°'+p.degree.minutes+'′':''}${p.dignity&&p.dignity!=='中性'?' · '+S(p.dignity):''}`;
  });
  out.push({title:'行运行星 · 逐颗落本命宫',lines:[
   ...rows,
   `读法：行运星落宫指出「此刻被点亮的领域」；${W_NATURE['木星']}、${W_NATURE['金星']}过境多带助力与舒缓，${W_NATURE['土星']}、${W_NATURE['火星']}过境多带结构压力与行动要求，外行星（天王/海王/冥王）过境主长期背景转变。逆行表示该主题反复，宜复盘不宜急定。`
  ]});
 }
 // 3) 推运相位逐条：星×相位×角度×容许度×性质×进/出相位
 const cross=(w.cross||w.natalCross||[]).filter(a=>a&&a.type);
 const harm=cross.filter(a=>/[合三分六分拱]/.test(S(a.type))).length,tens=cross.filter(a=>/[刑冲四分对分]/.test(S(a.type))).length;
 out.push({title:'推运相位 · 星×宫×容许度',lines: cross.length
  ? [...cross.slice(0,12).map(a=>`${S(a.a)} 与 ${S(a.b)} 成${S(a.type)}（${Number(a.angle)}°，容许度 ${Number(a.orb||0).toFixed(1)}°）${crossTone(a)}${a.applying===true?'，正在形成（ applying，能量上升）':a.applying===false?'，正在分离（出相位，余波）':''}。`),
     `本次共 ${cross.length} 条推运相位：和谐相 ${harm} 条、张力相 ${tens} 条。${harm>tens?'整体以支持与顺势为主，宜主动推进。':tens>harm?'整体以压力与调整为底，宜先立边界、分步走。':'支持与压力相当，按宫位领域分别核对。'}单一相位不定事件，须容许度内且多证据同向才计。`]
  : ['本步容许度内未检出显著推运相位；以行运落宫与宫主星为主，不制造相位。']});
 if(w.profection)out.push({title:'小限宫主 · 年度主题',lines:[
  `本年小限落第 ${S(w.profection.house)} 宫（${S(w.profection.sign)}，主${W_HOUSE[Number(w.profection.house)-1]||'—'}），宫主星 ${S(w.profection.ruler)}${w.profection.lordHouse?'（本命第'+S(w.profection.lordHouse)+'宫）':''}。`,
  `小限定「今年的主题领域」，行运定「何时触发」；宫主星所落宫位指出该主题的现实落点，两者同宫时主题最集中。`
 ]});
 if(w.firdaria)out.push({title:'法达主时',lines:[
  `当前法达主星 ${S(w.firdaria.active?.lord||'—')}，为该阶段的生活方式底色${w.firdaria.sub?'，副主星 '+S(w.firdaria.sub?.lord||''):''}；主星所落宫位与相位决定表达方式。`,
  `法达看「较长时段的底色」，与行运的「当下触发」叠加：底色星与行运星同性质时，该主题更集中显现。`
 ]});
 out.push({title:'读法与边界',lines:[
  `三件事叠看：行运行星「落在哪一宫」＝被点亮的领域；推运相位「哪两颗星成什么角」＝以何种方式互动；小限/法达「值年星是谁」＝年度或阶段主题。三者同指一处，才是最值得核对的时点重点。`,
  `本报告依古典占星推运与容许度规则生成，只作传统术数文化观察，不构成事实预测、投资、法律或医疗意见。`
 ]});
 return out;
}

function crossTone(a){
 const ang=Number(a.angle);
 if(ang===0)return '，合相主主题被强调、两股力量同向';
 if(ang===60)return '，六分相主机会与配合，需主动促成';
 if(ang===90)return '，四分相主张力与调整，宜立边界';
 if(ang===120)return '，三分相主顺畅与助力，宜顺势推进';
 if(ang===180)return '，对分相主对峙与取舍，宜兼顾两端';
 return '';
}

// 对外：按体系返回一节节「标题 + 行」的差异化正文。
export function focusSections(system,scope,label,data){
 switch(system){
  case 'bazi':return bazi(scope,label,data);
  case 'ziwei':return ziwei(scope,label,data);
  case 'vedic':return vedic(scope,label,data);
  default:return west(scope,label,data);
 }
}
