// 八字深度知识库：面向「问真八字 / 测测」级别的详批。
// 全部断语由当前盘面数据驱动（格局、十神配置、神煞落柱、大运流年干支），
// 术语首次出现附白话括注，末尾自动汇总术语小词典；不臆造无盘面依据的事件。
const STEMS='甲乙丙丁戊己庚辛壬癸',BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const GLOSS={};

/* ---------- 十神深解（白话 + 四大领域断语） ---------- */
export const TEN_GOD_DEEP={
 正官:{gloss:'正管着我、又对我好的力量——象征规矩、职位、名誉与稳定的社会地位',person:'端正自律、重信誉、有责任感，天然尊重规则与体面',career:'宜在大平台、体制、专业序列内晋升；凭资历与口碑稳步向上，适合管理、行政、法务、公职',wealth:'财从名中来——薪俸、职级、专业执照带来的稳定收入，忌投机',love:'欣赏端正可靠的伴侣，感情里重视承诺与名分',health:'压力多化为自律，注意肝胆郁结式的紧张'},
 七杀:{gloss:'带着压力直接克我的力量——象征竞争、魄力、危机与突破',person:'果决刚毅、行动力强、敢于直面冲突，天生的开拓者',career:'宜高压高回报的环境：创业、外科、执法、竞技、危机管理；杀有制则掌实权',wealth:'敢于重仓搏机会，大起大落；须设止损纪律',love:'易被强势、有野心的对象吸引，关系需要边界感',health:'注意炎症、意外伤与过劳'},
 正财:{gloss:'我克而有情之物——象征本分经营而来的财富与务实',person:'勤俭踏实、量入为出、重实际回报',career:'宜稳健经营、实业、现金流清晰的行业：制造、零售、财会、实业管理',wealth:'正财格局重积累，赚稳钱守得住，忌赌性',love:'感情务实长久，重居家与责任',health:'劳碌伤脾，注意消化与代谢'},
 偏财:{gloss:'我克而无情之物——象征流动的机会之财与人脉',person:'慷慨爽朗、善交际、对机会嗅觉敏锐',career:'宜贸易、金融、销售、资源撮合、平台分成类生意',wealth:'财来财去都快，人脉即钱脉；须留盈余',love:'异性缘旺，须守住界限',health:'应酬多，注意肝与血糖'},
 食神:{gloss:'我生出、温和从容的才华——象征口福、作品与生活情趣',person:'温和厚道、有审美、懂生活，福气是养出来的',career:'宜创作、餐饮、教育、内容、疗愈、文创——凭作品与口碑立身',wealth:'以才华换稳定财，细水长流',love:'相处舒适型感情，家庭氛围好',health:'先天消化吸收偏弱，宜饮食清淡规律'},
 伤官:{gloss:'我生出、锋芒外放的才华——象征聪明外露、批判与突破常规',person:'聪明外显、口才锋利、不服权威、审美好',career:'宜演讲、设计、自媒体、专业技术、自由职业——以才立身忌坐班',wealth:'伤官生财是技术变现的经典组合，收入弹性大',love:'言语最伤亲近人；「有理还要有礼」是相处第一律',health:'注意呼吸道与情绪性失眠'},
 正印:{gloss:'生我且护我的力量——象征学问、长辈庇荫与安全感',person:'仁厚好学、恋家、重视精神世界',career:'宜学术、教育、文书、公职、医护、宗教文化——考运学历是加分项',wealth:'清贵之格，财在名与资历之后，忌贪快钱',love:'恋母/恋家倾向，伴侣宜包容型',health:'体质偏弱易受寒，宜温补养脾'},
 偏印:{gloss:'生我但隔一层的力量——象征偏门学问、直觉与孤独（俗称枭神）',person:'直觉敏锐、思想深邃、喜独处、易多疑',career:'宜研究、玄学、医易、技术冷门、心理、创作——越是冷门越出彩',wealth:'凭独门技能变现，忌跟风',love:'心事不外露，需要主动沟通补足',health:'思虑伤脾，宜少熬夜'},
 比肩:{gloss:'与我同类的力量——象征自我、同辈与自立',person:'自我意识强、讲义气、能独当一面',career:'宜合伙、专业自立、体力与技艺型行业',wealth:'财靠亲力亲为；合伙须先写清分益',love:'平等型关系，忌争主导权',health:'体质根基不差，防操劳'},
 劫财:{gloss:'与我同类又争抢的力量——象征竞争、破耗与豪爽',person:'豪爽大方、行动快、容易冲动承诺',career:'宜团队作战、开拓型岗位；忌独自管钱',wealth:'破耗之星——借贷、担保、合伙出资都须设上限',love:'为情破财的剧本常见，金钱界限是底线',health:'注意意外伤与上火'}
};
/* ---------- 神煞详解 ---------- */
export const SHENSHA_DEEP={
 天乙贵人:{gloss:'最强的吉星，象征关键时刻出现的贵人与转机',inPillar:'年月柱逢之，长辈提携；日时柱逢之，同辈与晚辈助力'},
 太极贵人:{gloss:'与玄学、哲学、文化有缘的星，象征悟性与研究天赋',inPillar:'落在哪柱，该柱所主的领域都带一份「钻研成事」的底色'},
 文昌:{gloss:'学业与文书之星，象征考试运、文笔与条理',inPillar:'年月柱主求学顺遂；日时柱主终身笔耕成名'},
 驿马:{gloss:'迁移变动之星，象征出行、外派、搬迁与远方机遇',inPillar:'年柱主祖籍远方缘；月日柱主事业发展随迁动而来；逢冲之年动象更明显'},
 咸池桃花:{gloss:'人际魅力之星，象征异性缘、艺术感与人缘',inPillar:'年月柱为「内桃花」主早年人缘；日时柱主婚后魅力，须守界限'},
 华盖:{gloss:'孤高与艺术之星，象征宗教缘、艺术天赋与独处需求',inPillar:'日时柱逢之多思玄好静，宜以技艺与学问安顿此心'},
 劫煞:{gloss:'急变之星，象征突发消耗与意外',inPillar:'落在哪柱，该领域的计划都宜留缓冲与备份'},
 羊刃:{gloss:'日主极旺之刃，象征锋锐、胆量与刚极易折',inPillar:'身弱得刃是帮身之刃反成助力；身强逢刃，防争斗与意外'},
 天医:{gloss:'医缘之星，象征对身体与疗愈的敏感',inPillar:'宜医药、养生、心理相关领域，自己也须规律作息'},
 空亡:{gloss:'轮空之位，象征该柱力量需要后天补足',inPillar:'落在哪柱，那一柱代表的人事（年祖上、月父母、日婚姻、时子女）早期多靠自己'}
};
/* ---------- 格局详解（月令透干取格 + 从格检测） ---------- */
export const GEOGE_DEEP={
 正官格:{gloss:'月令正官当令透干——以名位立身的贵格',text:'以规矩与名位立身：适合体制、大平台与专业序列，凭资历德望阶梯式上升。官格怕刑冲与伤官透干——逢之多有职涯波动，宜以专业护身。'},
 七杀格:{gloss:'月令七杀当令——以魄力破局的权力之格',text:'开创与危机并存的格局：高压环境反而出成绩，适合创业、执法、外科等硬仗领域。杀喜食伤制、喜印化——盘中有制化则掌实权，无制则多波折。'},
 正财格:{gloss:'月令正财当令——以务实立业的富格',text:'以实业与现金流立身：一分耕耘一分收获，积累型财富格局。财格喜身强——身强方能任财，身弱见财反为财所累。'},
 偏财格:{gloss:'月令偏财当令——以流通机会生财之格',text:'善用机会与人脉的格局：财有流动性，利贸易、金融、撮合与平台型生意。须配比劫护财之意识——留盈余、设止损。'},
 正印格:{gloss:'月令正印当令——以学问庇身之贵格',text:'以学问与庇荫立身：学历、执照、资历是真金白银，适合学术、教育、文官与专业职称路线。印多则行动迟缓，宜早立实践之志。'},
 偏印格:{gloss:'月令偏印当令——以偏门绝学立身之格',text:'以独门学问立身：研究、技术、医易、创作等深巷领域最见光彩。思路独到但易孤——须主动经营人际与表达。'},
 食神格:{gloss:'月令食神当令——以才艺福气立身之和格',text:'以作品与口碑立身：才华能换成安稳的饭碗，福气是养出来的。最忌枭神夺食——偏印透干之年多见计划反复。'},
 伤官格:{gloss:'月令伤官当令——以锋芒才华立身之英格',text:'以才学与突破常规立身：聪明外露、不甘居人下，适合自由职业与专业个人品牌。伤官喜配财（技术变现）配印（收敛锋芒），忌见官。'},
 从弱格:{gloss:'日主无根无力，顺势弃身从势——借大环境成就自己',text:'顺势而为的格局：不与形势对抗，借力、依附平台与大势反而成就。忌逆势硬撑，喜行克泄耗之运。'},
 从强格:{gloss:'日主一气专旺，满盘同党——顺其气势而用',text:'专旺格局：气势极足，宜走纯粹路线把自己的一门天赋做到极致（如纯技术、纯创作、纯领导）。忌逆势之运强改方向。'},
 中和格:{gloss:'月令本气未透，日主中和——以平衡稳健立身',text:'月令本气未透干，取本气为暗格参断：命局以平和中庸立身，不靠一偏之极，大运引动什么就成什么——后天选择权重高。'}
};
/* ---------- 调候（寒暖燥湿） ---------- */
const TIAOHOU={子:'隆冬水旺，调候首取丙火暖局，无火则金寒水冷、谋定难行',丑:'冬土湿寒，先丙火后甲木，暖而后疏',寅:'初春余寒，丙火解冻为要，癸水滋木为辅',卯:'仲春木旺，阳和已至，察木多与否：多则庚金裁之',辰:'春末土湿，甲疏癸润，先暖后培',巳:'初夏火渐旺，湿土（辰丑）晦火生金为调',午:'仲夏火炎，专取壬水，水透为贵、无水燥烈',未:'夏末土燥而热，癸水为先，润土养金',申:'初秋金肃，丙火制金、癸水泄秀，观其配合',酉:'仲秋金旺，丁火炼金为要，甲木引丁',戌:'秋末土燥，甲疏为先，壬水滋培',亥:'初冬水寒，戊土堤防、丙火暖局为急'};
/* ---------- 五行健康象意 ---------- */
const HEALTH={木:'木对应肝胆与筋络——木枯或过旺之年，留意情绪郁结、肩颈与眼疲劳',火:'火对应心与小肠、血液循环——火弱血寒、火旺炎症，注意心脑血管与睡眠',土:'土对应脾胃与消化——土弱吸收差、土湿易浮肿，饮食规律最养土',金:'金对应肺与大肠、呼吸道——金弱易外感，注意呼吸与皮肤',水:'水对应肾与膀胱、内分泌——水弱怕冷腰酸，水旺思虑多，宜节欲安神'};
const ELEMENT_CAREER={木:'教育、出版、中医药、家具木材、纺织服装、园林、法务',火:'能源电力、互联网运营、传媒内容、餐饮、光学仪器、演艺',土:'地产建筑、农业、仓储物流、陶瓷建材、咨询顾问、殡葬宗教',金:'金融证券、机械五金、五金制造、司法军警、医疗手术、精工',水:'贸易物流、水产航运、旅游出行、咨询、自媒体、酒饮茶'};
const STAR_BRANCH={子:'23:00–00:59',丑:'01:00–02:59',寅:'03:00–04:59',卯:'05:00–06:59',辰:'07:00–08:59',巳:'09:00–10:59',午:'11:00–12:59',未:'13:00–14:59',申:'15:00–16:59',酉:'17:00–18:59',戌:'19:00–20:59',亥:'21:00–22:59'};
const CLASH_MAP=Object.fromEntries(BRANCHES.split('').map((b,i)=>[b,BRANCHES[(i+6)%12]]));
const LIUHE={子:'丑',丑:'子',寅:'亥',亥:'寅',卯:'戌',戌:'卯',辰:'酉',酉:'辰',巳:'申',申:'巳',午:'未',未:'午'};
const SANHE=['申子辰','寅午戌','巳酉丑','亥卯未'];

function godOf(dayStem,stem){
 const d=STEMS.indexOf(dayStem),s=STEMS.indexOf(stem);
 if(s<0||d<0)return null;
 const diff=(s-d+10)%10,yin=d%2===s%2;
 return [[yin?'比肩':'劫财',yin?'正财':'偏财',yin?'食神':'伤官'],[yin?'正印':'偏印',yin?'正官':'七杀',yin?'正财':'偏财']][s%2][Math.floor(diff/2)]||null;
}
const hidden={子:'癸',丑:'己癸辛',寅:'甲丙戊',卯:'乙',辰:'戊乙癸',巳:'丙庚戊',午:'丁己',未:'己丁乙',申:'庚壬戊',酉:'辛',戌:'戊辛丁',亥:'壬甲'};
const tenGodOf=(dayStem,stem)=>godOf(dayStem,stem);
const elementOfStem=s=>({甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'})[s];

/* 格局判定：月令藏干透干取格 + 从格检测 */
export function detectGege(pillars,natalStrength){
 const day=pillars[2],month=pillars[1]||{};
 const support=Number(natalStrength?.support??50);
 const stems=pillars.map(p=>p.stem);
 const rootsCount=pillars.filter(p=>p.branch&&p.branches?false:false).length; // roots 判定走外部字段
 const noRoot=!(natalStrength?.weights)||Object.entries(natalStrength.weights).every(([e,v])=>v>0);
 if(support<25)return {name:'从弱格',basis:'日主扶助不足 25%，弱到极处顺势而为'};
 if(support>75)return {name:'从强格',basis:'日主扶助超过 75%，一气专旺'};
 const cang=(month.hidden?.length?month.hidden:[...hidden[month.branch||'子']].map((s,i)=>({stem:s,rank:['本气','中气','余气'][i]})));
 for(const h of cang){
  const god=tenGodOf(day.stem,h.stem);
  if(!god)continue;
  if(stems.some((s,i)=>i!==1&&s===h.stem))return {name:god.replace('劫财','比肩')+'格',basis:`月令${h.rank}${h.stem}（${god}）透出天干`,transparent:true};
 }
 const first=cang[0],firstGod=tenGodOf(day.stem,first.stem);
 return {name:(firstGod||'中和格').replace('劫财','比肩')+'格',basis:`月令${first.rank}${first.stem}当令而未透干，取本气暗格参断`,transparent:false};
}
function relationWithNatal(branch,pillars){
 const hits=[];
 pillars.forEach((p,i)=>{
  if(p.branch===CLASH_MAP[branch])hits.push({type:'六冲',pillar:p.name,branch:p.branch});
  else if(LIUHE[branch]===p.branch)hits.push({type:'六合',pillar:p.name,branch:p.branch});
 });
 for(const tri of SANHE){
  if(tri.includes(branch)){
   const others=[...tri].filter(c=>c!==branch&&pillars.some(p=>p.branch===c));
   if(others.length===2)hits.push({type:'三合局',pillar:others.join(''),branch:others.join('')});
  }
 }
 return hits;
}
function roleOfBranch(branch,natalStrength){
 const elements={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
 const e=elements[branch]||'';
 const useful=natalStrength?.useful||[],caution=natalStrength?.caution||[];
 return useful.includes(e)?'useful':caution.includes(e)?'caution':'neutral';
}

/* ---------- 深度详批生成器 ---------- */
export function buildBaziDeepReport(data){
 const gloss={};
 const G=(term)=>{gloss[term]=TEN_GOD_DEEP[term]?.gloss||SHENSHA_DEEP[term]?.gloss||GEOGE_DEEP[term]?.gloss||null;return term;};
 const pillars=data.pillars||[],dm=data.dayMaster||{},ns=data.natalStrength||data.strength||{};
 const dayStem=dm.stem||pillars[2]?.stem||'甲';
 const gege=detectGege(pillars,ns);
 const gegeInfo=GEOGE_DEEP[gege.name]||GEOGE_DEEP.中和格;
 const useful=(ns.useful||[]).join('、'),caution=(ns.caution||[]).join('、');
 const strengthText=ns.kind==='身强'?'身强（自我与助力充足，能扛事也能担财）':ns.kind==='身弱'?'身弱（先天底气偏弱，贵在与人和、借势而行）':'中和（进可攻退可守，人生弹性大）';

 /* 一、命局总览 */
 const pillarTable=`<table class="rpt-table"><thead><tr><th>柱</th><th>干支</th><th>天干十神</th><th>地支藏干</th><th>星运</th><th>纳音</th></tr></thead><tbody>${pillars.map(p=>`<tr><td>${p.name}</td><td>${p.stem}${p.branch}</td><td>${p.tenGod||tenGodOf(dayStem,p.stem)||'—'}</td><td>${(p.hidden||[]).map(h=>`${h.stem}(${h.god})`).join(' ')||'—'}</td><td>${p.changsheng||'—'}</td><td>${p.nayin||'—'}</td></tr>`).join('')}</tbody></table>`;
 const overview=[
  `命主日主为「${dayStem}${elementOfStem(dayStem)}」，${strengthText}，全局扶助度 ${Number(ns.support??50).toFixed(1)}%${useful?`。喜用之神为${G(useful)}（行运遇之多顺）`:''}${caution?`，忌神为${caution}（行运遇之多滞，须提前防守）`:''}。`,
  `月令为${pillars[1]?.branch||'—'}（${(pillars[1]?.branchElement)||'—'}），${TIAOHOU[pillars[1]?.branch||'子']}。`,
  `本命判定为${G(gege.name)}：${gege.basis}。${gegeInfo.text}`,
  `四柱排布如上表：年柱看祖上与早年、月柱看父母与立业、日柱看自己与婚姻、时柱看子女与晚景。表内「十神」即每一柱天干与日主的关系，${TEN_GOD_DEEP.正官.gloss.slice(0,24)}……详见文末术语小词典。`
 ];

 /* 二、性格与天赋 */
 const godCount={};
 for(const p of pillars){const g=p.tenGod||tenGodOf(dayStem,p.stem);if(g&&g!=='日主')godCount[g]=(godCount[g]||0)+1;}
 for(const p of pillars)for(const h of p.hidden||[]){const g=h.god;if(g)godCount[g]=(godCount[g]||0)+0.4;}
 const topGods=Object.entries(godCount).sort((a,b)=>b[1]-a[1]).slice(0,3);
 const personality=[
  `以十神配置看性格：命局以${topGods.map(([g,n])=>`${G(g)}（权重 ${n.toFixed(1)}）`).join('、')}为主色调。`,
  ...topGods.map(([g])=>`「${g}」主性格：${TEN_GOD_DEEP[g].person}。`),
  `从格与身强弱合参：${gege.name}${strengthText}的人，先守好本格的 ${gege.name.includes('从')?'顺势':'节奏'}，再谈突破；性格没有好坏，只有用对了场合与否。`
 ];

 /* 三、事业方向 */
 const careerGod=topGods[0]?.[0]||'正官';
 const career=[
  `事业以${G(careerGod)}为主导：${TEN_GOD_DEEP[careerGod].career}。`,
  `行业五行参考：喜用为${useful||'中和'}，优先${(ns.useful||['土']).map(e=>ELEMENT_CAREER[e]||'稳健行业').join('；')}。`,
  `格局层次：${gegeInfo.text}`,
  `身强弱与事业姿态：${ns.kind==='身强'?'身强宜主动争取舞台，做牵头人；':'身弱宜先借平台与团队之势，做核心专业者；'}「${ns.kind}」不是能力上限，而是起步姿势。`
 ];

 /* 四、财富模式 */
 const wealthGods=pillars.map(p=>p.tenGod||tenGodOf(dayStem,p.stem)).filter(g=>['正财','偏财'].includes(g));
 const hasWealth=wealthGods.length>0;
 const wealth=[
  hasWealth?`命局见${wealthGods.map(G).join('、')}：${wealthGods.map(g=>TEN_GOD_DEEP[g].wealth).join(' ')}`:`命局天干未透财星：财富路径先走「才名换财」——以专业技能与口碑为财源，财星行运补足时再谈扩张。`,
  `身强弱与财富承载：${ns.kind==='身强'?'身强能任财，机会来时可以下重注，但仍须留三成安全垫。':'身弱财旺反受财累——大额投资、加杠杆、替人担保都须设上限。'}`,
  `流年财运观察：每逢「${G('正财')}」「${G('偏财')}」透干之年为进财窗口；「${G('劫财')}」当令或冲提纲之年防破耗，先守后攻。`
 ];

 /* 五、婚姻与六亲 */
 const dayBranch=pillars[2]?.branch;
 const spouseGod=(pillars[2]?.hidden||[])[0]?.god||pillars[2]?.tenGod&&pillars[2].tenGod!=='日主'&&pillars[2].tenGod||tenGodOf(dayStem,pillars[3]?.stem)||'正财';
 const spouseHit=relationWithNatal(dayBranch||'',pillars.slice(0,2));
 const love=[
  `日支（婚姻宫）坐${dayBranch||'—'}，藏干${(pillars[2]?.hidden||[]).map(h=>`${h.stem}(${h.god})`).join(' ')}——配偶画像与相处之道以${G(spouseGod||'正财')}取象：${TEN_GOD_DEEP[spouseGod||'正财'].love}。`,
  `婚姻宫与年月支的互动：${spouseHit.length?spouseHit.map(h=>`${h.type}（涉及${h.pillar}），关系有张力也有黏性，磨合即默契`).join('；'):'未见刑冲，感情以稳为主，贵在主动保鲜'}。`,
  `六亲取象：年柱${pillars[0]?.stem||''}${pillars[0]?.branch||''}（${pillars[0]?.tenGod||'—'}）看祖上与早年根基；月柱${pillars[1]?.stem||''}${pillars[1]?.branch||''}（${pillars[1]?.tenGod||'—'}）看父母与同辈；时柱${pillars[3]?.stem||''}${pillars[3]?.branch||''}（${pillars[3]?.tenGod||'—'}）看子女与晚运${pillars[3]?.unknown?'（时辰未知，子女晚运不参断）':''}。`,
  `感情应期参考：婚姻宫逢合（${Object.values(LIUHE).slice(0,3).join('、')}之类）或财官星透干之年，姻缘发动概率高；婚姻宫逢冲之年，聚少离多或关系重组，宜沟通勿冷战。`
 ];

 /* 六、健康 */
 const weights=ns.weights||{};
 const heaviest=Object.entries(weights).sort((a,b)=>b[1]-a[1])[0]?.[0]||'土';
 const lightest=Object.entries(weights).sort((a,b)=>a[1]-b[1])[0]?.[0]||'水';
 const health=[
  `五行偏枯与养生：全局${heaviest}气最重（${HEALTH[heaviest]}）；${lightest}气最轻（${HEALTH[lightest]}）。补${lightest}的日常习惯宜早养成。`,
  `调候提示：${TIAOHOU[pillars[1]?.branch||'子']}——寒燥失衡是很多「说不清的不舒服」的根源。`,
  `岁运健康观察：忌神五行当令、婚姻宫或日柱被冲之年，身心负担重，作息先行；凡明显不适应及时就医，本节仅是传统文化象意，不作诊断。`
 ];

 /* 七、神煞详解 */
 const shenshaLines=[];
 for(const p of pillars){
  for(const s of p.shensha||[]){
   const info=SHENSHA_DEEP[s];
   shenshaLines.push(`「${G(s)}」落于${p.name}${p.stem}${p.branch}：${info.gloss}。${info.inPillar}`);
  }
 }
 if((data.voidBranches||[]).length){
  shenshaLines.push(`「${G('空亡')}」：${SHENSHA_DEEP.空亡.gloss}。本命空亡为${data.voidBranches.join('、')}——落在哪柱，那一柱的人事早年多靠自力。`);
 }
 const shenshaSec=shenshaLines.length?shenshaLines:['本命四柱未检出所列常用吉凶神煞——神煞是锦上添花的细断，无神煞不碍格局大局。'];

 /* 八、大运逐运详批 */
 const cycles=data.cycles||[],trend=data.trend;
 const cycleLines=cycles.map(c=>{
  const god=c.tenGod||tenGodOf(dayStem,c.stem);
  const hits=relationWithNatal(c.branch,pillars);
  const support=trend?.cycles?.find(x=>x.index===c.index)?.support;
  const delta=support!=null?support-Number(ns.support??50):null;
  const trendText=delta==null?'':delta>2?`运势强度上行 ${delta.toFixed(1)} 点，顺势可进取`:delta<-2?`运势强度回落 ${Math.abs(delta).toFixed(1)} 点，宜守不宜攻`:'运势强度平稳';
  const deep=TEN_GOD_DEEP[god]||TEN_GOD_DEEP.正官;
  const rel=hits.length?hits.map(h=>{
   const role=roleOfBranch(c.branch,ns);
   return h.type==='六冲'?(role==='caution'?'冲去忌神，旧阻松动，反而是变局之年':role==='useful'?'冲用神，根基有摇动，凡事留退路':'冲动平和之位，变动中性，重在适应'):'相合聚力，人缘合作可借';
  }).join('；'):'与原局无明显刑冲合，行运平稳发挥';
  return `<li><b>第${(c.index??0)+1}步 · ${c.age?`虚岁 ${c.age}–${c.age+9} · `:''}${c.startYear?c.startYear+'–'+(c.startYear+9)+' · ':''}${c.stem}${c.branch}（${G(god)}）</b><span>事业：${deep.career}。财运：${deep.wealth}。${trendText?'。':''}${trendText}。${rel}。</span></li>`;
 }).join('');
 const cycleSec=cycleLines?`<ul class="rpt-list">${cycleLines}</ul>`:'大运数据待排盘后生成——在排盘页选择任意一步大运，本报告会随盘面同步更新。';

 /* 九、流年逐年详批 */
 const years=data.years||[];
 const yearLines=years.map(y=>{
  const god=y.tenGod||tenGodOf(dayStem,y.stem);
  const hits=relationWithNatal(y.branch,pillars);
  const support=trend?.years?.find(x=>x.year===y.year)?.support;
  const delta=support!=null?support-Number(ns.support??50):null;
  const deep=TEN_GOD_DEEP[god]||TEN_GOD_DEEP.正官;
  const clashText=hits.map(h=>h.type==='六冲'?'冲'+(hits[0]?.pillar||''):'合'+(hits[0]?.pillar||'')).join('、');
  const tone=delta==null?'':delta>3?'● 顺年':delta<-3?'▲ 慎年':'○ 平年';
  return `<li><b>${y.year}（${y.age??''}岁）${y.stem}${y.branch} · ${G(god)}${tone}</b><span>事业${deep.career.slice(0,30)}…；财 ${delta!=null&&delta>3?'可进取':delta!=null&&delta<-3?'先防守':'常规运转'}${clashText?`；与原局${clashText}`:''}；感情${deep.love.slice(0,26)}…；健康${deep.health}。</span></li>`;
 }).join('');
 const yearSec=yearLines?`<ul class="rpt-list rpt-years">${yearLines}</ul>`:'流年数据待排盘后生成。';

 /* 十、流月逐月详批 + 趋吉避凶 */
 const months=data.months||[];
 const monthLines=months.map(m=>{
  const god=m.tenGod||tenGodOf(dayStem,m.stem);
  const hits=relationWithNatal(m.branch,pillars);
  const role=roleOfBranch(m.branch,ns);
  const deep=TEN_GOD_DEEP[god];
  const roleText=role==='useful'?'月令五行为喜用——本月环境顺风，宜推进要事':role==='caution'?'月令五行为忌神——本月环境逆风，宜收尾守成、不宜开局':'月令五行中性——看个人动作，不看天吃饭';
  const hitText=hits.length?hits.map(h=>h.type==='六冲'?`与${h.pillar}（${h.branch}）相冲——变动月：行程、合同、人事易反复，重要节点留缓冲`:`与${h.pillar}（${h.branch}）相合——聚力月：合作、签约、见贵人的好窗口`).join('；'):'与原局无明显刑冲——平顺月，按计划走';
  const clashYear=months.length&&m.branch===CLASH_MAP[pillars[1]?.branch||'']?'；【冲提纲】此月动摇月令根基，大决策建议顺延':'';
  return `<li><b>${m.label||m.stem+m.branch} · ${m.stem}${m.branch} · ${G(god||'正官')}</b><span>${deep?deep.person.slice(0,20)+'式节奏；':''}${roleText}。${hitText}${clashYear}。</span></li>`;
 }).join('');
 const monthSec=monthLines?`<ul class="rpt-list rpt-months">${monthLines}</ul>`:'';
 const monthWindows=data.guidance?.monthWindows||[];
 const advice=[
  `流月层面：以节气为界换月，每月干支与原局的刑冲合害决定该月节奏。${monthWindows.length?`近段干支引动最强的月份为 ${monthWindows.map(m=>`${m.label}（${(m.links||[]).join('、')}）`).join('、')}——这些月份适合提前安排要事。`:'在排盘页时间轴选到具体年份后，逐月提示会同步到流月轨道。'}`,
  `趋吉总则：喜用${useful||'中和'}当令之年进取，忌神${caution||'不单列'}当令之年守成；大事避开婚姻宫、用神被冲之月。`,
  `避凶总则：${caution?`「${caution}」相关的行业与决策，在忌神年份降杠杆；`:''}${G('劫财')}透干之年不替人担保、合伙先写清分益；身弱之年少熬夜、大决策推迟到顺年。`,
  `本报告由命盘证据逐条推导（格局取月令透干、断语随十神与刑冲合害触发），术语白话见下节词典。传统术数供文化与自我观察参考，不构成事实预测、投资或医疗建议。`
 ];

 const sections=[
  {title:'一、命局总览与格局',lines:overview,table:pillarTable},
  {title:'二、性格与天赋',lines:personality},
  {title:'三、事业方向',lines:career},
  {title:'四、财富模式',lines:wealth},
  {title:'五、婚姻与六亲',lines:love},
  {title:'六、健康与调候',lines:health},
  {title:'七、神煞详解',lines:shenshaSec},
  {title:'八、大运逐运详批（每步十年）',lines:[],list:cycles.length?undefined:undefined,html:cycles.length?cycleSec:undefined},
  {title:'九、流年逐年详批（未来十年）',lines:[],html:years.length?yearSec:undefined},
  {title:'十、流月逐月详批（所选流年十二个月）',lines:months.length?[
   `流月以节气为界换月（立春起寅月）。下表逐月给出：月干支对日主的十神（当月主气质）、月支五行对喜忌的顺逆（环境风力）、与原局四柱的刑冲合（剧情走向）。`,
   `用法：合月签约合作、冲月防守缓冲、喜用月推进要事、忌神月收尾复盘——把一年的大事排进对的月份，就是「择时而动」。`
  ]:[],html:months.length?monthSec:undefined},
  {title:'十一、趋吉避凶总则',lines:advice}
 ];
 const glossary={...gloss};
 return {title:'八字命理 · 终身详批',sections,glossary,gege:gege.name,kind:'bazi'};
}
