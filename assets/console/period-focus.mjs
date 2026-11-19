// 时点专项报告的「差异化正文内核」：纯函数、无 DOM 依赖，浏览器与测试共用。
// 设计原则：每一句都由所选时点的真实字段推导，不同时点必然产出不同文本；
// 只做规则证据与可核对的观察，不臆造事件、不承诺结果。

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

function vedic(scope,label,data){
 const v=data.vedic||{},at=S(data.at||v.at||'').slice(0,10);
 const active=v.active||null,dasha=(v.dashas||[]).find(d=>d.active)||active;
 const out=[];
 out.push({title:`时点定性 · ${S(label)}`,lines:[
  `参考时刻 ${at||'当前'}；Lahiri 恒星黄道 · 整宫制，上升 ${S(v.lagna||'—')}。`,
  dasha?`当前主运 ${S(dasha.lord)}（${S(dasha.start||'').slice(0,10)} 起，约 ${S(dasha.years)} 年），为这一阶段的总体背景。`:'当前未定位到主运，先以本命 D1 为准。'
 ]});
 // 主星落宫与力量：不同 Dasha 主星落宫与 Shadbala 不同
 if(dasha){const lord=(v.planets||[]).find(p=>p.name===dasha.lord||p.key===dasha.lord);
  out.push({title:`主运星 · ${S(dasha.lord)}`,lines:[
   lord?`${S(lord.name)}在本命第 ${S(lord.house)} 宫、${S(lord.sign)}，${lord.retro?'逆行，表达更反复、需反复核对':'顺行'}；星宿 ${S(lord.nakshatra||'')} Pada ${S(lord.pada||'')}。`:'主运星落宫数据未列全，先以宫主关系推断。',
   v.shadbala?`力量参考见 Shadbala 六力：主运星强弱决定这运「能否顺畅表达」，弱则宜蓄力、借制度与贵人，强则宜主动承担。`:''
  ]});
 }
 if(v.varshaphala)out.push({title:'岁运 Varshaphala',lines:[
  `${S(v.varshaphala.year||at.slice(0,4))} 年太阳返照盘已起：以返照盘看该年重心，并以 D1 本命为根，不脱离本命单独以岁运断事。`
 ]});
 out.push({title:'分盘与读法',lines:[
  `D1 定底盘、D9 看关系成熟度、D10 看事业表达；分盘与岁运看阶段，吉凶须回扣 D1 宫主与行星力量。`,
  `本报告依传统 Parmesari/Vimshottari 与分盘规则生成，不构成事实预测、投资或医疗意见。`
 ]});
 return out;
}

function west(scope,label,data){
 const w=data.western||{},mode=S(data.mode||w.mode||'transit'),at=S(data.at||'').slice(0,16).replace('T',' ');
 const out=[];
 const modeText={secondary:'次限（一日推一年，看阶段性内在成长）',solar:'太阳返照（生辰太阳回归时刻立盘，主一年）',
  profection:'小限（按年龄轮值宫主星，看年度主题）',transit:'行运（当下行星过境本命宫位，看短期触发）',
  lunar:'月亮返照（月度情绪与生活节奏）',firdaria:'法达（按行星主时分段）'}[mode]||'推运';
 out.push({title:`时点定性 · ${S(label)}`,lines:[
  `参考时刻 ${at||'当前'}；推运法 ${modeText}。`,
  `推运盘须与本命同看：推运星落到本命哪一宫、与本命星成何相位，才构成可核对的时点证据。`
 ]});
 // 推运相位：逐条列出，随时刻变化
 const cross=(w.cross||w.natalCross||[]).filter(a=>a&&a.type).slice(0,10);
 out.push({title:'推运相位 · 星×宫×容许度',lines: cross.length
  ? cross.map(a=>`${S(a.a||'')} 与 ${S(a.b||'')} 成${S(a.type)}（${S(a.angle)}°，容许度 ${Number(a.orb||0).toFixed(1)}°）${crossTone(a)}。`)
  : [`本步容许度内未检出显著推运相位；以宫位与宫主星为主，不制造相位。`]});
 if(w.profection)out.push({title:'小限宫主',lines:[
  `本年小限落第 ${S(w.profection.house)} 宫（${S(w.profection.sign)}），宫主星 ${S(w.profection.ruler)}${w.profection.lordHouse?'（本命第'+S(w.profection.lordHouse)+'宫）':''}；小限看年度主题，须与行运触发同参。`
 ]});
 if(w.firdaria)out.push({title:'法达主时',lines:[
  `当前法达主星 ${S(w.firdaria.active?.lord||'—')}，为该阶段的生活方式底色；主星所落宫位与相位决定表达方式。`
 ]});
 out.push({title:'读法与边界',lines:[
  `把推运点到的宫位领域作为近期复盘重点，结合现实的资源、期限与关系核对；单一相位不当事件，容许度内才计。`,
  `本报告依传统占星推运规则生成，不构成事实预测、投资、法律或医疗意见。`
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
