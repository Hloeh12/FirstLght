/* 八字合婚 + 紫微合盘：双人关系的多体系互参（纯计算，不虚构契合度分数）。
 * 契合度百分比仍由印度 Ashtakoota 八科单向提供（见 console-engine.pairReading），
 * 本模块只补「八字干支/十神/用神」与「紫微命宫/夫妻宫互参」的结构化证据，交报告层解读。
 * 口径：传统婚配取象，供文化参考，不作关系质量实证结论。 */
import {ziweiChart} from './ziwei.mjs';

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
function relOf(a,b){
 if(CLASH[a]===b)return '六冲';
 if(LIUHE[a]===b)return '六合';
 for(const t of SANHE)if(t.includes(a)&&t.includes(b))return '三合局('+t[3]+')';
 if(XING.some(p=>p[0]===a&&p[1]===b))return '相刑';
 if(HAI.some(p=>p.includes(a)&&p.includes(b)))return '相害';
 if(PO.some(p=>p.includes(a)&&p.includes(b)))return '相破';
 return null;
}
// 十神：以 me 为日干、other 为对照天干（简化扶抑派）
function tenGod(me,other){
 const d='甲乙丙丁戊己庚辛壬癸'.indexOf(me),s='甲乙丙丁戊己庚辛壬癸'.indexOf(other);
 if(d<0||s<0)return null;
 const diff=(s-d+10)%10,yin=d%2===s%2;
 return [[yin?'比肩':'劫财',yin?'正财':'偏财',yin?'食神':'伤官'],[yin?'正印':'偏印',yin?'正官':'七杀',yin?'正财':'偏财']][s%2][Math.floor(diff/2)]||null;
}

/* 八字合婚证据 */
export function baziMatch(ba,bb){
 const pa=ba.pillars||[],pb=bb.pillars||[];
 const dayA=pa[2]||{},dayB=pb[2]||{};
 const yearA=pa[0]||{},yearB=pb[0]||{};
 const items=[];
 // 1 日柱：日支关系 + 日干五合
 const dayRel=relOf(dayA.branch,dayB.branch);
 items.push({key:'dayBranch',name:'日柱（婚姻宫）',level:dayRel==='六合'?'support':dayRel?.includes('三合')?'support':dayRel?'challenge':'neutral',
  text:`双方日支 ${dayA.branch||'—'} 与 ${dayB.branch||'—'}${dayRel?'成「'+dayRel+'」':''}——${dayRel==='六合'?'性情相吸、相处有黏性':dayRel?.includes('三合')?'同气相求、目标易一致':dayRel==='六冲'?'节奏错位、聚散明显，靠沟通补位':dayRel?'暗耗或牵制并存，权责宜讲清':'无明显冲合，相处靠后天经营'}。`});
 const stemHe=STEM_HE[dayA.stem]===dayB.stem;
 items.push({key:'dayStem',name:'日干',level:stemHe?'support':'neutral',
  text:`双方日干 ${dayA.stem||'—'} 与 ${dayB.stem||'—'}${stemHe?'正成天干五合，传统视为「有情」之配':'未见天干五合，合不合看后天相处'}。`});
 // 2 生肖（年支）三合六合
 const zodRel=relOf(yearA.branch,yearB.branch);
 items.push({key:'zodiac',name:'生肖年支',level:zodRel==='六合'||zodRel?.includes('三合')?'support':zodRel?'challenge':'neutral',
  text:`年支 ${yearA.branch||'—'} 与 ${yearB.branch||'—'}${zodRel?'「'+zodRel+'」':'无冲合'}——${zodRel==='六合'?'属相相合，家庭层面较易协调':zodRel?.includes('三合')?'属相三合，圈层与价值观相近':zodRel?'属相有冲克，长辈关照之外多一份磨合':'属相中性，不成为助力也不构成阻碍'}。`});
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
 return {items,support,challenge,method:'八字合婚取日支刑冲合害（含相刑）、日干五合与阴阳、生肖三合六合、十神财官互象、喜用互补、用神↔忌神双向克耗、日主强弱互补、日柱纳音五行生克，逐项给结构化证据；不把这些取象折算成契合度分数，契合度仍以印度八科单向口径为准。'};
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
 return {ok:true,items,
  a:{life:lifeA?.earthlyBranch||null,stars:stars(lifeA),spouse:stars(spouseA)},
  b:{life:lifeB?.earthlyBranch||null,stars:stars(lifeB),spouse:stars(spouseB)},
  method:'双方分别用出生资料排紫微 D1，取命宫主星、夫妻宫主星与命宫地支互落宫位互参；只描述结构位置与角色，不折算契合度分数，不据此作关系吉凶断言。'};
}
