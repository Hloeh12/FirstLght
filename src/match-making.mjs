/* 八字合婚 + 紫微合盘：双人关系的多体系互参（纯计算，不虚构契合度分数）。
 * 契合度百分比仍由印度 Ashtakoota 八科单向提供（见 console-engine.pairReading），
 * 本模块只补「八字干支/十神/用神」与「紫微命宫/夫妻宫互参」的结构化证据，交报告层解读。
 * 口径：传统婚配取象，供文化参考，不作关系质量实证结论。 */
import {ziweiChart} from './ziwei.mjs';
import {tenGod as canonicalTenGod} from './bazi.mjs';

const BRANCH_EL={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
const CLASH={子:'午',午:'子',丑:'未',未:'丑',寅:'申',申:'寅',卯:'酉',酉:'卯',辰:'戌',戌:'辰',巳:'亥',亥:'巳'};
const LIUHE={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
const SANHE=[['申','子','辰','水'],['寅','午','戌','火'],['巳','酉','丑','金'],['亥','卯','未','木']];
const HAI=[['子','未'],['丑','午'],['寅','巳'],['卯','辰'],['申','亥'],['酉','戌']];
const PO=[['子','酉'],['卯','午'],['辰','丑'],['未','戌'],['寅','亥'],['巳','申']];
// 相刑：子卯无礼刑、寅巳申无恩刑（二元取寅巳/巳申）、丑戌未恃势刑（二元取丑戌/戌未）、辰午酉亥自刑
const XING=[['子','卯'],['寅','巳'],['巳','申'],['丑','戌'],['戌','未'],['辰','辰'],['午','午'],['酉','酉'],['亥','亥']];
const STEM_HE={甲:'己',己:'甲',乙:'庚',庚:'乙',丙:'辛',辛:'丙',丁:'壬',壬:'丁',戊:'癸',癸:'戊'};
const STEM_EL={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
// 日主阴阳：甲丙戊庚壬为阳、乙丁己辛癸为阴——传统合婚看「阴阳相济」
const YANG_STEMS='甲丙戊庚壬',YIN_STEMS='乙丁己辛癸';
const yinYangOf=s=>YANG_STEMS.includes(s)?'阳':YIN_STEMS.includes(s)?'阴':null;
// 纳音五行：纳音名末字即五行（海中金→金、炉中火→火、大林木→木…）
const SHENG={木:'火',火:'土',土:'金',金:'水',水:'木'};
const KE={木:'土',土:'水',水:'火',火:'金',金:'木'};
function nayinElement(nayin){
 if(!nayin||nayin==='—')return null;
 const s=String(nayin);
 for(let i=s.length-1;i>=0;i--)if('金木水火土'.includes(s[i]))return s[i];
 return null;
}
function nayinRelation(a,b){
 if(!a||!b)return {kind:'unknown',text:'纳音五行未取到，不据此判读'};
 if(a===b)return {kind:'same',text:`同为${a}——同气相求、节奏相近，默契有余但互补性弱，宜主动引入差异视角`};
 if(SHENG[a]===b)return {kind:'support',text:`${a}生${b}——一方滋养另一方的「生」象，传统视为顺配，付出与承接宜有来有往`};
 if(SHENG[b]===a)return {kind:'support',text:`${b}生${a}——一方滋养另一方的「生」象，传统视为顺配，付出与承接宜有来有往`};
 if(KE[a]===b)return {kind:'challenge',text:`${a}克${b}——五行相克之象，相处有天然张力，靠规则与分工化解，非吉凶判决`};
 if(KE[b]===a)return {kind:'challenge',text:`${b}克${a}——五行相克之象，相处有天然张力，靠规则与分工化解，非吉凶判决`};
 return {kind:'unknown',text:'纳音五行无明显生克，不据此判读'};
}
// 六合化气与天干五合化气：合婚不只说「合」，还说合出什么五行（传统合化口径）
const HUA6={子丑:'土',寅亥:'木',卯戌:'火',辰酉:'金',巳申:'水',午未:'土'};
const STEM_HUA={甲己:'土',乙庚:'金',丙辛:'水',丁壬:'木',戊癸:'火'};
const HUA_OF=(tbl,a,b)=>tbl[a+b]||tbl[b+a]||null;
const sanheGroup=a=>SANHE.find(t=>t.includes(a))||null;
/* 地支关系详断：返回 kind / hua（合化五行）/ 半合类型，供日支与生肖共用。
 * 一支与另一支通常只落一种关系（子午冲、子丑合、子辰半合、子卯刑、子未害、子酉破），
 * 故按「冲→合→三合/半合→刑→害→破」的固定优先级取第一条，不叠加编造。 */
export function branchRelation(a,b){
 if(!a||!b)return {kind:'unknown',text:'地支缺失，不据此判读'};
 if(CLASH[a]===b)return {kind:'六冲',text:'六冲'};
 if(LIUHE[a]===b)return {kind:'六合',hua:HUA_OF(HUA6,a,b),text:'六合'};
 const g=sanheGroup(a);
 if(g&&g.includes(b)){
  const i=g.indexOf(a),j=g.indexOf(b),pair=[i,j].sort().join('');
  return pair==='12'?{kind:'半合',sub:'墓地半合',hua:g[3],text:'半合'}:
   pair==='01'?{kind:'半合',sub:'生地半合',hua:g[3],text:'半合'}:
   {kind:'三合局',hua:g[3],text:'三合局'};
 }
 if(XING.some(p=>p[0]===a&&p[1]===b))return {kind:'相刑',text:'相刑'};
 if(HAI.some(p=>p.includes(a)&&p.includes(b)))return {kind:'相害',text:'相害'};
 if(PO.some(p=>p.includes(a)&&p.includes(b)))return {kind:'相破',text:'相破'};
 if(a===b)return {kind:'同支',text:'同支（比和）'};
 return {kind:'无',text:'无明显刑冲合害'};
}
export function relOf(a,b){
 const r=branchRelation(a,b);
 if(r.kind==='六合'||r.kind==='六冲'||r.kind==='相刑'||r.kind==='相害'||r.kind==='相破')return r.kind;
 if(r.kind==='三合局')return '三合局('+r.hua+')';
 if(r.kind==='半合')return '半合('+r.hua+')';
 return null;
}
// 十神：委托 bazi.mjs 的权威实现（五行生克+阴阳同异定正偏），避免自造索引越界。
// 旧实现用 floor(diff/2) 索引 2×3 数组，diff≥6 时越界返回 null，实测 100 组错 95 组。
const STEM_IDX={甲:0,乙:1,丙:2,丁:3,戊:4,己:5,庚:6,辛:7,壬:8,癸:9};
export function tenGod(me,other){
 const d=STEM_IDX[me],s=STEM_IDX[other];
 return d===undefined||s===undefined?null:canonicalTenGod(d,s);
}

/* 八字合婚证据 */
export function baziMatch(ba,bb){
 const pa=ba.pillars||[],pb=bb.pillars||[];
 const dayA=pa[2]||{},dayB=pb[2]||{};
 const yearA=pa[0]||{},yearB=pb[0]||{};
 const items=[];
 // 1 日支（婚姻宫）详断：六冲/六合（含化气）/三合局/半合（生地·墓地）/相刑/相害/相破/同支
 const dR=branchRelation(dayA.branch,dayB.branch);
 const DAY_TEXT={
  六冲:'宫位相冲，节奏与生活惯性错位，聚散明显；冲不是「不合」，是必须靠沟通与作息安排把差异摆到桌面上。',
  六合:`婚姻宫六合${dR.hua?'，合化'+dR.hua:''}——性情相吸、相处有黏性，传统视为婚配中的「有情」之象；黏性过强时也要留各自空间。`,
  三合局:`婚姻宫同属${dR.hua}局三合——同气相求，目标与生活节律容易一致，是传统婚配里较被看重的结构。`,
  半合:`婚姻宫${dR.sub||'半合'}成${dR.hua}局——有相合之意但不完整，彼此吸引之中带着一点距离，正好留出磨合空间。`,
  相刑:'宫位相刑，容易在「谁说了算」上反复较劲，或把关心表达成挑剔；刑的解法是规则先行，不在情绪里争论对错。',
  相害:'宫位相害，暗耗多于明争，常见「说不出哪里不对但就是累」；宜把不满及时说清，不让小事积压。',
  相破:'宫位相破，日常琐事上易互相打乱节奏，属小摩擦型结构，靠分工与容错度即可化解。',
  同支:'日支同支（比和），生活节奏相近、容易互相理解，但缺少互补视角，遇事需主动引入第三方意见。',
  无:'两宫无明显刑冲合害，婚姻宫不构成主要线索，关系更看后天经营与其它结构项。',
  unknown:'地支资料不全，婚姻宫不作判读。'
 };
 items.push({key:'dayBranch',name:'日柱（婚姻宫）',level:['六合','三合局','半合'].includes(dR.kind)?'support':['六冲','相刑','相害','相破'].includes(dR.kind)?'challenge':'neutral',
  text:`双方日支 ${dayA.branch||'—'} 与 ${dayB.branch||'—'}：${dR.kind==='unknown'?'资料不全':dR.text}。${DAY_TEXT[dR.kind]||DAY_TEXT.unknown}`,detail:{kind:dR.kind,hua:dR.hua||null,sub:dR.sub||null}});
 // 2 日干：天干五合 + 合化五行
 const stemHe=STEM_HE[dayA.stem]===dayB.stem;
 const stemHua=stemHe?HUA_OF(STEM_HUA,dayA.stem,dayB.stem):null;
 items.push({key:'dayStem',name:'日干',level:stemHe?'support':'neutral',
  text:`双方日干 ${dayA.stem||'—'} 与 ${dayB.stem||'—'}${stemHe?`正成天干五合${stemHua?'、合化'+stemHua:''}——传统视为「有情」之配，容易一见如故，也容易彼此迁就过头`:'未见天干五合，谈不上天生有情，合不合看后天相处'}。`,detail:{he:stemHe,hua:stemHua}});
 // 3 生肖（年支）详断：把六合/三合/半合/冲/刑/害/破逐条点名，不再只给一个模糊结论
 const zR=branchRelation(yearA.branch,yearB.branch);
 const ZODIAC_TEXT={
  六合:`属相六合${zR.hua?'（合化'+zR.hua+'）':''}——传统视为上等婚配结构，两家往来、长辈关系较易协调。`,
  三合局:`属相同属${zR.hua}局三合——圈层、价值观与做事节奏相近，谈家庭规划容易谈得拢。`,
  半合:`属相${zR.sub||'半合'}成${zR.hua}局——有天然亲近感，但不如整局三合稳固，仍需经营。`,
  六冲:'属相六冲——传统婚配里最常被提起的一条，实际含义是两家节奏与立场容易对撞，须提前约定年节、金钱、育儿等「易撞点」。',
  相刑:'属相相刑——易在礼数与边界上互相刺痛，多因「我都是为你好」而起，宜把话说在事前。',
  相害:'属相相害——传统称「暗害」，指不易察觉的消耗，多来自双方家庭的隐性期待，宜各自与原生家庭划清边界。',
  相破:'属相相破——小事上互不顺眼，属摩擦型，不影响根本，靠包容即可。',
  同支:'属相相同（比和）——同龄人式的理解与竞争并存，容易同步也容易同盲。',
  无:'属相之间无冲合，不成为助力也不构成阻碍，不必拿生肖决定关系。',
  unknown:'年支资料不全，不作属相判读。'
 };
 items.push({key:'zodiac',name:'生肖年支',level:['六合','三合局','半合'].includes(zR.kind)?'support':['六冲','相刑','相害','相破'].includes(zR.kind)?'challenge':'neutral',
  text:`年支 ${yearA.branch||'—'} 与 ${yearB.branch||'—'}：${zR.kind==='unknown'?'资料不全':zR.text}。${ZODIAC_TEXT[zR.kind]||ZODIAC_TEXT.unknown}`,detail:{kind:zR.kind,hua:zR.hua||null,sub:zR.sub||null}});
 // 4 年命纳音（传统「年命」即年柱纳音）：与日柱纳音分开看，年命主两家气场、日柱主两人相处
 const yaEl=nayinElement(yearA.nayin),ybEl=nayinElement(yearB.nayin),yaRel=nayinRelation(yaEl,ybEl);
 items.push({key:'yearNayin',name:'年命纳音',level:yaRel.kind==='support'?'support':yaRel.kind==='challenge'?'challenge':'neutral',
  text:`甲方年命 ${yearA.nayin||'—'}${yaEl?'（'+yaEl+'）':''}，乙方 ${yearB.nayin||'—'}${ybEl?'（'+ybEl+'）':''}——${yaRel.text}。年命纳音传统上看两家气场与长辈缘分，与日柱纳音（看两人相处）分属两层，不合并计分。`});
 // 3 十神互补：对方日干相对我是什么，是否互为财/官（传统夫财妻官）
 const godBA=tenGod(dayA.stem,dayB.stem),godAB=tenGod(dayB.stem,dayA.stem);
 const moneyOfficial=g=>['正财','偏财','正官','七杀'].includes(g);
 items.push({key:'tenGod',name:'十神互补',level:moneyOfficial(godBA)&&moneyOfficial(godAB)?'support':'neutral',
  text:`以甲之眼看乙为「${godBA||'—'}」，以乙之眼看甲为「${godAB||'—'}」。${moneyOfficial(godBA)&&moneyOfficial(godAB)?'双方互为财官之象，传统婚配视为责任与吸引兼具的组合':'十神不全是财官组合，相处更看性格与共同目标，不必套公式'}。`});
 // 4 用神互补：一方的喜用是否为另一方命局所有/所喜
 const ua=ba.strength?.useful||[],ub=bb.strength?.useful||[];
 const shared=ua.filter(e=>ub.includes(e));
 const aNeedFromB=(bb.pillars||[]).some(p=>ua.includes(p.stemElement)||ua.includes(p.branchElement));
 const bNeedFromA=(ba.pillars||[]).some(p=>ub.includes(p.stemElement)||ub.includes(p.branchElement));
 items.push({key:'useful',name:'喜用互补',level:shared.length||(aNeedFromB&&bNeedFromA)?'support':'neutral',
  text:`甲方喜用 ${ua.join('、')||'中和未单列'}，乙方喜用 ${ub.join('、')||'中和未单列'}。${shared.length?'共同喜用为 '+shared.join('、')+'，两人可往同一五行环境借力':aNeedFromB&&bNeedFromA?'对方的命局恰含自己所需之五行，传统视为互补':'喜用不显式互补，以各自行运调节为主'}。`});
 // 5 用神↔忌神双向克耗：甲喜用∩乙忌神（甲需乙之五行被乙命压制）、反之亦然
 // 双向皆真＝实质互补（彼此能卸掉对方的忌神）；单向＝一方付出型；皆假＝无明显克耗
 const ca=ba.strength?.caution||ba.strength?.roles?.avoid||[],cb=bb.strength?.caution||bb.strength?.roles?.avoid||[];
 const aNeed=ua.filter(e=>cb.includes(e)),bNeed=ub.filter(e=>ca.includes(e));
 const uaLevel=aNeed.length&&bNeed.length?'support':(aNeed.length||bNeed.length)?'challenge':'neutral';
 items.push({key:'usefulAvoid',name:'用神↔忌神',level:uaLevel,
  text:`甲方喜用 ${ua.join('、')||'—'} 对乙方忌神 ${cb.join('、')||'—'}：交集${aNeed.length?'【'+aNeed.join('、')+'】':''}；乙方喜用 ${ub.join('、')||'—'} 对甲方忌神 ${ca.join('、')||'—'}：交集${bNeed.length?'【'+bNeed.join('、')+'】':''}。${aNeed.length&&bNeed.length?'双向互为用忌——传统视为「彼此能卸掉对方忌神」的实质互补，两人在一起反而各自松绑，是较稀缺的结构':aNeed.length?`仅甲方喜用落在乙方忌神（${aNeed.join('、')}）——乙方需为这段关系克制自身忌神之性，付出感偏多，宜有来有往`:bNeed.length?`仅乙方喜用落在甲方忌神（${bNeed.join('、')}）——甲方承担较多克制与成全，长期须防失衡`:'双方喜用与对方忌神无明显交集，不必靠「互相克制」维系，相处更看共同目标'}。此为扶抑模型内的取象，非吉凶判定。`});
 // 6 日主强弱互补：身强×身弱为一泄一补（传统视为分工互补）；两强/两弱各有课题
 const ka=ba.strength?.kind,kb=bb.strength?.kind;
 const balanceLevel=ka&&kb&&ka!==kb&&ka!=='中和'&&kb!=='中和'?'support':ka==='中和'||kb==='中和'?'neutral':'challenge';
 items.push({key:'strengthBalance',name:'日主强弱',level:balanceLevel,
  text:`甲方日主${ka||'—'}（扶助 ${Number(ba.strength?.support||0).toFixed(0)}%），乙方${kb||'—'}（扶助 ${Number(bb.strength?.support||0).toFixed(0)}%）。${ka&&kb&&ka!=='中和'&&kb!=='中和'?(ka!==kb?'一强一弱——传统合婚视为「一泄一补」的分工型组合：强者主导开拓、弱者守成滋养，宜明确角色而非争同一位置':`同为${ka}——两强易争主导权、两弱易相互依赖，宜各自保留独立空间与决策边界`):'有一方近中和——强弱不成为相处主轴，看其它结构项'}。日主强弱仅为扶抑模型结论，不是性格判决。`});
 // 7 纳音五行生克（此前写死 neutral，有数据不判定）
 const naEl=nayinElement(dayA.nayin),nbEl=nayinElement(dayB.nayin),naRel=nayinRelation(naEl,nbEl);
 items.push({key:'nayin',name:'日柱纳音',level:naRel.kind==='support'?'support':naRel.kind==='challenge'?'challenge':'neutral',
  text:`甲方日柱纳音 ${dayA.nayin||'—'}${naEl?'（'+naEl+'）':''}，乙方 ${dayB.nayin||'—'}${nbEl?'（'+nbEl+'）':''}——${naRel.text}。纳音婚配为传统取象，只作相处风格的旁证，不据此断吉凶。`});
 // 8 日主阴阳（此前完全未用）
 const yyA=yinYangOf(dayA.stem),yyB=yinYangOf(dayB.stem);
 const yyLevel=yyA&&yyB&&yyA!==yyB?'support':'neutral';
 items.push({key:'yinyang',name:'日主阴阳',level:yyLevel,
  text:`甲方日干 ${dayA.stem||'—'}${yyA?'（'+yyA+'）':''}，乙方 ${dayB.stem||'—'}${yyB?'（'+yyB+'）':''}。${yyA&&yyB?(yyA!==yyB?'阴阳相异——传统合婚讲「阴阳相济」，一刚一柔、一外一内，互补性强，宜各自发挥所长而非争同一角色。':`同为${yyA}——气质同频、易互相理解，但刚性或柔性叠加时易一边倒，须刻意保留对方的表达空间。`):'日主阴阳未取到，不据此判读。'}`});
 const support=items.filter(x=>x.level==='support').length,challenge=items.filter(x=>x.level==='challenge').length;
 return {items,support,challenge,method:'八字合婚取日支刑冲合害（含相刑、相破、同支）、日干五合与合化、阴阳、生肖六合/三合/半合/冲刑害破逐条详断、年命纳音与日柱纳音分层生克、十神财官互象、喜用互补、用神↔忌神双向克耗、日主强弱互补，逐项给结构化证据；不把这些取象折算成契合度分数，契合度仍以印度八科单向口径为准。'};
}

/* 紫微合盘：双方命宫/夫妻宫互参 */
export function ziweiMatch(solarA,solarB){
 let za,zb;
 try{za=ziweiChart(solarA);}catch(e){za={error:e.message};}
 try{zb=ziweiChart(solarB);}catch(e){zb={error:e.message};}
 if(za.error||zb.error)return {ok:false,error:(za.error||zb.error),method:'紫微排盘失败，不做合盘推断。'};
 const lifeA=za.palaces.find(p=>p.name==='命宫'),lifeB=zb.palaces.find(p=>p.name==='命宫');
 const spouseA=za.palaces.find(p=>p.name==='夫妻'),spouseB=zb.palaces.find(p=>p.name==='夫妻');
 const stars=p=>(p?.majorStars||[]).map(s=>s.name).join('、')||(p?.borrowedStars||[]).map(s=>s.name).join('、')||'空宫';
 // A 命宫地支落在 B 盘哪一宫：以 B 的命宫地支为基准顺数
 const houseIn=(targetBranch,chart)=>{
  const lifeIdx=chart.palaces.find(p=>p.name==='命宫')?.earthlyBranch;
  const idx='子丑寅卯辰巳午未申酉戌亥'.indexOf(targetBranch);
  const lifeI='子丑寅卯辰巳午未申酉戌亥'.indexOf(lifeIdx);
  if(idx<0||lifeI<0)return null;
  const house=((idx-lifeI+12)%12)+1;
  return chart.palaces.find(p=>((('子丑寅卯辰巳午未申酉戌亥'.indexOf(p.earthlyBranch)-lifeI+12)%12)+1)===house)?.name||null;
 };
 const aLifeInB=houseIn(lifeA?.earthlyBranch,zb),bLifeInA=houseIn(lifeB?.earthlyBranch,za);
 const items=[
  {key:'life',name:'命宫主星',text:`甲方命宫在${lifeA?.earthlyBranch||'—'}，主星${stars(lifeA)}；乙方命宫在${lifeB?.earthlyBranch||'—'}，主星${stars(lifeB)}。命宫看两个人各自「是谁」，气质互补还是相似，决定相处的底色。`},
  {key:'spouse',name:'夫妻宫主星',text:`甲方夫妻宫主星${stars(spouseA)}，乙方夫妻宫主星${stars(spouseB)}。夫妻宫传统用来看择偶偏好与关系课题——两人的夫妻宫主星若能互相呼应（同星、对星或三合），相处话题更容易同频。`},
  {key:'cross',name:'命宫互落宫',text:`甲方命宫落乙方命盘的${aLifeInB||'—'}，乙方命宫落甲方命盘的${bLifeInA||'—'}——互落的宫位说明「你在对方生命里扮演什么角色」，落夫妻/官禄/财帛宫时传统上视为更紧扣现实关系。`}
 ];
 const boardOf=ch=>(ch?.palaces||[]).map(p=>({name:p.name,branch:p.earthlyBranch,
  majors:(p.majorStars||[]).map(s=>s.name),
  life:ch.palaces.find(x=>x.name==='命宫')?.earthlyBranch===p.earthlyBranch,
  spouse:ch.palaces.find(x=>x.name==='夫妻')?.earthlyBranch===p.earthlyBranch}));
 const boards={a:boardOf(za),b:boardOf(zb)};
 // 四化互飞（v0.77.0）：宫干飞四化是斗数看「关系动力」的常用手法。
 // 甲盘命宫宫干化禄/权/科/忌 → 落甲盘某宫 → 该宫地支在乙盘对应哪一宫（乙的命宫/夫妻/官禄…），
 // 即「甲给出的东西落在乙生命的哪个领域」。夫妻宫同法，并标出自化（宫干四化落回本宫）。
 const BR='子丑寅卯辰巳午未申酉戌亥';
 const flyOf=(chart,palaceName,otherChart)=>{
  const p=(chart.palaces||[]).find(x=>x.name===palaceName);
  if(!p)return null;
  const rows=(p.flyingEnriched||[]).map(f=>({type:f.type,star:f.star,to:f.to,self:!!f.self,
   inOther:f.branch==null?null:houseIn(BR[f.branch],otherChart)}));
  return {palace:palaceName,stem:p.heavenlyStem,items:rows};
 };
 const flyA={life:flyOf(za,'命宫',zb),spouse:flyOf(za,'夫妻',zb)};
 const flyB={life:flyOf(zb,'命宫',za),spouse:flyOf(zb,'夫妻',za)};
 const key=(f,fields)=>f&&f.items.filter(x=>fields.includes(x.inOther)||x.self);
 const hits=[];
 for(const [side,fly] of [['a',flyA],['b',flyB]]){
  for(const scope of ['life','spouse']){
   for(const it of (fly[scope]?.items||[])){
    if(it.self||['命宫','夫妻','官禄'].includes(it.inOther))hits.push({side,scope,...it});
   }
  }
 }
 const sihuaFly={ok:true,a:flyA,b:flyB,hits,
  text:hits.length
   ?hits.slice(0,6).map(h=>`${h.side==='a'?'甲方':'乙方'}${h.scope==='life'?'命宫':'夫妻宫'}宫干化${h.type}（${h.star}）${h.self?'自化于本宫':'飞入对方「'+h.inOther+'」'}`).join('；')+'。'
   :'双方命宫/夫妻宫宫干四化未飞入对方命宫、夫妻宫或官禄宫，也无自化，四化互飞不构成主要线索。',
  method:'取双方本命盘命宫与夫妻宫的宫干，按当前四化口径（全书/北派）飞禄权科忌，落宫再换算到对方盘（以对方命宫地支为基准顺数十二宫）；自化指宫干四化落回本宫。只作关系动力取象，不折算分数。'};
 return {ok:true,items,boards,sihuaFly,
  a:{life:lifeA?.earthlyBranch||null,stars:stars(lifeA),spouse:stars(spouseA)},
  b:{life:lifeB?.earthlyBranch||null,stars:stars(lifeB),spouse:stars(spouseB)},
  method:'双方分别用出生资料排紫微 D1，取命宫主星、夫妻宫主星与命宫地支互落宫位互参；只描述结构位置与角色，不折算契合度分数，不据此作关系吉凶断言。'};
}

/* Mangal Dosh（火星煞，印占合婚常用）：火星在 1/4/7/8/12 宫时传统视为「火星煞」，
 * 若双方火星同落同一宫（如都在 7 宫），传统上视为彼此抵消（Mitigates）。
 * 仅作婚配取象参考，不作关系吉凶断言。vedic 盘的行星已带 house（自命宫起 1–12）。 */
const MANGAL_HOUSES=new Set([1,4,7,8,12]);
const HOUSE_ZH={1:'命宫',2:'财帛',3:'兄弟',4:'田宅',5:'子女',6:'奴仆',7:'夫妻',8:'疾厄',9:'迁移',10:'官禄',11:'福德',12:'玄秘'};
export function mangalDosh(va,vb){
 const marsOf=v=>{const m=(v?.planets||[]).find(p=>p.key==='mars'||p.name==='火星');if(!m)return null;return {house:m.house,sign:v.lagna||null};};
 const ma=marsOf(va),mb=marsOf(vb);
 const dosh=h=>h?MANGAL_HOUSES.has(h):false;
 const aDosh=dosh(ma?.house),bDosh=dosh(mb?.house);
 const bothSame=aDosh&&bDosh&&ma.house===mb.house;
 const aText=aDosh?`火星落 ${ma.house} 宫（${HOUSE_ZH[ma.house]||''}）`:`火星在 ${ma.house||'—'} 宫，不在 1/4/7/8/12，未成火星煞`;
 const bText=bDosh?`火星落 ${mb.house} 宫（${HOUSE_ZH[mb.house]||''}）`:`火星在 ${mb.house||'—'} 宫，未成火星煞`;
 return {
  ok:true,
  a:{dosh:aDosh,house:ma?.house??null,sign:ma?.sign??null,text:aText},
  b:{dosh:bDosh,house:mb?.house??null,sign:mb?.sign??null,text:bText},
  both:bothSame,
  level:bothSame?'neutral':aDosh&&bDosh?'challenge':aDosh||bDosh?'warn':'calm',
  text:bothSame
   ?`双方火星同落 ${ma.house} 宫，传统视为互相抵消（Mitigates），火星煞的张力彼此化解。`
   :aDosh&&bDosh
   ?`双方各成火星煞（${ma.house}/${mb.house} 宫），传统视为两股张力叠加，宜以规则与分工化解。`
   :aDosh||bDosh
   ?`${aDosh?aText:bText}，单方成煞；传统上建议关注该宫对应课题，但不作吉凶判决。`
   :`双方火星均不在 1/4/7/8/12 宫，无火星煞之象。`,
  method:'火星落 1/4/7/8/12 宫判为火星煞（Mangal Dosh），双方同宫视为互抵；仅传统取象，不作实证结论。'
 };
}

/* 西占重点星（v0.77.0）：合盘里真正决定「谈得下去」的往往只有几颗星——
 * 金星（怎么爱）、火星（怎么要）、月亮（怎么被安抚）。这里只筛出跨盘中至少一端是这三颗的相位，
 * 按「融合（合相）/ 和谐（六分·三分）/ 张力（四分·对分）」三组归类，并按容许度给权重。
 * 不复用单一总分：三组各自计数，避免「和谐多就一定是好关系」的误读。 */
const KEY_PLANETS=['金星','火星','月亮'];
const GROUP_OF={0:'fusion',60:'harmony',120:'harmony',90:'tension',180:'tension'};
const GROUP_ZH={fusion:'融合',harmony:'和谐',tension:'张力'};
const GROUP_ADVICE={
 fusion:'两个功能黏在一起，亲密感强，但也容易失去边界，宜各自保留独处与朋友圈',
 harmony:'能量流动顺畅，不需要刻意经营就能感到被接住',
 tension:'摩擦同时也是吸引力来源，关键是给冲突定规则，别在情绪高点做决定'
};
const COMBO={
 '月亮|金星':'情绪与爱意对得上：一方的安抚方式正好是另一方想要的被爱方式',
 '月亮|火星':'情绪与行动直接相撞：一方的急切会点着另一方的情绪，热度高、回弹也快',
 '金星|火星':'典型的吸引结构：爱意表达与欲望节奏互相点燃，浓度高，也最容易起火',
 '月亮|月亮':'两个人的安全感机制同频或互扰，决定日常相处的底色',
 '金星|金星':'审美与价值观的表达方式相近或相斥，决定「怎么花钱、怎么过节」这类现实分歧',
 '火星|火星':'行动与脾气的节奏对撞，决定吵架的方式与修复速度'
};
export function westernKeyStars(interAspects){
 const rows=[];
 for(const x of interAspects||[]){
  if(!KEY_PLANETS.includes(x.a)&&!KEY_PLANETS.includes(x.b))continue;
  const group=GROUP_OF[x.angle]||'tension';
  const pairKey=[x.a,x.b].sort().join('|');
  const combo=COMBO[pairKey]||'';
  const both=KEY_PLANETS.includes(x.a)&&KEY_PLANETS.includes(x.b);
  const weight=Number(Math.max(0,1-x.orb/8).toFixed(2));
  rows.push({a:x.a,b:x.b,type:x.type,angle:x.angle,orb:Number(x.orb.toFixed(2)),group,groupZh:GROUP_ZH[group],weight,both,
   text:`${x.a} × ${x.b} ${x.type}（容许度 ${x.orb.toFixed(2)}°）：${combo?combo+'；':''}${GROUP_ADVICE[group]}。`});
 }
 // 排序：优先「两端都是金星/火星/月亮」的核心组合，再看容许度与情感三角的先后
 const rank=p=>{const s=new Set([p.a,p.b]);return s.has('金星')&&s.has('火星')?0:s.has('月亮')&&s.has('金星')?1:s.has('月亮')&&s.has('火星')?2:3;};
 rows.sort((p,q)=>(p.both===q.both?0:p.both?-1:1)||rank(p)-rank(q)||p.orb-q.orb);
 const groups={harmony:[],tension:[],fusion:[]};
 for(const r of rows)groups[r.group].push(r);
 const tally=Object.fromEntries(Object.keys(groups).map(k=>[k,groups[k].length]));
 const core=rows.filter(r=>r.both);
 const top=core[0]||rows[0];
 const text=rows.length
  ?`共检出 ${core.length} 条核心（金火月互见）与 ${rows.length-core.length} 条含单端的重点星跨盘相位：融合 ${tally.fusion} 条、和谐 ${tally.harmony} 条、张力 ${tally.tension} 条。最紧的一条是 ${top.text}`
  :'双方金星、火星、月亮之间未形成主相位，情感互动不靠「一眼来电」，更多取决于相处时间与共同经历。';
 return {ok:true,items:rows,groups,tally,core,top,text,
  method:'筛出跨盘中至少一端为金星/火星/月亮的相位（容许度沿用主盘：合相与对分 8°、四分 6°、六分 5°、三分 6°），按合相=融合、六分/三分=和谐、四分/对分=张力归类；权重按 (1−容许度/8) 计，仅用于排序，不折算契合度。'};
}
