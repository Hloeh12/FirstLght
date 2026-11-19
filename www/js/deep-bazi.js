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
  wealth:gr==='caution'?`${deep.wealth}——本段忌神当令，只做已验证的现金流，不扩新战线。`:gr==='useful'?`${deep.wealth}——喜用得力，可把已验证的模式加密投入。`:`${deep.wealth}——维持既有结构，等干支引出明确信号再加码。`,
  love:br==='caution'?`${deep.love}——地支偏耗，关系里少讲道理、多讲安排。`:`${deep.love}${gr==='useful'?'；本段主动经营，关系容易有实质推进。':''}`,
  health:br==='caution'?`${deep.health}；本段地支为忌，作息与复查先行。`:deep.health};
}
function relPhrase(h,role){
 const who=`${h.pillar||h.branch||''}`;
 switch(h.type){
  case '六冲':return role==='caution'?'冲去忌神，旧阻松动，反而是变局之年':role==='useful'?'冲用神，根基有摇动，凡事留退路':'冲动平和之位，变动中性，重在适应';
  case '六合':return `与${who}相合——聚力，人缘合作可借`;
  case '三合局':return `与${who}成三合局——同气汇聚，做大事有助力`;
  case '相刑':return `${h.detail||'相刑'}——彼此牵制、内耗或规矩约束，重要决定留缓冲`;
  case '相害':return `${h.detail||'相害'}——暗耗与误会，合作宜把权责写清`;
  case '相破':return `${h.detail||'相破'}——计划易松脱，关键环节备一手`;
  default:return `${h.type}（${who}）`;
 }
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
  `婚姻宫与年月支的互动：${spouseHit.length?spouseHit.map(h=>`${h.type}（涉及${h.pillar}），${h.type==='六合'||h.type==='三合局'?'关系有黏性，磨合即默契':h.type==='六冲'?'聚少离多或节奏错位，靠沟通补位':'暗耗与牵制并存，权责与边界宜早讲清'}`).join('；'):'未见刑冲合害，感情以稳为主，贵在主动保鲜'}。`,
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
  const rel=hits.length?hits.map(h=>relPhrase(h,t.br)).join('；'):'与原局无明显刑冲合害，主题按本运节奏平稳发挥';
  return `<li><b>第${(c.index??0)+1}步 · ${c.age?`虚岁 ${c.age}–${c.age+9} · `:''}${c.startYear?c.startYear+'–'+(c.startYear+9)+' · ':''}${c.stem}${c.branch}（${G(god)}）</b><span><b>${t.head}</b>。事业：${t.career}财运：${t.wealth}感情：${t.love}健康：${t.health}。${t.trend}${rel}。</span></li>`;
 }).join('');
 const cycleSec=cycleLines?`<ul class="rpt-list">${cycleLines}</ul>`:'大运数据待排盘后生成——在排盘页选择任意一步大运，本报告会随盘面同步更新。';

 /* 九、流年逐年详批 */
 const years=data.years||[];
 const yearLines=years.map(y=>{
  const god=y.tenGod||tenGodOf(dayStem,y.stem);
  const hits=relationWithNatal(y.branch,pillars);
  const support=trend?.years?.find(x=>x.year===y.year)?.support;
  const delta=support!=null?support-Number(ns.support??50):null;
  const t=periodTenor(god,ns,dayStem,y.branch,delta);
  const clashText=hits.map(h=>({六冲:'冲',六合:'合',三合局:'三合',相刑:'刑',相害:'害',相破:'破'})[h.type]||h.type).join('、');
  const tone=delta==null?'':delta>3?'● 顺年':delta<-3?'▲ 慎年':'○ 平年';
  return `<li><b>${y.year}（${y.age??''}岁）${y.stem}${y.branch} · ${G(god)}${tone}</b><span><b>${t.head}</b>。事业：${t.career}财：${t.wealth}感情：${t.love}健康：${t.health}。${t.trend}${clashText?`与原局${clashText}——${hits.map(h=>relPhrase(h,t.br)).join('；')}。`:'与原局无明显刑冲合害，按下列动作推进。'}</span></li>`;
 }).join('');
 const yearSec=yearLines?`<ul class="rpt-list rpt-years">${yearLines}</ul>`:'流年数据待排盘后生成。';

 /* 十、流月逐月详批 + 趋吉避凶 */
 const months=data.months||[];
 const monthLines=months.map(m=>{
  const god=m.tenGod||tenGodOf(dayStem,m.stem)||'正官';
  const hits=relationWithNatal(m.branch,pillars);
  const t=periodTenor(god,ns,dayStem,m.branch,null);
  const hitText=hits.length?hits.map(h=>relPhrase(h,t.br)).join('；'):'与原局无明显刑冲合害——依下列动作推进即可';
  const clashYear=m.branch===CLASH_MAP[pillars[1]?.branch||'']?'；【冲提纲】此月动摇月令根基，大决策建议顺延':'';
  return `<li><b>${m.label||m.stem+m.branch} · ${m.stem}${m.branch} · ${G(god)}</b><span><b>${t.head}</b>。事业：${t.career}财：${t.wealth}感情：${t.love}。${hitText}${clashYear}。</span></li>`;
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
const dayTable=days.length?`<table class="rpt-table rpt-days"><thead><tr><th>日期</th><th>干支</th><th>十神</th><th>与原局</th></tr></thead><tbody>${days.map(d=>{
 const hits=relationWithNatal(d.branch,pillars);
 return `<tr><td>${(d.date||'').slice(5)}</td><td>${d.stem}${d.branch}</td><td>${d.tenGod||tenGodOf(dayStem,d.stem)||'—'}</td><td>${hits.map(h=>h.type+h.pillar).join('、')||'—'}</td></tr>`;
}).join('')}</tbody></table>`:'';
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
  if(d.merge.length)bits.push(`合${d.merge.map(h=>h.pillar).join('、')}——人缘顺，适合约人谈事`);
  return `${(d.date||'').slice(5)}（${d.stem}${d.branch}·${G(d.god)}）${bits.join('；')}`;
 }).join('。')}。`]:['所选流月内，流日与原局无强刑冲——这个月的日子比较平均，按计划推进即可，不必刻意挑日。']),
 `挑日原则：大事（签约、面试、手术、搬家）避开冲日柱、冲用神之日；日常沟通与协作，选合日更省力。流时用于把一天之内的事排进对的时段。`
]:[];
const hourSec=hours.length?[
 `流时以两小时为一个时辰，时干由当日日干按五鼠遁推出。同样的日子，挑对时辰做事，阻力会小一档。`,
 `用法：把一天里最难的那件事，放进「十神对口且不冲原局」的时辰；把纯执行的杂事，放进冲时——反正都要做，不如放在阻力本来就大的时段。`
]:[];
// 表格必须走 html 字段：lines 在渲染时会被转义，塞进去只会显示成标签字面量。
const hourTable=hours.length?`<table class="rpt-table rpt-hours"><thead><tr><th>时辰</th><th>干支</th><th>十神</th><th>宜</th></tr></thead><tbody>${hours.map((h,i)=>{
 const god=h.tenGod||tenGodOf(dayStem,h.stem);
 const clash=relationWithNatal(h.branch,pillars).some(x=>x.type==='六冲');
 return `<tr${i===Math.floor(((new Date().getHours()+1)%24)/2)?' class="rpt-now"':''}><td>${h.label||'—'}<br><small>${h.clock||''}</small></td><td>${h.stem}${h.branch}</td><td>${G(god||'正官')}</td><td>${HOUR_USE[god]||'按当日主题推进'}${clash?'；<b>此时辰冲原局，忌硬推</b>':''}</td></tr>`;
}).join('')}</tbody></table>`:'';
const dayHourHtml=`${dayTable||''}${hourTable||''}`;

 const monthWindows=data.guidance?.monthWindows||[];
 const advice=[
  `流月层面：以节气为界换月，每月干支与原局的刑冲合害决定该月节奏。${monthWindows.length?`近段干支引动最强的月份为 ${monthWindows.map(m=>`${m.label}（${(m.links||[]).join('、')}）`).join('、')}——这些月份适合提前安排要事。`:'在排盘页时间轴选到具体年份后，逐月提示会同步到流月轨道。'}`,
  `趋吉总则：喜用${useful||'中和'}当令之年进取，忌神${caution||'不单列'}当令之年守成；大事避开婚姻宫、用神被冲之月。`,
  `避凶总则：${caution?`「${caution}」相关的行业与决策，在忌神年份降杠杆；`:''}${G('劫财')}透干之年不替人担保、合伙先写清分益；身弱之年少熬夜、大决策推迟到顺年。`,
  `本报告由命盘证据逐条推导（格局取月令透干、断语随十神与刑冲合害触发），术语白话见下节词典。传统术数供文化与自我观察参考，不构成事实预测、投资或医疗建议。`
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
