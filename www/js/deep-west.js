// 西洋占星深度知识库：逐星「星座×宫位」成篇解读 + 盘面格局检测（星群/大三角/T三角/元素失衡）。
// 行运触发点由星历实算（木土天海冥当前行度对本命行星的相位与落宫）。
import {bodyAt} from '../../src/ephemeris.mjs';
const GLOSS={};
// 行星尊贵度（dignity）差异化判读：同一颗星在庙/旺/弱/陷的表达质量不同，不再对所有盘输出同一句模板。
const DIGNITY_TONE={
 入庙:{tag:'入庙',text:'行星回到自己的星座，能量「在家」——表达纯粹、自主性高，能以建设性的方式稳定发挥，是这颗星最可靠的实力区。'},
 旺相:{tag:'旺相',text:'行星处于最有力的星座，能量被放大到最佳——天赋突出、表现亮眼；须防过度扩张与「用力过猛」。'},
 入弱:{tag:'入弱',text:'行星落在与本性相悖的星座，如同「客场作战」——表达别扭、易内耗或与场域规范冲突，须靠后天刻意练习找回节奏。'},
 落陷:{tag:'落陷',text:'行星处于最不舒适的表达状态——课题感重、能量易受压抑或扭曲，恰是后天修炼与成熟度的主要来源，不宜当作缺陷看。'}
};
const ORB_TIER=o=>{const a=Math.abs(o??9);return a<=2?'极紧':a<=4?'紧':a<=6?'宽':'松';};
const PLANET_CORE={
 sun:'自我意志与生命力的核心——你想成为什么样的人',moon:'情绪需求与安全感的来源——你需要什么才能安心',
 mercury:'思维方式与表达风格——你如何思考与沟通',venus:'爱与美的取向——你被什么吸引、如何去爱',
 mars:'行动力与欲望——你如何争取与出击',jupiter:'扩张与信念——你在哪里获得成长与幸运',
 saturn:'纪律与课题——你在哪里必须成熟',uranus:'变革与独立——你打破常规的方式',
 neptune:'梦境与灵感——你在哪里失去边界又获得慈悲',pluto:'深层转化——你在哪里经历蜕变与重生'
};
const SIGN_TRAIT={
 白羊座:'先锋式——直接、快、要赢',金牛座:'耕耘式——务实、感官、要稳',双子座:'好奇式——多线、机敏、要新鲜',
 巨蟹座:'滋养式——情感、记忆、要安全',狮子座:'舞台式——慷慨、骄傲、要被看见',处女座:'精修式——分析、完善、要有用',
 天秤座:'协调式——优雅、权衡、要公平',天蝎座:'深潜式——浓烈、洞察、要真相',射手座:'远行式——乐观、宏观、要自由',
 摩羯座:'攀登式——自律、克己、要成就',水瓶座:'革新式——超前、疏离、要独立',双鱼座:'流动式——慈悲、梦幻、要合一'
};
const HOUSE_THEME={1:'自我形象与开局姿态',2:'金钱与价值感',3:'沟通、学习与近途',4:'家庭、根基与归属',5:'创造、恋爱与游戏',6:'日常、健康与服务',7:'伴侣与合作',8:'深度绑定与共同资源',9:'远行、高教与信念',10:'事业与社会角色',11:'社群、朋友与愿景',12:'潜意识、独处与消融'};
const ASPECT_MEANING={0:'合相（能量融合）',60:'六合（轻松协作）',90:'刑相（张力与成长课题）',120:'拱相（和谐流畅）',180:'对冲（两极拉扯与整合）',30:'半拱（微支持）',45:'半刑（微摩擦）',135:' Sesquiquadrate（节奏失衡）',150:'Quincunx（错位调试）'};
const ELEMENT_OF={白羊座:'火',狮子座:'火',射手座:'火',金牛座:'土',处女座:'土',摩羯座:'土',双子座:'风',天秤座:'风',水瓶座:'风',巨蟹座:'水',天蝎座:'水',双鱼座:'水'};
const SIGN_INDEX=Object.fromEntries(Object.keys(SIGN_TRAIT).map((s,i)=>[s,i]));

export function buildWesternDeepReport(w,at,analysis){
 const transitAt=at?new Date(at):new Date();
 const validTransitAt=!Number.isNaN(+transitAt)?transitAt:new Date();
 const transitStamp=validTransitAt.toLocaleString('zh-CN',{hour12:false});
 const gloss={};
 const planets=w?.planets||[],aspects=w?.aspects||[];
 // 尊贵度与命主星来自 analysis（chart() 已算好，此前被丢弃）；按行星名匹配，缺失时降级为中性，不影响旧调用
 const dignBy=new Map((analysis?.planets||[]).map(x=>[x.name,x.dignity]));
 const dignOf=p=>dignBy.get(p?.name)||p?.dignity||null;
 const rulerName=analysis?.chartRuler?.planet||null;
 // 星座名归一：兼容「狮子」与「狮子座」两种输入，统一到含「座」的键
 const signName=v=>{const s=typeof v==='string'?v:(v?.sign||v?.name||'—');return SIGN_TRAIT[s]?s:(SIGN_TRAIT[s+'座']?s+'座':s);};
 const asc=signName(w?.asc),mc=signName(w?.mc);
 const byKey=k=>planets.find(p=>p.key===k);
 const sun=byKey('sun'),moon=byKey('moon');
 const houseOf=p=>p?.house;

 /* 一、核心三要素 */
 const core=[
  `太阳在${sun?.sign||'—'}第${sun?.house||'—'}宫：你要成为的人是「${SIGN_TRAIT[signName(sun?.sign)]||'—'}」的，而第${sun?.house}宫（${HOUSE_THEME[sun?.house]||''}）是你投入生命力的主战场。`,
  `月亮在${moon?.sign||'—'}第${moon?.house||'—'}宫：情绪与安全感的配方是「${SIGN_TRAIT[signName(moon?.sign)]||'—'}」式的，在${HOUSE_THEME[moon?.house]||''}的场域里最容易放松和回血。`,
  `上升在${asc}：面对新环境的第一反应是「${SIGN_TRAIT[asc]||'—'}」；天顶（MC）在${mc}：事业与社会形象的方向带${SIGN_TRAIT[mc]||'—'}的色彩。上升—天顶轴线是全盘骨架。`,
  `日月升三者的关系速读：${sun&&moon&&houseOf(sun)!==houseOf(moon)?`太阳与月亮不同宫——「想要的我」与「需要的我」有落差，人生课题之一是让二者协作而非互搏：${HOUSE_THEME[sun.house]||''}是你想赢的地方，${HOUSE_THEME[moon.house]||''}是你真正能放松的地方，把这两件事排进同一周，人就不拧。`:`日月同宫或同主题——内外较为一致，目标感强，代价是「换个场景就不知道怎么放松」。`}`,
  // 三要素只回答了「是什么」，还要回答「怎么串起来」——命主星是那根线。
  `【一句话画像】用「${SIGN_TRAIT[asc]||''}」的方式进场，用「${SIGN_TRAIT[signName(sun?.sign)]||''}」的方式证明自己，靠「${SIGN_TRAIT[signName(moon?.sign)]||''}」的方式回血。这三句连起来就是别人对你的完整体验：先看到你的壳（上升），再看到你争什么（太阳），最后才发现你真正在乎什么（月亮）。`,
  ...(rulerName?[`【串起来的那根线】命主星是${rulerName}，落第${analysis.chartRuler?.house||'—'}宫（${HOUSE_THEME[analysis.chartRuler?.house]||''}）${analysis.chartRuler?.dignity?`·${analysis.chartRuler.dignity}`:''}——上升决定你「怎么出场」，命主星决定「出场之后往哪走」。这颗星所在的宫位，是你这一生反复回到的战场；它的尊贵度，决定你在这件事上是顺手还是硬扛。`]:[]),
  `【读法提醒】三要素是骨架，不是全部。太阳星座常被当成「我就是什么座」，其实它只回答「你想成为什么」；真正决定你日常反应的，是月亮（情绪）与上升（应对），以及后文相位与宫位给出的具体配置。`
 ];

 /* 二、逐星解读 */
 const planetLines=planets.filter(p=>p.key!=='nnode').map(p=>{
  const core2=PLANET_CORE[p.key];
  if(!core2)return '';
  gloss[p.name]=core2;
  const style=SIGN_TRAIT[signName(p.sign)]||'';
  const field=HOUSE_THEME[p.house]||'';
  const dg=dignOf(p),dgTone=DIGNITY_TONE[dg];
  const isRuler=rulerName&&p.name===rulerName;
  const quality=dgTone?`<b class="rpt-dignity rpt-dig-${dg}">【${dgTone.tag}】</b>${dgTone.text}`:'';
  const ruler=isRuler?' <b class="rpt-ruler">命主星</b>（上升的守护者）：它的状态是全盘的推进主力，落宫与相位尤其值得优先看。':'';
  return `<li><b>${p.name}${p.retro?' ℞':''} · ${p.sign} · 第${p.house}宫${isRuler?' · ★命主':''}</b><span>${core2}。以${style}的方式，展现在${field}之中${p.retro?'（逆行：能量内收，先内化再外放，不宜急于一次性兑现）':''}。${quality}${ruler}</span></li>`;
 }).join('');
 const planetSec=`<ul class="rpt-list">${planetLines||'<li>行星数据待排盘后生成。</li>'}</ul>`;
 const rulerLine=analysis?.chartRuler?`命主星（上升守护者）${rulerName||'—'}落${analysis.chartRuler.sign||'—'}第${analysis.chartRuler.house||'—'}宫${analysis.chartRuler.dignity?`（${analysis.chartRuler.dignity}）`:''}——它掌舵全盘的能量走向，是理解「哪颗星最该被优先照顾」的关键。`:null;
 const dignCount=analysis?.dignitiesSummary||null;
 const planetIntro=[
  `行星是「什么能量」，星座是「什么风格」，宫位是「哪个场域」，尊贵度（庙旺弱陷）是「这颗星状态好不好」——四者合读才算读完整。上表按个人行星（日月水金火：日常人格）→社会行星（木土：成长课题）→外行星（天海冥：世代背景）顺序理解。`,
  `尊贵度判读：入庙＝能量在家、发挥最稳；旺相＝力量放大、天赋突出；入弱＝客场作战、需后天练习；落陷＝课题最重、成熟度的主要来源，不是缺陷标签。同一颗星落在庙与落在陷，表达质量天差地别，不可只看星座与宫位。`,
  ...(rulerLine?[rulerLine]:[]),
  ...(dignCount?[`本盘庙旺弱陷分布：入庙 ${dignCount.入庙||0}、旺相 ${dignCount.旺相||0}、入弱 ${dignCount.入弱||0}、落陷 ${dignCount.落陷||0}。庙旺多者天赋资源足、起跑省力；弱陷多者课题感重但后发空间大——两者无好坏，只是能量的调度方式不同。`]:[]),
  `空宫不是缺失：没有行星的宫位，看它的守护星（星座守护者）落在哪一宫、与谁成相位——议题由宫主星承接。`
 ];

 /* 二·五、十二宫逐宫：宫头星座 + 宫内行星 + 宫主星落宫链条
   空宫不是没有议题——它由宫主星承接，宫主星落在哪一宫，这件事就在哪个场合被解决。
   旧报告只写了「空宫看宫主星」这句方法论，从没真的把这条链走一遍。 */
const SIGN_NAMES=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const RULER_OF={'白羊座':'火星','金牛座':'金星','双子座':'水星','巨蟹座':'月亮','狮子座':'太阳','处女座':'水星','天秤座':'金星','天蝎座':'冥王星','射手座':'木星','摩羯座':'土星','水瓶座':'天王星','双鱼座':'海王星'};
const RULER_CLASSIC={'天蝎座':'火星','水瓶座':'土星','双鱼座':'木星'};
const CN2KEY={'太阳':'sun','月亮':'moon','水星':'mercury','金星':'venus','火星':'mars','木星':'jupiter','土星':'saturn','天王星':'uranus','海王星':'neptune','冥王星':'pluto'};
const signAtLon=lon=>SIGN_NAMES[Math.floor((((Number(lon)||0)%360)+360)%360/30)];
const cuspsAll=w?.cusps||[];
const ascIdx=Math.max(0,SIGN_NAMES.indexOf(asc));
const houseCusp=h=>cuspsAll.length?signAtLon(cuspsAll[h-1]):SIGN_NAMES[(ascIdx+h-1)%12];
const HOUSE_ASK={1:'别人第一眼看到的你、以及你遇到新事的第一反应',2:'你怎么赚钱、怎么花钱、值不值钱的标准',3:'你怎么说话、怎么学东西、和身边人怎么往来',4:'你的家、你的根、你独处时回血的方式',5:'你怎么玩、怎么谈恋爱、怎么创造',6:'你的日常节奏、工作方式与身体状况',7:'你会被什么样的人吸引、合作怎么谈',8:'深度绑定：共同的钱、亲密关系里的信任与掌控',9:'你信什么、往哪里走、靠什么理解世界',10:'社会怎么看你、你爬到哪个位置',11:'你和群体的关系、你想要什么样的未来',12:'你不愿承认的部分、你怎么消化情绪'};
const houseLines=Array.from({length:12},(_,i)=>{
 const h=i+1,sign=houseCusp(h);
 const inside=planets.filter(p=>Number(p.house)===h);
 const ruler=RULER_OF[sign]||'';
 const rp=planets.find(p=>p.name===ruler);
 const classic=RULER_CLASSIC[sign];
 const rpDign=rp?dignOf(rp):null;
 const chain=rp
  ?`宫主${ruler}落第${rp.house}宫（${HOUSE_THEME[rp.house]||''}）${rpDign?`·${rpDign}`:''}——这一宫的议题最终会在「${HOUSE_THEME[rp.house]||''}」的场合里被解决，而不是在它自己的地盘上。`
  :`宫主${ruler}未在盘上定位。`;
 const insideTxt=inside.length
  ?`宫内${inside.map(p=>`${p.name}${p.retro?'℞':''}`).join('、')}——${inside.map(p=>PLANET_CORE[p.key]?.split('——')[0]).filter(Boolean).join('；')}，这几股能量主要在这个场域里使。另看${chain}`
  :`空宫——议题「外包」给宫主星：${chain}`;
 const classicHouse=classic?planets.find(p=>p.name===classic)?.house:null;
 const classicNote=classic&&!inside.length&&classicHouse!==rp?.house?`（古典占星以${classic}为${sign}的守护，按古法读则改为落第${classicHouse??'—'}宫——两种读法都成立，差别在于「用什么在管这件事」）`:'';
 return `【第${h}宫 · ${HOUSE_THEME[h]}】宫头${sign}。${insideTxt}${classicNote}这一宫回答的是：${HOUSE_ASK[h]}。`;
});
const houseIntro=[
 `十二宫是「人生的十二个房间」：行星说能量、星座说风格、宫位说场域。同一颗金星，落第2宫是「把钱花在美的东西上」，落第7宫是「用审美与和气经营关系」——星没变，房间变了。`,
 `读法：宫内有星，议题显性、由这颗星主导；宫空不等于没这回事，而是议题「外包」给了宫主星——宫主星落在哪一宫，这件事就在哪个房间被处理。本盘逐宫如下，先看自己的第1、2、7、10宫，那是自我、钱、关系、事业四条主线。`
];

/* 三、相位格局 */
 const NATURE_OF=a=>[60,120].includes(a)?'和谐':[90,180].includes(a)?'张力':a===0?'融合':'次要';
 const phaseState=x=>typeof x.applying==='boolean'?(x.applying?'入相位':'出相位'):null;
 const sorted=[...aspects].sort((a,b)=>(a.orb??99)-(b.orb??99)).slice(0,12);
 const aspRows=sorted.map(x=>{
  const tier=ORB_TIER(x.orb),nature=NATURE_OF(x.angle),state=phaseState(x);
  const weight=tier==='极紧'?'权重最高':tier==='紧'?'权重偏高':tier==='宽'?'中等权重':'轻度影响';
  const dynamic=state==='入相位'?'能量正在聚拢、议题趋于显性':state==='出相位'?'能量正在退潮、议题转入内化':'未标注出入相位，按容许度判读';
  return `<tr><td>${x.a} ${ASPECT_MEANING[x.angle]?.slice(0,3)||x.type||''} ${x.b}</td><td>${x.angle??'—'}°</td><td>${(x.orb??0).toFixed(1)}°<small class="rpt-orb-${tier}">${tier}</small></td><td>${nature}${state?' · '+state:''}<small>${weight}；${dynamic}</small></td></tr>`;
 }).join('');
 const aspTable=aspRows?`<table class="rpt-table"><thead><tr><th>相位</th><th>角度</th><th>容许度</th><th>性质与动态</th></tr></thead><tbody>${aspRows}</tbody></table>`:'';
 // 表格只给数值，读者仍不知道「这组相位在我身上是什么样」——按容许度取前六条逐条落到本盘。
const ANGLE_SENSE={0:'两者绑在一起，同进同退，常常分不清哪部分是自己的',60:'可以互相借力，但需要主动开口才会动',90:'两个需求互相卡住，只能在实践里找折中，没有一次性解法',120:'天赋回路：顺到容易不用，越用它越稳',180:'两端拉扯，成熟的做法是轮流满足，而不是选一边站',30:'轻微助力，属于「有更好、没有也行」',45:'轻微摩擦，长期积累会变成习惯性烦躁',135:'节奏对不上：一方快一方慢，配合需要额外协调',150:'错位：两边都在做对的事，但时机总差一点'};
const NATURE_ACTION={和谐:'把它当资源用，别当护身符——不用就不会兑现。',张力:'把它当课题做：这类拉扯不会消失，只能被驯服成手感。',融合:'注意边界：分不清彼此的时候，容易替对方承担。',次要:'背景音，不必为它做决定。'};
const keyAspects=sorted.slice(0,6).map((x,i)=>{
 const ka=CN2KEY[x.a],kb=CN2KEY[x.b];
 const ca=PLANET_CORE[ka]?.split('——')[0]||x.a,cb=PLANET_CORE[kb]?.split('——')[0]||x.b;
 const nat=NATURE_OF(x.angle);
 const tier=ORB_TIER(x.orb);
 return `【${x.a} ${ASPECT_MEANING[x.angle]?.replace(/（.*/,'')||x.type||''} ${x.b} · 容许 ${(x.orb??0).toFixed(1)}° ${tier}】${ca} 与 ${cb}：${ANGLE_SENSE[x.angle]||'两者之间有持续互动'}。${i===0?'其中容许度最小、也最响的一组：它几乎定义了你处理这类事的方式。':tier==='极紧'?'同属最紧的一档，日常里持续起作用。':tier==='紧'?'分量很重，日常里会反复出现。':'属于背景层，关键时刻才会显形。'}${NATURE_ACTION[nat]||''}`;
});
 const aspLines=[
  `相位是行星之间的「对话」。容许度（orb，与精确角度的偏差）越小，对话声音越大——上表按紧到松排列，每行列明松紧等级与权重：极紧／紧是人格里最响的主旋律，宽／松是背景和声。`,
  `入相位（applying）＝两星仍在接近精确角度，能量上升、议题趋于事件化，权重加一档；出相位（separating）＝已过精确点正在远离，能量退潮、议题转为内化沉淀。同一组相位，入与出的读法不同（本盘若未标注出入相位，则仅按容许度判读）。`,
  `和谐相位（六合/拱）是天赋的顺水推舟；张力相位（刑/冲）是成长的心脏压——两者都要「用」才会兑现。多相位指向同一主题时才形成稳定行为模式——单相位不定人格。`,
  ...(keyAspects.length?[`【本盘最紧的 ${keyAspects.length} 组相位】`]:[]),
  ...keyAspects
 ];
 // 宫主星互融（Reception）：A 落在 B 守护的星座＝B 在家接待 A，比单纯相位更稳的结构性支援。
 const recps=analysis?.receptions||[];
 const mutual=recps.filter(r=>r.kind==='mutual'),single=recps.filter(r=>r.kind==='single');
 if(recps.length){
  gloss['互融 Reception']='古典占星概念：A 星落在 B 星守护的星座，等于 B 在自己家里接待 A，A 较易得到 B 的配合；双方互落对方守护星座即互融(mutual reception)，是比相位更稳定的良性结构';
  aspLines.push(...recps.map(r=>`【${r.kind==='mutual'?'互融':'单方接收'}】${r.text}`));
  aspLines.push(`互融读法：${mutual.length?`本盘有 ${mutual.length} 组互融——这些行星彼此给力，遇事能互相援手，是最可靠的良性结构，值得优先用来成事。`:'本盘无严格互融（没有两星互在对方守护星座）——支援关系多为单向或须靠相位接通。'}${single.length?`另有 ${single.length} 组单方接收：客星易得主星资源，但回报不对等，长久相处宜主动回馈。`:''}互融只看星座守护关系，与吉凶无关——它回答的是「这两股能量配不配合」，不预测具体事件。`);
 }

 /* 四、格局检测 */
 const patterns=[];
 // 星群：同星座或同宫 ≥3 星
 const bySign={},byHouse={};
 for(const p of planets){const s=signName(p.sign);bySign[s]=(bySign[s]||[]).concat(p.name);byHouse[p.house]=(byHouse[p.house]||[]).concat(p.name);}
 for(const [s,ps] of Object.entries(bySign))if(ps.length>=3)patterns.push(`【星群 Stellium】${ps.join('、')}同落${s}——能量高度集中：${SIGN_TRAIT[s]}的特质与${ELEMENT_OF[s]||''}元素主题被放大，人生主线清晰但弹性降低。`);
 for(const [h,ps] of Object.entries(byHouse))if(ps.length>=3)patterns.push(`【宫位星群】${ps.join('、')}同聚第${h}宫（${HOUSE_THEME[h]}）——此领域是你绕不开的人生主战场。`);
 // 大三角：三行星两两 120°（容许 8°）
 const ang=(a,b)=>{const ia=SIGN_INDEX[signName(a.sign)],ib=SIGN_INDEX[signName(b.sign)];if(ia==null||ib==null)return null;const d=Math.abs(ia-ib)%12;return Math.min(d,12-d)*30;};
 const trine=[];
 for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++)if(ang(planets[i],planets[j])===120)trine.push([planets[i],planets[j]]);
 for(let i=0;i<trine.length;i++)for(let j=i+1;j<trine.length;j++){
  const names=new Set([...trine[i],...trine[j]].map(p=>p.name));
  if(names.size===3&&!patterns.some(x=>x.includes('Grand Trine')&&[...names].every(n=>x.includes(n)))){
   const ps=[...names].map(n=>planets.find(p=>p.name===n));
   const els=[...new Set(ps.map(p=>ELEMENT_OF[signName(p.sign)]))];
   if(els.length===1)patterns.push(`【大三角 Grand Trine】${ps.map(p=>p.name).join('、')}同属${els[0]}元素成三角——${els[0]}象天赋回路：天生顺、易荒废，须主动给目标。`);
   else patterns.push(`【多元素三角】${ps.map(p=>p.name).join('、')}成三角但跨元素（${els.join('、')}）——和谐中带张力，反而更有行动力。`);
  }
 }
 // T 三角：一对 180° + 与第三星均 90°
 for(let i=0;i<planets.length;i++)for(let j=i+1;j<planets.length;j++){
  if(ang(planets[i],planets[j])!==180)continue;
  for(let k=0;k<planets.length;k++){
   if(k===i||k===j)continue;
   if(ang(planets[i],planets[k])===90&&ang(planets[j],planets[k])===90){
    patterns.push(`【T 三角 T-Square】${planets[i].name}—${planets[j].name}对冲，顶点${planets[k].name}——人生引擎：顶点行星所在的宫位（第${planets[k].house}宫·${HOUSE_THEME[planets[k].house]}）是反复出现的压力与突破出口，压力即动力。`);
    k=planets.length;
   }
  }
 }
 // 元素失衡
 const elCount={};
 for(const p of planets){const e=ELEMENT_OF[signName(p.sign)];if(e)elCount[e]=(elCount[e]||0)+1;}
 if(asc)elCount[ELEMENT_OF[asc]]=(elCount[ELEMENT_OF[asc]]||0)+1;
 const entries=Object.entries(elCount).sort((a,b)=>b[1]-a[1]);
 const dominant=entries[0],missing=['火','土','风','水'].filter(e=>!elCount[e]);
 const elementLines=[
  `元素分布：${entries.map(([e,n])=>`${e}${n}`).join(' · ')}。主导${dominant?.[0]}元素——${({火:'行动先于思考，节奏快',土:'务实稳重，重视可落地',风:'思维活跃，重信息与交流',水:'情感丰沛，凭直觉走'})[dominant?.[0]]||''}。`,
  missing.length?`缺${missing.join('、')}元素——${missing.map(m=>({火:'行动力需要刻意练习：先做再想',土:'落地需要外挂系统：清单、日程、账本',风:'观点需要碰撞：主动找人聊',水:'情绪需要出口：艺术、水、冥想'})[m]).join('；')}。缺什么就外挂什么，不必自责。`:'四元素齐备——能量类型全面，弹性大。'
 ];
 // 模式（基本/固定/变动）失衡：古典三分法，描述「人怎么推进事情」，与元素（能量类型）互补。
 // analysis.modalities 由 src/analysis.mjs 统计；缺失时按本盘行星自行兜底，保证报告自足。
 const MOD_TRAIT={基本:'开创与启动——善于起头、抓时机，弱项是虎头蛇尾',固定:'坚持与守成——耐力与定力强，弱项是抗拒改变',变动:'适应与流转——灵活善变、擅长收尾，弱项是难以持久'};
 const MODE_OF={'白羊座':'基本','巨蟹座':'基本','天秤座':'基本','摩羯座':'基本','金牛座':'固定','狮子座':'固定','天蝎座':'固定','水瓶座':'固定','双子座':'变动','处女座':'变动','射手座':'变动','双鱼座':'变动'};
 const modeStat=analysis?.modalities?.percentages
  ?{percentages:analysis.modalities.percentages,dominant:analysis.modalities.dominant||[],missing:analysis.modalities.missing||[]}
  :(()=>{const c={基本:0,固定:0,变动:0};for(const p of planets){const m=MODE_OF[signName(p.sign)];if(m)c[m]++;}const total=Object.values(c).reduce((a,b)=>a+b,0)||1;
     return {percentages:Object.fromEntries(Object.entries(c).map(([k,v])=>[k,100*v/total])),dominant:Object.keys(c).filter(k=>c[k]===Math.max(...Object.values(c))),missing:Object.keys(c).filter(k=>!c[k])};})();
 const mPct=modeStat.percentages;
 const mDom=modeStat.dominant||[];
 const modeLines=[
  `模式分布（人怎么推进事情）：基本 ${(mPct['基本']||0).toFixed(0)}% · 固定 ${(mPct['固定']||0).toFixed(0)}% · 变动 ${(mPct['变动']||0).toFixed(0)}%。${mDom.length?`主导「${mDom.join('、')}」模式——${mDom.map(m=>MOD_TRAIT[m]).join('；')}。`:''}元素说的是「能量是什么」，模式说的是「能量怎么动」，两者合看才完整。`,
  modeStat.missing?.length
   ? `缺${modeStat.missing.join('、')}模式——${modeStat.missing.map(m=>({基本:'起头需要外力推动或刻意立项：先定一个明确的第一步',固定:'持久力需外挂结构：承诺、期限、问责伙伴',变动:'灵活度需刻意留白：别把计划排满，预留调整空间'})[m]).join('；')}。缺的不是能力，是可借力的习惯。`
   : '三种模式齐备——启动、坚持、收尾都能自我供给，面对不同阶段切换弹性大。'
 ];
 const topPatterns=patterns.slice(0,8);
 const patternSec=topPatterns.length?topPatterns:['未检出经典格局（星群/大三角/T三角）——格局不是好命的必要条件，多数人的驱动力来自紧张相位而非天赋格局。'];
 patternSec.push(...elementLines,...modeLines);

 /* 五、所选时点行运触发点（星历实算） */
 const TRANSIT_INFO={
  jupiter:{name:'木星',theme:'扩张与机遇——所触之宫位进入放大期，机会窗口约一年'},
  saturn:{name:'土星',theme:'验收与结构——所触之宫位进入责任期，压力与成熟同来，约两年半'},
  uranus:{name:'天王星',theme:'变革与松绑——所触之宫位出现意外翻新，约七年'},
  neptune:{name:'海王星',theme:'消融与梦想——所触之宫位边界变模糊，宜防理想化，约十四年'},
  pluto:{name:'冥王星',theme:'深层转化——所触之宫位旧结构连根拔起再重建，约二十年'}
 };
 const transitRows=[];
 const now=validTransitAt;
 try{
  const cusps=w?.cusps||[];
  const norm=x=>((x%360)+360)%360;
  const natalHouseOf=lon=>{
   for(let i=0;i<12;i++){
    const a=cusps[i]??i*30,b=cusps[(i+1)%12]??((i+1)*30);
    const d=norm(lon-a),span=norm(b-a);
    if(d<span)return i+1;
   }
   return Math.floor(norm(lon)/30)+1;
  };
  const SIGN_NAMES=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
  const TRANSIT_IDS={jupiter:5,saturn:6,uranus:7,neptune:8,pluto:9};
  for(const [key,info] of Object.entries(TRANSIT_INFO)){
   const body=bodyAt(now,TRANSIT_IDS[key],0);
   if(!body||!Number.isFinite(body.longitude))continue;
   const tLon=norm(body.longitude);
   const tSign=SIGN_NAMES[Math.floor(tLon/30)];
   const tHouse=natalHouseOf(tLon);
   let hits=[];
   for(const p of planets){
    if(!Number.isFinite(p.lon))continue;
    const s=norm(tLon-norm(p.lon));
    for(const a of [0,60,90,120,180]){
     const d=Math.min(Math.abs(s-a),360-Math.abs(s-a));
     if(d<=2.5)hits.push({p,a,d,level:'正激活'});
     else if(d<=5)hits.push({p,a,d,level:'临近'});
    }
   }
   hits.sort((x,y)=>x.d-y.d);hits=hits.slice(0,4);
   const hitText=hits.map(h=>`${h.p.name}${h.level}（${ASPECT_MEANING[h.a]?.replace(/（.*/,'')||'相位'}，容许度${h.d.toFixed(1)}°）`).join('、');
   transitRows.push(`<li><b>${info.name} · 现行 ${tSign} · 你本命第${tHouse}宫（${HOUSE_THEME[tHouse]}）</b><span>${info.theme}。${hitText?`对本命：${hitText}——被触行星的主题（${hits.map(h=>PLANET_CORE[h.p.key]?.split('——')[0]).filter(Boolean).join('、')}）将在该宫位领域被点名重演。`:`当前与你的本命行星无紧密相位——行运吉凶中性，看该宫本身的课题节奏。`}</span></li>`);
  }
 }catch{transitRows.length=0;}
 const transitSec=transitRows.length?`<ul class="rpt-list">${transitRows.join('')}</ul>`:'行运数据待星历支持后生成。';
 const transitIntro=[
  `行运（Transit）：天上行星在所选时刻（${transitStamp}）的真实位置与你本命盘的对话。上表由星历按该时刻实算——每颗外行星当时的星座、进入你本命的哪一宫、正与你哪些本命行星成相位；换一个时点重算，这一段会随之改变。`,
  `用法：木星过境＝播种窗口（该宫领域主动争取）；土星过境＝验收期（该宫领域补结构、还旧账）；天海冥过境＝时代级课题（该宫领域的深层改版）。正激活（容许度≤2.5°）是当下最强音，临近（≤5°）是未来数月将进入的主题。`
 ];

 /* 七、领域速览与建议：每个领域都走一遍「宫头—宫内星—宫主星」链条，不再只给一句口号 */
 const houseOf2=h=>({sign:houseCusp(h),inside:planets.filter(p=>Number(p.house)===h),ruler:RULER_OF[houseCusp(h)]||'',rulerP:planets.find(p=>p.name===(RULER_OF[houseCusp(h)]||''))});
 const h10=houseOf2(10),h2=houseOf2(2),h8=houseOf2(8),h7=houseOf2(7),h6=houseOf2(6);
 const chainOf=(o,label)=>{
  if(!o.rulerP)return `${label}宫主${o.ruler}未定位`;
  return `${label}宫主${o.ruler}落第${o.rulerP.house}宫（${HOUSE_THEME[o.rulerP.house]}）${dignOf(o.rulerP)?`·${dignOf(o.rulerP)}`:''}`;
 };
 const insideTxt=o=>o.inside.length?o.inside.map(p=>`${p.name}${p.retro?'℞':''}（${PLANET_CORE[p.key]?.split('——')[0]||''}）`).join('、'):'空宫';
 const domains=[
  `【事业】第10宫（社会角色）宫头${mc}，宫内${insideTxt(h10)}；${chainOf(h10,'第10')}。第6宫（日常与工作方式）宫内${insideTxt(h6)}。这两宫合看是「你想被看作什么」与「你每天实际在做什么」——${h10.inside.length?'第10宫有星，事业议题显性，你会主动争取舞台':`第10宫空，事业方向由宫主${h10.ruler}所在的「${HOUSE_THEME[h10.rulerP?.house]||''}」定义，而不是由职位名称定义`}。往「${SIGN_TRAIT[mc]||'务实'}」的方向走，成色看土星与木星的状态。`,
  `【财富】第2宫（自己的钱）宫头${h2.sign}，宫内${insideTxt(h2)}；${chainOf(h2,'第2')}。第8宫（共同的钱、他人的资源）宫头${h8.sign}，宫内${insideTxt(h8)}；${chainOf(h8,'第8')}。${byKey('venus')?`金星在${byKey('venus').sign}第${byKey('venus').house}宫——你花钱的方式是${SIGN_TRAIT[signName(byKey('venus').sign)]?.split('——')[1]||'按感觉走'}，赚钱的方式则看第2与第10两条链。`:''}${h2.inside.length?'钱的事你愿意正面处理，适合自己管账。':'第2宫空：钱容易「不主动管」，建议把记账、定投这类事交给固定流程而不是自律。'}`,
  `【感情】第7宫（伴侣与合作）宫头${h7.sign}，宫内${insideTxt(h7)}；${chainOf(h7,'第7')}。${byKey('venus')?`金星（爱的方式）在${byKey('venus').sign}第${byKey('venus').house}宫——${PLANET_CORE.venus.split('——')[0]}落在「${HOUSE_THEME[byKey('venus').house]}」，所以你的吸引力在这个场域里最有效。`:''}${byKey('moon')?`月亮（安全感）在${byKey('moon').sign}第${byKey('moon').house}宫——关系里真正让你安心的，是${HOUSE_THEME[byKey('moon').house]}这件事被满足。`:''}${h7.inside.length?'第7宫有星：关系议题会反复成为人生主线，晚婚或关系形态非典型都属正常。':'第7宫空：不是不重视关系，而是关系的模样由宫主星决定，随大限行运成形。'}`,
  `【成长节奏】推运（次限／行运／日返月返）是时间层：行运触发本命相位时，旧主题会重演一次，这次可以做得不一样。重大决定建议交叉核对本命与行运两层——本命说「你是什么结构」，行运说「现在这个结构正在被什么推着」。`,
  `【怎么用这份报告】先读第一章的三要素（你是谁），再读第三章十二宫（你在哪几个房间最用力），最后读第七章的领域（钱、关系、事业各走哪条链）。凡是本报告没给证据的句子，都可以不信——占星的价值在于提供一套可核对的观察语言，不在预测。`,
  `本报告由行星落点、宫头、宫主星链条、相位容许度与格局几何逐条推导。占星为传统文化与自我观察工具，不构成事实预测、投资、心理或医疗建议。`
 ];

const sections=[
  {title:'一、核心三要素与人格骨架',lines:core},
  {title:'二、逐星解读（星座×宫位）',lines:planetIntro,html:planetSec},
  {title:'三、十二宫逐宫解读（宫头×宫内星×宫主星）',lines:houseIntro.concat(houseLines)},
  {title:'四、相位格局',lines:aspLines,table:aspTable},
  {title:'五、盘面格局与元素',lines:patternSec},
  {title:'六、所选时点行运触发点（星历实算）',lines:transitIntro,html:transitSec},
  {title:'七、领域速览与成长建议',lines:domains}
 ];
 return {title:'西洋占星 · 本命详批',sections,glossary:gloss,kind:'west'};
}
