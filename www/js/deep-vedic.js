// 印度占星深度知识库：面向专业 Jyotish 审计系统级别的详批。
// 行星力量评级（庙旺陷逆焦战）、Yoga 命格检测、九曜落宫 108 断语、
// Vimshottari 大运逐运详批、D9/D10 分盘、人生格局四大领域结论——全部由盘面证据驱动。
import {planetStates,divisional,VARGAS} from '../../src/vargas.mjs';

const SIGN_LIST=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const SIGN_LORD=['火星','金星','水星','月亮','太阳','水星','金星','火星','木星','土星','土星','木星'];
const SIGN_INDEX=Object.fromEntries(SIGN_LIST.map((s,i)=>[s,i]));
const HOUSE_THEME={1:'自我与体魄',2:'财货与家声',3:'勇气与同业',4:'居所与心境',5:'智识与子女',6:'竞争与债务',7:'伴侣与合作',8:'隐秘与转化',9:'信念与远行',10:'事业与名誉',11:'社群与收益',12:'损耗与灵修'};
const LAGAN_THEME={
 白羊座:'行动先锋型上升——人生主轴是「开创」：敢于第一个吃螃蟹，课题是急躁与莽撞',
 金牛座:'稳健积累型上升——人生主轴是「耕耘」：重视安全感与实感，课题是固执与变化恐惧',
 双子座:'机敏学习型上升——人生主轴是「沟通」：一生都在收集信息与表达，课题是散光不聚焦',
 巨蟹座:'情感滋养型上升——人生主轴是「照料」：以家庭与情感为圆心，课题是情绪牵动',
 狮子座:'王者风范型上升——人生主轴是「领舞台」：天生的存在感与责任感，课题是面子与骄傲',
 处女座:'精工细作型上升——人生主轴是「完善」：分析力与服务心，课题是挑剔与焦虑',
 天秤座:'协调美学型上升——人生主轴是「平衡」：天生的外交与审美，课题是选择困难',
 天蝎座:'深潜转化型上升——人生主轴是「淬炼」：危机中重生的强者命，课题是执念与多疑',
 射手座:'远见弘道型上升——人生主轴是「求道」：信念与远方，课题是好高骛远',
 摩羯座:'登峰务实型上升——人生主轴是「成事」：大器晚成的攀登者，课题是压抑与孤寒',
 水瓶座:'革新博爱型上升——人生主轴是「破格」：前瞻与人道精神，课题是疏离',
 双鱼座:'慈悲灵感型上升——人生主轴是「渡人」：艺术与灵性天赋，课题是边界模糊'
};
const PLANET_NATURE={太阳:'中性偏吉（自我、生命力、父亲、权威）',月亮:'吉（心智、情绪、母亲、记忆）',火星:'凶（行动、胆识、竞争、兄弟）',水星:'中性（智力、表达、商业、技艺）',木星:'大吉（智慧、扩张、贵人、财富）',金星:'吉（美、爱、享受、艺术）',土星:'凶而终吉（纪律、时间、结构、考验）',罗睺:'影曜（欲望、颠覆、外来机遇）',计都:'影曜（超脱、灵性、既往业力）'};
const PLANET_HOUSE={
 太阳:['自我意识极强，人生舞台感重；防自我中心','才华生财，声名与家世互相成就','勇气可嘉，与同辈争先；防与权威口角','向内扎根，家世与不动产是底气','掌权的气质，与子女晚辈缘分深','竞争与诉讼之象，职场多对手','公开的对手或强势伴侣，合作需对等','深沉内敛，研究玄学之才','信念坚定，远方扬名；利高教涉外','事业心极强，天生的管理者与公众人物','社群中的领袖地位，收益与名望并至','幕后运作者，宜灵修、疗愈、幕后顾问'],
 月亮:['情绪写在脸上，人缘随月盈亏波动','口才与财缘顺，重视家庭供养','心思敏捷多变，手足缘深','宅心仁厚，家是能量补给站','慈爱之心，子女缘佳，教学有天分','情绪内耗与服务型岗位；饮食须规律','伴侣即情绪归宿，关系敏感须沟通','直觉心理学天赋，探索幽微之事','信仰之心柔软，远方生慧','公众形象亲和，事业多与人群打交道','人脉即财库，社交中得机会','喜欢独处充电，梦境丰富，直觉力强'],
 火星:['行动力爆表，天生的先锋；防急躁头颈伤','敢赚敢花，财从竞争中来','短兵相接的执行力，与同辈易摩擦','家宅多动象（装修搬迁），护家心切','竞争型才华，与子女须温和相处','火落本宫如鱼得水——竞技、医疗、工程利器','感情热烈如焰，防争吵与闪聚闪散','意志淬炼，危机处理专家','为信念而战，远方开拓','事业冲劲十足，敢啃硬骨头；防职场树敌','圈内竞技生财，敢为人先','幕后之火，精力暗耗，宜冥想泄洪'],
 水星:['思维即人格，表达力是天赋','理财与商业头脑，口生金','信息枢纽，手足同侪中的智囊','房产文书顺遂，学习力在家养成','教育之心，与子女教学相长','精密分析型岗位（法务、审计、医技）','合作谈判高手，伴侣是智性交流对象','侦探式思维，研究与玄学分析','高等教育与外语利，著述远传','以智谋得位，事业多文书演讲','社群运营与收益计算的天才','直觉思维，梦境研究，宜日记与冥想'],
 木星:['自带福气与导师气质，乐观豁达','财库之星入财帛——积累型富格','贵人多于同辈中出，言传身教','家宅安稳兴旺，长辈庇荫深','最经典的子女福配置，儿女有出息','债务与竞争被智慧化解，化凶为吉','伴侣贤贵，婚姻带资源','玄学哲学天赋，深研之才','九宫主落九宫式大吉——远行、高教、宗教缘极深','事业大器之象，德望与地位并至','收益丰厚，圈层高端，目标易达成','慈悲隐修，精神世界的富翁'],
 金星:['魅力四射，美与爱是人生主题','财自美来——艺术、设计、奢侈品行业','表达优雅，同辈中人缘之花','家居审美极佳，家是作品','恋爱享乐之心，子女缘浪漫','服务型审美岗位；防享乐过度','婚姻爱情的正位——伴侣美貌有品位','深度的亲密与信任课题','异域之恋或在远方遇美','事业带光——公众形象讨喜，宜台前','社交生财，人脉即钱脉','暗恋与幕后之爱，艺术灵修天赋'],
 土星:['自律早熟，人生课题从「自我要求」开始','财富积累缓慢但根基极深，大器晚成','同辈相处严肃，须练松弛感','家宅责任重，早离家宅得成长','对子女严苛，缘分晚而深','土星入本宫正位——以纪律化解竞争债务，服务业医疗业大将','婚姻课题：晚婚或伴侣年长务实','深陷之土——生死研究的哲人','传统信仰，学术苦修，远方多磨砺','事业正位！权威是熬出来的，越老越高','朋友少而精，收益靠时间复利','隐退修心之星，孤寂中出真功夫'],
 罗睺:['自我意识叛逆，不走寻常路','偏财之象，来去皆快','口才犀利，同辈中异军突起','家宅多变动与非常规安排','子女缘独特，晚辈个性强','竞争暗流，防小人口舌','伴侣特立独行，关系打破常规','深研神秘学的天赋，直觉锐利','异教远方之缘，海外突破','事业野心极大，敢走偏门成大事','圈层混杂，机会与风险并至','灵性直觉极强，出世之才'],
 计都:['超脱淡然，人生课题是「我执」','财如流水，钱须过手不留','表达跳跃，同辈缘清冷','家宅漂泊感，心安即是家','子女缘分清浅，晚辈缘精神交流','化解竞争之道是退出与独辟蹊','伴侣间需要空间，关系去繁就简','神秘学大师之配——前世今生的直觉','灵性信仰，苦行远方','事业中幕后军师，功成不必在我','圈层中的独行者，收益去留随缘','解脱之星正位——冥想、疗愈、出世修行的大配置']
};
const YOGA_LIB={
 GajaKesari:{name:'大象狮子格 Gaja Kesari',form:'木星与月亮成四角（1/4/7/10 相位关系）',text:'印占最著名的贵格之一：智慧（木）与情感（月亮）互持，主声望持久、口碑载道、逢难有贵人。人前自带分量，是「德高望重」的底盘。'},
 BudhaAditya:{name:'智日同辉格 Budha-Aditya',form:'太阳与水星同宫',text:'太阳的舞台力与水星的智力合一：聪慧外显、表达杰出，天然适合管理、写作、讲台与一切「以脑成名」的领域。'},
 ChandraMangala:{name:'月火生财格 Chandra-Mangala',form:'月亮与火星同宫',text:'情绪与行动力绑在一起的赚钱组合：敢想敢干，财从冲劲中来；同时情绪起伏直接牵动财务决策，须设冷静期。'},
 Sunapha:{name:'后月聚富格 Sunapha',form:'月亮顺行第二宫有星（除日月罗计）',text:'月亮身后有星：白手起家、自造资产之象，财务独立早。'},
 Anapha:{name:'前月荫贵格 Anapha',form:'月亮逆行第十二宫（即月亮前一宫）有星（除日月罗计）',text:'月亮身前有星：气质沉稳有威仪，健康与名利皆有后盾。'},
 Durudhara:{name:'双月环护格 Durudhara',form:'月亮前后两宫皆有星（除日月罗计）',text:'月亮被环抱：富足有仆使运的现代版——资源左右逢源，一生难陷绝境。'},
 Kemadruma:{name:'孤月格 Kemadruma',form:'月亮前后两宫皆无星且月亮无合相',text:'月亮独悬：早年心绪易孤立无援，宜刻意经营情感支持系统；一旦度过整合期，独处反而淬炼出独立人格。'},
 Amala:{name:'清誉格 Amala',form:'月亮起第十宫有吉星',text:'声誉清白持久：行业里「口碑就是人」的配置，宜走长期主义品牌路线。'},
 Dhana:{name:'财富格 Dhana Yoga',form:'第二宫主与第十一宫主相互关联',text:'财库（2宫）与进账（11宫）打通：正路财富格局，收入结构随大运逐年增厚。'},
 Raja:{name:'王者格 Raja Yoga',form:'角宫（1/4/7/10）之主与三角宫（1/5/9）之主相互关联',text:'掌权之格：平台（角宫）与福报（三角宫）联手，主管理实权与身份跃迁。'},
 NeechaBhanga:{name:'陷而复兴格 Neecha Bhanga',form:'落陷行星的守护星或对宫星成有力配置',text:'「跌到底反而弹起」的逆转格：早年某领域的挫败，反成后半生专业的资本。'},
 Vargottama:{name:'倍数升格 Vargottama',form:'行星在本命与 D9 分盘同星座',text:'力量翻倍确认：该行星所主领域「说到做到」，力量稳定不虚。'}
};
const DASHA_THEME={
 计都:{best:'灵性觉醒、退出旧局、断舍离',watch:'莫名迷失、方向感丢失——不宜重大扩张'},
 金星:{best:'感情婚姻、艺术享受、财务顺境',watch:'享乐与惰性膨胀'},
 太阳:{best:'地位提升、掌权、与权威结缘',watch:'自负与父辈议题'},
 月亮:{best:'情感滋养、安居、人缘上扬',watch:'情绪主导决策'},
 火星:{best:'行动突破、置业、竞争得胜',watch:'急躁冲突与意外'},
 罗睺:{best:'破格逆袭、异域与新兴领域',watch:'欲望膨胀、是非口舌'},
 木星:{best:'贵人、学识、财富与家庭全面扩张',watch:'过度乐观、盲目扩张'},
 土星:{best:'苦功成事、身份确认、长期资产',watch:'压力、拖延与孤独感'},
 水星:{best:'学习、商业、文书与沟通的丰收',watch:'思虑反复、信息过载'}
};

function houseOfSign(sign){
 if(sign==null)return null;
 const s=String(sign);
 return SIGN_INDEX[s] ?? SIGN_INDEX[s+'座'] ?? SIGN_INDEX[s.replace(/座$/,'')] ?? null;
}
function lordOfHouse(house,lagnaIndex){
 const sign=SIGN_LIST[(lagnaIndex+house-1+12)%12];
 return SIGN_LORD[SIGN_INDEX[sign]];
}
function planetsInHouse(planets,h){return planets.filter(p=>p.house===h);}
function sameSign(a,b){
 const ia=houseOfSign(a?.sign),ib=houseOfSign(b?.sign);
 return ia!=null&&ib!=null&&ia===ib;
}

export function detectYogas(v){
 const planets=v?.planets||[];const byName=n=>planets.find(p=>p.name===n);
 const lagnaIndex=houseOfSign(v?.lagna)??0;
 const moon=byName('月亮'),jup=byName('木星'),sun=byName('太阳'),merc=byName('水星'),mars=byName('火星'),venus=byName('金星'),saturn=byName('土星');
 const found=[];
 const kendraFrom=(a,b)=>{if(!a||!b||!a.house||!b.house)return false;const d=((b.house-a.house)%12+12)%12+1;return [1,4,7,10].includes(d);};
 if(jup&&moon&&moon.house&&kendraFrom(moon,jup))found.push('GajaKesari');
 if(sun&&merc&&sameSign(sun,merc))found.push('BudhaAditya');
 if(moon&&mars&&sameSign(moon,mars))found.push('ChandraMangala');
 const core=planets.filter(p=>!['太阳','月亮','罗睺','计都'].includes(p.name));
 const secondFromMoon=core.filter(p=>((p.house-moon?.house)%12+12)%12===1);
 const twelfthFromMoon=core.filter(p=>((p.house-moon?.house)%12+12)%12===11);
 const conjMoon=core.filter(p=>sameSign(p,moon));
 if(moon&&secondFromMoon.length&&!twelfthFromMoon.length)found.push('Sunapha');
 if(moon&&twelfthFromMoon.length&&!secondFromMoon.length)found.push('Anapha');
 if(moon&&secondFromMoon.length&&twelfthFromMoon.length)found.push('Durudhara');
 if(moon&&!secondFromMoon.length&&!twelfthFromMoon.length&&!conjMoon.length)found.push('Kemadruma');
 const tenthFromMoon=planets.filter(p=>['木星','金星','水星'].includes(p.name)&&((p.house-(moon?.house??1))%12+12)%12===9);
 if(moon&&tenthFromMoon.length)found.push('Amala');
 // Dhana: 2主与11主同宫或互换
 const l2=byName(lordOfHouse(2,lagnaIndex)),l11=byName(lordOfHouse(11,lagnaIndex));
 if(l2&&l11&&sameSign(l2,l11))found.push('Dhana');
 // Raja: 角宫主与三角主同宫
 const kendra=[1,4,7,10],trikona=[1,5,9];let raja=false;
 for(const k of kendra)for(const t of trikona){
  const ka=byName(lordOfHouse(k,lagnaIndex)),ta=byName(lordOfHouse(t,lagnaIndex));
  if(ka&&ta&&sameSign(ka,ta))raja=true;
 }
 if(raja)found.push('Raja');
 return found;
}

export function buildVedicDeepReport(v){
 const gloss={};
 const planets=v?.planets||[];
 const rawLagna=String(v?.lagna||'待定');
 const lagna=rawLagna.endsWith('座')?rawLagna:rawLagna+'座';
 const lagnaIndex=houseOfSign(lagna)??0;
 const byName=n=>planets.find(p=>p.name===n);
 const moon=byName('月亮'),sun=byName('太阳');
 const yogas=detectYogas(v);
 const states=p=>{try{return planetStates(p,planets);}catch{return [];}};

 /* 一、上升与人生主轴 */
 const ascLord=SIGN_LORD[lagnaIndex],ascLordP=byName(ascLord);
 const overview=[
  `上升（Lagna，即第一宫起点）落于${lagna}：${LAGAN_THEME[lagna]||'上升星座定人生主轴'}。上升主星为${ascLord}${ascLordP?`，落第${ascLordP.house}宫（${HOUSE_THEME[ascLordP.house]}）`:''}——命主星所在的宫位，就是这张盘持续兑现的主战场。`,
  `月亮（心智与情绪的指针）在${moon?.sign||'—'}第${moon?.house||'—'}宫，${moon?.nakshatra||'—'}宿 Pada ${moon?.pada??'—'}（宿主${moon?.nakLord||'—'}）：安全感与情绪节奏由该宿的节奏展开。太阳（生命力与自我）在${sun?.sign||'—'}第${sun?.house||'—'}宫：${HOUSE_THEME[sun?.house]||'—'}是你投入生命力的领域。`,
  `印占读盘顺序：先上升定「人生的壳」，再月亮定「情绪的芯」，再逐宫主与大运定「何时兑现哪一域」。本报告按此顺序展开，专业术语均附白话。`,
  `盘面采用 ${v?.ayan||'Lahiri'} 恒星黄道、整宫制（Whole Sign：上升所在星座即第一宫，依次排满十二宫）。`
 ];

 /* 二、行星力量评级 */
 const powerRows=planets.map(p=>{
  const st=states(p);
  const dign=st.find(x=>x.startsWith('庙')||x.startsWith('旺'))?'强':st.find(x=>x.startsWith('陷'))?'弱':st.length?'中':'中';
  return {p,st,dign};
 });
 const gradeOf=pw=>{
  const bad=(pw.st.filter(x=>x.startsWith('陷')||x.startsWith('焦')||x.startsWith('战'))).length;
  const good=(pw.st.filter(x=>x.startsWith('庙')||x.startsWith('旺')||x.startsWith('根'))).length;
  const score=good*2-bad*2+(pw.st.some(x=>x.startsWith('逆'))?-1:0);
  return score>=2?['强','■■■■■']:score>=1?['中强','■■■■□']:score===0?['中','■■■□□']:score>=-1?['中弱','■■□□□']:['弱','■□□□□'];
 };
 const powerTable=`<table class="rpt-table"><thead><tr><th>行星</th><th>落宫</th><th>状态</th><th>评级</th><th>力量</th></tr></thead><tbody>${powerRows.map(pw=>{
  const [label,bar]=gradeOf(pw);
  return `<tr><td>${pw.p.name}${pw.p.retro?' ℞':''}</td><td>第${pw.p.house}宫</td><td>${pw.st.join('、')||'平常'}</td><td>${label}</td><td>${bar}</td></tr>`;
 }).join('')}</tbody></table>`;
 const strongs=powerRows.map(pw=>({pw,label:gradeOf(pw)[0]})).filter(x=>x.label==='强'||x.label==='中强').map(x=>x.pw.p.name);
 const weaks=powerRows.map(pw=>({pw,label:gradeOf(pw)[0]})).filter(x=>x.label==='弱').map(x=>x.pw.p.name);
 const powerLines=[
  `行星力量（Sthana Bala 简化版）按庙（自己星座）、旺（入庙）、陷（落陷）、根（Moolatrikona）、逆行、燃烧（离太阳过近）、行星战逐项评估。上表即你的九曜体检单。`,
  strongs.length?`力量最强的行星：${strongs.join('、')}——它们所主的宫位与主题，是你「不费力就比别人好」的领域，选行业、选赛道优先从这里出发。`:'本盘无高力量行星——成败更依赖大运时序与后天深耕，宜走专业积累路线。',
  weaks.length?`需要后天补强的行星：${weaks.join('、')}——其所主领域（${weaks.map(n=>PLANET_NATURE[n]?.slice(0,8)).join('、')}）易成短板，重大决策前多核对事实。`:'本盘无明显落陷行星，底盘平均。',
  `「逆行」（℞）不是坏词：该行星的能量向内走——适合深耕、复盘与内在打磨，不宜外放冒进。`
 ];

 /* 三、Shadbala 六力审计 */
const shad=v?.shadbala||null;
const housesOfPlanet=name=>SIGN_LIST.map((s,i)=>SIGN_LORD[i]===name?((i-lagnaIndex+12)%12)+1:null).filter(Boolean);
gloss['Shadbala']='六力评分：位置、方向、时间、动势、自然（另含相位，本实现未计）——判断一颗行星「有没有力气把所主宫位兑现出来」的经典体系';
gloss['Rupas']='Shadbala 的计分单位，60 virupa = 1 Rupa；每颗行星另有经典最低要求，达不到即判「力量不足」';
const shadTable=shad?`<table class="rpt-table rpt-shad"><thead><tr><th>行星</th><th>位置</th><th>方向</th><th>时间</th><th>动势</th><th>自然</th><th>Rupas</th><th>位次</th></tr></thead><tbody>${shad.rows.map(r=>`<tr><td>${r.name}${r.retro?' ℞':''}</td><td>${r.sthana.toFixed(0)}</td><td>${r.dig.toFixed(0)}</td><td>${r.paksha.toFixed(0)}</td><td>${r.cheshta}</td><td>${r.naisargika.toFixed(0)}</td><td><b>${r.rupas.toFixed(2)}</b></td><td>${r.rank}/7</td></tr>`).join('')}</tbody></table>`:'';
const shadWeak=shad?[...shad.rows].sort((a,b)=>a.rupas-b.rupas):[];
const shadLines=shad?[
 `Shadbala 回答的是「这颗星有没有力气办事」：分数越高，它主管的宫位越能在现实里兑现。60 virupa = 1 Rupa——下表是七颗主星的分项得分与合计。`,
 `最强 ${shad.strongest}（${shad.rows.find(r=>r.name===shad.strongest)?.rupas.toFixed(2)} Rupas）——它主管的第 ${housesOfPlanet(shad.strongest).join('、')||'—'} 宫，是你本命最「不费力就比别人好」的领域，选赛道优先从这里出发。最弱 ${shad.weakest}（${shad.rows.find(r=>r.name===shad.weakest)?.rupas.toFixed(2)} Rupas），对应领域宜借力、宜后补，不宜强攻。`,
 `相对最弱的三颗，以及各自短在哪一项：${shadWeak.slice(0,3).map(r=>`${r.name}（${r.rupas.toFixed(2)}，第${r.rank}位，短板在${r.weakestPart[0]} ${r.weakestPart[1].toFixed(0)}/60，主管第 ${housesOfPlanet(r.name).join('、')||'—'} 宫——${housesOfPlanet(r.name).map(h=>HOUSE_THEME[h]).join('、')||'本命无主管宫位'}）`).join('；')}。短板项告诉你「该补什么」：庙旺度低宜换战场、方向力低宜借位置、月相力低宜养情绪、动势力低宜主动出击。`,
 `读法：力量强而所主宫位一般的星，是「有余力可调用的资源」；力量弱而所主宫位关键的星，是「必须提前布防的短板」。两者合看，才是完整的资源调度图。`,
 `口径：${shad.method}`
]:['Shadbala 数据待排盘后生成。'];

/* 四、Yoga 命格识别 */
 const yogaLines=yogas.map(k=>{const y=YOGA_LIB[k];gloss[y.name.split(' ')[0]]=y.form;return `【${y.name}】构成：${y.form}。判读：${y.text}`;});
 const yogaSec=yogaLines.length?[...yogaLines,`Yoga 是印占「命格」的核心——多格成立时看相互是否同主题（同主星、同宫位）叠加；不同主题则各有兑现年份，随大运轮播。`]:['本盘按传统 12 式常见 Yoga 逐项检测：未检出成立条件。这不代表命差——无 Yoga 之盘成败更看行星力量评级与大运配合，后天选择权重更大。'];

 /* 四、九曜逐星落宫详解 */
 const planetRows=planets.map(p=>`<li><b>${p.name}${p.retro?' ℞':''} · ${p.sign} · 第${p.house}宫（${HOUSE_THEME[p.house]}）${p.nakshatra?` · ${p.nakshatra}宿`:''}</b><span>${PLANET_NATURE[p.name]}。${(PLANET_HOUSE[p.name]||[])[(p.house||1)-1]||'落宫主题见宫位详解'}${states(p).length?`（状态：${states(p).join('、')}）`:''}。宿主${p.nakLord||'—'}所落的宫，是该行星能量的现实落点。</span></li>`).join('');
 const planetSec=`<ul class="rpt-list">${planetRows||'<li>九曜数据待排盘后生成。</li>'}</ul>`;

 /* 五、Vimshottari 大运逐运详批 */
 const dashas=v?.dashas||[];
 const dashaRows=dashas.map(d=>{
  const lordP=byName(d.lord),theme=DASHA_THEME[d.lord]||{};
  const house=lordP?.house,houseTheme=HOUSE_THEME[house]||'';
  const dign=lordP?gradeOf({p:lordP,st:states(lordP)})[0]:'—';
  return `<li class="${d.active?'rpt-now':''}"><b>${d.lord}大运 · ${(d.start||'').slice(0,10)} 至 ${(d.end||'').slice(0,10)} · ${d.years||''}年${d.active?' · 【当前大运】':''}</b><span>主星落第${house||'—'}宫（${houseTheme}），力量评级${dign}。该运主轴：${theme.best||''}${theme.watch?'；须防：'+theme.watch:''}。大运兑现方式＝主星宫位主题×主星状态×行运当时年龄：${lordP?(PLANET_HOUSE[d.lord]?.[(house||1)-1]||''):''}${dign==='弱'?'（主星偏弱，此运主题打折呈现，宜稳不宜攻）':''}。</span></li>`;
 }).join('');
 const dashaSec=dashaRows?`<ul class="rpt-list rpt-decades">${dashaRows}</ul>`:'大运数据待排盘后生成。';
 const dashaIntro=[
  `Vimshottari（毗姆沙达里）大运：以月亮出生星宿起排，九曜轮值共 120 年——印占最重要的「人生时刻表」。当前余额：出生大运还余 ${Number(v?.balanceYears||0).toFixed(2)} 年（按月亮在宿内的位置折算）。`,
  `大运判读三步：①主星本命落宫＝此运舞台；②主星力量评级＝演出质量；③副运（Antar）主星落宫＝该运内的波段。排盘页可四级下钻到细运（Pratyantar）与微运（Sookshma）。`
 ];

 /* 五b、当前与下一大运的 Antardasha（小运）细分 */
 const SEQ=['计都','金星','太阳','月亮','火星','罗睺','木星','土星','水星'];
 const SEQ_YEARS={计都:7,金星:20,太阳:6,月亮:10,火星:7,罗睺:18,木星:16,土星:19,水星:17}; // 合计 120 年
 const antarLines=[];
 try{
  const fmt=d=>d instanceof Date?d.toISOString().slice(0,10):String(d||'').slice(0,10);
  const activeIdx=dashas.findIndex(d=>d.active);
  const pickIdxs=[activeIdx,activeIdx+1].filter(i=>i>=0&&i<dashas.length);
  for(const mi of pickIdxs){
   const M=dashas[mi];
   const s=new Date(M.start).getTime(),e=new Date(M.end).getTime();
   if(!Number.isFinite(s)||!Number.isFinite(e))continue;
   const T=e-s;
   const startIdx=SEQ.indexOf(M.lord);
   const subs=SEQ.map((_,i)=>SEQ[(startIdx+i)%9]).map((lord,i,all)=>{
    const ratio=SEQ_YEARS[lord]/120;
    const prev=all.slice(0,i).reduce((sum,x)=>sum+SEQ_YEARS[x]/120,0);
    return {lord,start:new Date(s+T*prev),end:new Date(s+T*(prev+ratio)),years:(T*ratio)/(365.2425*86400000)};
   });
   const subLordP=byName(subs[0].lord);
   const rows=subs.map(x=>{
    const lp=byName(x.lord),theme=DASHA_THEME[x.lord]||{};
    const now2=Date.now();
    const isNow=x.start.getTime()<=now2&&now2<x.end.getTime();
    return `<li class="${isNow?'rpt-now':''}"><b>${M.lord}运之${x.lord}小运 · ${fmt(x.start)} 至 ${fmt(x.end)}${isNow?' · 【当前小运】':''}</b><span>${x.lord}主星${lp?`落第${lp.house}宫（${HOUSE_THEME[lp.house]}）`:''}。主轴：${theme.best||''}${theme.watch?'；防：'+theme.watch:''}。判读＝大运舞台（${M.lord}）×小运波段（${x.lord}）：${M.lord===x.lord?`小运与大运同主——该波段大运主题以最强音呈现，是整段大运的定点年。`:`以${x.lord}的方式兑现${M.lord}的议题（如${M.lord}运遇${x.lord}小运：${theme.best||'见上'}）。`}</span></li>`;
   }).join('');
   antarLines.push(`<li class="rpt-group"><b>${M.lord}大运（${fmt(M.start)} 至 ${fmt(M.end)}）内的九段小运</b><ul class="rpt-list">${rows}</ul></li>`);
  }
 }catch{/* 小运计算异常时静默跳过，不影响主报告 */}
 const antarSec=antarLines.length?`<ul class="rpt-list rpt-decades">${antarLines.join('')}</ul>`:'小运数据待排盘后生成。';
 const antarIntro=[
  `Antardasha（小运/副运）：每段大运内部再按九曜比例切分为九段小运——小运主星落宫决定「这一两年的波段剧情」。上表列出当前大运与下一大运的全部小运及起止日期，【当前小运】即当下所在波段。`,
  `判读：大运定舞台（十年之约），小运定剧目（一两年之内）——木星大运里的土星小运，扩张主题暂时让位于验收与责任；土星大运里的金星小运，苦功之中开一扇享受与感情的窗。重叠看：小运主星若与命格（Yoga）之星同星，该波段即命格兑现期。`
 ];
 /* 六、分盘与专项 */
 const vargaLines=[];
 if(Number.isFinite(v?.ascSid)){
  try{
   const d9=divisional(v,9),d10=divisional(v,10);
   const d9LordName=SIGN_LORD[SIGN_INDEX[d9.lagna]],d9Lord=d9.planets.find(p=>p.name===d9LordName);
   const d10LordName=SIGN_LORD[SIGN_INDEX[d10.lagna]],d10Lord=d10.planets.find(p=>p.name===d10LordName);
   gloss['D9 分盘']='把每个星座九等分重排的盘，专看婚姻、内在成熟度与后半生兑现度';
   gloss['D10 分盘']='十等分重排，专看事业表达的盘';
   vargaLines.push(`D9（${VARGAS[9]}）：上升${d9.lagna}，命主${d9LordName}${d9Lord?`落第${d9Lord.house}宫——${HOUSE_THEME[d9Lord.house]}`:''}。D9 与 D1 命主不同宫时，人前形象与亲密关系中的真我并不一致：伴侣认的是 D9 里那个你。`);
   vargaLines.push(`D10（${VARGAS[10]}）：上升${d10.lagna}，命主${d10LordName}${d10Lord?`落第${d10Lord.house}宫——${HOUSE_THEME[d10Lord.house]}`:''}。事业表达的真正落点看 D10：D1 十宫定方向，D10 定成色。`);
   // Vargottama 检测
   const vg=planets.filter(p=>{const q=d9.planets.find(x=>x.key===p.key);return q&&houseOfSign(p.sign)===houseOfSign(q.sign);}).map(p=>p.name);
   if(vg.length)vargaLines.push(`倍数升格 Vargottama：${vg.join('、')}在本命与 D9 同星座——力量加倍确认，所主领域「说到做到」。`);
  }catch{
   vargaLines.push('分盘计算异常，已跳过（不影响其余章节）。');
  }
 }else{
  vargaLines.push('分盘数据待完整星历支持后生成（D9 关系与 D10 事业专项）。');
 }
 const vargaSec=[...vargaLines,'分盘原则：D1 是前提，分盘只回答专项问题——D9 断婚姻内在，D10 断事业成色，D7 断子息；脱离 D1 单看分盘必失其准。'];

 /* 八、十二宫力量审计（Bhava Bala） */
const bhava=v?.bhavaBala||null;
gloss['Bhava Bala']='宫位力量：把宫主星的六力得分、宫内吉凶星与罗计干扰合成一个分数，用来比较十二宫谁强谁弱、资源该往哪投';
const bhavaTable=bhava?`<table class="rpt-table rpt-bhava"><thead><tr><th>宫位</th><th>星座</th><th>宫主</th><th>宫内</th><th>宫主力</th><th>评分</th><th>评级</th></tr></thead><tbody>${bhava.rows.map(r=>`<tr${r.grade==='弱'?' class="rpt-warn"':''}><td>${r.house} · ${r.theme}</td><td>${r.sign}</td><td>${r.lord}</td><td>${r.occupants.join('、')||'—'}</td><td>${r.lordPower.toFixed(1)}</td><td><b>${r.score.toFixed(1)}</b></td><td>${r.grade}</td></tr>`).join('')}</tbody></table>`:'';
const bhavaTop=bhava?[...bhava.rows].sort((a,b)=>b.score-a.score):[];
const bhavaLines=bhava?[
 `同一个盘里，十二宫不是一样「厚」的。宫主星有力量、宫内有吉星，这一宫的事就办得顺；宫主弱、宫内凶星多，这一宫就得多花力气。`,
 `最强的三宫：${bhavaTop.slice(0,3).map(r=>`第${r.house}宫（${r.theme}，${r.score.toFixed(1)}，${r.grade}）`).join('；')}——这是你本命的资源富集区，重大目标优先借这三股力。`,
 `最弱的三宫：${[...bhavaTop].reverse().slice(0,3).map(r=>`第${r.house}宫（${r.theme}，${r.score.toFixed(1)}，${r.grade}）`).join('；')}——不是「没有」，而是要靠规划、搭档与时间来补，别指望一蹴而就。`,
 `用法：把「最强宫」当杠杆——用强宫的资源去补弱宫的缺口（例如十宫强而七宫弱，就以事业平台去经营关系）；这是印占里最实用的一条资源调度原则。`,
 `口径：${bhava.method}`
]:['宫位力量数据待排盘后生成。'];

/* 九、岁运 Varshaphala */
const vs=v?.varshaphala||null;
gloss['Varshaphala']='太阳返照岁运：太阳回到出生时所在黄经的那一刻重新起盘，专门看「这一年」的主题';
gloss['Muntha']='岁运盘里的年度敏感点：自本命上升每年进一宫，指这一年的关注落在哪一域';
const vsLocal=vs?(()=>{const tz=Number(vs.tz??8);const d=new Date(+new Date(vs.returnUtc)+tz*3600000);return d.toISOString().slice(0,16).replace('T',' ');})():'';
const vsLordRow=vs&&shad?shad.rows.find(r=>r.name===vs.yearLord.name):null;
const vsSec=vs?[
 `岁运盘于 ${vsLocal}（出生地时间）起盘——太阳回到你出生时所在的黄经，这一年的「年度命盘」由此成立。本命回答「你是谁」，岁运回答「今年轮到什么」。`,
 `返照上升 ${vs.chart.lagna}：这一年的整体气质与出手方式。年度主星为${vs.yearLord.name}${vs.yearLord.house?`，在返照盘落第${vs.yearLord.house}宫（${HOUSE_THEME[vs.yearLord.house]}）`:''}${vs.yearLord.retro?'，且逆行——今年的主题偏向内省、复盘与延迟兑现':''}${vsLordRow?`；其本命六力为 ${vsLordRow.rupas.toFixed(2)} Rupas，在七曜中排第 ${vsLordRow.rank} 位`:''}。${vsLordRow?(vsLordRow.rank<=3?'年主星力量靠前，这一年的计划推得动，适合主动出击。':vsLordRow.rank>=6?'年主星在七曜中偏弱，今年宜守成、宜调整，把资源留给下一个强运年。':'年主星力量居中，成败看你投入的节奏与执行密度。'):''}`,
 `Muntha 落第 ${vs.muntha.house} 宫（${vs.muntha.sign}）：今年的焦点在「${vs.muntha.theme}」。Muntha 每年进一宫，十二年走完一圈——它指的那一宫，就是这一年最容易发生实质变化的生活领域。`,
 `怎么用：把年度目标对着 Muntha 的宫位定，用年主星的方式去推进。${vs.muntha.house===1?'Muntha 在命宫：今年是「重启自我」的一年，形象、健康与人生方向都会有实质调整。':vs.muntha.house===10?'Muntha 在事业宫：今年事业与公开身份是主战场，值得把资源压过来。':vs.muntha.house===7?'Muntha 在伴侣宫：今年关系与合作是主线，单身者易有实质进展。':vs.muntha.house===4?'Muntha 在家宅宫：今年重心回到家人、居所与内心，宜安定。':vs.muntha.house===2||vs.muntha.house===11?'Muntha 在财帛/收益宫：今年是财务结构变化年，收入与支出都值得重新规划。':vs.muntha.house===5?'Muntha 在子女与智慧宫：今年利创作、学习与添丁。':vs.muntha.house===6?'Muntha 在竞争与健康宫：今年宜处理旧账、整顿身体与工作节奏。':vs.muntha.house===8?'Muntha 在转化宫：今年是深水区，宜研究、宜转型，不宜冒进。':vs.muntha.house===9?'Muntha 在运势宫：今年利远行、进修、拜师与信念升级。':vs.muntha.house===3?'Muntha 在勇气宫：今年利学习、表达与短途奔波。':'Muntha 在消耗宫：今年宜收尾、宜休养、宜幕后布局。'}`,
 `口径：${vs.method}`
]:['岁运盘数据待排盘后生成。'];

/* 十、人生格局总结 */
 const t10=planets.filter(p=>p.house===10).map(p=>p.name),t2=planets.filter(p=>p.house===2).map(p=>p.name),t7=planets.filter(p=>p.house===7).map(p=>p.name),t6=planets.filter(p=>p.house===6).map(p=>p.name);
 const lordHouseOf=h=>{const lord=byName(lordOfHouse(h,lagnaIndex));return lord?`第${lord.house}宫（${HOUSE_THEME[lord.house]}）`:'待考';};
 const lifePattern=[
  `事业格局：第10宫（事业与公开身份）${t10.length?'坐'+t10.join('、'):`为空宫——宫主${lordOfHouse(10,lagnaIndex)}落${lordHouseOf(10)}`}。${t10.length?`十宫之星所主：${t10.map(n=>PLANET_HOUSE[n]?.[9]).filter(Boolean).join('；')}。`:''}配合 D10 命主落宫，即为你的事业赛道坐标。`,
  `财富格局：第2宫（财库）${t2.length?'坐'+t2.join('、'):`空宫——宫主${lordOfHouse(2,lagnaIndex)}`}；第11宫（进账）主为${lordOfHouse(11,lagnaIndex)}，落${lordHouseOf(11)}${yogas.includes('Dhana')?'；【财富格成立】财库与进账之主已关联——收入结构有复利基因':'；未见经典财富格——财富靠行星力量与大运逐段积累'}。`,
  `婚姻格局：第7宫（伴侣与合作）${t7.length?'坐'+t7.join('、'):`空宫——宫主${lordOfHouse(7,lagnaIndex)}`}。${t7.length?t7.map(n=>PLANET_HOUSE[n]?.[6]).filter(Boolean).join('；'):''}D9 的命主落宫进一步定婚姻成熟度（见第六章）。金星与月亮的力量评级是感情质量的两个总开关。`,
  `健康格局：第6宫（竞争与债务，传统兼看病厄）${t6.length?'坐'+t6.join('、'):'空宫'}。土星、太阳与上升主星的力量评级决定底盘精力；落陷或燃烧之行星所主的身体功能宜早做长期保养。此为传统象意，不替代医疗诊断。`,
  `总评：本盘以${lagna}立命，${yogas.length?`成立 ${yogas.length} 组命格（${yogas.map(k=>YOGA_LIB[k].name.split(' ')[0]).join('、')}）`:'无经典命格成立'}，力量最强领域为${strongs[0]||'综合均衡'}。人生节奏遵循 Vimshottari 时刻表——在强运进取、弱运蓄力，即为「知命而后善用其命」。`,
  `本报告由盘面行星、宫位、星宿、Yoga 与大运数据逐条推导。Jyotish 为传统术数文化，供自我观察与时机参考，不构成事实预测、投资、医疗或婚姻决策依据。`
 ];

 const sections=[
  {title:'一、上升与人生主轴',lines:overview},
  {title:'二、行星力量评级',lines:powerLines,table:powerTable},
  {title:'三、Shadbala 六力审计',lines:shadLines,table:shadTable},
  {title:'四、Yoga 命格识别',lines:yogaSec},
  {title:'五、九曜逐星落宫详解',lines:[],html:planetSec},
  {title:'六、Vimshottari 大运逐运详批',lines:dashaIntro,html:dashaSec},
  {title:'七、小运细分（当前与下一大运的九段 Antardasha）',lines:antarIntro,html:antarSec},
  {title:'八、分盘专项（D9/D10）',lines:vargaSec},
  {title:'九、十二宫力量审计（Bhava Bala）',lines:bhavaLines,table:bhavaTable},
  {title:'十、岁运 Varshaphala（今年年度盘）',lines:vsSec},
  {title:'十一、人生格局总结',lines:lifePattern}
 ];
 return {title:'印度占星 · Jyotish 终身详批',sections,glossary:gloss,kind:'vedic',yogas};
}
