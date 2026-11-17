// 西洋占星深度知识库：逐星「星座×宫位」成篇解读 + 盘面格局检测（星群/大三角/T三角/元素失衡）。
// 行运触发点由星历实算（木土天海冥当前行度对本命行星的相位与落宫）。
import {bodyAt} from '../../src/ephemeris.mjs';
const GLOSS={};
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

export function buildWesternDeepReport(w){
 const gloss={};
 const planets=w?.planets||[],aspects=w?.aspects||[];
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
  `日月升三者的关系速读：${sun&&moon&&houseOf(sun)!==houseOf(moon)?`太阳与月亮不同宫——「想要的我」与「需要的我」有落差，人生课题之一是让二者协作而非互搏。`:`日月同宫或同主题——内外较为一致，目标感强。`}`
 ];

 /* 二、逐星解读 */
 const planetLines=planets.filter(p=>p.key!=='nnode').map(p=>{
  const core2=PLANET_CORE[p.key];
  if(!core2)return '';
  gloss[p.name]=core2;
  const style=SIGN_TRAIT[signName(p.sign)]||'';
  const field=HOUSE_THEME[p.house]||'';
  return `<li><b>${p.name}${p.retro?' ℞':''} · ${p.sign} · 第${p.house}宫</b><span>${core2}。以${style}的方式，展现在${field}之中${p.retro?'（逆行：能量内收，先内化再外放，不宜急于一次性兑现）':''}。</span></li>`;
 }).join('');
 const planetSec=`<ul class="rpt-list">${planetLines||'<li>行星数据待排盘后生成。</li>'}</ul>`;
 const planetIntro=[
  `行星是「什么能量」，星座是「什么风格」，宫位是「哪个场域」——三星合读，一颗行星才读完整。上表按个人行星（日月水金火：日常人格）→社会行星（木土：成长课题）→外行星（天海冥：世代背景）顺序理解。`,
  `空宫不是缺失：没有行星的宫位，看它的守护星（星座守护者）落在哪一宫、与谁成相位——议题由宫主星承接。`
 ];

 /* 三、相位格局 */
 const sorted=[...aspects].sort((a,b)=>(a.orb??99)-(b.orb??99)).slice(0,12);
 const aspRows=sorted.map(x=>`<tr><td>${x.a} ${ASPECT_MEANING[x.angle]?.slice(0,3)||x.type||''} ${x.b}</td><td>${x.angle??'—'}°</td><td>${(x.orb??0).toFixed(1)}°</td><td>${ASPECT_MEANING[x.angle]?.replace(/（.*/,'')||'综合判读'}</td></tr>`).join('');
 const aspTable=aspRows?`<table class="rpt-table"><thead><tr><th>相位</th><th>角度</th><th>容许度</th><th>类型</th></tr></thead><tbody>${aspRows}</tbody></table>`:'';
 const aspLines=[
  `相位是行星之间的「对话」。容许度（orb，即与精确角度的偏差）越小，对话声音越大——上表按紧到松排列，前几条是你人格中最响的内部对话。`,
  `读法：和谐相位（六合/拱）是天赋的顺水推舟；紧张相位（刑/冲）是成长的心脏压——两者都要「用」才会兑现，顺境须落实，逆境须整合。`,
  `多相位指向同一主题（同一行星被反复触及，或同主题宫位被反复强调）时，才会形成稳定的行为模式——单相位不定人格。`
 ];

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
 const topPatterns=patterns.slice(0,8);
 const patternSec=topPatterns.length?topPatterns:['未检出经典格局（星群/大三角/T三角）——格局不是好命的必要条件，多数人的驱动力来自紧张相位而非天赋格局。'];
 patternSec.push(...elementLines);

 /* 五、当下行运触发点（星历实算） */
 const TRANSIT_INFO={
  jupiter:{name:'木星',theme:'扩张与机遇——所触之宫位进入放大期，机会窗口约一年'},
  saturn:{name:'土星',theme:'验收与结构——所触之宫位进入责任期，压力与成熟同来，约两年半'},
  uranus:{name:'天王星',theme:'变革与松绑——所触之宫位出现意外翻新，约七年'},
  neptune:{name:'海王星',theme:'消融与梦想——所触之宫位边界变模糊，宜防理想化，约十四年'},
  pluto:{name:'冥王星',theme:'深层转化——所触之宫位旧结构连根拔起再重建，约二十年'}
 };
 const transitRows=[];
 const now=new Date();
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
  `行运（Transit）：天上行星此刻的真实位置与你本命盘的对话。上表由星历按当下时刻实算——每颗外行星现在的星座、进入你本命的哪一宫、正与你哪些本命行星成相位。这是「现在进行时」的一章。`,
  `用法：木星过境＝播种窗口（该宫领域主动争取）；土星过境＝验收期（该宫领域补结构、还旧账）；天海冥过境＝时代级课题（该宫领域的深层改版）。正激活（容许度≤2.5°）是当下最强音，临近（≤5°）是未来数月将进入的主题。`
 ];

 /* 六、领域速览与建议 */
 const findHouse=h=>planets.filter(p=>p.house===h).map(p=>p.name);
 const domains=[
  `事业：看天顶${mc}、第10宫${findHouse(10).join('、')||'空宫（看宫主星）'}与第6宫（${findHouse(6).join('、')||'日常工作象限'}）——方向在${SIGN_TRAIT[mc]||'—'}，成色看土星与木星的状态。`,
  `财富：看第2宫${findHouse(2).join('、')||'（宫主星）'}与第8宫${findHouse(8).join('、')||'（共同资源）'}——金星与金牛/天蝎轴线给出赚钱与用钱的风格。`,
  `感情：看金星（${byKey('venus')?.sign||'—'}第${byKey('venus')?.house||'—'}宫）与第7宫${findHouse(7).join('、')||'（宫主星）'}、月亮与第4宫（家的需求）——爱的方式由金星定，关系里的安全感由月亮定。`,
  `成长节奏：推运（次限/行运/日返月返）是时间层——行运触发本命相位时旧主题重现；排盘页可切换各推运逐段核对。重大决策建议交叉核对本命与行运两层。`,
  `本报告由行星落点、相位容许度与格局几何逐条推导。占星为传统文化与自我观察工具，不构成事实预测、投资、心理或医疗建议。`
 ];

 const sections=[
  {title:'一、核心三要素与人格骨架',lines:core},
  {title:'二、逐星解读（星座×宫位）',lines:planetIntro,html:planetSec},
  {title:'三、相位格局',lines:aspLines,table:aspTable},
  {title:'四、盘面格局与元素',lines:patternSec},
  {title:'五、当下行运触发点（星历实算）',lines:transitIntro,html:transitSec},
  {title:'六、领域速览与成长建议',lines:domains}
 ];
 return {title:'西洋占星 · 本命详批',sections,glossary:gloss,kind:'west'};
}
