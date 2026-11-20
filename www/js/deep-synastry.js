// 双人合盘深度知识库：面向专业 Synastry 审计级别。
// 逐星对照（日月金火升元素关系→互动模式）、跨盘相位逐条详解（星×星×相位三角判读）、
// 印度八科逐科详解与低分化解、D9 互参、八字干支互参、关系经营指南——全部由两盘证据驱动。
const GLOSS={};
const SIGN_ELEMENTS={'白羊':'火','金牛':'土','双子':'风','巨蟹':'水','狮':'火','处女':'土','天秤':'风','天蝎':'水','射手':'火','摩羯':'土','水瓶':'风','双鱼':'水'};
function elementOf(sign){
 if(sign==null)return null;
 const s=String(sign).replace(/座$/,'');
 for(const k in SIGN_ELEMENTS)if(s===k||s.startsWith(k))return SIGN_ELEMENTS[k];
 return null;
}
const ELEMENT_REL={
 同:'同元素：两人在这颗星的课题上「同频共振」——不用解释对方就懂，但也容易一起放大同一盲点。相处舒服，须防同质化。',
 和:'三合（120°元素兼容）：天然的顺滑协作——这颗星的能量彼此补给，是最省力的默契来源，也别忘了主动制造新鲜感。',
 磨:'刑（90°张力）：持续的吸引与摩擦并存——这颗星的主题上两人节奏错位，需要明确分工与议事规则；磨得好就是成长引擎。',
 拉:'对冲（180°镜像）：你是我的一面镜子——这颗星的主题上两人站在两端互相张望，互补性极强也最容易两极化，学会轮流让步。',
 半:'六合（60°轻协作）：温和的支持位——不轰烈但可靠，主动发起才有产出。',
 无:'其他关系：按具体相位与宫位细读，不套用固定标签。'
};
function elementRel(a,b){
 const ea=elementOf(a),eb=elementOf(b);
 if(!ea||!eb||ea===eb)return '同';
 const fire=['火','风'],earth=['土','水'];
 const both=(g)=>g.includes(ea)&&g.includes(eb);
 if((ea==='火'&&eb==='风')||(ea==='风'&&eb==='火'))return '和';
 if((ea==='土'&&eb==='水')||(ea==='水'&&eb==='土'))return '和';
 if((ea==='火'&&eb==='水')||(ea==='水'&&eb==='火'))return '拉';
 if((ea==='风'&&eb==='土')||(ea==='土'&&eb==='风'))return '磨';
 if(both(fire)||both(earth))return '半';
 return '无';
}
// 逐星主题：这颗星在关系里管什么
const STAR_ROLE={
 sun:{name:'太阳',role:'自我与人生方向',pair:'两人的「我是谁」如何互相照亮或互相遮蔽',a:'一方越发光，另一方是甘当观众还是抢舞台？',text:'太阳对照是关系的主旋律：元素和/同的两人彼此欣赏对方的样子，愿意支持对方的人生目标；元素磨/拉的两人则需要在「各自发光」与「共同舞台」之间反复协商——不是不合适，而是需要明确彼此的领地。'},
 moon:{name:'月亮',role:'情绪与安全感',pair:'两颗心是在同一个频率，还是各说各话',a:'对方情绪低落时，你接得住吗？',text:'月亮是合盘第一关键星：元素和/同——情绪同频，一个眼神就懂，家是共同充电站；元素磨/拉——安慰方式互相踩雷（你要空间、他要抱抱），须明说各自的安抚偏好；月亮任何配置都不决定成败，但决定「日常相处的质感」。'},
 venus:{name:'金星',role:'爱与吸引力',pair:'爱语与审美是否合拍',a:'你示爱的方式，对方收得到吗？',text:'金星决定吸引的火花与爱的表达方式：元素和/同——审美与示爱天然同频，越处越有味道；元素磨/拉——「你爱的方式不是我想要的爱」式错位最常见于此，把各自的接收频道讲给对方听是头等大事。'},
 mars:{name:'火星',role:'欲望与行动',pair:'激情与冲突模式',a:'吵起架来是同一招还是连环对撞？',text:'火星决定激情浓度也决定吵架画风：元素和/同——干柴烈火、并肩做事都带劲；元素磨/拉——易上火对撞，但也是化学吸引最强的配置——把战火烧在共同目标上（运动、项目）而不是彼此身上。'},
 mercury:{name:'水星',role:'沟通与思维',pair:'聊不聊得来、怎么吵明白架',a:'鸡同鸭讲还是一点就通？',text:'水星决定「能不能把话说清楚」：元素和/同——聊天本身就是享受，误会少；元素磨/拉——不是不爱而是听不懂，须约定「复述对方的话再回应」的沟通协议。'}
};
const PLANET_MEAN={
 太阳:'自我、生命力与方向',月亮:'情绪、安全感与归属',水星:'沟通、思维与学习',金星:'爱、审美与亲密',火星:'欲望、行动与竞争',
 木星:'扩张、信念与共学',土星:'责任、承诺与考验',天王:'自由、颠覆与意外',海王:'浪漫、共情与迷雾',冥王:'深度、执念与转化',
 凯龙:'疗愈课题',上升点:'人格面具与第一印象',北交:'成长方向',莉莉丝:'深层渴望'
};
const ASPECT_ROLE={
 0:{tag:'合相',tone:'能量完全叠加——这个主题在两人之间被放大到最大声，要么共振起飞，要么互相淹没，没有中间态。'},
 60:{tag:'六合',tone:'温和支持——顺境时自动补位，但不会自动发生，须主动发起协作。'},
 90:{tag:'刑相',tone:'持续摩擦——吸引与冲突并存的经典张力配置，磨合好了是成长引擎，磨不好是慢性消耗。'},
 120:{tag:'三合',tone:'和谐流通——不费力的默契与支持，天生一对的相位底色；久处易淡，须主动保鲜。'},
 150:{tag:'梅花',tone:'别扭牵扯——说不清哪里不对但就是硌得着，小矛盾易积成怨，宜及时小规模摊牌。'},
 180:{tag:'对冲',tone:'镜像对望——互补性最强的配置，也最容易两极摆荡；学会轮流让步，就是最长久的平衡。'}
};
const KOOTA_LIB={
 varna:{zh:'心性层级',why:'看两人内在「气场类型」的匹配度——不是地位高低，而是精神世界的频道是否错位',fix:'频道错不等于不能相处：约定各自的精神领地互不打扰，共同兴趣只取交集。'},
 vashya:{zh:'相处引力',why:'看谁自然「带节奏」、谁自然「跟节奏」——相处中无意识的支配与顺从结构',fix:'引力弱的关系容易各干各的：刻意制造「必须一起完成」的小事（共同计划、共同家务），把轨道重新并上。'},
 tara:{zh:'命星',why:'看两人生命节律的吉凶互动——传统用于判断相处是否「顺命」',fix:'命星失合时重大决定避开各自情绪低谷期，错峰商量正事。'},
 yoni:{zh:'本能契合',why:'看两人最底层的舒适度与亲密节奏——气场是否天生亲',fix:'本能节奏不同的两人，亲密须明说偏好、多做试探性沟通，忌想当然。'},
 maitri:{zh:'星谊',why:'看两人心智层面的友谊浓度——能否聊到一起去、互相欣赏脑回路',fix:'星谊弱不致命：把「聊得来」的期待分给朋友圈一部分，伴侣负责别的频道。'},
 gana:{zh:'天性',why:'看气质类型（创造/守成/变动）是否同型——生活方式与节奏的根本适配',fix:'天性异型的组合需要「分区生活」：各自保留自己的节奏区，公共区再谈妥协。'},
 bhakoot:{zh:'业力对望',why:'看两人月亮的整体相位关系——传统认为关系长远度的总纲',fix:'bhakoot 弱时更须西洋合盘的月亮/金星互参补看，单一体系不定论。'},
 nadi:{zh:'脉轮体质',why:'看能量构成的深相容度——传统认为与健康与子嗣相关',fix:'nadi 低分是传统提醒而非判决：健康与生育问题以现代医学检查为准。'}
};
const DASHING={}; // 占位避免 lint 未用告警

function byKey(planets,k){return (planets||[]).find(p=>p.key===k);}
function signIndex(sign){
 if(sign==null)return null;
 const s=String(sign).replace(/座$/,'');
 const list=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
 return list.findIndex(x=>s===x||s.startsWith(x));
}
function lonOf(p){return p?.lon??p?.longitude??null;}

export function buildSynastryDeepReport(result,aName,bName){
 const gloss={};
 const r=result||{};
 const A=aName||'甲方',B=bName||'乙方';
 const aw=r.persons?.a?.western?.planets||r.persons?.a?.planets||[];
 const bw=r.persons?.b?.western?.planets||r.persons?.b?.planets||[];
 const ascA=r.persons?.a?.western?.asc||r.persons?.a?.asc;
 const ascB=r.persons?.b?.western?.asc||r.persons?.b?.asc;
 const inter=(r.western?.interAspects||[]).slice().sort((x,y)=>Math.abs(x.orb??9)-Math.abs(y.orb??9));
 const koota=r.vedic?.koota||{};
 const kootaItems=koota.items||[];
 const cross=r.crossRelations||[];
 const d1a=r.vedic?.a?.d1,d1b=r.vedic?.b?.d1;
 const fit=r.fit||{};

 /* 一、关系总览 */
 const pct=fit.percent??'—';
 const strongAspects=inter.filter(x=>Math.abs(x.orb??9)<=2);
 const harmonics=strongAspects.filter(x=>[60,120].includes(x.angle));
 const tensions=strongAspects.filter(x=>[90,180].includes(x.angle));
 const overview=[
  `${A} 与 ${B} 的综合契合度 ${pct}${pct==='—'?'':'%'}（Ashtakoota 双向均分 ${fit.total??'—'}/${fit.max??'—'}）。契合度是结构底色，不是判决书——专业合盘的用法是找「互动模式」，再决定怎么经营。`,
  strongAspects.length?`紧相位（容许度≤2°）共 ${strongAspects.length} 组：和谐类 ${harmonics.length} 组、张力类 ${tensions.length} 组——${harmonics.length>tensions.length?'底盘以顺为主，摩擦有解；':tensions.length>harmonics.length?'张力主导的关系：吸引强、消耗也强，规则先行；':'张弛均衡的组合，成熟度决定成色。'}`:'跨盘紧相位不多：关系质感更多由日月元素关系与八科细项决定（见下）。',
  (fit.insights||[]).map(x=>`${x.name||'观察'}：${x.text||''}`).join(' '),
  `读盘顺序：①日月定情绪底盘（第二章）→②金火定吸引与冲突（第二章）→③跨盘相位定互动机制（第三章）→④八科定结构适配（第四章）→⑤经营指南落地（第七章）。每层证据都来自两人的真实盘面，逐条可核。`
 ];

 /* 二、日月金火水逐星对照 */
 const pairRows=['sun','moon','mercury','venus','mars'].map(k=>{
  const pa=byKey(aw,k),pb=byKey(bw,k);
  const role=STAR_ROLE[k];
  gloss[role.name+'（合盘）']=role.role;
  const rel=pa&&pb?elementRel(pa.sign,pb.sign):'无';
  return `<li><b>${role.name} · ${pa?.sign||'—'} × ${pb?.sign||'—'} · ${({同:'同元素',和:'三合',磨:'刑',拉:'对冲',半:'六合',无:'细读'})[rel]}</b><span>${role.text}${pa&&pb?` 对照实况：${A} 的${role.name}在${pa.sign}、${B} 的${role.name}在${pb.sign}——${ELEMENT_REL[rel]}`:''}${role.a?` 经营问句：${role.a}`:''}</span></li>`;
 }).join('');
 const pairSec=`<ul class="rpt-list">${pairRows||'<li>行星数据待生成。</li>'}</ul>`;
 const ascRel=ascA&&ascB?elementRel(typeof ascA==='string'?ascA:ascA.sign,typeof ascB==='string'?ascB:ascB.sign):null;
 const pairLines=[
  `太阳看方向、月亮看情绪、水星看沟通、金星看爱语、火星看激情——五星对照是合盘的主干，其余行星互为修饰。`,
  ascRel?`上升对照：${A} 上升${typeof ascA==='string'?ascA:ascA?.sign}、${B} 上升${typeof ascB==='string'?ascB:ascB?.sign}——${ELEMENT_REL[ascRel]}第一印象与社交面具层面据此判读。`:'上升数据待补（时辰未知或数据未提供时以日月对照为主）。'
 ];

 /* 三、跨盘相位逐条详解 */
 const aspectLines=inter.slice(0,14).map(x=>{
  const role=ASPECT_ROLE[x.angle]||{tag:x.type||'相位',tone:'按行星性质与容许度综合判读。'};
  gloss[role.tag]='两颗行星之间特定角度的能量关系';
  const topicA=PLANET_MEAN[x.a]||'（星）',topicB=PLANET_MEAN[x.b]||'（星）';
  return `<li><b>${x.a} ${role.tag} ${x.b} · ${num(x.orb,1)}°${Math.abs(x.orb??9)<=1.5?' · 极紧':''}</b><span>${topicA} × ${topicB} 的交会：${role.tone}落在两人之间即「${x.a}代表的需求」与「${x.b}代表的需求」在同一主题上${[0,60,120].includes(x.angle)?'互相成全':'互相讨价还价'}——这是关系里反复出现的固定剧情，认出它就不会每次都当新伤。${Math.abs(x.orb??9)<=1.5?'（容许度极紧：此相位贯穿相处始终，权重最高）':''}</span></li>`;
 }).join('');
 const aspectSec=aspectLines?`<ul class="rpt-list">${aspectLines}</ul>`:'跨盘相位数据待生成。';
 const aspectIntro=[
  `跨盘相位（${A} 的行星 × ${B} 的行星）按容许度从紧到松排列——越紧的相位越像「关系里的固定剧情」。上表每组都给出：两星各自管什么、这个角度如何在你俩之间上演、怎么接招。`,
  `判读铁则：同一主题（如金星-火星、月亮-月亮）在多组相位中重复出现时，该主题就是这段关系的核心课题；张力相位不是「不合」，而是「需要规则」——把规则谈成，张力相位的关系反而比全和谐相位的关系更有生命力。`
 ];

 /* 四、印度八科逐科详解 */
 const kootaRows=kootaItems.map(x=>{
  const lib=KOOTA_LIB[x.key]||{};
  const pctItem=Math.round(100*(x.score??0)/(x.max||1));
  const level=pctItem>=80?'强':pctItem>=50?'中':'弱';
  gloss['Ashtakoota 八科']='印度合盘的相容性评分体系，满分 36 分，双向取均值';
  return `<tr><td>${x.zh||lib.zh||x.key}</td><td>${x.score??'—'}/${x.max||'—'}</td><td class="${level==='弱'?'rpt-warn':''}">${level}</td><td>${lib.why||'传统相容维度'}</td><td>${lib.fix||'—'}</td></tr>`;
 }).join('');
 const kootaTable=kootaRows?`<table class="rpt-table"><thead><tr><th>科目</th><th>得分</th><th>评级</th><th>看什么</th><th>低分化解</th></tr></thead><tbody>${kootaRows}</tbody></table>`:'';
 const weaks=kootaItems.filter(x=>x.max&&x.score/x.max<0.5);
 const kootaLines=[
  `Ashtakoota（八科）满分 36，本盘双向均分 ${koota.total??'—'}（${A}→${B} 与 ${B}→${A} 取中，比单向更公允）。逐科看法：≥80% 为天然强项；50–80% 为可经营；<50% 为需要「补偿机制」的领域——不是分手理由，是相处说明书的重点章节。`,
  weaks.length?`低分科目（<50%）：${weaks.map(x=>x.zh).join('、')}——上表已给各自的化解思路。八科的智慧在于「早知道」：提前知道哪一科弱，就不会把结构性摩擦误读成「对方不爱了」。`:'无低于 50% 的科目——结构性适配良好，相处课题更多来自行运与成长阶段。'
 ];

 /* 五、月亮星宿与 D9 互参 */
 const nakLines=[];
 try{
  const mA=(d1a?.planets||[]).find(p=>p.name==='月亮'),mB=(d1b?.planets||[]).find(p=>p.name==='月亮');
  if(mA&&mB&&mA.nakshatra&&mB.nakshatra){
   gloss['月亮星宿']='月亮所在的心宿（Nakshatra），印占情绪底盘的最细刻度';
   nakLines.push(`月亮星宿：${A} 在 ${mA.nakshatra}（宿主${mA.nakLord||'—'}）、${B} 在 ${mB.nakshatra}（宿主${mB.nakLord||'—'}）。宿主关系即两人情绪底层的「血缘」：宿主相同或互为吉配，情绪节律天然咬合；宿主相冲，安抚方式须后天对齐。`);
  }
  const d9a=r.vedic?.a?.d9,d9b=r.vedic?.b?.d9;
  if(d9a&&d9b){
   gloss['D9 合盘互参']='两人各自的九分盘对照——看关系进入深水区后各自的真容';
   nakLines.push(`D9 互参：${A} 上升${d9a.lagna||'—'}、${B} 上升${d9b.lagna||'—'}。D1 是社交场上的彼此，D9 是褪去滤镜后的彼此——若两人 D9 上升元素相合（火风/水土同组），长期共处的舒适度加一档；相刑冲则须靠日月对照的底盘拉回。`);
  }
 }catch{/* 分盘缺数据时静默跳过 */}
 nakLines.length||nakLines.push('月亮星宿与分盘互参数据待补——可在印度合盘视图生成后重试。');

 /* 六、八字干支互参 */
 const crossRows=cross.slice(0,10).map(x=>`<tr><td>${x.type||'—'}</td><td>${x.pattern||'—'}</td><td>${(x.pillars||[]).map(p=>(p.stem||'')+(p.branch||'')).join('、')||x.note||'—'}</td></tr>`).join('');
 const crossTable=crossRows?`<table class="rpt-table"><thead><tr><th>关系</th><th>组合</th><th>涉及柱位</th></tr></thead><tbody>${crossRows}</tbody></table>`:'';
 const crossLines=[
  cross.length?`干支互参共检出 ${cross.length} 组跨盘关系（上表）。天干五合主「缘分黏性」、地支六合三合主「合作顺度」、六冲刑害主「相处雷区」——与西洋跨盘相位互相印证：两套体系同时指同一主题时，权重翻倍。`:'未检出干支跨盘关系：干支层面互动平淡，关系动力主要看星象层。',
  `合参原则：西洋看「怎么互动」、印占看「结构合不合」、干支看「聚散黏性」——三镜互照而非三镜投票；单镜不合不否决，多镜同向才重点布防。`
 ];

 /* 七、关系经营指南 */
 const moonPair=elementRel(byKey(aw,'moon')?.sign,byKey(bw,'moon')?.sign);
 const venusPair=elementRel(byKey(aw,'venus')?.sign,byKey(bw,'venus')?.sign);
 const advice=[
  `情绪底盘：月亮${({同:'同频',和:'互养',磨:'错位',拉:'镜像',半:'温和',无:'待细读'})[moonPair]||'待细读'}——${moonPair==='磨'||moonPair==='拉'?'约定「情绪不是攻击」：低气压时先报备（我现在需要静一静/需要抱抱），错位即变共学。':'日常质感有底盘，把默契说出口让它显形，别让懂变成理所当然。'}`,
  `爱的频道：金星${({同:'同频',和:'互养',磨:'错位',拉:'镜像',半:'温和',无:'待细读'})[venusPair]||'待细读'}——${venusPair==='磨'||venusPair==='拉'?'最容易「付出了但对方收不到」：直接交换「我最收到的示爱方式」清单，重质不重量。':'审美与爱语天然同路：保持一起发现美的仪式感，就是你们的感情保鲜剂。'}`,
  tensions.length?`张力管理：紧张力相位 ${tensions.slice(0,3).map(x=>x.a+'-'+x.b).join('、')} 对应的剧情会反复上演——冲突后 24 小时内复盘（只复盘模式不追对错），把「又来了」变成「又练了一遍」。`:`张力缓和：跨盘以和谐相位为主——真正的课题不是吵架，而是别把顺当成不在乎：主动制造新鲜与挑战，关系才不流于惯性。`,
  `长期视角：合盘不随感情变，但人的成熟度会变——同一组刑相位，二十岁演成互相消耗，三十五岁演成互相打磨。本报告给的是地图，路是两个人一起走出来的。`,
  `本报告由两人盘面的行星、宫位、相位、八科与干支数据逐条推导；合盘属传统术数与占星文化，供关系观察与沟通参考，不构成对关系走向、婚姻或法律事务的判断依据。`
 ];

 /* 七、八字合婚专项（干支/十神/喜用/纳音证据） */
 const bm=r.baziMatch||null;
 const levelZh={support:'助力',challenge:'需磨合',neutral:'中性'};
 const baziMatchLines=bm?.items?.length?[
  `八字合婚不做单一分数，而是把传统婚配的几项依据逐条摊开——每一项都可核、可争辩，比一个「契合度 90%」更负责任。以下共 ${bm.items.length} 项，其中助力 ${bm.support} 项、需磨合 ${bm.challenge} 项。`,
  ...bm.items.map(x=>`【${x.name}·${levelZh[x.level]||'中性'}】${x.text}`),
  `口径：${bm.method}`
 ]:['八字合婚数据待排盘后生成（需双方完整出生资料）。'];

 /* 八、紫微合盘（命宫/夫妻宫互参） */
 const zm=r.ziweiMatch||null;
 const ziweiMatchLines=zm?.ok?[
  `紫微合盘看两个人「各自是谁」与「在对方生命里扮演什么角色」：命宫是核心气质，夫妻宫是择偶偏好与关系课题，命宫互落宫则把抽象气质落到具体生活领域。`,
  ...zm.items.map(x=>`【${x.name}】${x.text}`),
  `命宫互落夫妻、官禄、财帛宫时，传统上视为关系更紧扣现实合作；落父母、兄弟等宫则偏向精神与生活层面的陪伴。互参只是视角，不是定论。`,
  `口径：${zm.method}`
 ]:['紫微合盘数据待排盘后生成，或任一方出生时辰不足——不做无依据的推断。'];

 const sections=[
  {title:'一、关系总览与读盘路线',lines:overview},
  {title:'二、日月金火水五星对照（互动模式）',lines:pairLines,html:pairSec},
  {title:'三、跨盘相位逐条详解',lines:aspectIntro,html:aspectSec},
  {title:'四、印度八科逐科详解与化解',lines:kootaLines,table:kootaTable},
  {title:'五、月亮星宿与 D9 深层互参',lines:nakLines},
  {title:'六、八字干支互参（三镜合参）',lines:crossLines,table:crossTable},
  {title:'七、八字合婚专项（干支·十神·喜用·纳音）',lines:baziMatchLines},
  {title:'八、紫微合盘（命宫与夫妻宫互参）',lines:ziweiMatchLines},
  {title:'九、关系经营指南',lines:advice}
 ];
 return {title:'双人合盘 · Synastry 深度详参',sections,glossary:gloss,kind:'synastry',
  characters:sections.reduce((n,x)=>n+(x.title?.length||0)+(x.lines||[]).join('').length+(String(x.table||'')+String(x.html||'')).replace(/<[^>]*>/g,'').length,0)};
}
function num(v,d=1){return Number.isFinite(Number(v))?Number(v).toFixed(d):'—';}
