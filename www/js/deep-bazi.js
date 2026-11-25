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
/* 0.32.0 扩充：将星/灾煞/亡神/孤辰寡宿/红鸾天喜/天罗地网/金舆/魁罡/学堂词馆/十恶大败/天德月德 */
export const SHENSHA_MORE={
 将星:{gloss:'三合局旺气所聚之星，象征组织力与掌控力',inPillar:'落在哪柱，该柱所主的人事容易出现「被推到台前」的局面'},
 灾煞:{gloss:'与驿马对望的急耗之星，象征突发破坏与计划被打断',inPillar:'落在哪柱，该领域的关键事务都要留出缓冲与备份'},
 亡神:{gloss:'机巧与心机之星，象征谋略、城府与暗中消耗',inPillar:'宜用在研究、策略与风控，不宜用在算计人际上'},
 孤辰:{gloss:'独处倾向之星，象征自立、疏离与精神独立',inPillar:'落在日时柱，习惯一个人扛事，须主动建立可依靠的关系'},
 寡宿:{gloss:'与孤辰相对，象征清静自守与情感克制',inPillar:'落在哪柱，哪一柱的领域偏向少言多思、靠自己成事'},
 红鸾:{gloss:'婚喜之星，象征姻缘、喜事与人情往来',inPillar:'逢流年引动时，感情与社交场合的机会明显增多'},
 天喜:{gloss:'与红鸾对冲的喜乐之星，象征开心事与贵人牵线',inPillar:'落宫所主的领域常有「不期而遇」的好消息'},
 天罗:{gloss:'戌为天罗，象征网罗与束缚',inPillar:'逢之宜守法守规，忌投机与灰色操作'},
 地网:{gloss:'辰为地网，象征牵绊与难以脱身',inPillar:'落在哪柱，该柱的人事易陷纠缠，宜早立边界'},
 金舆:{gloss:'车马华盖之星，象征体面、出行便利与配偶助力',inPillar:'年月主得长辈体面相待，日时主婚姻中能得实际帮衬'},
 魁罡:{gloss:'庚辰、庚戌、壬辰、戊戌四日，象征刚烈果断与不服人',inPillar:'日柱逢之性格鲜明、办事有魄力，须防过刚易折'},
 学堂:{gloss:'日干长生位所临，象征学习能力与系统训练',inPillar:'落在哪柱，该柱所主领域成为「学得进、教得出」的长项'},
 词馆:{gloss:'日干临官位所临，象征文才与专业表达',inPillar:'宜以文字、专业与可复用的作品立身'},
 十恶大败:{gloss:'传统所指的耗败之日，象征财来财去与大开大合',inPillar:'仅作传统取象参考，不据此断言凶吉，重在提醒守恒与留余地'},
 天德贵人:{gloss:'月令所生的仁厚之星，象征逢凶化吉与长辈庇护',inPillar:'落在哪柱，该柱所主的人事多能遇贵人解围'},
 月德贵人:{gloss:'三合月气所钟的祥和之星，象征宽厚与福泽',inPillar:'与天德同看，两德齐聚者待人宽、遇事有人帮'}
};
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
 中和格:{gloss:'月令本气未透，日主中和——以平衡稳健立身',text:'月令本气未透干，取本气为暗格参断：命局以平和中庸立身，不靠一偏之极，大运引动什么就成什么——后天选择权重高。'},
 '正格·身弱':{gloss:'身弱但有根、未至于从——以帮扶为用',text:'日主偏弱而根气未绝，属身弱正格：取印比为喜用，靠平台、贵人与同辈借力；忌财官过旺之地硬撑，须先补底气再谈扩张。'},
 '正格·身强':{gloss:'身强但未成一气专旺——以克泄耗为用',text:'日主偏旺而气势未纯，属身强正格：取财官食伤为喜用，宜主动任事、把精力投到事功与产出上；忌再添帮身之地而壅塞。'}
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
// 刑冲合害破口径与引擎 src/bazi-pro.mjs rowRules 对齐，避免报告层与盘面层说法打架
const XING_PAIRS=[['子','卯'],['辰','辰'],['午','午'],['酉','酉'],['亥','亥'],['寅','巳','申'],['丑','戌','未']];
const HAI_PAIRS=[['子','未'],['丑','午'],['寅','巳'],['卯','辰'],['申','亥'],['酉','戌']];
const PO_PAIRS=[['子','酉'],['卯','午'],['辰','丑'],['未','戌'],['寅','亥'],['巳','申']];

/* 十神映射：与引擎 src/bazi.mjs tenGod() 完全同源（五行生克 + 阴阳同异）。
   旧实现用 [s%2][diff/2] 索引查表，天干关系几乎全错且 diff>=6 返回 null，
   直接导致格局判定误判（如把七杀格误报成「中和格格」）。标准十神：
   同我=比肩/劫财、我生=食神/伤官、我克=偏财/正财、克我=七杀/正官、生我=偏印/正印。*/
const STEM_ELEM={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const ELEM_GENERATE={木:'火',火:'土',土:'金',金:'水',水:'木'};
const ELEM_CONTROL={木:'土',土:'水',水:'火',火:'金',金:'木'};
const YIN_STEMS='乙丁己辛癸';
function godOf(dayStem,stem){
 const de=STEM_ELEM[dayStem],oe=STEM_ELEM[stem];
 if(!de||!oe)return null;
 const same=YIN_STEMS.includes(dayStem)===YIN_STEMS.includes(stem);
 if(oe===de)return same?'比肩':'劫财';
 if(ELEM_GENERATE[de]===oe)return same?'食神':'伤官';
 if(ELEM_CONTROL[de]===oe)return same?'偏财':'正财';
 if(ELEM_CONTROL[oe]===de)return same?'七杀':'正官';
 return same?'偏印':'正印';
}
const hidden={子:'癸',丑:'己癸辛',寅:'甲丙戊',卯:'乙',辰:'戊乙癸',巳:'丙庚戊',午:'丁己',未:'己丁乙',申:'庚壬戊',酉:'辛',戌:'戊辛丁',亥:'壬甲'};
const tenGodOf=(dayStem,stem)=>godOf(dayStem,stem);
const elementOfStem=s=>({甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'})[s];

/* 格局判定：月令藏干透干取格 + 从格检测（须通根/透干/得令三重证据，不只看百分比）
   sb = strengthBreakdown（通根 tongGen、透干 touGan、得令 deLing、得势 deShi） */
export function detectGege(pillars,natalStrength,sb){
 const day=pillars[2],month=pillars[1]||{};
 const support=Number(natalStrength?.support??50);
 const stems=pillars.map(p=>p.stem);
 const rootCount=Number(sb?.tongGen?.count??0);      // 地支同我之根
 const touGanCount=Number(sb?.touGan?.count??0);     // 天干透出且地支有根
 const deLingOk=!!sb?.deLing?.ok;                     // 月令得令（同我或生我）
 const deShiCount=Number(sb?.deShi?.count??0);        // 天干帮身
 // 从格四要素：扶助极性极端 + 无强根 + 不得令 + 天干无实透帮身。
 // 缺一即按「偏旺/偏弱」的正格参断，不轻言从——这是从格最易误判之处。
 const extremeWeak=support<25,extremeStrong=support>75;
 const hasAnchor=rootCount>0||touGanCount>0||deLingOk||deShiCount>0;
 if(extremeWeak&&!hasAnchor)return {name:'从弱格',basis:`扶助仅 ${support.toFixed(1)}%，四柱无同我之根、天干无实透帮身、月令不得令——弱无所依，顺势从势`,evidence:{support,rootCount,touGanCount,deLingOk,deShiCount}};
 if(extremeStrong&&rootCount>=2&&deLingOk)return {name:'从强格',basis:`扶助 ${support.toFixed(1)}%，月令得令且地支 ${rootCount} 处同我强根——气势专一，顺其旺势`,evidence:{support,rootCount,touGanCount,deLingOk,deShiCount}};
 // 极端但未满足从格要件：明确降级说明，避免把「身弱/身强」说成「从」。
 if(extremeWeak)return {name:'正格·身弱',basis:`扶助 ${support.toFixed(1)}% 偏低，但${deLingOk?'月令得令':rootCount?'地支尚有根':touGanCount?'天干有实透帮身':'仍有帮身之气'}，未至无依——按身弱正格取用，不轻断从弱`,evidence:{support,rootCount,touGanCount,deLingOk,deShiCount}};
 if(extremeStrong)return {name:'正格·身强',basis:`扶助 ${support.toFixed(1)}% 偏高，但${rootCount<2?'强根不足':'气势未纯'}，未成一气专旺——按身强正格取用，不轻断从强`,evidence:{support,rootCount,touGanCount,deLingOk,deShiCount}};
 const cang=(month.hidden?.length?month.hidden:[...hidden[month.branch||'子']].map((s,i)=>({stem:s,rank:['本气','中气','余气'][i]})));
 for(const h of cang){
  const god=tenGodOf(day.stem,h.stem);
  if(!god)continue;
  if(stems.some((s,i)=>i!==1&&s===h.stem))return {name:god.replace('劫财','比肩')+'格',basis:`月令${h.rank}${h.stem}（${god}）透出天干`,transparent:true};
 }
 const first=cang[0],firstGod=tenGodOf(day.stem,first.stem);
 return {name:(firstGod||'中和').replace(/格$/,'')+'格',basis:`月令${first.rank}${first.stem}当令而未透干，取本气暗格参断`,transparent:false};
}
function relationWithNatal(branch,pillars){
 const hits=[];
 // 六冲 / 六合（一对一）
 pillars.forEach((p,i)=>{
  if(p.branch===CLASH_MAP[branch])hits.push({type:'六冲',pillar:p.name,branch:p.branch});
  else if(LIUHE[branch]===p.branch)hits.push({type:'六合',pillar:p.name,branch:p.branch});
 });
 // 三合局（三支齐备）
 for(const tri of SANHE){
  if(tri.includes(branch)){
   const others=[...tri].filter(c=>c!==branch&&pillars.some(p=>p.branch===c));
   if(others.length===2)hits.push({type:'三合局',pillar:others.join(''),branch:others.join('')});
  }
 }
 // 相刑：无恩之刑(寅巳申)/恃势之刑(丑戌未)须三支齐；无礼之刑(子卯)与自刑(辰午酉亥)须两支见
 for(const grp of XING_PAIRS){
  if(!grp.includes(branch))continue;
  if(grp.length===3){
   const others=[...grp].filter(c=>c!==branch&&pillars.some(p=>p.branch===c));
   if(others.length===2)hits.push({type:'相刑',pillar:grp.join(''),branch:grp.join(''),detail:grp.join('')+'三刑'});
  }else if(grp[0]===grp[1]){
   // 自刑：当前支本身算一支，原局再遇同支即成立
   if(pillars.some(p=>p.branch===branch))hits.push({type:'相刑',pillar:branch,branch,detail:branch+'自刑'});
  }else{
   const other=grp.find(c=>c!==branch);
   if(other&&pillars.some(p=>p.branch===other))hits.push({type:'相刑',pillar:other,branch:other,detail:grp.join('')+'相刑'});
  }
 }
 // 相害（六害，一对一）
 for(const [a,b] of HAI_PAIRS){
  const other=a===branch?b:b===branch?a:null;
  if(other&&pillars.some(p=>p.branch===other))hits.push({type:'相害',pillar:other,branch:other,detail:a+b+'相害'});
 }
 // 相破（一对一）
 for(const [a,b] of PO_PAIRS){
  const other=a===branch?b:b===branch?a:null;
  if(other&&pillars.some(p=>p.branch===other))hits.push({type:'相破',pillar:other,branch:other,detail:a+b+'相破'});
 }
 return hits;
}
function roleOfBranch(branch,natalStrength){
 const elements={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
 const e=elements[branch]||'';
 const useful=natalStrength?.useful||[],caution=natalStrength?.caution||[];
 return useful.includes(e)?'useful':caution.includes(e)?'caution':'neutral';
}
/* 把一条地支关系翻译成行运断语：六冲/六合/三合/相刑/相害/相破各有不同象意，
   不再把新增的刑害破误当「相合」。role 为该流支相对喜忌的角色。 */
const BRANCH_ELEM_MAP={子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};
// 十神对应的五行（相对日主）：把「喜忌五行」落到「这个十神在当前行运是帮还是耗」。
function elementOfGod(god,dayStem){
 const de=STEM_ELEM[dayStem];if(!de||!god)return '';
 if(god==='比肩'||god==='劫财')return de;
 if(god==='食神'||god==='伤官')return ELEM_GENERATE[de];
 if(god==='正财'||god==='偏财')return ELEM_CONTROL[de];
 if(god==='正官'||god==='七杀')return Object.keys(ELEM_CONTROL).find(k=>ELEM_CONTROL[k]===de)||'';
 if(god==='正印'||god==='偏印')return Object.keys(ELEM_GENERATE).find(k=>ELEM_GENERATE[k]===de)||'';
 return '';
}
const ROLE_CODE={useful:'U',caution:'C',neutral:'N',idle:'N'};
const TENOR_HEAD={
 UU:'天干十神与地支五行同为喜用——主题与环境同向，本段是本命最省力的兑现窗口',
 UC:'天干喜用、地支忌神——主题对但环境逆风，宜小步验证、先收成果再扩张',
 CU:'天干忌神、地支喜用——环境给资源，但议题本身要重新校准，别把顺风当方向',
 CC:'干支同为忌神——本段以守成、复盘、降杠杆为主，重大开局建议顺延',
 UN:'天干喜用、地支中性——主题由自己推动，环境不添乱也不托举',
 CN:'天干忌神、地支中性——主题偏耗，宜压缩投入、把主导权交回专业流程',
 NU:'天干中性、地支喜用——顺势而为即可，具体主题看流月干支引出',
 NC:'天干中性、地支忌神——环境偏耗，按计划收尾，不在此时立新目标',
 NN:'干支皆中性——平段，按既有节奏推进，不靠运气也不必设防'
};
const ACTION_BY_GOD={
 正官:{good:'把流程、资质与权责一次讲清，用制度换位置',bad:'别为头衔背书，复核合同与口头承诺'},
 七杀:{good:'主动接硬仗，但先写好止损线与退出条件',bad:'不争强斗狠，高风险竞争本段避战'},
 正财:{good:'稳健报价、签长约，把现金流锁进账',bad:'不加杠杆、不替人担保，先把账目核清'},
 偏财:{good:'跑外勤、拓渠道，机会财可试但设上限',bad:'应酬与投机都压缩，先守住既有盈余'},
 食神:{good:'把作品做出来，用口碑换长期订单',bad:'别沉溺舒适区，设定交付节点'},
 伤官:{good:'提案、演讲、亮作品——用专业表达争取话语权',bad:'话到嘴边留三分，先写稿再发言，不硬碰权威'},
 正印:{good:'进修、考证、读合同，把资历变成可核证据',bad:'别只备考不落地，学一项就做一次实践'},
 偏印:{good:'钻冷门课题、复盘旧案，独门技能在这段最容易成型',bad:'少熬夜少内耗，把研究结论说出来让人校验'},
 比肩:{good:'同行协作、健身与自立项目同步推进',bad:'合伙先写清分益，别在情面上让利'},
 劫财:{good:'团队作战、抢时机——但钱账必须独立',bad:'借贷、担保、共同出资一律设上限'}
};
// 行运三元组：十神喜忌（天干）× 地支五行喜忌 × 与原局的刑冲合害，三者合参才定调。
// 同一十神在不同喜忌角色下产出不同文本，替代过去「十神查表复读」。
export function periodTenor(god,ns,dayStem,branch,delta){
 const elem=elementOfGod(god,dayStem),roles=ns?.roles||{};
 const gr=(roles.useful||[]).includes(elem)?'useful'
  :((roles.avoid||[]).includes(elem)||(roles.enemy||[]).includes(elem))?'caution'
  :(roles.idle||[]).includes(elem)?'idle'
  :(ns?.useful||[]).includes(elem)?'useful'
  :(ns?.caution||[]).includes(elem)?'caution':'neutral';
 const be=BRANCH_ELEM_MAP[branch]||'';
 const br=(ns?.useful||[]).includes(be)?'useful':(ns?.caution||[]).includes(be)?'caution':'neutral';
 const deep=TEN_GOD_DEEP[god]||TEN_GOD_DEEP.正官;
 const action=(ACTION_BY_GOD[god]||ACTION_BY_GOD.正官)[gr==='caution'?'bad':'good'];
 const head=TENOR_HEAD[ROLE_CODE[gr]+ROLE_CODE[br]]||TENOR_HEAD.NN;
 const trend=delta==null?'':delta>3?`运势强度较本命上行 ${delta.toFixed(1)} 点——可加速推进。`:delta<-3?`运势强度较本命回落 ${Math.abs(delta).toFixed(1)} 点——先收后攻。`:'运势强度接近本命基线，靠动作而非等时机。';
 return {god,gr,br,head,trend,action,deep,
  career:`${deep.career.split('，')[0]}；${action}。`,
  wealth:gr==='caution'?`${deep.wealth}——本段忌神当令，只做已验证的现金流，不扩新战线。`:gr==='useful'&&br==='caution'?`${deep.wealth}；天干得力但地支偏耗，扩张要有节奏——先收回旧账，再谈加码。`:gr==='useful'?`${deep.wealth}——喜用得力，可把已验证的模式加密投入。`:`${deep.wealth}——维持既有结构，等干支引出明确信号再加码。`,
  love:br==='caution'?`${deep.love}——地支偏耗，关系里少讲道理、多讲安排。`:`${deep.love}${gr==='useful'?'；本段主动经营，关系容易有实质推进。':''}`,
  health:br==='caution'?`${deep.health}；本段地支为忌，作息与复查先行。`:deep.health};
}
// 四段领域文案来自不同知识库，句尾标点不统一；拼接前统一收口，
// 否则会出现「…是相处第一律健康：…」和「…先行。。」这类明显的排版事故。
const endDot=t=>{const v=String(t||'').trim();return !v?'':(/[。！？；]$/.test(v)?v:v+'。');};
// 关系称号：相刑/相害/相破自带「辰自刑」这类细节，直接当称号用，正文不再重复一遍。
const relLabel=h=>h.detail||h.type;
function relPhrase(h,role){
 const who=`${h.pillar||h.branch||''}`;
 switch(h.type){
  case '六冲':return role==='caution'?'冲去忌神，旧阻松动，反而是变局之年':role==='useful'?'冲用神，根基有摇动，凡事留退路':'冲动平和之位，变动中性，重在适应';
  case '六合':return '聚力，人缘与合作可借';
  case '三合局':return '同气汇聚，做大事有助力';
  case '相刑':return '彼此牵制、内耗或规矩约束，重要决定留缓冲';
  case '相害':return '暗耗与误会，合作宜把权责写清';
  case '相破':return '计划易松脱，关键环节备一手';
  default:return `${h.type}（${who}）`;
 }
}

/* ---------- 十神结构：从「有哪些十神」升级为「哪几组关系在起作用」 ----------
   只数十神数量，结论只能停在「你偏印重」；而真正能落成建议的是组合——
   偏印重是性格，偏印夺食是「想法很多、落地很少」的具体机制。
   同一组十神，一透一藏、透在哪柱，读法完全不同，所以证据必须带柱位。 */
function godIndex(pillars,dayStem){
 const tou={},cang={},count={};
 for(const p of pillars){
  const g=p.tenGod||tenGodOf(dayStem,p.stem);
  if(g&&g!=='日主'){(tou[g]=tou[g]||[]).push(`${p.name}${p.stem}`);count[g]=(count[g]||0)+1;}
  for(const h of p.hidden||[]){
   const hg=h.god||tenGodOf(dayStem,h.stem);
   if(!hg)continue;
   (cang[hg]=cang[hg]||[]).push(`${p.name}藏${h.stem}${h.rank?`(${h.rank})`:''}`);
   count[hg]=(count[hg]||0)+0.4;
  }
 }
 const all=g=>[...(tou[g]||[]),...(cang[g]||[])];
 return {tou,cang,count,
  t:g=>(tou[g]||[]).length>0,
  c:g=>(cang[g]||[]).length>0,
  has:g=>all(g).length>0,
  n:g=>all(g).length,
  where:g=>all(g).slice(0,3).join('、')};
}
/* 组合判据一律「透干优先、藏支次之」，并在文本里写清是哪几柱成立——
   不写证据的组合断语，读者无法核对，也就等于不可信。 */
const GOD_PATTERNS=[
 {id:'伤官见官',hit:(x,ns)=>x.t('伤官')&&(x.t('正官')||x.c('正官')),
  mean:'才华与规矩正面相撞：你想按自己的方式把事做好，又必须在一个有明确评价标准的系统里被认可。',
  use:'把「不服」用在改进流程上：先做出结果，再提意见；提意见时同时给替代方案，而不是只指出问题。',
  risk:'与上级、审批、合同的摩擦会反复出现，口舌与文书是主要风险点；越是当场争论，越吃亏。'},
 {id:'枭神夺食',hit:(x,ns)=>x.t('偏印')&&(x.t('食神')||x.c('食神'))&&ns.kind!=='身弱',
  mean:'偏印压住食神：思路比谁都多，落地却慢半拍——想法在脑子里反复打磨，等到出手时窗口已经过去。',
  use:'给自己设「先做一个粗版」的硬规矩：三天内必须交出一个能被人看见的版本，再迭代。',
  risk:'长期停在准备阶段，作品与收入都卡在「差最后一步」；越焦虑越想多学，越学越不动。'},
 {id:'财星坏印',hit:(x,ns)=>(x.t('正财')||x.t('偏财'))&&(x.t('正印')||x.t('偏印'))&&ns.kind==='身弱',
  mean:'身弱而财印同透：求财会直接消耗你的根基——为钱透支学历、健康或靠山，短期见钱，长期掉底。',
  use:'先补底气再谈扩张：把收入的固定比例投入「不会立刻变现」的能力与资质，这是本盘最划算的投资。',
  risk:'高杠杆、替人担保、为短期收益放弃长期位置，是本盘最容易踩的三个坑。'},
 {id:'食神制杀',hit:(x,ns)=>(x.t('食神')||x.t('伤官'))&&x.t('七杀'),
  mean:'以专业压制压力：七杀带来硬仗与强对手，食伤是你能拿出来的手艺与方案——这正是「靠本事接硬活」的结构。',
  use:'主动接有明确难度、能被验证的硬任务；把每次危机写成方法论，下一次就能收更高的价。',
  risk:'无制时七杀变成纯压力；一旦停下输出，压力立刻反噬，所以别让自己长期空转。'},
 {id:'杀印相生',hit:(x,ns)=>x.t('七杀')&&(x.t('正印')||x.t('偏印')),
  mean:'压力转资历：七杀的逼迫经由印星转化成学历、职称、话语权——你吃的苦会沉淀成别人拿不走的凭证。',
  use:'把每一次被压着做的事，主动整理成可展示的成果（案例、证书、专利、复盘文档），让压力变成资产。',
  risk:'转化需要时间，中间的辛苦期最难熬；若只扛不总结，苦就白吃了。'},
 {id:'官印相生',hit:(x,ns)=>x.t('正官')&&(x.t('正印')||x.t('偏印')),
  mean:'名位与庇护同来：体制、大平台、专业序列对你是加成而非束缚，资历可以稳步兑换成位置。',
  use:'走「先拿资格、再拿位置」的路线，别跳过认证与背书；你的信用本身就是资产。',
  risk:'过于依赖平台评价，离开体系后身价需要重新证明；趁在台上时把个人品牌做出来。'},
 {id:'伤官配印',hit:(x,ns)=>x.t('伤官')&&(x.t('正印')||x.t('偏印')),
  mean:'锋芒被学养收束：伤官的才华配上印的沉淀，表达既有锐度又有分量——这是最耐用的才华结构。',
  use:'把观点写成体系：课程、专栏、方法论，让才华不只停在当场发挥。',
  risk:'印太重会压住输出，变成「懂很多但不说」；定期强制公开发表，是这个结构的关键动作。'},
 {id:'伤官生财',hit:(x,ns)=>(x.t('伤官')||x.t('食神'))&&(x.t('正财')||x.t('偏财')),
  mean:'技艺直接变现：作品、方案、内容能换成钱，收入弹性来自你的输出质量，而不是熬时间。',
  use:'把最强的那个技能产品化——定价、交付标准、复购路径一次讲清，别只做零散接单。',
  risk:'收入随状态波动，淡季要有现金储备；别把全部身家押在单一客户身上。'},
 {id:'比劫夺财',hit:(x,ns)=>x.n('比肩')+x.n('劫财')>=2&&(x.t('正财')||x.t('偏财')),
  mean:'同辈与自我同时来分财：机会常由朋友带来，钱也常在朋友与合伙里漏掉。',
  use:'合伙可以，但分益、退出、决策权必须落纸；钱账与情面分开处理。',
  risk:'借贷、担保、共同出资三件事，是本盘破财的第一来源；不是不能做，是必须先设上限。'},
 {id:'官杀混杂',hit:(x,ns)=>x.has('正官')&&x.has('七杀'),
  mean:'两套评价标准同时在场：一个要你稳、一个要你狠，容易在选择上反复——换赛道、换方向、换合作方时最明显。',
  use:'先定一个主评价体系（谁说了算），另一套只作参考；决策前把标准写下来，避免临场被情绪带走。',
  risk:'多头并进导致精力分散，哪一头都只做到七成；关键时刻必须做减法。'},
 {id:'印重身弱',hit:(x,ns)=>x.n('正印')+x.n('偏印')>=2.5&&ns.kind==='身弱',
  mean:'印多而身弱：被照顾、被安排、被输入的机会很多，自己动手的机会反而少——容易「学了很多、做成很少」。',
  use:'刻意制造「必须自己交付」的场合：接下没人替你收尾的项目，用截止日期逼出行动。',
  risk:'长期依赖平台与长辈，独立决策能力被推迟发育；越晚独立，代价越高。'},
 {id:'食伤混杂',hit:(x,ns)=>x.t('食神')&&x.t('伤官'),
  mean:'两种输出方式同时透干：既想温和地做好东西，又想锋利地表达观点，风格在两者之间摆。',
  use:'按场合切换：对内打磨用食神的耐心，对外争取用伤官的锋利，不要在同一件事上同时用两种力道。',
  risk:'表达前后不一致，让人摸不准你的立场；重要场合先定调再开口。'}
];
function detectGodPatterns(pillars,dayStem,ns){
 const x=godIndex(pillars,dayStem);
 const hits=GOD_PATTERNS.filter(p=>{try{return p.hit(x,ns);}catch{return false;}})
  .map(p=>({...p,evidence:p.id==='官杀混杂'?[x.where('正官'),x.where('七杀')].filter(Boolean).join(' / '):x.where(p.id.replace(/见|夺|坏|制|相生|配|生|混杂|重|星/g,''))||''}));
 return {x,hits};
}
/* 用神落点：喜用五行在盘里「有没有、透不透、被不被克」。
   这决定一个人是「天生就顺」还是「一辈子等运来」——旧报告只写喜用是哪几个五行，
   却不回答「这几个五行在盘里到底有没有力量」，等于把最关键的一半留空了。 */
function useGodLanding(pillars,ns,dayStem){
 const useful=ns.useful||[],caution=ns.caution||[];
 const rows=useful.map(el=>{
  const touStems=pillars.filter(p=>STEM_ELEM[p.stem]===el);
  const rootBranches=pillars.filter(p=>BRANCH_ELEM_MAP[p.branch]===el);
  const monthEl=BRANCH_ELEM_MAP[pillars[1]?.branch||'']||'';
  const isMonth=monthEl===el;
  const attackers=caution.filter(c=>ELEM_CONTROL[c]===el);
  const atkTou=pillars.filter(p=>attackers.includes(STEM_ELEM[p.stem])).map(p=>p.name+p.stem);
  const level=touStems.length&&(rootBranches.length||isMonth)?'strong'
   :touStems.length||rootBranches.length||isMonth?'rooted':'absent';
  return {el,touStems,rootBranches,isMonth,attackers,atkTou,level};
 });
 return rows;
}
const USE_LEVEL_TEXT={
 strong:'透干且有根——喜神是「实」的：本命自带的资源，不用等运来就能用。',
 rooted:'有根或有透但不成势——喜神是「半实」的：平时靠积累与平台借力，行到大运流年引动时才明显兑现。',
 absent:'盘面无明显落点——喜神是「虚」的：命局本身补不上，主要靠大运流年与后天环境补。这不是命薄，而是「选对环境比努力更重要」的结构。'
};
/* 柱位语义：同一个十神透在不同柱，表现出来的场合不同。 */
const PILLAR_FIELD={年柱:'早年经历与对外的第一印象，也主祖上与家族的底子',月柱:'社会角色与职场形象，是别人最常看到的你',日柱:'亲密关系里的自我，也是中年以后的主场',时柱:'私下状态、晚年与对下一代的态度'};

// 流年常同时与原局两三个柱成同一类关系（午与原局年支午合、月支未合、日支子冲），
// 逐条列会读成「六合、六冲、六合」——按关系类型归并，柱位放进括号。
function groupRelations(hits,role){
 const m=new Map();
 for(const h of hits){
  const key=`${h.type}|${h.detail||''}`;
  const g=m.get(key)||{type:h.type,detail:h.detail||'',who:[]};
  if(h.pillar)g.who.push(h.pillar);
  m.set(key,g);
 }
 return [...m.values()].map(g=>({
  ...g,
  // detail 本身已写明地支（如「子未相害」），再加括号就是「子未相害（子）」这种冗余。
  label:`${g.detail||g.type}${!g.detail&&g.who.length?`（${g.who.join('、')}）`:''}`,
  text:relPhrase({type:g.type,detail:g.detail,pillar:g.who.join('、')},role)
 }));
}

/* ---------- 深度详批生成器 ---------- */
export function buildBaziDeepReport(data){
 const gloss={};
 const G=(term)=>{gloss[term]=TEN_GOD_DEEP[term]?.gloss||SHENSHA_DEEP[term]?.gloss||GEOGE_DEEP[term]?.gloss||null;return term;};
 const pillars=data.pillars||[],dm=data.dayMaster||{},ns=data.natalStrength||data.strength||{};
 const sbData=data.strengthBreakdown||{};
 const dayStem=dm.stem||pillars[2]?.stem||'甲';
 // 示例十神取自本盘真实天干，不再是写死的「正官」（脱离盘面即名不副实）
 const sampleGod=pillars.map(p=>p.tenGod||tenGodOf(dayStem,p.stem)).find(g=>g&&g!=='日主')||'正官';
 const gege=detectGege(pillars,ns,sbData);
 const gegeInfo=GEOGE_DEEP[gege.name]||GEOGE_DEEP.中和格;
 const sp=ns.special;
 const spLines=sp?[`特殊格局判定：${sp.kind}——${sp.note}（已优先于扶抑/从格取用，喜用 ${sp.use.join('、')}、忌 ${sp.avoid.join('、')}）。专旺/化气格不按常规身强身弱读：顺其势则昌，逆其势多滞，行运亦以生助化神为佳。`]:[];
 const useful=(ns.useful||[]).join('、'),caution=(ns.caution||[]).join('、');
 const strengthText=ns.kind==='身强'?'身强（自我与助力充足，能扛事也能担财）':ns.kind==='身弱'?'身弱（先天底气偏弱，贵在与人和、借势而行）':'中和（进可攻退可守，人生弹性大）';

 /* 一、命局总览 */
 const pillarTable=`<table class="rpt-table"><thead><tr><th>柱</th><th>干支</th><th>天干十神</th><th>地支藏干</th><th>星运</th><th>纳音</th></tr></thead><tbody>${pillars.map(p=>`<tr><td>${p.name}</td><td>${p.stem}${p.branch}</td><td>${p.tenGod||tenGodOf(dayStem,p.stem)||'—'}</td><td>${(p.hidden||[]).map(h=>`${h.stem}(${h.god})`).join(' ')||'—'}</td><td>${p.changsheng||'—'}</td><td>${p.nayin||'—'}</td></tr>`).join('')}</tbody></table>`;
 const overview=[
  `命主日主为「${dayStem}${elementOfStem(dayStem)}」，${strengthText}，全局扶助度 ${Number(ns.support??50).toFixed(1)}%${useful?`。喜用之神为${G(useful)}（行运遇之多顺）`:''}${caution?`，忌神为${caution}（行运遇之多滞，须提前防守）`:''}。`,
  `月令为${pillars[1]?.branch||'—'}（${(pillars[1]?.branchElement)||'—'}），${TIAOHOU[pillars[1]?.branch||'子']}。`,
  `本命判定为${G(gege.name)}：${gege.basis}。${gegeInfo.text}`,
  ...(gege.name.includes('从')&&gege.evidence?[`从格证据核对：扶助 ${gege.evidence.support.toFixed(1)}% · 通根 ${gege.evidence.rootCount} 处 · 透干有根 ${gege.evidence.touGanCount} 个 · ${gege.evidence.deLingOk?'月令得令':'月令不得令'}。从格最忌误判——若这几项与盘面观感不符，请优先按「身强/身弱正格」参断。`]:[]),
  `四柱排布如上表：年柱看祖上与早年、月柱看父母与立业、日柱看自己与婚姻、时柱看子女与晚景。表内「十神」即每一柱天干与日主的关系——例如「${sampleGod}」即${TEN_GOD_DEEP[sampleGod]?.gloss||'天干与日主的生克关系'}；详见文末术语小词典。`,
  ...spLines,
  ...(ns.approach?[`取用口径：${ns.approach}这是本盘得出「喜用什么、忌什么」的规则；换一套派别结论可能不同，换盘时请先核对这一行。`]:[]),
  ...(ns.roles?[`十神角色补全：喜用 ${ns.roles.useful.join('、')||'未单列'} · 忌神 ${ns.roles.avoid.join('、')||'未单列'} · 仇神 ${ns.roles.enemy.join('、')||'本盘无独立仇神'} · 闲神 ${ns.roles.idle.join('、')||'无'}。${ns.roles.note}`]:[])
 ];

 /* 二、命局根基：三垣与力量来源 */
const tri=data.traditional||{},sb=data.strengthBreakdown||{};
const tripleRows=[]
 .concat(tri.taiYuan?[['胎元',tri.taiYuan.ganzhi,tri.taiYuan.tenGod,tri.taiYuan.nayin,'受胎之气：看先天体质与家族底色，胎元受生扶者底子厚']]:[])
 .concat(tri.mingGong?[['命宫',tri.mingGong.ganzhi,tri.mingGong.tenGod,tri.mingGong.nayin,'先天禀赋与人生主轴：命宫所主之神，是一生最顺手的做事方式']]:[])
 .concat(tri.shenGong?[['身宫',tri.shenGong.ganzhi,tri.shenGong.tenGod,tri.shenGong.nayin,'后天作为与身体：身宫落在哪一柱的领域，中年后越用越显']]:[])
 .concat(tri.taiXi?[['胎息',tri.taiXi.ganzhi,tri.taiXi.tenGod,tri.taiXi.nayin,'胎元之合气，古法备参，现代多作辅助参考']]:[]);
const tripleTable=tripleRows.length?`<table class="rpt-table"><thead><tr><th>项目</th><th>干支</th><th>对日主</th><th>纳音</th><th>取象</th></tr></thead><tbody>${tripleRows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]||'—'}</td><td>${r[3]||'—'}</td><td>${r[4]}</td></tr>`).join('')}</tbody></table>`:'';
const strengthEvidence=[
 sb.deLing?.text,
 sb.tongGen?.text,
 sb.deShi?.text,
 sb.touGan?.text
].filter(Boolean);
const strengthSec=[
 `同样是「${ns.kind||'中和'}」，成因可以完全不同——有人靠月令当令，有人靠地支强根，有人靠天干帮身。拆开来看，才知道该补哪一块。`,
 ...strengthEvidence.map(x=>`${x}${/[。！]$/.test(x)?'':'。'}`),
 sb.verdict?`【结论】${sb.verdict}（力量来源评分 ${Number(sb.score||0).toFixed(1)} / ${sb.full||6.5}）。`:'',
 sb.deLing?.ok&&sb.deDi?.length?'现实用法：令与地皆得，属于「起步就顺」的类型，重点在选对赛道，不必过度补短板。'
  :sb.deLing?.ok?'现实用法：得令而根浅，起势快但续航需靠积累——把资源沉淀成可复用的能力与团队。'
  :sb.deDi?.length?'现实用法：失令而得地，属于「靠根基硬扛」的类型，前期慢热，越到中后段越稳。'
  :'现实用法：令地皆弱，最忌硬撑。借平台、借团队、借行运，是这一格局的正确打开方式，不是妥协。',
 `三垣补四柱之未备：${tri.mingGong?`命宫${tri.mingGong.ganzhi}（${tri.mingGong.tenGod}）——${TEN_GOD_DEEP[tri.mingGong.tenGod]?.person||'主一生做事的底色'}；`:''}${tri.shenGong?`身宫${tri.shenGong.ganzhi}（${tri.shenGong.tenGod}）——中年后越用越显，${TEN_GOD_DEEP[tri.shenGong.tenGod]?.career?.slice(0,28)||'主后天作为'}；`:''}${tri.unknown?'时辰未知，命宫与身宫不成立，补全时辰后可参断。':'三垣与四柱合看，先天禀赋（命宫）与后天作为（身宫）是否同气，决定「想做的」与「做成的」是否一致。'}`,
 tri.method?`口径：${tri.method}`:''
].filter(Boolean);

/* 二、性格与天赋 */
 // 用神落点算得早：性格、事业两章都要引用，不能各算一次（口径必须同源）。
 const landing=useGodLanding(pillars,ns,dayStem);
 const godCount={};
 for(const p of pillars){const g=p.tenGod||tenGodOf(dayStem,p.stem);if(g&&g!=='日主')godCount[g]=(godCount[g]||0)+1;}
 for(const p of pillars)for(const h of p.hidden||[]){const g=h.god;if(g)godCount[g]=(godCount[g]||0)+0.4;}
 const topGods=Object.entries(godCount).sort((a,b)=>b[1]-a[1]).slice(0,3);
 const {x:godx,hits:patternHits}=detectGodPatterns(pillars,dayStem,ns);
 const dominantGod=topGods[0]?.[0]||'正官';
 // 十神「要什么」：一句话说清这股力量在争什么，用来解释内部拉扯，而不是贴性格标签。
 const GOD_WANT={正官:'要名分与秩序，先合规再谈发挥',七杀:'要赢，宁可硬碰也不绕路',正财:'要看得见的积累，一分耕耘一分收',偏财:'要流动的机会，人脉就是钱脉',食神:'要舒服、要作品，慢工才出细活',伤官:'要说出不同的意见，压着比说错更难受',正印:'要先学、先靠、先等一个周全的时机',偏印:'要独自想明白，别人给的答案不算答案',比肩:'要自己来，分工不如亲手',劫财:'要快、要抢，机会窗口比稳妥重要'};
 // 柱位短语要短：PILLAR_FIELD 是给整段叙述用的长句，塞进「X 这一层最显」会读成病句。
 const PILLAR_SHORT={年柱:'早年与对外第一印象',月柱:'社会角色',日柱:'亲密关系与中年主场',时柱:'私下与晚年'};
 const seatLine=g=>{
  const tou=pillars.filter(p=>(p.tenGod||tenGodOf(dayStem,p.stem))===g).map(p=>p.name);
  const cang=pillars.filter(p=>(p.hidden||[]).some(h=>h.god===g)).map(p=>p.name);
  const place=[tou.length?`透${tou.join('、')}天干`:'',cang.length?`藏${cang.map(x=>x.replace('柱','')).join('、')}支`:''].filter(Boolean).join('、');
  const field=PILLAR_SHORT[tou[0]||cang[0]]||'';
  return `${g}——${place||'间接得气'}${field?`，${field}这一层最显`:'，不在明面，遇事才冒出来'}`;
 };
 const personality=[
  `【十神座次】命局十神以${topGods.map(([g,n])=>`${g}（权重 ${n.toFixed(1)}）`).join('、')}为前三。权重把天干透出按 1、地支藏干按 0.4 折算：透干是「别人看得见」，藏支是「遇事才冒出来」。它衡量的是「显不显」，不是「好不好」——权重低的十神照样能在关键时刻决定结果。`,
  // 三颗主导十神一次讲清「各在哪、各要什么、互相怎么拉扯」，
  // 比逐颗套同一句模板更有信息量：同一句式重复三遍，读者只会跳读。
  `【三者各在哪】${topGods.map(([g])=>seatLine(g)).join('；')}。同样一颗星，透在月柱就是「别人眼里的你」，透在时柱则是「关起门来的你」——位置比名字更能解释「为什么我在公司像另一个人」。`,
  `【三者在争什么】${topGods.map(([g])=>`${g}${GOD_WANT[g]||'要它认定的东西'}`).join('；')}。三股同时在场，日常状态往往是「想法多、标准高、出手慢」——不是能力不够，而是内部一直在开会。其中「${dominantGod}」权重最高，遇事由它先出手；另外两股在后面要么补位、要么拉扯，这取决于你有没有给它们安排各自的场合。`,
  `【性格的骨架】日主${dayStem}${elementOfStem(dayStem)}，${strengthText}。${ns.kind==='身强'?'身强者主见强、耐受度高，遇事先想「我怎么解决」，缺点是容易把别人的事也揽过来。':ns.kind==='身弱'?'身弱者感知细、擅长借力，遇事先想「谁能帮我」，缺点是容易在等一个更好时机时错过窗口。':'中和者进可攻退可守，弹性最大，缺点是缺少一股非做不可的狠劲。'}格局为${gege.name}，${gegeInfo.text}`,
  ...(patternHits.length?[
   `【正在起作用的组合】单看十神只能说出「你有哪些倾向」，真正决定日常表现的是组合。本盘成立 ${patternHits.length} 组：`,
   ...patternHits.map(p=>`·「${p.id}」（${p.evidence||'盘面成立'}）：${p.mean}用法：${p.use}风险：${p.risk}`)
  ]:['【组合】本盘未成立常见的十神冲突组合（伤官见官、枭神夺食、财星坏印、比劫夺财等）——这意味着你的性格内部冲突较少，行事风格相对统一；代价是缺少那种「被逼出来」的爆发力，成就更多靠持续积累。']),
  `【三段优势】①${TEN_GOD_DEEP[dominantGod].person.split('，')[0]}，这是别人最先记住你的地方；②${gege.name.includes('从')?'顺势借力，能在大势里找到自己的位置':'本格清晰，遇事有稳定的判断框架'}；③${landing.some(r=>r.level==='strong')?`喜用${useful}透干有根，做成事时会有「顺手」的体感，这是本盘最该被用尽的一块资产`:`喜用${useful}在盘里只是半实或全虚，单靠本命不够用——你对环境的敏感度高，换对环境的效果，往往大过埋头努力`}。`,
  `【三处要留意】①${patternHits[0]?`${patternHits[0].id}——${patternHits[0].risk}`:`${TEN_GOD_DEEP[dominantGod].person.split('，').slice(-1)[0]}一旦过头，会变成别人眼里的固执`}；②${ns.kind==='身弱'?'决策容易拖：把「再想想」换成「先做最小的一步」':'容易把标准加在别人身上：先问对方要什么，再给自己的方案'}；③情绪出口窄——本盘${(patternHits.some(p=>p.id==='枭神夺食'||p.id==='印重身弱'))?'思虑型内耗明显，情绪常在心里打转，需要一个固定的外化渠道（写、练、聊）':'表达直接，情绪来得快去得也快，但容易在亲密关系里留下没说清的余账'}。`,
  `【怎么和自己相处】把上面三段翻成一句可执行的话：${ns.kind==='身强'?'给自己设「不接」的边界，把力气收在少数几件事上':'先建一个不依赖他人的小系统（一项技能、一份副业、一个固定圈子），底气来自可复用的东西'}；${patternHits.length?`并盯住「${patternHits[0].id}」这一个机制，它比任何性格标签都更能预测你会在哪里栽跟头。`:'并给自己安排定期的「外部压力源」，否则容易长期待在舒适区。'}`
 ];

/* 三、事业方向 */
 const careerGod=topGods[0]?.[0]||'正官';
 const officialGods=pillars.map(p=>p.tenGod||tenGodOf(dayStem,p.stem)).filter(g=>['正官','七杀'].includes(g));
 const careersOf=[];for(const e of (ns.useful||['土']))if(ELEMENT_CAREER[e])careersOf.push(`${e}：${ELEMENT_CAREER[e]}`);
 // 发力期：只排「还没走完」的运。把已经过去的运排进来，会得出「最顺的是三十六岁前」这种
 // 无法执行的结论；顺运若在晚年，要如实说成「慢热积累型」，而不是让人等到六十岁才创业。
 const nowYear=new Date().getFullYear();
 const cycleRank=(data.cycles||[]).map(c=>({c,s:Number((data.trend?.cycles||[]).find(x=>x.index===c.index)?.support)}))
  .filter(x=>Number.isFinite(x.s)&&x.c.startYear+9>=nowYear);
 const bySupport=[...cycleRank].sort((a,b)=>b.s-a.s);
 const peak=bySupport[0],worst=bySupport[bySupport.length-1];
 const current=(data.cycles||[]).find(c=>c.startYear<=nowYear&&nowYear<=c.startYear+9);
 const currentS=current?Number((data.trend?.cycles||[]).find(x=>x.index===current.index)?.support):NaN;
 const base=Number(ns.support??50);
 // 未来十年里天干五行落在喜用／忌神的年份——「忌神之年重防守」这类话，不给具体年份就无法执行。
 const aheadYears=(data.years||[]).filter(y=>y.year>=nowYear&&y.year<=nowYear+10);
 const yearElOf=y=>STEM_ELEM[y.stem]||'';
 const usefulYears=aheadYears.filter(y=>(ns.useful||[]).includes(yearElOf(y))).map(y=>y.year);
 const cautionYears=aheadYears.filter(y=>(ns.caution||[]).includes(yearElOf(y))).map(y=>y.year);
 const career=[
  `【赛道】事业以${G(careerGod)}为主导，${TEN_GOD_DEEP[careerGod].career}。这句话的实际含义是：你在「${TEN_GOD_DEEP[careerGod].person.split('，')[0]}」这件事上比别人省力，所以第一份工作、第一次创业、第一个可复用的产品，都应该压在这个长板上，而不是先补短板。`,
  `【行业五行】喜用为${useful||'中和'}，对应的行业方向——${careersOf.join('；')}。五行只用于「同气」参考：同一个岗位在不同公司可能属于不同五行（如互联网运营偏火、互联网基础设施偏金），以你实际做的事为判断依据。`,
  `【你的优势落在哪一层】${landing.map(r=>`喜用「${r.el}」${USE_LEVEL_TEXT[r.level]}位置：${r.touStems.length?`天干透于${r.touStems.map(p=>p.name+p.stem).join('、')}`:'天干不透'}${r.rootBranches.length?`，地支根在${r.rootBranches.map(p=>p.name+p.branch).join('、')}`:'，地支无根'}${r.isMonth?'，且为月令当权——这是最强的一种落法':''}${r.atkTou.length?`；但被${r.atkTou.join('、')}所克，力量打折，逢这些字当令的年份尤其明显`:''}。`).join('')}这句话的实际用法：${landing.some(r=>r.level==='strong')?'本命自带喜用，先把它用尽——选喜用五行对应的行业与角色，成功率高出一个量级。':'本命给的不够，所以要主动「造」：换城市、换行业、换圈层，让喜用五行从外部补进来，而不是指望熬时间。'}`,
  `【体制还是自由】${officialGods.length?'命局见'+[...new Set(officialGods)].join('、'):'命局天干未透官杀'}——${officialGods.includes('正官')&&!officialGods.includes('七杀')?'正官为主，宜在有明确晋升阶梯的组织里做长期主义，跳槽宜「同级平移、上级进阶」，不宜频繁换赛道。':officialGods.includes('七杀')&&!officialGods.includes('正官')?'七杀为主，高压高回报的环境出成绩：创业、执法、外科、竞技、危机管理；须自设止损线，别把「能扛」当成「该扛」。':officialGods.length?'官杀混杂，两套评价体系同时在拉扯：先确立一个「谁说了算」的主体系，另一个只作参考，否则会在换方向上来回消耗。':'官杀不透，意味着「头衔」对你的加成有限：走专业序列与个人品牌，比走管理序列更容易被看见。'}`,
  `【发力期】${current&&Number.isFinite(currentS)?`当前走${current.stem}${current.branch}运（${current.startYear}–${current.startYear+9}），扶助 ${currentS.toFixed(1)}%，相对本命基线 ${currentS-base>=2?'高出':currentS-base<=-2?'低于':'接近'} ${Math.abs(currentS-base).toFixed(1)} 点——${currentS-base>=2?'这十年是你的顺风段，可主动加速':currentS-base<=-2?'这十年是补课段，重点在攒能力与资源，不宜强推':'这十年是平段，靠动作而非靠时机'}。`:''}${peak&&Number.isFinite(peak.s)?`${peak.c.startYear>nowYear+2?`往后看，最顺的一步是${peak.c.stem}${peak.c.branch}运（${peak.c.startYear}–${peak.c.startYear+9}，扶助 ${peak.s.toFixed(1)}%）`:`最近的顺运是${peak.c.stem}${peak.c.branch}运（${peak.c.startYear}–${peak.c.startYear+9}，扶助 ${peak.s.toFixed(1)}%）`}——${peak.s-base>=8&&peak.c.startYear>nowYear+8?'这一步离现在还远，说明你的模型是「慢热积累型」：前期的正确动作不是等运，而是把技能、资历、人脉存下来，等运到了才有东西可放大。':'升职、创业、转型这类不可逆的决定，优先安排在这一步的前三年。'}${worst&&worst.s<base-4?`相对最吃力的是${worst.c.stem}${worst.c.branch}运（扶助 ${worst.s.toFixed(1)}%），那段以守成、精进、攒资源为主，不做重资产投入。`:''}`:'大运数据未排，发力期无法判断——请在排盘页确认起运时刻后再看本节。'}`,
  `【三条可执行】①${ns.kind==='身强'?'主动要位置：身强的人拿不到位置，往往是因为没开口，而不是能力不够。':'先做核心专业者，再谈牵头：身弱时期把「不可替代的一项技能」做深，比争管理岗更划算。'}②${patternHits.some(p=>p.id==='伤官见官')?'所有对上的沟通先写下来再发：这个结构下当场争论几乎必输。':'把每次成果留证据：截图、数据、复盘，一年后这些就是你的定价依据。'}③${patternHits.some(p=>p.id==='比劫夺财')?'合伙可以，但分益、退出、决策权先落纸：本盘破财多来自「朋友开口不好意思拒绝」。':'每年留一笔「不产生回报」的学习预算，长期看这是回报率最高的一项。'}`
 ];

 /* 四、财富模式 */
 const wealthGods=pillars.map(p=>p.tenGod||tenGodOf(dayStem,p.stem)).filter(g=>['正财','偏财'].includes(g));
 const wealthHidden=[];
 for(const p of pillars)for(const h of p.hidden||[])if(['正财','偏财'].includes(h.god))wealthHidden.push(`${p.name}藏${h.stem}`);
 const hasWealth=wealthGods.length>0,hasWealthHidden=wealthHidden.length>0;
 const WEALTH_STORE={木:'未',火:'戌',土:'戌',金:'丑',水:'辰'};
 const wealthEl=ELEM_CONTROL[STEM_ELEM[dayStem]];
 const storeBranch=WEALTH_STORE[wealthEl];
 const storeAt=pillars.filter(p=>p.branch===storeBranch);
 const robCount=godx.n('比肩')+godx.n('劫财');
 const wealth=[
  `【财星在哪】${hasWealth?`天干透${wealthGods.map(g=>`${g}（${godx.where(g)}）`).join('、')}——财是「显」的，赚钱的方式别人看得见，你也更愿意把收入讲出来。`:'天干未透财星。'}${hasWealthHidden?`地支藏${wealthHidden.join('、')}——财是「隐」的：钱在具体的事里，不在名头上，靠自己一件件做出来。`:''}${!hasWealth&&!hasWealthHidden?'本盘财星不显——这不等于没财，而是财富必须由「食伤」或「官印」两条路间接换来：前者靠作品与技术，后者靠名位与资历。':''}`,
  `【身财平衡】${ns.kind==='身强'?'身强能任财：机会来时可以下重注，但仍须留三成安全垫——身强的人亏得起一次，亏不起连续两次。':ns.kind==='身弱'?'身弱财旺反受财累：大额投资、加杠杆、替人担保都必须设上限；本盘的钱应该「由别人替你管一部分」，比如定投、托管、合伙企业，而不是全部自己盯。':'身财相对平衡：能赚也能守，缺点是容易停在「够用就好」，缺少把规模做大的冲动——需要外部目标来推。'}`,
  `【比劫夺财检查】比劫合计 ${robCount.toFixed(1)}（比肩 ${godx.n('比肩')}、劫财 ${godx.n('劫财')}）${robCount>=2?'——已过线：同辈、朋友、合伙人会实际参与你的钱。破财的第一来源不是市场，是「人情开口」。借钱、担保、共同出资三件事，一律先设上限再谈情面。':robCount>=1?'——未过线但需留意：遇到「一起做点事」的邀约时，把分益写清再做，成本很低。':'——比劫轻，钱主要靠自己掌，破财多来自判断失误而非人情，反而好办：建立决策清单即可。'}`,
  `【财库】本盘财星五行为${wealthEl}，其库在「${storeBranch}」${storeAt.length?`——${storeAt.map(p=>p.name+p.branch).join('、')}见库，属「有库可存」的结构：赚到的钱能沉淀成资产，适合买房、长期持有、做复利，而不是高频进出。`:'——四柱不见此库，属于「财来财去」的结构：钱容易停在流水上，不会自动变成资产。对策是强制转化：每笔收入到账即划走固定比例进长期账户，靠制度而不是靠意志力。'}`,
  `【求财路径】${patternHits.some(p=>p.id==='伤官生财')?'本盘成立伤官生财：靠技艺、作品、方案直接换钱，收入弹性来自输出质量。适合把最强的一项技能产品化（课程、咨询、订阅、交付标准明确的接单），不适合长期做纯执行。':hasWealth?'财星为本：走「本分经营」的路线——稳定的客户、清晰的报价、可复购的产品，比追风口更划算。':'财星不显而以官印为主：走「名位换财」——先把职称、执照、行业口碑拿到，收入是名望的副产品，急不得。'}`,
  `【风险与纪律】${ns.kind==='身弱'?'身弱之年的破财多发生在「想翻身」的时候：一次重注、一次担保、一次 all in。给自己定一条硬规矩——单笔投入不超过可支配资产的两成，且必须隔夜再决定。':'身强之年的破财多发生在「太顺」的时候：加杠杆、扩规模、觉得自己判断对了。规矩是——规模每扩一倍，先补一次现金流压力测试。'}${caution?`忌神${caution}当令之年${cautionYears.length?`（未来十年：${cautionYears.join('、')}）`:''}以收账、降杠杆、结清旧账为主，不新开局；${usefulYears.length?`喜用年${usefulYears.join('、')}则是扩规模、谈条件的窗口。`:''}`:''}`
 ];

 /* 五、婚姻与六亲 */
 const dayBranch=pillars[2]?.branch;
 const gender=data.gender==='女'?'女':'男';
 // 配偶星按性别取：男以财为妻、女以官为夫；偏星（偏财/七杀）主偏缘与恋爱期，正星主婚配。
 const spouseMain=gender==='男'?'正财':'正官',spouseSub=gender==='男'?'偏财':'七杀';
 const spouseTou=godx.tou[spouseMain]||[],spouseSubTou=godx.tou[spouseSub]||[];
 const spouseCang=godx.cang[spouseMain]||[],spouseSubCang=godx.cang[spouseSub]||[];
 const spouseGod=spouseMain;
 const dayHidden=(pillars[2]?.hidden||[]).map(h=>`${h.stem}(${h.god})`).join(' ')||'无藏干';
 const dayGod=(pillars[2]?.hidden||[])[0]?.god||tenGodOf(dayStem,pillars[3]?.stem)||'正财';
 const spouseHit=relationWithNatal(dayBranch||'',pillars.slice(0,2));
 const love=[
  `【配偶星】${gender==='男'?'男命以「财」为妻星':'女命以「官」为夫星'}。本盘${spouseMain}${spouseTou.length?`透于${spouseTou.join('、')}`:'未透天干'}${spouseCang.length?`，藏于${spouseCang.join('、')}`:''}；${spouseSub}${spouseSubTou.length?`透于${spouseSubTou.join('、')}`:spouseSubCang.length?`藏于${spouseSubCang.join('、')}`:'亦不显'}。${spouseTou.length?`配偶星透干，感情是「明面的事」：你会主动进入关系，也愿意让别人知道。`:spouseCang.length?`配偶星藏支不透，感情偏「慢热与内敛」：关系多从熟人、同事、长期相处里长出来，不习惯被安排相亲式的推进。`:`配偶星不显，感情的入口不在「遇到谁」，而在「你把自己放进了什么场合」——换圈子比等缘分有效。`}`,
  `【婚姻宫】日支坐${dayBranch||'—'}，藏干${dayHidden}，以${dayGod}取象。婚姻宫决定的是「你在亲密关系里的默认姿态」：${TEN_GOD_DEEP[dayGod]?.love||'以务实与责任相处'}。配偶画像参考${TEN_GOD_DEEP[spouseGod]?.person||'踏实可靠'}——注意这是「你容易遇到并被吸引的类型」，不是「必须找的类型」。`,
  `【宫位互动】${spouseHit.length?spouseHit.map(h=>`${h.type}（涉及${h.pillar}）——${h.type==='六合'||h.type==='三合局'?'关系有黏性，磨合到位就是默契，轻易分不开':h.type==='六冲'?'聚少离多或节奏错位，靠固定沟通机制补位，而不是靠感情浓度硬扛':h.type==='相刑'?'彼此牵制、规矩感重，重要决定留缓冲，别在情绪高点谈条件':h.type==='相害'||h.type==='相破'?'暗耗与误会多，权责与边界宜早讲清，尤其是钱与家人的事':'具体影响不大，按日常节奏相处即可'}`).join('；'):'婚姻宫与年月支无刑冲合害，感情基调平稳——稳定是优势，但容易「不上心」，需要刻意保鲜：固定的共同项目比偶尔的仪式更有效'}。${pillars[3]?.branch&&pillars[3].branch===dayBranch?'另注意：日时同支，中晚年与子女议题会和婚姻议题缠在一起，家庭决策要留出各自空间。':''}`,
  `【应期】${spouseTou.length||spouseCang.length?'配偶星被引动之年（大运流年透出'+spouseMain+'／'+spouseSub+'，或与日支成合、成冲）是感情的实际窗口。':''}婚姻宫逢合（${LIUHE[dayBranch]||'六合'}之类）之年多主定下来、同居、领证；逢冲（${CLASH_MAP[dayBranch]||'对冲'}）之年多主分离、搬迁、关系重组。${(()=>{const merge=aheadYears.filter(y=>y.branch===LIUHE[dayBranch]).map(y=>y.year);const clash=aheadYears.filter(y=>y.branch===CLASH_MAP[dayBranch]).map(y=>y.year);return `未来十年里，合日支的年份为 ${merge.length?merge.join('、'):'无'}，冲日支的年份为 ${clash.length?clash.join('、'):'无'}——这两组年份就是感情最容易发生实际变化的窗口。`;})()}判断时以「大运是否同时引动」为准：只流年引动多为短期波动，大运也引动才是结构性变化。`,
  `【相处建议】${patternHits.some(p=>p.id==='伤官见官')?'本盘伤官见官：言语是最容易伤到亲近人的东西。规矩是「有理也要有礼」——先讲感受，再讲道理，最后讲方案。':ns.kind==='身强'?'身强者在关系里容易替对方做决定。把「我帮你安排好了」换成「你想怎么安排」，关系会松一大截。':'身弱者在关系里容易委屈自己成全对方。练习把需求说出口——不说，对方不会猜，只会按自己的方式对你好。'}${godx.n('劫财')>=1.5?'另：劫财不轻，金钱界限要早立（谁付、怎么分、借不借），这是本盘感情里最常见的摩擦点。':''}`,
  `【六亲取象】年柱${pillars[0]?.stem||''}${pillars[0]?.branch||''}（${pillars[0]?.tenGod||'—'}）看祖上与早年根基；月柱${pillars[1]?.stem||''}${pillars[1]?.branch||''}（${pillars[1]?.tenGod||'—'}）看父母与同辈；时柱${pillars[3]?.stem||''}${pillars[3]?.branch||''}（${pillars[3]?.tenGod||'—'}）看子女与晚运${pillars[3]?.unknown?'（时辰未知，子女晚运不参断）':''}。四柱十神即「你在这些关系里被期待的角色」，与本人的性格是两回事，别混为一谈。`
 ];

 /* 六、健康 */
 const weights=ns.weights||{};
 const wEntries=Object.entries(weights).sort((a,b)=>b[1]-a[1]);
 const heaviest=wEntries[0]?.[0]||'土';
 const lightest=wEntries[wEntries.length-1]?.[0]||'水';
 const missingEls=['木','火','土','金','水'].filter(e=>!(Number(weights[e])>0));
 const weakest=missingEls[0]||lightest;
 const ORGANS={木:'肝胆、筋络、眼',火:'心与小肠、血液循环、睡眠',土:'脾胃、消化、肌肉',金:'肺与大肠、呼吸道、皮肤',水:'肾与膀胱、内分泌、腰膝'};
 const horizon=data.trend?.years||[];
 const worstYear=horizon.map(y=>({y:y.year,s:Number(y.support)}))
  .filter(x=>Number.isFinite(x.s)&&x.y>=nowYear&&x.y<=nowYear+10).sort((a,b)=>a.s-b.s)[0];
 const clashDayYears=(data.years||[]).filter(y=>y.year>=nowYear&&relationWithNatal(y.branch,pillars).some(h=>h.type==='六冲'&&h.pillar==='日柱')).map(y=>y.year).slice(0,4);
 const health=[
  `【五行量化】${wEntries.map(([e,v])=>`${e} ${Number(v).toFixed(1)}`).join(' · ')}（按月令、通根、透干加权后的相对值，不是百分比）。${missingEls.length?`本盘${missingEls.join('、')}气全无——不是「缺了就要补」，而是这一路的调节能力偏弱，遇事时最容易从这里先垮。`:'五行俱全，调节能力完整——问题不在缺，而在配比。'}`,
  `【最弱一环】${weakest}气最弱（${Number(weights[weakest]||0).toFixed(1)}），对应${ORGANS[weakest]}。${HEALTH[weakest]}。现实表现多半不是「生病」，而是长期的小信号：${({木:'情绪压着不说、肩颈发紧、眼睛干涩',火:'手脚偏凉、睡眠浅、容易心慌',土:'吃一点就胀、大便不成形、容易疲乏',金:'换季必咳、皮肤干痒、鼻炎反复',水:'腰酸、怕冷、夜里起夜、耳鸣'})[weakest]}。这些信号持续两周以上就该查，而不是扛。`,
  `【最旺一环】${heaviest}气最重（${Number(weights[heaviest]||0).toFixed(1)}），对应${ORGANS[heaviest]}——这一路的气偏盛，功能容易「过度运转」。过旺不是好事：${({木:'木旺易克土，脾胃先受牵连，情绪也容易顶在那儿下不来',火:'火旺易耗水，注意血压、心率与失眠，忌熬夜与辛辣',土:'土旺易壅滞，代谢与体重是长期课题，忌久坐与甜腻',金:'金旺易克木，肝胆与情绪易紧，忌长期压抑',水:'水旺易克火，循环偏弱、易水肿，忌贪凉'})[heaviest]}。`,
  `【调候】月令${pillars[1]?.branch||'—'}：${TIAOHOU[pillars[1]?.branch||'子']}。${pillars[1]?.branch&&'亥子丑'.includes(pillars[1].branch)?'生于冬令，寒是第一病根：保暖、温热饮食、晒太阳，比任何补品都直接。':pillars[1]?.branch&&'巳午未'.includes(pillars[1].branch)?'生于夏令，燥热是第一病根：补水、少辛辣、避免正午暴晒与情绪过热。':'生于春秋，寒燥交替，重点在「随季节换策略」，而不是一套习惯用全年。'}`,
  `【需要留意的时段】${worstYear?`未来十年中扶助度最低的是 ${worstYear.y} 年（${worstYear.s.toFixed(1)}%），这一年忌神当令，作息与复查放在第一位，别在该体检的年份拼项目。`:''}${clashDayYears.length?`日柱被冲的年份为 ${clashDayYears.join('、')}——日柱主自身与身体，这些年份的劳损会集中显形，提前安排体检与休整。`:'未来十年无流年直冲日柱，身体的压力更多来自积累而非突发。'}`,
  `【三条日常】①${weakest==='水'?'护肾与睡眠是主线：固定入睡时间比补品有效，少熬夜是唯一的硬指标。':weakest==='木'?'疏肝是主线：每周三次能出汗的运动，加上一个固定的情绪出口。':weakest==='火'?'养心是主线：有氧加规律作息，避免长期情绪高压。':weakest==='土'?'养脾胃是主线：定时吃饭、七分饱、少生冷。':'养肺是主线：呼吸训练、空气质量、换季提前防护。'}②按调候调整环境（温度、湿度、饮食寒热），这比吃什么都重要。③本节是传统文化象意，不作诊断——明显不适应及时就医，别用命理替代检查。`
 ];

 /* 七、神煞详解 */
 const shenshaLines=[];
 for(const p of pillars){
  for(const s of p.shensha||[]){
   const info=SHENSHA_DEEP[s]||SHENSHA_MORE[s]||{gloss:'传统神煞，按所列口径查得',inPillar:'落在哪柱便侧重观察该柱所主的人事。'};
   shenshaLines.push(`「${G(s)}」落于${p.name}${p.stem}${p.branch}：${info.gloss}。${info.inPillar}`);
  }
 }
 if((data.voidBranches||[]).length){
  shenshaLines.push(`「${G('空亡')}」：${SHENSHA_DEEP.空亡.gloss}。本命空亡为${data.voidBranches.join('、')}——落在哪柱，那一柱的人事早年多靠自力。`);
 }
 if(data.shenshaMethod)shenshaLines.push(`查法口径：${data.shenshaMethod}`);
 const shenshaSec=shenshaLines.length?shenshaLines:['本命四柱未检出所列常用吉凶神煞——神煞是锦上添花的细断，无神煞不碍格局大局。'];

 /* 八、大运逐运详批 */
 const cycles=data.cycles||[],trend=data.trend;
 const cycleLines=cycles.map(c=>{
  const god=c.tenGod||tenGodOf(dayStem,c.stem);
  const hits=relationWithNatal(c.branch,pillars);
  const support=trend?.cycles?.find(x=>x.index===c.index)?.support;
  const delta=support!=null?support-Number(ns.support??50):null;
  const t=periodTenor(god,ns,dayStem,c.branch,delta);
  const groups=groupRelations(hits,t.br);
  const rel=hits.length?groups.map(g=>`${g.label}——${g.text}`).join('；'):'与原局无明显刑冲合害，主题按本运节奏平稳发挥';
  // 八步大运一并列出，但必须标清哪一步是现在——否则读者要自己数年份。
  const stage=c.startYear>nowYear?'未来':c.startYear+9<nowYear?'已过':'当前';
  const stageTag=stage==='当前'?` · <em class="rpt-stage rpt-stage-now">当前</em>`:stage==='已过'?` · <em class="rpt-stage">已过</em>`:'';
  return `<li><b>第${(c.index??0)+1}步 · ${c.age?`虚岁 ${c.age}–${c.age+9} · `:''}${c.startYear?c.startYear+'–'+(c.startYear+9)+' · ':''}${c.stem}${c.branch}（${G(god)}）${stageTag}</b><span><b>${endDot(t.head)}</b>事业：${endDot(t.career)}财运：${endDot(t.wealth)}感情：${endDot(t.love)}健康：${endDot(t.health)}${t.trend}${rel}。</span></li>`;
 }).join('');
 const cycleSec=cycleLines?`<ul class="rpt-list">${cycleLines}</ul>`:'大运数据待排盘后生成——在排盘页选择任意一步大运，本报告会随盘面同步更新。';

 /* 九、流年逐年详批 */
 // 旧实现直接铺 data.years（从出生那年起全生命周期），标题却写「未来十年」——
 // 结果是一岁婴儿的「宜演讲、设计、自媒体」占了整整一章，真正要用的年份被压到后面。
 const allYears=data.years||[];
 const years=allYears.filter(y=>y.year>=nowYear).slice(0,10);
 const yearList=years.length?years:allYears.slice(0,10);
 const yearLines=yearList.map(y=>{
  const god=y.tenGod||tenGodOf(dayStem,y.stem);
  const hits=relationWithNatal(y.branch,pillars);
  const support=trend?.years?.find(x=>x.year===y.year)?.support;
  const delta=support!=null?support-Number(ns.support??50):null;
  const t=periodTenor(god,ns,dayStem,y.branch,delta);
  const groups=groupRelations(hits,t.br);
  const clashText=groups.map(g=>g.label).join('、');
  // ●／▲／○ 紧跟在「·」后面会被读成「两个点」；语气改成带色标签，层级也更清楚
 const tone=delta==null?null:delta>3?['up','顺年']:delta<-3?['down','慎年']:['flat','平年'];
  return `<li><b>${y.year}（${y.age??''}岁）${y.stem}${y.branch} · ${G(god)}${tone?` · <em class="rpt-tone" data-t="${tone[0]}">${tone[1]}</em>`:''}</b><span><b>${endDot(t.head)}</b>事业：${endDot(t.career)}财：${endDot(t.wealth)}感情：${endDot(t.love)}健康：${endDot(t.health)}${t.trend}${clashText?`与原局${clashText}——${groups.map(g=>g.text).join('；')}。`:'与原局无明显刑冲合害，按下列动作推进。'}</span></li>`;
 }).join('');
 const yearSec=yearLines?`<p class="rpt-lede">以下从 ${yearList[0]?.year||nowYear} 年起，逐年给出 ${yearList.length} 年（虚岁见括号）。已过的年份不再列出——回看旧年对决策没有帮助。</p><ul class="rpt-list rpt-years">${yearLines}</ul>`:'流年数据待排盘后生成。';

 /* 十、流月逐月详批 + 趋吉避凶 */
 const months=data.months||[];
 const monthLines=months.map(m=>{
  const god=m.tenGod||tenGodOf(dayStem,m.stem)||'正官';
  const hits=relationWithNatal(m.branch,pillars);
  const t=periodTenor(god,ns,dayStem,m.branch,null);
  const hitText=hits.length?hits.map(h=>relPhrase(h,t.br)).join('；'):'与原局无明显刑冲合害——依下列动作推进即可';
  const clashYear=m.branch===CLASH_MAP[pillars[1]?.branch||'']?'；【冲提纲】此月动摇月令根基，大决策建议顺延':'';
  return `<li><b>${m.label||m.stem+m.branch} · ${m.stem}${m.branch} · ${G(god)}</b><span><b>${endDot(t.head)}</b>事业：${endDot(t.career)}财：${endDot(t.wealth)}感情：${endDot(t.love)}${hitText}${clashYear}。</span></li>`;
 }).join('');
 const monthSec=monthLines?`<ul class="rpt-list rpt-months">${monthLines}</ul>`:'';

/* 十一、流日与流时：把「择时」落到具体日子与两小时 */
const HOUR_USE={
 正官:'见上级、递材料、把规矩定下来',七杀:'处理硬仗、做决断、拆难题',
 正财:'谈薪报价、收款、签长约',偏财:'谈合作、拓客、跑外勤',
 食神:'创作、试菜、陪家人、慢工出细活',伤官:'提案、演讲、写东西、亮作品',
 正印:'学习、考证、读合同、静养',偏印:'研究、复盘、独处、钻冷门',
 比肩:'协作、健身、同行交流',劫财:'竞技、抢时机——但别在这时候谈钱'
};
const days=data.days||[],hours=data.hours||[];
const dayFocus=days.map(d=>{
 const hits=relationWithNatal(d.branch,pillars);
 const god=d.tenGod||tenGodOf(dayStem,d.stem);
 const clash=hits.filter(h=>h.type==='六冲'),merge=hits.filter(h=>h.type!=='六冲');
 const clashDay=clash.some(h=>h.pillar==='日柱'),clashMonth=clash.some(h=>h.pillar==='月柱');
 return {...d,god,clash,merge,clashDay,clashMonth,
  score:(clashDay?3:0)+(clashMonth?2:0)+clash.length+(merge.some(h=>h.pillar==='日柱')?1.5:0)};
}).filter(d=>d.clash.length||d.merge.length).sort((a,b)=>b.score-a.score);
const dayFocusTop=dayFocus.slice(0,6).sort((a,b)=>(a.date||'').localeCompare(b.date||''));
// v0.41.0 图像化栏目：把「日期/干支/十神/与原局」长表改造成可横滑的流日卡片条。
// 每卡：干支大字（带五行色）+ 十神徽章 + 与原局关系色签（冲=红/合=绿/刑害=橙）+ 重点日角标，
// 信息量与表格一致，但像四柱盘面一样一眼可读，不再是一长串看不懂的字。
const REL_TONE={六冲:'clash',六合:'merge',三合局:'merge',相刑:'warn',相害:'warn',相破:'warn'};
const dayCards=days.length?`<div class="rpt-day-cards" role="list" aria-label="流日干支卡片">${days.map(d=>{
 const hits=relationWithNatal(d.branch,pillars);
 const god=d.tenGod||tenGodOf(dayStem,d.stem)||'—';
 const se=STEM_ELEM[d.stem]||'',be=BRANCH_ELEM_MAP[d.branch]||'';
 const badges=hits.map(h=>{const tone=REL_TONE[h.type]||'warn';return `<span class="rday-rel ${tone}">${h.type}${h.pillar||''}</span>`;}).join('');
 const key=hits.some(h=>h.type==='六冲'&&(h.pillar==='日柱'||h.pillar==='月柱'));
 return `<div class="rday-card${key?' key':''}" role="listitem" data-e="${se}">
  <div class="rday-top"><span class="rday-date">${(d.date||'').slice(5)}</span>${key?'<span class="rday-flag">重点</span>':''}</div>
  <div class="rday-gz"><b data-e="${se}">${d.stem}</b><b data-e="${be}">${d.branch}</b></div>
  <div class="rday-god">${G(god)}</div>
  <div class="rday-rels">${badges||'<span class="rday-rel calm">平</span>'}</div>
 </div>`;
}).join('')}</div>`:'';
const hourCards=hours.length?`<div class="rpt-hour-cards" role="list" aria-label="十二时辰卡片">${hours.map((h,i)=>{
 const god=h.tenGod||tenGodOf(dayStem,h.stem);
 const clash=relationWithNatal(h.branch,pillars).some(x=>x.type==='六冲');
 const se=STEM_ELEM[h.stem]||'';
 return `<div class="rhour-card${clash?' clash':''}" role="listitem" data-e="${se}">
  <div class="rhour-label">${h.label||'—'}<small>${h.clock||''}</small></div>
  <div class="rhour-gz"><b data-e="${se}">${h.stem}</b><b data-e="${BRANCH_ELEM_MAP[h.branch]||''}">${h.branch}</b></div>
  <div class="rhour-god">${G(god||'正官')}</div>
  <div class="rhour-use">${clash?'冲原局·忌硬推':(HOUR_USE[god]||'按当日主题推进')}</div>
 </div>`;
}).join('')}</div>`:'';
const daySec=days.length?[
 `流日是把「择时」落到天：日干十神定当天的做事手感，日支与原局的冲合刑害定当天的剧情起伏。以下为所选流月内的全部日子。`,
 ...(dayFocusTop.length?[`【重点日】${dayFocusTop.map(d=>{
  const bits=[];
  if(d.clash.length){
   const names=d.clash.map(h=>h.pillar==='月柱'?'月柱（提纲）':h.pillar).join('、');
   bits.push(d.clashDay?`冲${names}——变动最明显的一天，签约、手术、远行尤忌`
    :d.clashMonth?`冲${names}——整月节奏在此前后转折，别把定案压在这天`
    :`冲${names}——易有变动与返工，关键事留缓冲`);
  }
  if(d.merge.length){
   // merge 里既有六合、三合局，也有刑害破（只是非六冲），逐条拼 pillar 会读出「合日柱、寅巳申、寅、申」这种乱码。
   const mg=groupRelations(d.merge,'useful');
   bits.push(mg.map(g=>`${g.label}——${g.text}`).join('；'));
  }
  return `${(d.date||'').slice(5)}（${d.stem}${d.branch}·${G(d.god)}）${bits.join('；')}`;
 }).join('。')}。`]:['所选流月内，流日与原局无强刑冲——这个月的日子比较平均，按计划推进即可，不必刻意挑日。']),
 `挑日原则：大事（签约、面试、手术、搬家）避开冲日柱、冲用神之日；日常沟通与协作，选合日更省力。流时用于把一天之内的事排进对的时段。`
]:[];
const hourSec=hours.length?[
 `流时以两小时为一个时辰，时干由当日日干按五鼠遁推出。同样的日子，挑对时辰做事，阻力会小一档。`,
 `用法：把一天里最难的那件事，放进「十神对口且不冲原局」的时辰；把纯执行的杂事，放进冲时——反正都要做，不如放在阻力本来就大的时段。`
]:[];
// 卡片栏目必须走 html 字段：lines 在渲染时会被转义，塞进去只会显示成标签字面量。
const dayHourHtml=`${dayCards?`<div class="rday-sec"><p class="rday-sec-t">所选流月 · 流日一览（横滑查看，红=冲、绿=合、橙=刑害）</p>${dayCards}</div>`:''}${hourCards?`<div class="rday-sec"><p class="rday-sec-t">当日 · 十二时辰（择时卡片）</p>${hourCards}</div>`:''}`;

 const monthWindows=data.guidance?.monthWindows||[];
 // 总则章常被写成三句口号。这里改成「什么时候做什么、什么时候不做什么」的分组清单，
 // 每条都挂具体的年份或月份，读者能直接对照日历执行。
 const strongYears=usefulYears.slice(0,6),weakYears=cautionYears.slice(0,6);
 const advice=[
  `【一句话总则】${ns.kind==='身强'?'把力气用在事上，别用在证明自己上；忌神年收，喜用年放。':'把底气建在可复用的东西上，别建在别人的评价上；忌神年守，喜用年借势推进。'}本命喜用${useful||'中和'}、忌${caution||'不单列'}，这条总则不会因为换工作或换城市而改变——变的是场景，不变的是「往哪个方向使力」。`,
  `【进攻窗口】${strongYears.length?`未来十年天干为喜用（${useful}）的年份：${strongYears.join('、')}。`:'未来十年天干未见喜用之年，进攻窗口主要落在喜用月份与喜用大运。'}这些年份适合做「不可逆」的事：签约、跳槽、立项、结婚、买房。判断标准很简单——失败后能不能撤回；不能撤回的，就放到这些年份。${monthWindows.length?`近段干支引动最强的月份为 ${monthWindows.map(m=>`${m.label}（${(m.links||[]).join('、')}）`).join('、')}，值得提前排期。`:''}`,
  `【防守窗口】${weakYears.length?`天干为忌（${caution}）的年份：${weakYears.join('、')}。`:'未来十年天干未见忌神之年，防守主要看地支冲刑。'}在这些年份把动作换成「可逆」的：试水、学习、维护关系、结清旧账。不是不能做事，是不做押上全部的那种事。${(data.trend?.years||[]).map(y=>({y:y.year,s:Number(y.support)})).filter(x=>Number.isFinite(x.s)&&x.y>=nowYear&&x.y<=nowYear+10).sort((a,b)=>a.s-b.s)[0]?`其中最吃力的是 ${(data.trend.years).map(y=>({y:y.year,s:Number(y.support)})).filter(x=>Number.isFinite(x.s)&&x.y>=nowYear&&x.y<=nowYear+10).sort((a,b)=>a.s-b.s)[0].y} 年，把它当成「年度体检 + 降杠杆」的固定动作年。`:''}`,
  `【三条禁忌】①${G('劫财')}透干之年（${(data.years||[]).filter(y=>y.year>=nowYear&&y.year<=nowYear+10&&(y.tenGod||tenGodOf(dayStem,y.stem))==='劫财').map(y=>y.year).join('、')||'本段无'}）不替人担保、不共同出资；②冲提纲（${CLASH_MAP[pillars[1]?.branch||'']||'—'}）之年不换赛道，只优化现有的事；③日柱被冲之年（${clashDayYears.join('、')||'本段无'}）不做重大手术式的人生改动，先稳住睡眠与节奏。`,
  `【每年固定四件事】①年初只定一件「必须做成」的事，其余都算加分项；②每季清一次账，把「应收、应付、担保」三类分开看；③每年查一次最弱五行对应的脏腑（本盘为${weakest}·${ORGANS[weakest]}）；④年末复盘一条今年验证有效、一条验证无效的判断——这是唯一能让「命理参考」变成「自己的经验」的动作。`,
  `【怎么用这份报告】把它当决策清单，不当结论：先看第三章的十神组合，那是最容易反复踩的坑；再看第四章的发力期，决定什么时候加压；具体到某个月某一天，用第十二章或择日页。凡是本报告没给证据的句子，都可以不信。`,
  `【边界】本报告由命盘证据逐条推导：格局取月令透干、断语随十神与刑冲合害触发、年份由干支与喜忌对应，术语白话见下节词典。传统术数供文化与自我观察参考，不构成事实预测、投资或医疗建议；重大决定请以现实信息为准。`
 ];

const sections=[
 {title:'一、命局总览与格局',lines:overview,table:pillarTable},
 {title:'二、命局根基：三垣与四柱力量来源',lines:strengthSec,table:tripleTable},
 {title:'三、性格与天赋',lines:personality},
 {title:'四、事业方向',lines:career},
 {title:'五、财富模式',lines:wealth},
 {title:'六、婚姻与六亲',lines:love},
 {title:'七、健康与调候',lines:health},
 {title:'八、神煞详解',lines:shenshaSec},
 {title:'九、大运逐运详批（每步十年）',lines:[],list:cycles.length?undefined:undefined,html:cycles.length?cycleSec:undefined},
 {title:'十、流年逐年详批（未来十年）',lines:[],html:years.length?yearSec:undefined},
 {title:'十一、流月逐月详批（所选流年十二个月）',lines:months.length?[
  `流月以节气为界换月（立春起寅月）。下表逐月给出：月干支对日主的十神（当月主气质）、月支五行对喜忌的顺逆（环境风力）、与原局四柱的刑冲合害破（剧情走向）。`,
  `用法：合月签约合作、冲月防守缓冲、喜用月推进要事、忌神月收尾复盘——把一年的大事排进对的月份，就是「择时而动」。`
 ]:[],html:months.length?monthSec:undefined},
 {title:'十二、流日与流时（择时落到日与时）',lines:daySec.length||hourSec.length?[...daySec,...hourSec]:['在排盘页选到具体流月后，此处将逐日列出流日干支与原局的冲合，并给出十二时辰的宜忌。'],html:dayHourHtml||undefined},
 {title:'十三、趋吉避凶总则',lines:advice}
];
 const glossary={...gloss};
 return {title:'八字命理 · 终身详批',sections,glossary,gege:gege.name,kind:'bazi'};
}
