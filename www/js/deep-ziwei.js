// 紫微斗数深度知识库：面向「文墨天机 / 测测」级别的详批。
// 十二宫逐宫详解、大限逐限详批、四化×落宫指向性事件——全部由当前盘面星曜证据驱动。
const GLOSS={};
const STAR_CORE={
 紫微:{gloss:'帝座，统御与尊贵',person:'天生的气场与格局感，重体面与主导权',career:'宜统筹、决策、管理层——越大的平台越显价值',wealth:'以地位带财，财随名至',love:'要敬重式的关系，伴侣须给足认可',risk:'耳根软听捧场话，易被近侍之人影响'},
 天机:{gloss:'智多星，谋略与机变',person:'脑子转得快，好学善析，心思细腻',career:'宜策划、参谋、研究、技术、咨询',wealth:'以智生财，脑力变现',love:'感情里想太多，易自己加戏',risk:'思虑过度、神经紧张，聪明反被聪明误'},
 太阳:{gloss:'光明之主，博爱与名望',person:'热心外放，讲公平，天生想照亮别人',career:'宜公职、管理、传媒、教育、公开露面行业',wealth:'名先于利，财在名声之后',love:'付出型伴侣，但容易忽略自己',risk:'锋芒外露招妒，操劳伤目与心'},
 武曲:{gloss:'财星，刚毅与执行',person:'直来直去，重承诺，行动力极强',career:'宜金融、工程、外科、军警、实业',wealth:'正财星入财帛/田宅为最强配置，善守善攻',love:'不解风情，重实际付出',risk:'过刚易折，固执听不进劝'},
 天同:{gloss:'福星，安逸与治愈',person:'随和乐观，孩子气，福相',career:'宜服务业、疗愈、文教、后勤闲职',wealth:'衣食无忧型，不缺小钱难聚大富',love:'情绪稳定型伴侣，会享受生活',risk:'惰性重，小富即安，抗压弱'},
 廉贞:{gloss:'次桃花，原则与风情',person:'外冷内热，讲原则又懂浪漫',career:'宜政法、纪检、公关、设计、演艺',wealth:'以专业与人脉生财',love:'吸引力强但感情路多转折',risk:'情绪两极，囚星入命防一念之差'},
 天府:{gloss:'库星，厚重与守成',person:'稳重包容，天生的理财管家',career:'宜管理、金融、后勤总管、大机构',wealth:'库星主积聚，越老越有钱',love:'稳重型伴侣，家庭感强',risk:'守成有余开创不足，易安于现状'},
 太阴:{gloss:'月主，细腻与积蓄',person:'温柔敏感，审美佳，夜型人',career:'宜文创、房产、财务、医护、女性行业',wealth:'细水长流式积财，田宅主星',love:'体贴入微型伴侣',risk:'多愁善感，优柔'},
 贪狼:{gloss:'桃花才艺星，欲望与交际',person:'多才多艺、社交高手、好奇心重',career:'宜业务、公关、娱乐、教培、命理玄学',wealth:'人脉即财源，应酬中见机会',love:'桃花重，晚婚为宜',risk:'欲望难节制，应酬耗身'},
 巨门:{gloss:'暗曜，口舌与研究',person:'口才锋利，善质疑，研究型人格',career:'宜律师、教师、主播、医师、心理',wealth:'以口与专业立业，靠真本事',love:'口舌是非是感情头号课题',risk:'多疑善辩，祸从口出'},
 天相:{gloss:'印星，辅佐与公正',person:'气质端方，天生的二把手',career:'宜幕僚、法务、HR、公职、品牌管理',wealth:'稳定薪禄，衣食型财富',love:'重视门当户对与名分',risk:'过于方正，易被人当枪使'},
 天梁:{gloss:'荫星，庇护与寿德',person:'老成持重，爱管闲事的大哥大姐',career:'宜医药、保险、公益、监察、教育',wealth:'先荫后财，稳中有余',love:'照顾型伴侣，易把对方当孩子',risk:'说教气重，倚老卖老'},
 七杀:{gloss:'将星，肃杀与开创',person:'狠劲与魄力，敢冲敢当，孤独的强者',career:'宜开拓、竞技、创业、军警、手术',wealth:'险中求财，大开大合',love:'聚少离多式感情，需要独立空间',risk:'刚暴冲动，防意外与树敌'},
 破军:{gloss:'耗星，破旧与立新',person:'天生的破局者，人生不走寻常路',career:'宜创新、变革、海外、先破后立行业',wealth:'先破后聚，晚发之财',love:'感情多巨变重组，宜晚婚',risk:'破坏性强，人生起伏剧烈'}
};
/* 14 主星 × 关键宫位专断：文墨天机式「星曜坐宫」的具体断法。
   未列宫位回退到 STAR_CORE 通用文案，并明示「以星性×宫性参断」，不臆造专条。 */
const STAR_PALACE={
 紫微:{命宫:'帝星坐命，气度自成一格，宜掌权担纲、走管理或专业牵头路线；须防刚愎、好听奉承。',夫妻:'配偶多要强体面，婚姻重名分与尊重；宜找能独当一面又给足面子的人，忌两强争锋。',官禄:'适合在大机构、平台型组织担要职，越大的舞台越能显其统筹之才。',财帛:'财随名至，靠地位与资源调度生财，非锱铢必较型；忌为面子大意花钱。',迁移:'外出有贵人、见大局，越走动越能打开格局，宜向外发展。'},
 天机:{命宫:'机敏善谋、思虑深，宜策划参谋与技术咨询；须防想太多、反复变动。',夫妻:'伴侣聪慧善变，感情里易「想太多自己加戏」，沟通要直白别猜。',官禄:'宜参谋、企划、研发、顾问等动脑岗位，适合作军师不当一线莽夫。',财帛:'以智生财、脑力变现，财源随点子与专业判断而来，忌跟风投机。',疾厄:'注意神经紧绷、睡眠与消化，宜规律作息、少内耗。'},
 太阳:{命宫:'光明外放、乐于付出，天生想照亮别人；名先于利，须防操劳与锋芒招妒。',夫妻:'付出型伴侣，容易忽略自己；宜找懂得回应与珍惜的人。',官禄:'宜公职、管理、传媒教育等需公开露面、能积累声望的行业。',财帛:'先有名后有利，财随声誉来；忌为面子铺张。',迁移:'外出见光、声名远播，越公开越有利，宜向外发展。'},
 武曲:{命宫:'刚毅果决、重承诺、行动力强；财星坐命宜务实理财，须防过刚易折、不解风情。',夫妻:'重实际付出、不解风情，感情宜找务实型伴侣，用行动代替甜言。',官禄:'宜金融、工程、外科、军警、实业等要执行与决断的领域。',财帛:'正财星入财帛为最强配置之一，善守善攻，能积聚也能生财。',疾厄:'注意呼吸系统、外伤与过劳，运动狠了要收着。'},
 天同:{命宫:'随和乐观、有福气、孩子气；宜服务疗愈文教，须防惰性、小富即安。',夫妻:'情绪稳定、会享受生活，感情宜找能一起过日子的伴侣，忌一方过于进取。',官禄:'宜服务业、疗愈、文教、后勤等压力适中的岗位，抗压非其所长。',财帛:'衣食无忧型，不缺小钱难聚大富，宜稳中求进。',福德:'心境豁达、知足常乐，福气是天同的底色，须防安于现状。'},
 廉贞:{命宫:'外冷内热、讲原则又懂风情；才艺与魅力兼具，须防情绪两极与感情多折。',夫妻:'吸引力强但关系多转折，宜晚婚、重精神契合，忌一念之差。',官禄:'宜政法、纪检、公关、设计演艺等讲原则又用人情的领域。',财帛:'以专业与人脉生财，财路带几分才艺色彩。',疾厄:'注意心血循环与情绪，忌熬夜与情绪压抑。'},
 天府:{命宫:'稳重包容、天生的理财管家；守成有余开创不足，宜大机构与稳健经营。',夫妻:'配偶多半稳重顾家，婚姻重安稳与责任，宜门当户对。',官禄:'宜管理、金融、后勤总管，越大的机构越能发挥统筹之才。',财帛:'库星主积聚，越老越有钱，善守财、能积产。',田宅:'田宅宫得天府，家业根基厚，房产运佳，宜置产安居。'},
 太阴:{命宫:'温柔敏感、审美佳、夜型人；宜文创财务医护，须防多愁善感、优柔。',夫妻:'体贴入微型伴侣，感情细腻，宜找能读懂情绪的人。',官禄:'宜文创、房产、财务、医护及女性相关行业。',财帛:'细水长流式积财，田宅主星，宜长期稳健积累不动产。',田宅:'太阴入田宅，家宅安稳、房产运佳，宜居水边或安静处。'},
 贪狼:{命宫:'多才多艺、社交高手、好奇心重；才艺与桃花并重，宜晚婚、防欲望与应酬耗身。',夫妻:'桃花重、异性缘旺，宜晚婚并守界限，找能一起成长的人。',官禄:'宜业务、公关、娱乐、教培、命理玄学等人脉与才艺型行业。',财帛:'人脉即财源，应酬中见机会，须防为享乐破财。',福德:'欲望与才艺并存，兴趣广博，须防贪多与沉迷声色。'},
 巨门:{命宫:'口才锋利、善质疑、研究型人格；靠口与专业立身，须防多疑善辩、祸从口出。',夫妻:'口舌是非是感情头号课题，宜找能理性沟通的人，话前三思。',官禄:'宜律师、教师、主播、医师、心理等靠表达与专业判断的领域。',财帛:'以口才与专业立业，靠真本事赚钱，非投机之财。',疾厄:'注意口腔、消化与情绪性失眠，少吃辛辣、少纠结。'},
 天相:{命宫:'气质端方、天生的二把手；重名分与体面，须防过于方正、被人当枪使。',夫妻:'重视门当户对与名分，宜找品貌端正、能互相扶持的伴侣。',官禄:'宜幕僚、法务、HR、公职、品牌管理等辅佐与制度型岗位。',财帛:'稳定薪禄、衣食型财富，宜稳健理财，忌冒险。',迁移:'外出得贵人、重礼数，宜在规范有序的环境发展。'},
 天梁:{命宫:'老成持重、爱管闲事的大哥大姐；有荫庇与寿德，须防说教气重、倚老卖老。',夫妻:'照顾型伴侣，易把对方当孩子，宜找能独立又领情的人。',官禄:'宜医药、保险、公益、监察、教育等庇荫与监督型领域。',财帛:'先荫后财、稳中有余，宜靠专业口碑积累。',疾厄:'注意脾胃与慢性问题，宜规律养生、少操心。'},
 七杀:{命宫:'狠劲魄力、敢冲敢当、孤独的强者；宜开拓竞技创业，须防刚暴冲动、防意外。',夫妻:'聚少离多式感情，需要独立空间，宜找能各自精彩的伴侣。',官禄:'宜开拓、竞技、创业、军警、手术等高风险高回报领域。',财帛:'险中求财、大开大合，须设止损线、忌孤注一掷。',迁移:'外出闯荡见真章，宜向外发展、独当一面。'},
 破军:{命宫:'天生的破局者、人生不走寻常路；宜创新变革，须防破坏性强、起伏剧烈。',夫妻:'感情多巨变重组，宜晚婚、重磨合，忌冲动开始或结束。',官禄:'宜创新、变革、海外、先破后立的行业与岗位。',财帛:'先破后聚、晚发之财，忌大进大出、宜守住既得。',田宅:'田宅宫见破军，家宅多变动，宜晚置产、装修翻新可转运。'}
};
const MINOR_STAR={
 禄存:{gloss:'财禄庇荫之星',text:'禄存坐守，财禄有源，善于守住既得'},
 擎羊:{gloss:'刑星，锋锐与冲突',text:'擎羊入此宫，该领域多竞争与摩擦，宜化锋锐为执行力'},
 陀罗:{gloss:'忍星，拖延与磨',text:'陀罗入此宫，事多反复拖延，宜设截止线破解'},
 火星:{gloss:'火煞，急变',text:'火星入此宫，节奏来得急，快中取事也快中生变'},
 铃星:{gloss:'火煞，暗火',text:'铃星入此宫，烦扰细碎，宜定期清理积压'},
 地空:{gloss:'空亡，顿悟与破财',text:'地空入此宫，传统称「钱财不聚」——反着用即是看透与放下'},
 地劫:{gloss:'劫煞，耗损',text:'地劫入此宫，此领域波动大，忌借贷担保'},
 左辅:{gloss:'助力贵人星',text:'左辅会照，得平辈贵人之助'},
 右弼:{gloss:'助力贵人星',text:'右弼会照，暗中有助力推送'},
 文昌:{gloss:'文书聪慧星',text:'文昌会照，利考试文书才华'},
 文曲:{gloss:'艺术口才星',text:'文曲会照，利艺术与口才表现'},
 天魁:{gloss:'长辈贵人星',text:'天魁会照，年长者提携'},
 天钺:{gloss:'暗贵人星',text:'天钺会照，危难有暗助'}
};
const PALACE_THEME={
 命宫:'性情、志向与一生气象',父母:'长辈、文书与庇荫',福德:'精神世界、福气与兴趣',田宅:'家宅、资产与根基',
 官禄:'事业、职位与社会角色',仆役:'朋友、同侪与追随者',迁移:'外出、远方与舞台',疾厄:'体质象意与劳逸',
 财帛:'财源、用钱习惯',子女:'子女、晚辈与创作',夫妻:'婚姻、伴侣与相处',兄弟:'手足、同辈与近亲'
};
const PALACE_KEYWORD={命宫:'自身与格局',父母:'长辈与文书',福德:'心境与福气',田宅:'家产与安居',官禄:'事业与地位',仆役:'人际与圈子',迁移:'远方与变动',疾厄:'身体与能量',财帛:'金钱与流通',子女:'子嗣与创作',夫妻:'婚姻与另一半',兄弟:'手足与同伴'};
const BRIGHT_MOD={
 庙:'（入庙）星曜全力发挥，此主题以正面放大呈现',
 旺:'（旺地）星曜得力，主题强势而顺',
 得:'（得地）星曜稳定，主题平实可靠',
 利:'（利益）星曜可用，主题先蓄后发',
 平:'（平和）星曜不增不减，主题看后天经营',
 不:'（失辉）星曜受制，主题以课题形式出现，宜早修炼',
 陷:'（落陷）星曜失辉，此领域为一生功课，磨出真金'
};
const SIHUA_EVENTS={
 禄:{
  命宫:'运势走强、气场打开——宜升级形象、主动亮相、把握主场优势',
  父母:'长辈助力、文书利好——贵人常来自年长者；文书手续顺利',
  福德:'心境转安、灵感丰沛——利心灵成长、兴趣变现',
  田宅:'家宅兴旺、置产增益——宜居所升级、不动产机会年',
  官禄:'事业进财年——业绩奖金、升迁加薪、掌印之喜；宜主动请缨',
  仆役:'人缘生金——朋友带来资源与订单，圈层活跃',
  迁移:'外出得利——出行顺利、异地机遇、外派红利',
  疾厄:'精力回充——身体转好、调养见效之年',
  财帛:'财源广进——正财丰收，收入结构升级的年份',
  子女:'添丁之喜、创作丰收——子女缘旺、作品问世',
  夫妻:'感情升温、伴侣助力——宜婚订、伴侣带资源进门',
  兄弟:'手足同辈助力——合作融洽、平辈提携'
 },
 权:{
  命宫:'主导权到手——宜掌事负责、树立话语权；防独断',
  父母:'长辈权威议题——与父母领导的关系需要重新定位',
  福德:'内在驱力增强——执行力上扬，但心也闲不下来',
  田宅:'家宅变动主导权——搬迁装修动土、家庭决策年',
  官禄:'权力年——升职掌权、负责大项目、专业话语权；职场高光也是高压',
  仆役:'团队领导——带队掌事；防与朋友争主导',
  迁移:'远方扩张——外派、开拓市场、异地立足',
  疾厄:'体能增强也易透支——健身见效年，防过劳伤',
  财帛:'财权在握——宜主导投资决策、议价谈判',
  子女:'管教课题——对子女晚辈的权威与耐心课题',
  夫妻:'关系权力重排——伴侣强势或自己争主导；宜分工勿争权',
  兄弟:'手足间话语权调整——利益与立场需明算'
 },
 科:{
  命宫:'名声文书年——考试、评级、曝光、口碑上扬；宜考证发文',
  父母:'文书辈分——合同证件、与长辈的文书往来顺利；学业榜',
  福德:'心境清朗——心态修复、贵人一句话点醒',
  田宅:'家宅文书——房产证件、契税过户顺遂',
  官禄:'科名事业——考绩评优、职称评定、专业认证；名利双收的「清贵」年',
  仆役:'贵人年——逢凶有解、转危为安多靠朋友一句话',
  迁移:'异地扬名——出行平安、异地口碑',
  疾厄:'遇医得医——身体小恙也能及时找到对的医生；体检年',
  财帛:'财有清名——收入透明化、以名得财',
  子女:'学业子女——子女成绩、自己的进修成果',
  夫妻:'婚姻文书——领证、契约；感情得正名',
  兄弟:'同辈文书——合作签署、平辈认证'
 },
 忌:{
  命宫:'自我消耗年——纠结反复、想不开放不下；宜断舍离与轻装',
  父母:'长辈牵挂——父母健康与文书须操心；防与权威冲突',
  福德:'心结年——焦虑失眠、钻牛角尖；冥想与倾诉是解药',
  田宅:'家宅课题——搬迁反复、房产纠纷、家中修缮；先检查后签约',
  官禄:'事业阻滞——项目反复、职场是非、岗位调整；守成蓄力年，忌裸辞创业',
  仆役:'人际耗损——朋友是非、被拖累失信；慎担保借贷',
  迁移:'出行受阻——行程反复、远方变数；重要行程留缓冲',
  疾厄:'健康警报——身体红灯亮起的提示年；及时体检就医',
  财帛:'破耗年——现金流吃紧、投资被套；防守！防守！防守！',
  子女:'子女操心——晚辈健康学业起伏；多陪伴少施压',
  夫妻:'感情课题年——沟通卡顿、旧账重翻；多听少辩，忌冷战与仓促定分合',
  兄弟:'手足亏欠——亲兄弟明算账，防利益伤情'
 }
};
const PALACE_ORDER=['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','仆役','官禄','田宅','福德','父母'];
// 十天干四化表（流年干/大限干通用：甲廉破武阳、乙机梁紫阴……）
// 庚辛两干因派别而异（中州派 vs 全集北派同相/阴相），须与 src/ziwei-rules.mjs mutagensFor 完全同源。
// 其余八干三派一致。旧版硬编码中州派，导致用户切北派后主盘按北派飞化、报告仍按中州派，自相矛盾。
const GAN_SIHUA_BASE={
 甲:['廉贞','破军','武曲','太阳'],
 乙:['天机','天梁','紫微','太阴'],
 丙:['天同','天机','文昌','廉贞'],
 丁:['太阴','天同','天机','巨门'],
 戊:['贪狼','太阴','右弼','天机'],
 己:['武曲','贪狼','天梁','文曲'],
 庚:['太阳','武曲','太阴','天同'],
 辛:['巨门','太阳','文曲','文昌'],
 壬:['天梁','紫微','左辅','武曲'],
 癸:['破军','巨门','太阴','贪狼']
};
// 北派两口径只改庚、辛（与 ziwei-rules.mjs mutagensFor 一致）：
// 庚：中州 太阳/武曲/太阴/天同；同相 太阳/武曲/天同/天相；阴相 太阳/武曲/太阴/天相
// 辛：中州 巨门/太阳/文曲/文昌；北派 巨门/太阳/文昌/文曲
const SIHUA_SCHOOL_OVERRIDE={
 quanjiTong:{庚:['太阳','武曲','天同','天相'],辛:['巨门','太阳','文昌','文曲']},
 quanjiYin:{庚:['太阳','武曲','太阴','天相'],辛:['巨门','太阳','文昌','文曲']}
};
const sihuaFor=(stem,school)=>{
 const arr=(SIHUA_SCHOOL_OVERRIDE[school]?.[stem])||GAN_SIHUA_BASE[stem];
 if(!arr)return null;
 return {禄:arr[0],权:arr[1],科:arr[2],忌:arr[3]};
};
const STEMS='甲乙丙丁戊己庚辛壬癸';
const BRANCHES='子丑寅卯辰巳午未申酉戌亥';

function brightnessOf(star){return star?.brightness||'';}
function starEntry(star,palaceName,gloss){
 const core=STAR_CORE[star.name]||{gloss:'星曜',person:'',career:'',wealth:'',love:'',risk:''};
 const mod=BRIGHT_MOD[(star.brightness||'').slice(0,1)]||'';
 gloss[star.name]=core.gloss;
 const pn=/宫$/.test(palaceName||'')?palaceName:(palaceName+'宫'); // 避免「命宫宫」重复
 const spec=STAR_PALACE[star.name]?.[palaceName];
 const text=spec
  ? `${star.name}（${core.gloss}）${mod}坐${pn}：${spec}`
  : `${star.name}（${core.gloss}）${mod}坐${pn}——以${star.name}星性（${core.person||'见前述主星深解'}）与${PALACE_KEYWORD[palaceName]||'本宫主题'}相参：${core.career?`事业上${core.career}；`:''}${core.love?`感情上${core.love}。`:''}`;
 return {name:star.name,core,mod,text,specific:!!spec};
}
export function buildZiweiDeepReport(chart,flow,at){
 const gloss={};
 // 时点锚：常规本命报告用今天；时点专项报告由 flow.year / at 指定，禁止用系统时钟冒充「所选时点」。
 const clock=new Date();
 const focusYear=Number(flow?.year)||clock.getFullYear();
 const chosenDate=(()=>{
  if(at){const d=new Date(at);if(!Number.isNaN(+d))return d;}
  if(flow?.year&&flow?.month&&flow?.day)return new Date(Number(flow.year),Number(flow.month)-1,Number(flow.day),12);
  return clock;
 })();
 // 四化口径跟随本盘/流曜所选派别：chart.school / flow.school 由 ziweiChart/ziweiFlow 返回 {id,...}。
 // 缺省回退中州派（quanshu），保证旧数据/单测仍得到中州四化。
 const school=(chart?.school?.id||flow?.school?.id||'quanshu');
 const palaces=chart?.palaces||[];
 const find=branch=>palaces.find(p=>p.branch===branch);
 const pnOf=n=>/宫$/.test(n||'')?n:(n+'宫'); // 命宫已带「宫」，其余宫名补「宫」，避免「命宫宫」
 const findName=n=>palaces.find(p=>p.name===n);
 const life=findName('命宫')||palaces[0];
 const bodyPalace=palaces.find(p=>p.isBodyPalace);
 const lifeStars=life?(life.majorStars?.length?life.majorStars:life.borrowedStars||[]):[];
 const borrowed=!life?.majorStars?.length&&life?.borrowedStars?.length;

 /* 一、命盘总览 */
 const overview=[
  `命宫在${life?.earthlyBranch||'—'}宫，主星为${lifeStars.length?lifeStars.map(s=>`${s.name}${brightnessOf(s)}`).join('、'):'空宫（借对宫'+(life?.borrowedStars||[]).map(s=>s.name).join('、')+'参断）'}。命宫是全盘总开关——${lifeStars.map(s=>STAR_CORE[s.name]?.person).filter(Boolean).join('；')||'空宫之人可塑性强，随境遇与大限成型'}。`,
  `五行局为${chart?.fiveElementsClass||'—'}，命主${chart?.soul||'—'}、身主${chart?.body||'—'}——传统以命主定先天禀赋、身主定后天依托。身宫落${bodyPalace?bodyPalace.name+'宫（'+PALACE_KEYWORD[bodyPalace.name]+'，此领域是后半生发力重心）':'待考'}。`,
  lifeStars.map(s=>{const c=STAR_CORE[s.name];return c?`${s.name}坐命：${c.career}；感情上${c.love}；注意${c.risk}。`:''}).filter(Boolean).join(''),
  `本命格局：${(chart?.patterns||[]).length?(chart.patterns||[]).map(p=>typeof p==='string'?p:[p.name,p.description].filter(Boolean).join('——')).join('；'):'未见传世名格——平凡命格占绝大多数，格局不如「大限走得好」重要，后文逐限详批。'}`
 ];

 /* 二、三方四正 */
 const triad=life?.relatedBranches||[];
 const triadPalaces=triad.map(b=>find(b)).filter(Boolean);
 const triadText=triadPalaces.map(p=>{
  const stars=[...(p.majorStars||[]),...(p.majorStars?.length?[]:p.borrowedStars||[])];
  return `${pnOf(p.name)}（${PALACE_KEYWORD[p.name]}）：${stars.length?stars.map(s=>`${s.name}${brightnessOf(s)}${s.mutagen?'化'+s.mutagen:''}`).join('、'):'空宫'}${p.flying?.length?`；宫干飞化：${p.flying.map(f=>`${f.star}化${f.type}`).join('、')}`:''}`;
 });
 const sanction=[
  `三方四正（命宫+官禄+财帛+迁移）是紫微断事的骨架——命宫看是什么人，三方看这台机器的配置：`,
  ...triadText,
  `配置判读：${(life?.majorStars?.length||0)>=1&&triadPalaces.some(p=>(p.majorStars||[]).length>=2)?'三方星曜厚实，格局有支撑，大限走到吉位即有爆发力。':'三方星曜偏薄，成败更看大限四化的引动与个人深耕，忌频繁换赛道。'}`
 ];

 /* 三、十二宫逐宫详解 */
 const palaceLines=palaces.filter(p=>p.name&&p.name!=='').sort((a,b)=>PALACE_ORDER.indexOf(a.name)-PALACE_ORDER.indexOf(b.name)).map(p=>{
  const stars=p.majorStars?.length?p.majorStars:p.borrowedStars||[];
  const starTexts=stars.map(s=>starEntry(s,p.name,gloss));
  const minor=(p.minorStars||[]).slice(0,4).map(s=>MINOR_STAR[s.name]).filter(Boolean).map(m=>m.text).join('；');
  const sihua=(p.stars||[]).filter(s=>s.siHua).map(s=>`${s.name}化${s.siHua}`);
  const dec=p.decadal?`（大限${p.decadal.range?.join?.('–')||p.decadal.range}岁）`:'';
  return `<li><b>${pnOf(p.name)} · ${p.earthlyBranch}${dec}${stars.length?` · ${stars.map(s=>s.name+(s.brightness||'')).join('、')}`:' · 空宫'}</b><span>${PALACE_THEME[p.name]}。${starTexts.map(t=>t.text).join('')}${borrowed&&stars===p.borrowedStars?'（借星入宫，力道六成）':''}${sihua.length?` 生年四化：${sihua.join('、')}——${sihua.map(x=>SIHUA_EVENTS[x.slice(-1)][p.name]).join('；')}。`:''}${minor?' '+minor+'。':''}</span></li>`;
 }).join('');
 const palacesSec=`<ul class="rpt-list rpt-palaces">${palaceLines||'<li>宫位数据待排盘后生成。</li>'}</ul>`;

 /* 四、生年四化与人生课题 */
 const sihua=chart?.sihua||[];
 const sihuaLines=sihua.map(x=>{
  gloss['化'+x.type]=({禄:'福泽与机缘',权:'权力与担当',科:'名声与文书',忌:'执念与阻滞'})[x.type];
  return `「${x.star}化${x.type}」入${pnOf(x.palace)}：${SIHUA_EVENTS[x.type][x.palace]||'见宫位主题参断'}——这是写入命盘的先天气质，一生围绕此课题展开；行运再逢同类化象时被再次引动。`;
 });
 // 四化飞星轨迹：每宫的「干」引动四化，飞向对应星曜所在宫——文墨式可核的飞星连线文字版
 function findStarPalace(starName){return palaces.find(p=>['majorStars','minorStars','adjectiveStars','borrowedStars','stars'].some(k=>(p[k]||[]).some(s=>s.name===starName)));}
 const FLYING_SIHUA={禄:'资源入口',权:'责任所系',科:'名声所倚',忌:'亏欠所系'};
 const flyRows=palaces.flatMap(p=>{
  const flying=p.flying||[];
  return flying.map(m=>{
   const target=palaces.find(q=>q.branch===m.branch)||{};
   const star=findStarPalace(m.star);
   return {from:p.name,fromBranch:p.earthlyBranch,type:m.type,star:m.star,to:target.name||('第'+((m.branch??0)+1)+'宫'),toBranch:target.earthlyBranch||'—',starPalace:star?.name||'—'};
  }).filter(m=>m.type&&m.star);
 }).filter(m=>m.from&&m.to&&m.type&&m.star);
 const flyTable=flyRows.length?`<table class="rpt-table rpt-fly"><thead><tr><th>起宫</th><th>四化</th><th>化星</th><th>落宫</th><th>象意</th></tr></thead><tbody>${flyRows.slice(0,24).map(m=>`<tr><td>${m.from}（${m.fromBranch}）</td><td><b>${m.type}</b></td><td>${m.star}</td><td>${m.to}（${m.toBranch}）</td><td>${FLYING_SIHUA[m.type]||''}·${PALACE_THEME[m.to]||''}</td></tr>`).join('')}</tbody></table>`:'';
 const flyLines=flyRows.length?[
  `飞星轨迹回答的是「谁把力量送到哪里」：每一宫的宫干引动四化，把某颗星的化禄/化权/化科/化忌送到另一宫。上表按宫位列出全部飞星——这是文墨天机式「点击飞星连线」的文字版，可与盘面交互层互相核对。`,
  `读法：化禄飞入财帛＝资源的入口在财；化忌飞入夫妻＝此生在亲密关系里最需修行的功课；权科同会一宫＝该宫领域靠专业立身。飞星与本宫生年四化叠加看——同星同化是「双重引动」，异化同宫是「禄忌交战」或「权科相随」。`
 ]:['飞星轨迹数据待排盘后生成（需完整宫位与四化）。'];
 const sihuaSec=sihuaLines.length?sihuaLines:['生年四化数据待排盘后生成。'];
 sihuaSec.push(`读法：化禄是资源入口、化权是责任所系、化科是名声所倚、化忌是亏欠所系。四化互看——禄忌同宫成「禄逢冲破」式的甜中带苦；权科同会，事业以专业立身。化忌所在不是绝地，而是此生必修的功课，修过即成专业。`);
 if(flyLines.length&&flyLines[0].startsWith('飞星轨迹'))sihuaSec.push(...flyLines);

 /* 五、大限逐限详批 */
 const decades=chart?.decades||[];
 const nowYear=focusYear;
 const decadeLines=decades.map(d=>{
  const pal=findName(d.palaceName);
  const stars=pal?(pal.majorStars?.length?pal.majorStars:pal.borrowedStars||[]):[];
  const core=stars.map(s=>STAR_CORE[s.name]).filter(Boolean);
  const ageRange=Array.isArray(d.ageRange)?d.ageRange.join('–'):d.ageRange;
  const yearRange=Array.isArray(d.yearRange)?d.yearRange.join('–'):d.yearRange;
  const isNow=Array.isArray(d.yearRange)&&d.yearRange[0]<=nowYear&&nowYear<d.yearRange[1];
  const flying=pal?.flying||[];
  return `<li class="${isNow?'rpt-now':''}"><b>大限 ${ageRange}岁 · ${yearRange} · 走${pnOf(d.palaceName)}${isNow?' · 【当前十年】':''}</b><span>${PALACE_THEME[d.palaceName]}。${stars.length?`本限主星${stars.map(s=>s.name+(s.brightness||'')).join('、')}：${core.map(c=>c.career).join('；')}。`:'空宫借对宫参断，主题随环境而变。'}${flying.length?` 大限四化：${flying.map(f=>`${f.star}化${f.type}入${pnOf(find(f.branch)?.name||'—')}${f.type==='忌'?'——此十年防该领域反复':''}`).join('、')}。`:''}${core.length?` 福气面：${core.map(c=>c.wealth).join('；')}。风险面：${core.map(c=>c.risk).join('；')}。`:''}</span></li>`;
 }).join('');
 const decadesSec=decadeLines?`<ul class="rpt-list rpt-decades">${decadeLines}</ul>`:'大限资料待排盘后生成——紫微的十年剧本按大限宫逐限展开，本报告在排盘后自动列出每限主题。';

 /* 六、流年逐流年详批（未来十年）——流年命宫按年支定位，流年四化按年干飞布 */
 const flowDecadeLines=Array.from({length:10},(_,i)=>{
  const year=nowYear+i;
  const stemIdx=((year-4)%10+10)%10,branchIdx=((year-4)%12+12)%12;
  const stem=STEMS[stemIdx],branch=BRANCHES[branchIdx];
  const fPal=find(branchIdx);
  const fStars=fPal?(fPal.majorStars?.length?fPal.majorStars:(fPal.borrowedStars||[])):[];
  const mut=sihuaFor(stem,school);
  const evs=[];
  for(const t of ['禄','权','科','忌']){
   const starName=mut[t];
   const sp=findStarPalace(starName);
   const ev=sp?SIHUA_EVENTS[t]?.[sp.name]:null;
   if(sp&&ev)evs.push(`<i>${starName}化${t}入${sp.name}</i>${t==='忌'?'（防）':'（宜）'}：${ev}`);
  }
  // 叠化检测：流年四化之星与生年四化同星——同化叠强、禄忌相遇为交战
  const natalMap=(chart?.sihua||[]).reduce((m,x)=>{m[x.star]=x.type;return m;},{});
  const stackText=(sn,ft,nt)=>{
   if(ft===nt)return `${sn}双${ft}（生年化${nt}叠流年化${ft}，同主题显著加强）`;
   if((ft==='禄'&&nt==='忌')||(ft==='忌'&&nt==='禄'))return `${sn}禄忌交战（生年化${nt}遇流年化${ft}——机遇与消耗并存，进财须防暗耗、得利须防反复）`;
   return `${sn}化${nt}化${ft}叠至（生年课题被流年再引动，该年此主题必上议程）`;
  };
  const stacks=Object.entries(mut).filter(([,sn])=>natalMap[sn]).map(([t,sn])=>stackText(sn,t,natalMap[sn]));
  const starText=fStars.length?`流年命宫主星${fStars.map(s=>s.name+(s.brightness||'')).join('、')}——${fStars.map(s=>STAR_CORE[s.name]?.person).filter(Boolean).join('；')}。全年气质据此：${fStars.map(s=>STAR_CORE[s.name]?.risk).filter(Boolean)[0]||'顺其自然，主动而不冒进'}。`:`流年命宫空宫（借对宫参断）——随环境而变的一年，主动权在「跟对人、上对船」。`;
  return `<li class="${i===0?'rpt-now':''}"><b>${year}年 ${stem}${branch} · 流年命宫走${pnOf(fPal?.name||'—')}${i===0?(flow?' · 【所选流年】':' · 【今年】'):''}</b><span>${starText}${evs.length?`<br>流年四化：${evs.join('；')}。`:''}${stacks.length?`<br>叠化提示：${stacks.join('；')}。`:''}</span></li>`;
 }).join('');
 const flowDecadeSec=`<ul class="rpt-list rpt-decades">${flowDecadeLines}</ul>`;
 const flowDecadeIntro=[
  `流年命宫＝该年地支所在之宫（如${BRANCHES[((nowYear-4)%12+12)%12]}年走${pnOf(find(((nowYear-4)%12+12)%12)?.name||'—')}），自 ${nowYear} 年起排十年${flow?'（按所选流年起算）':''}；流年四化＝以流年天干飞布禄权科忌，落宫即指向性事件。两者合看：命宫主星答「今年像什么样的一年」，四化落宫答「今年哪件事被点亮」。`,
  `用法：把「忌入之宫」当作该年的防守科目提前布防；「禄入之宫」当作进攻窗口主动布局。吉化不等于躺着发生——没有对应动作（求职/签约/表白），禄也无处兑现。`
 ];

 /* 七、流年指向性事件（所选流年） */
 const flowEvents=[];
 if(flow?.mutagens?.length){
  for(const m of flow.mutagens){
   const p=find(m.branch);
   const ev=SIHUA_EVENTS[m.type]?.[p?.name];
   gloss['化'+m.type]=({禄:'福泽与机缘',权:'权力与担当',科:'名声与文书',忌:'执念与阻滞'})[m.type];
   if(ev)flowEvents.push(`【指向事件】${m.star}化${m.type}入${pnOf(p.name)}（${flow.label||'流年'}${flow.ganZhi||''}）：${ev}。`);
  }
 }
 const flowSec=[
  flowEvents.length?flowEvents.join(''):flow?'所选运限未见可核之四化飞星。':'尚未选择流年——在紫微排盘页选任一年份后重新生成报告，此处将逐条列出该年四化落宫触发的指向性事件（进财/升迁/文书/置产/感情/健康六类）。',
  `指向性事件的用法：四化落宫指明「哪一域被点亮」，触发方式仍取决于你本年是否有对应动作（求职才有升迁、签约才有置产）。吉化（禄权科）入宫是顺水推舟之年，凶化（忌）入宫是提前布防之年——知忌而不惧忌，即为趋吉避凶。`,
  `叠加判读：流年四化若与本命四化、大限四化同宫重叠（禄叠禄、忌叠忌），该主题显著加强——双禄之年进财力度倍增，双忌之年务必保守。`
 ];

 /* 八、流月逐月详批（斗君起正月，月四化落宫） */
const MONTH_STEM_START={甲:2,己:2,乙:4,庚:4,丙:6,辛:6,丁:8,壬:8,戊:0,癸:0};
let lunarMeta={};
try{lunarMeta=typeof chart?.lunarDate==='string'?JSON.parse(chart.lunarDate):(chart?.lunarDate||{});}catch{lunarMeta={};}
const bornMonth=Math.abs(lunarMeta.lunarMonth||1),bornHour=chart?.effectiveTimeIndex??0;
const fyYear=flow?.year??nowYear;
const idxOfBranch=b=>palaces.findIndex(p=>p.branch===b);
const flowMonths=(()=>{
 if(!palaces.length)return [];
 const fyBranchIdx=((fyYear-4)%12+12)%12;
 const base=idxOfBranch(fyBranchIdx);
 if(base<0)return [];
 // 斗君：流年支宫起正月顺数至生月，该宫起子时逆数至生时——即流年正月所在宫
 const p1=(base+bornMonth-1)%12;
 const doujun=((p1-bornHour)%12+12)%12;
 const yearStem=STEMS[((fyYear-4)%10+10)%10];
 return Array.from({length:12},(_,i)=>{
  const palIndex=(doujun+i)%12,pal=palaces[palIndex];
  const stem=STEMS[(MONTH_STEM_START[yearStem]+i)%10],branch=BRANCHES[(2+i)%12];
  const mut=sihuaFor(stem,school)||{};
  const events=[];
  for(const t of ['禄','权','科','忌']){
   const sp=findStarPalace(mut[t]);
   const ev=sp?SIHUA_EVENTS[t]?.[sp.name]:null;
   if(sp&&ev)events.push({star:mut[t],type:t,palace:sp.name,text:ev});
  }
  const stars=pal?(pal.majorStars?.length?pal.majorStars:(pal.borrowedStars||[])):[];
  const isNow=(flow?.scope==='monthly'||flow?.scope==='daily')&&Math.abs(Number(flow?.month||0))===i+1;
  return {index:i+1,label:`${i+1}月`,stem,branch,palIndex,palaceName:pal?.name||'—',stars,events,isNow};
 });
})();
const flowMonthLines=flowMonths.map(m=>{
 const core=m.stars.map(s=>STAR_CORE[s.name]).filter(Boolean);
 const mutText=m.events.length?m.events.map(e=>`${e.star}化${e.type}入${e.palace}${e.type==='忌'?'（防：'+e.text+'）':'（宜：'+e.text+'）'}`).join('；'):'本月四化未见强势落宫';
 const action=m.events.some(e=>e.type==='忌')?'有忌化之月，先把该宫领域的老问题收尾，别开新战场。'
  :m.events.some(e=>e.type==='禄')?'有禄化之月，主动出击的成本最低——约人、递方案、谈条件都放在这时。'
  :'四化平缓之月，按年度计划推进即可，重在积累。';
 return `<li class="${m.isNow?'rpt-now':''}"><b>${m.label} · ${m.stem}${m.branch} · 流月命宫走${pnOf(m.palaceName)}${m.isNow?' · 【当前月】':''}</b><span>${m.stars.length?`主星${m.stars.map(s=>s.name).join('、')}：${core.map(c=>c.career).filter(Boolean).join('；')}。`:'空宫借对宫参断，本月主题随环境走。'}月四化：${mutText}。${action}</span></li>`;
}).join('');
const flowMonthSec=flowMonthLines?`<ul class="rpt-list rpt-months">${flowMonthLines}</ul>`:'';
const flowMonthIntro=flowMonths.length?[
 `流月不是把流年除以十二：它有自己的命宫。古法以「斗君」定流年正月——从流年地支宫起正月顺数到你出生的农历${bornMonth}月，再从该宫起子时逆数到你出生的${BRANCHES[bornHour]||'子'}时，落宫即斗君；斗君起正月，顺行十二宫。`,
 `本段按上述斗君法排出 ${fyYear} 年十二个月的流月命宫，并以五虎遁定月干、以月干飞四化。月四化落宫＝这个月最容易被点亮的事——禄宜攻、忌宜守，比「哪个月好」更具体。`,
 `用法：把年度要事排进「禄化之月」，把清账、收尾、体检排进「忌化之月」；流月是节奏工具，不是吉凶判决。`
]:['流月数据待完整命盘生成。'];

/* 九、流日与流时（流日命宫顺行，日干四化取所选日）——日干支由儒略日自推，随所选时点重算 */
const curMonth=flowMonths.find(m=>m.isNow)||flowMonths[0]||null;
const dayGzOf=(y,m,d)=>{const j=Math.floor(Date.UTC(y,m-1,d)/86400000)+2440588;const i=((j+49)%60+60)%60;return STEMS[i%10]+BRANCHES[i%12];};
const nowDate=chosenDate,curY=nowDate.getFullYear(),curM=nowDate.getMonth()+1,curD=nowDate.getDate();
const monthLen=new Date(Date.UTC(curY,curM,0)).getUTCDate();
const flowDayRows=curMonth?Array.from({length:monthLen},(_,i)=>{
 const d=i+1,gz=dayGzOf(curY,curM,d),pal=palaces[(curMonth.palIndex+i)%12];
 const mut=sihuaFor(gz[0],school)||{};
 const hit=Object.entries(mut).map(([t,sn])=>{const sp=findStarPalace(sn);return sp&&sp.name===pal?.name?t:null;}).filter(Boolean);
 return {day:d,date:`${curY}-${String(curM).padStart(2,'0')}-${String(d).padStart(2,'0')}`,ganZhi:gz,palace:pal?.name||'—',mut,hit,isNow:d===curD};
}):[];
const flowDayTable=flowDayRows.length?`<table class="rpt-table rpt-days"><thead><tr><th>日期</th><th>干支</th><th>流日命宫</th><th>日干四化</th></tr></thead><tbody>${flowDayRows.map(r=>`<tr${r.isNow?' class="rpt-now"':''}><td>${r.date.slice(5)}${r.isNow?' · 今':''}</td><td>${r.ganZhi}</td><td>${r.palace}</td><td>${Object.entries(r.mut).map(([t,sn])=>`${sn}化${t}`).join('、')}${r.hit.length?`<b>（${r.hit.join('')}入本宫）</b>`:''}</td></tr>`).join('')}</tbody></table>`:'';
const HOUR_LABEL=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const dayStemOf=dayGzOf(curY,curM,curD)[0];
const flowHours=Array.from({length:12},(_,i)=>{
 const stem=STEMS[(STEMS.indexOf(dayStemOf)*2+i)%10];
 const mut=sihuaFor(stem,school)||{};
 const pal=curMonth?palaces[(curMonth.palIndex+(curD-1)+i)%12]:null;
 const events=Object.entries(mut).map(([t,sn])=>{const sp=findStarPalace(sn);return sp?`${sn}化${t}入${sp.name}`:null;}).filter(Boolean);
 return {label:HOUR_LABEL[i]+'时',stem,mut,palace:pal?.name||'—',events,isNow:i===Math.floor(((nowDate.getHours()+1)%24)/2)};
});
const flowHourTable=`<table class="rpt-table rpt-hours"><thead><tr><th>时辰</th><th>时干</th><th>流时命宫</th><th>时干四化</th></tr></thead><tbody>${flowHours.map(h=>`<tr${h.isNow?' class="rpt-now"':''}><td>${h.label}${h.isNow?' · 今':''}</td><td>${h.stem}</td><td>${h.palace}</td><td>${h.events.join('、')||'—'}</td></tr>`).join('')}</tbody></table>`;
const flowDaySec=[
 `流日命宫由流月命宫逐日顺行一位，日干四化看当天哪一宫被点亮。下表为本次时点所在月份（${curY}-${String(curM).padStart(2,'0')}，流月命宫${curMonth?.palaceName||'—'}）的整月流日；日干支由儒略日直接推算（(JDN+49) mod 60），随所选时点重算而非固定读系统日期。`,
 flowHourTable?`时干由今日日干（${dayStemOf}日）按五鼠遁推出，${dayStemOf}日起${STEMS[(STEMS.indexOf(dayStemOf)*2)%10]}子时。流时命宫沿流日命宫逐时辰顺行——把一天里最关键的一件事，放进「时干四化吉化入命/财/官」的时辰。`:'',
 `流日流时是「择日择时」的最细一层：它不能改变大势，但能在同一个月里帮你避开最硬的阻力、抓住最顺的窗口。`
];
// 表格走 html 字段，避免被 lines 的转义逻辑渲染成标签字面量。
const flowDayHtml=`${flowDayTable||''}${flowHourTable||''}`;

/* 十、综合建议 */
 const advice=[
  `总纲：紫微看命，先认格局（命宫主星）、再排时机（大限四化）、后取动作（流年指向）。你的底盘是${lifeStars.map(s=>s.name).join('、')||'空宫'}，后半生身宫发力点在${bodyPalace?.name||'待考'}。`,
  `择业建议：${lifeStars.map(s=>STAR_CORE[s.name]?.career).filter(Boolean).join('；')||'空宫之人宜借大限星曜定赛道——走到哪步大限，就借该限主星的行业东风。'}`,
  `感情建议：${(findName('夫妻')?.majorStars||findName('夫妻')?.borrowedStars||[]).map(s=>STAR_CORE[s.name]?.love+'。').join('')||'夫妻宫空宫，伴侣形象随大限成形；相处之道重沟通。'}命宫与夫妻宫合参：${lifeStars.map(s=>STAR_CORE[s.name]?.love).filter(Boolean).join('；')}。`,
  `时机建议：大限详批中标注【当前十年】的行限是当下主舞台；每逢流年四化入命宫/官禄/财帛的年份，是十年内的关键行动窗口，宜提前半年布局。`,
  `本报告由盘面星曜、亮度、四化与宫垣主题逐条推导；斗数为传统术数文化，供自我观察与时机参考，不构成事实预测、投资或婚姻决策依据。`
 ];

 const sections=[
  {title:'一、命盘总览与命宫主星',lines:overview},
  {title:'二、三方四正配置',lines:sanction},
  {title:'三、十二宫逐宫详解',lines:[],html:palacesSec},
  {title:'四、生年四化与人生课题（含四化飞星轨迹）',lines:sihuaSec,html:flyTable||undefined},
  {title:'五、大限逐限详批（十二个十年）',lines:[],html:decadesSec},
  {title:'六、流年逐流年详批（未来十年）',lines:flowDecadeIntro,html:flowDecadeSec},
 {title:'七、流年指向性事件（所选流年）',lines:flowSec},
 {title:'八、流月逐月详批（斗君起正月 · 十二个月）',lines:flowMonthIntro,html:flowMonthSec},
 {title:'九、流日与流时（整月流日 · 十二时辰）',lines:flowDaySec,html:flowDayHtml||undefined},
 {title:'十、综合建议',lines:advice}
 ];
 return {title:'紫微斗数 · 全盘详批',sections,glossary:gloss,kind:'ziwei'};
}
