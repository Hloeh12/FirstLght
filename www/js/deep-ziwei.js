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
const GAN_SIHUA={
 甲:{禄:'廉贞',权:'破军',科:'武曲',忌:'太阳'},
 乙:{禄:'天机',权:'天梁',科:'紫微',忌:'太阴'},
 丙:{禄:'天同',权:'天机',科:'文昌',忌:'廉贞'},
 丁:{禄:'太阴',权:'天同',科:'天机',忌:'巨门'},
 戊:{禄:'贪狼',权:'太阴',科:'右弼',忌:'天机'},
 己:{禄:'武曲',权:'贪狼',科:'天梁',忌:'文曲'},
 庚:{禄:'太阳',权:'武曲',科:'太阴',忌:'天同'},
 辛:{禄:'巨门',权:'太阳',科:'文曲',忌:'文昌'},
 壬:{禄:'天梁',权:'紫微',科:'左辅',忌:'武曲'},
 癸:{禄:'破军',权:'巨门',科:'太阴',忌:'贪狼'}
};
const STEMS='甲乙丙丁戊己庚辛壬癸';
const BRANCHES='子丑寅卯辰巳午未申酉戌亥';

function brightnessOf(star){return star?.brightness||'';}
function starEntry(star,palaceName,gloss){
 const core=STAR_CORE[star.name]||{gloss:'星曜',person:'',career:'',wealth:'',love:'',risk:''};
 const mod=BRIGHT_MOD[(star.brightness||'').slice(0,1)]||'';
 gloss[star.name]=core.gloss;
 return {name:star.name,core,mod,text:`${star.name}（${core.gloss}）${mod}坐${palaceName}宫。`}
}
export function buildZiweiDeepReport(chart,flow){
 const gloss={};
 const palaces=chart?.palaces||[];
 const find=branch=>palaces.find(p=>p.branch===branch);
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
  return `${p.name}宫（${PALACE_KEYWORD[p.name]}）：${stars.length?stars.map(s=>`${s.name}${brightnessOf(s)}${s.mutagen?'化'+s.mutagen:''}`).join('、'):'空宫'}${p.flying?.length?`；宫干飞化：${p.flying.map(f=>`${f.star}化${f.type}`).join('、')}`:''}`;
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
  return `<li><b>${p.name}宫 · ${p.earthlyBranch}${dec}${stars.length?` · ${stars.map(s=>s.name+(s.brightness||'')).join('、')}`:' · 空宫'}</b><span>${PALACE_THEME[p.name]}。${starTexts.map(t=>t.text).join('')}${borrowed&&stars===p.borrowedStars?'（借星入宫，力道六成）':''}${sihua.length?` 生年四化：${sihua.join('、')}——${sihua.map(x=>SIHUA_EVENTS[x.slice(-1)][p.name]).join('；')}。`:''}${minor?' '+minor+'。':''}</span></li>`;
 }).join('');
 const palacesSec=`<ul class="rpt-list rpt-palaces">${palaceLines||'<li>宫位数据待排盘后生成。</li>'}</ul>`;

 /* 四、生年四化与人生课题 */
 const sihua=chart?.sihua||[];
 const sihuaLines=sihua.map(x=>{
  gloss['化'+x.type]=({禄:'福泽与机缘',权:'权力与担当',科:'名声与文书',忌:'执念与阻滞'})[x.type];
  return `「${x.star}化${x.type}」入${x.palace}宫：${SIHUA_EVENTS[x.type][x.palace]||'见宫位主题参断'}——这是写入命盘的先天气质，一生围绕此课题展开；行运再逢同类化象时被再次引动。`;
 });
 const sihuaSec=sihuaLines.length?sihuaLines:['生年四化数据待排盘后生成。'];
 sihuaSec.push(`读法：化禄是资源入口、化权是责任所系、化科是名声所倚、化忌是亏欠所系。四化互看——禄忌同宫成「禄逢冲破」式的甜中带苦；权科同会，事业以专业立身。化忌所在不是绝地，而是此生必修的功课，修过即成专业。`);

 /* 五、大限逐限详批 */
 const decades=chart?.decades||[];
 const nowYear=new Date().getFullYear();
 const decadeLines=decades.map(d=>{
  const pal=findName(d.palaceName);
  const stars=pal?(pal.majorStars?.length?pal.majorStars:pal.borrowedStars||[]):[];
  const core=stars.map(s=>STAR_CORE[s.name]).filter(Boolean);
  const ageRange=Array.isArray(d.ageRange)?d.ageRange.join('–'):d.ageRange;
  const yearRange=Array.isArray(d.yearRange)?d.yearRange.join('–'):d.yearRange;
  const isNow=Array.isArray(d.yearRange)&&d.yearRange[0]<=nowYear&&nowYear<d.yearRange[1];
  const flying=pal?.flying||[];
  return `<li class="${isNow?'rpt-now':''}"><b>大限 ${ageRange}岁 · ${yearRange} · 走${d.palaceName}宫${isNow?' · 【当前十年】':''}</b><span>${PALACE_THEME[d.palaceName]}。${stars.length?`本限主星${stars.map(s=>s.name+(s.brightness||'')).join('、')}：${core.map(c=>c.career).join('；')}。`:'空宫借对宫参断，主题随环境而变。'}${flying.length?` 大限四化：${flying.map(f=>`${f.star}化${f.type}入${find(f.branch)?.name||'—'}宫${f.type==='忌'?'——此十年防该领域反复':''}`).join('、')}。`:''}${core.length?` 福气面：${core.map(c=>c.wealth).join('；')}。风险面：${core.map(c=>c.risk).join('；')}。`:''}</span></li>`;
 }).join('');
 const decadesSec=decadeLines?`<ul class="rpt-list rpt-decades">${decadeLines}</ul>`:'大限资料待排盘后生成——紫微的十年剧本按大限宫逐限展开，本报告在排盘后自动列出每限主题。';

 /* 六、流年逐流年详批（未来十年）——流年命宫按年支定位，流年四化按年干飞布 */
 const findStarPalace=starName=>palaces.find(p=>['majorStars','minorStars','adjectiveStars','borrowedStars','stars'].some(k=>(p[k]||[]).some(s=>s.name===starName)));
 const flowDecadeLines=Array.from({length:10},(_,i)=>{
  const year=nowYear+i;
  const stemIdx=((year-4)%10+10)%10,branchIdx=((year-4)%12+12)%12;
  const stem=STEMS[stemIdx],branch=BRANCHES[branchIdx];
  const fPal=find(branchIdx);
  const fStars=fPal?(fPal.majorStars?.length?fPal.majorStars:(fPal.borrowedStars||[])):[];
  const mut=GAN_SIHUA[stem];
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
  return `<li class="${i===0?'rpt-now':''}"><b>${year}年 ${stem}${branch} · 流年命宫走${fPal?.name||'—'}宫${i===0?' · 【今年】':''}</b><span>${starText}${evs.length?`<br>流年四化：${evs.join('；')}。`:''}${stacks.length?`<br>叠化提示：${stacks.join('；')}。`:''}</span></li>`;
 }).join('');
 const flowDecadeSec=`<ul class="rpt-list rpt-decades">${flowDecadeLines}</ul>`;
 const flowDecadeIntro=[
  `流年命宫＝该年地支所在之宫（如${BRANCHES[((nowYear-4)%12+12)%12]}年走${find(((nowYear-4)%12+12)%12)?.name||'—'}宫），宫内主星即全年主气质；流年四化＝以流年天干飞布禄权科忌，落宫即指向性事件。两者合看：命宫主星答「今年像什么样的一年」，四化落宫答「今年哪件事被点亮」。`,
  `用法：把「忌入之宫」当作该年的防守科目提前布防；「禄入之宫」当作进攻窗口主动布局。吉化不等于躺着发生——没有对应动作（求职/签约/表白），禄也无处兑现。`
 ];

 /* 七、流年指向性事件（所选流年） */
 const flowEvents=[];
 if(flow?.mutagens?.length){
  for(const m of flow.mutagens){
   const p=find(m.branch);
   const ev=SIHUA_EVENTS[m.type]?.[p?.name];
   gloss['化'+m.type]=({禄:'福泽与机缘',权:'权力与担当',科:'名声与文书',忌:'执念与阻滞'})[m.type];
   if(ev)flowEvents.push(`【指向事件】${m.star}化${m.type}入${p.name}宫（${flow.label||'流年'}${flow.ganZhi||''}）：${ev}。`);
  }
 }
 const flowSec=[
  flowEvents.length?flowEvents.join(''):flow?'所选运限未见可核之四化飞星。':'尚未选择流年——在紫微排盘页选任一年份后重新生成报告，此处将逐条列出该年四化落宫触发的指向性事件（进财/升迁/文书/置产/感情/健康六类）。',
  `指向性事件的用法：四化落宫指明「哪一域被点亮」，触发方式仍取决于你本年是否有对应动作（求职才有升迁、签约才有置产）。吉化（禄权科）入宫是顺水推舟之年，凶化（忌）入宫是提前布防之年——知忌而不惧忌，即为趋吉避凶。`,
  `叠加判读：流年四化若与本命四化、大限四化同宫重叠（禄叠禄、忌叠忌），该主题显著加强——双禄之年进财力度倍增，双忌之年务必保守。`
 ];

 /* 八、综合建议 */
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
  {title:'四、生年四化与人生课题',lines:sihuaSec},
  {title:'五、大限逐限详批（十二个十年）',lines:[],html:decadesSec},
  {title:'六、流年逐流年详批（未来十年）',lines:flowDecadeIntro,html:flowDecadeSec},
  {title:'七、流年指向性事件（所选流年）',lines:flowSec},
  {title:'八、综合建议',lines:advice}
 ];
 return {title:'紫微斗数 · 全盘详批',sections,glossary:gloss,kind:'ziwei'};
}
