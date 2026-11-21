/* 洞见页内容层（v0.51.0）
   历史问题不是「内容多少」，而是「结构不对称」：
   紫微接了 deepDigest（十章详批），八字完全没接，西洋/印度只接了一半，
   于是同一页里紫微几万字、八字四句话，读起来像两个产品。
   本模块把四体系统一到同一骨架：主轴摘要 → 六维结构 → 深度详批 → 终身周期，
   每一条判断都从盘面字段推出（拱出证据 chips），不用静态填充文案。 */
import {esc,table} from './ui.js';
import {buildBaziDeepReport} from '../../www/js/deep-bazi.js';
import {buildZiweiDeepReport} from '../../www/js/deep-ziwei.js';
import {buildWesternDeepReport} from '../../www/js/deep-west.js';
import {buildVedicDeepReport} from '../../www/js/deep-vedic.js';

const SIGNS=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const SIGN_ELEMENT={'白羊座':'火','狮子座':'火','射手座':'火','金牛座':'土','处女座':'土','摩羯座':'土','双子座':'风','天秤座':'风','水瓶座':'风','巨蟹座':'水','天蝎座':'水','双鱼座':'水'};
const SIGN_MODE={'白羊座':'基本','巨蟹座':'基本','天秤座':'基本','摩羯座':'基本','金牛座':'固定','狮子座':'固定','天蝎座':'固定','水瓶座':'固定','双子座':'变动','处女座':'变动','射手座':'变动','双鱼座':'变动'};
const WEST_LORD={'白羊座':'火星','金牛座':'金星','双子座':'水星','巨蟹座':'月亮','狮子座':'太阳','处女座':'水星','天秤座':'金星','天蝎座':'冥王星','射手座':'木星','摩羯座':'土星','水瓶座':'天王星','双鱼座':'海王星'};
const VEDIC_LORD={'白羊座':'火星','金牛座':'金星','双子座':'水星','巨蟹座':'月亮','狮子座':'太阳','处女座':'水星','天秤座':'金星','天蝎座':'火星','射手座':'木星','摩羯座':'土星','水瓶座':'土星','双鱼座':'木星'};
const HOUSE_THEME={1:'自我与外在形象',2:'资源与技能变现',3:'表达、学习与近邻',4:'家宅与内在根基',5:'创造、恋爱与子女',6:'日常、健康与工作方式',7:'一对一关系与合作',8:'共享资源与深层转化',9:'信念、远行与高等学习',10:'事业与社会角色',11:'朋友、社群与长期愿景',12:'潜修与隐性负担'};
const DM_TRAIT={甲:'如乔木向上，重原则与担当，认准方向后不易改道',乙:'如花草藤蔓，柔中带韧，善借势与审时，怕的是把自己让没了',丙:'如日光普照，外向热诚，需要被看见，也容易先照亮别人再照自己',丁:'如灯烛之火，细腻专注，善于在微处照见人和事',戊:'如高山厚土，稳健守信，扛得住事，也要防因稳而迟',己:'如田园之土，涵养包容，长于协调，须防优柔与过度承接',庚:'如剑戟之金，果决明快，重效率与准则，宜留三分转圜',辛:'如珠玉之金，敏感讲究，重质感与体面，最怕被粗糙对待',壬:'如江河之水，视野开阔，长于流动与谋略，须有堤岸',癸:'如雨露之水，内敛细腻，直觉敏锐，宜把感受落成语言'};

const signOf=lon=>SIGNS[Math.floor((((Number(lon)||0)%360)+360)%360/30)];
const gz=p=>p&&p.stem?`${p.stem}${p.branch}`:'';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const list=a=>a&&a.length?a.join('、'):'';
const dim=(no,title,body,chips)=>`<li class="is-dim"><span class="is-dim-no">${no}</span><div class="is-dim-body"><h3 class="is-dim-title">${esc(title)}</h3><div class="is-dim-text">${body}</div>${chips&&chips.length?`<div class="is-chips">${chips.map(c=>`<span class="is-chip">${esc(c)}</span>`).join('')}</div>`:''}</div></li>`;

/* ---------------- 八字 ---------------- */
function baziBlocks(b){
 const pillars=(b?.pillars||[]).filter(Boolean);
 const dm=b?.dayMaster||{},st=b?.strength||{},ns=b?.natalStrength||st;
 const [yearP,monthP,dayP,hourP]=pillars;
 if(!dayP)return null;
 const godCount={};
 for(const pl of pillars){
  if(pl.tenGod&&pl.tenGod!=='日主')godCount[pl.tenGod]=(godCount[pl.tenGod]||0)+1;
  for(const h of pl.hidden||[])if(h.god)godCount[h.god]=(godCount[h.god]||0)+1;
 }
 const pick=(...gs)=>gs.filter(g=>godCount[g]).map(g=>`${g}×${godCount[g]}`);
 const roots=(b.roots||[]).map(x=>`${x.pillar}${x.branch}藏${x.stem}`);
 const revealed=(b.revealed||[]).map(x=>`${x.stem}透${x.visibleAt}`);
 const kind=st.kind||'';
 const kindLine=kind==='身强'?'自我与助力都充足，能扛事也担得起财，要防的是用力过猛':kind==='身弱'?'先天底气偏薄，贵在借势、结盟与择时，不宜独自硬撑':'进退都有弹性，最怕的是把弹性用成犹豫';
 const support=num(st.support).toFixed(1);
 const tiao=(b.tiaoHou?.gods||[]).map(x=>x).join('、')||'未见专属调候';
 const hard=(b.relationships||[]).filter(x=>/冲|刑|害/.test(x.type||''));

 const summary={
  kicker:'本命主轴 · 四柱八字',
  headline:`${dm.stem||''}${dm.element||''}日主 · ${monthP.branch||''}月生 · ${kind||'待定'}`,
  chips:[`日主 ${dm.stem||'—'}${dm.element||''}`,`月令 ${monthP.branch||'—'}${monthP.branchElement||''}`,`扶助 ${support}%`,`调候 ${tiao}`]
 };

 const dims=[
  dim('01','性格主轴',
   `<p>日主<b>${esc(dm.stem||'')}${esc(dm.element||'')}</b>（${dm.yin?'阴':'阳'}干），${esc(DM_TRAIT[dm.stem]||'须结合月令与四柱气势细参')}。月令为<b>${esc(monthP.branch||'')}（${esc(monthP.branchElement||'')}）</b>，提纲在此，${esc(kindLine)}。</p>
    <p>同一个日主落在不同月令，性情并不相同：月令决定「气」的来路，${esc(monthP.stem||'')}${esc(monthP.branch||'')}月生人先受${esc(monthP.branchElement||'')}气牵引，再论日主能否承载。所以本命主轴按「日主 × 月令 × 旺衰」三者合看，不用单一标签定人。</p>`,
   []),

  dim('02','天赋与资源',
   `<p>通根 <b>${roots.length}</b> 处${roots.length?'（'+esc(roots.join('、'))+'）':'—四支未见日主同类之根'}，透干 <b>${revealed.length}</b> 处${revealed.length?'（'+esc(revealed.join('、'))+'）':'—天干未见同类透出'}。有根者遇岁运加压不易被拔起，透干者才华容易外显、也容易被看见或被要求。</p>
    <p>月干${esc(monthP.stem||'')}透<b>${esc(monthP.tenGod||'—')}</b>，是这张盘最显性的表达层；日支${esc(dayP.branch||'')}为配偶宫兼内在根基。资源不是「有什么星」而是「气能不能落地」：<b>${esc(list(pick('正印','偏印'))||'印星未显')}</b>看承接与学习，<b>${esc(list(pick('食神','伤官'))||'食伤未显')}</b>看输出与创造。</p>`,
   [`通根 ${roots.length} 处`,`透干 ${revealed.length} 处`,`月干 ${monthP.tenGod||'—'}`]),

  dim('03','关系模式',
   `<p>日支<b>${esc(dayP.branch||'')}（${esc(dayP.branchElement||'')}）</b>为配偶宫，藏${esc((dayP.hidden||[]).map(h=>h.stem+'·'+h.god).join('、')||'干未透')}——内在期待往往藏在这里，而不是嘴上说的条件。</p>
    <p>${hard.length?`盘面有 <b>${esc(hard.map(x=>x.type+' '+x.pattern).join('、'))}</b>，牵动${esc(list([...new Set(hard.flatMap(x=>x.pillars||[]))])||'相关柱位')}：关系里容易先有拉扯再谈磨合，宜把期待讲清楚、把边界留出来。`:'四柱未见直接的冲刑害关系，关系模式更依赖岁运引动：平静时不代表没课题，只代表课题还没被点出来。'}合不等于化、冲不必然凶，都要回到具体参与的字与柱位上看。</p>`,
   [`日支 ${dayP.branch||'—'}`,`配偶宫藏 ${(dayP.hidden||[]).map(h=>h.god).join('/')||'—'}`,`${hard.length?hard.length+' 处冲刑':'无直接冲刑'}`]),

  dim('04','事业路径',
   `<p>月柱<b>${esc(gz(monthP)||'')}</b>为提纲，代表师友环境与事业场；时柱<b>${esc(gz(hourP)||'')}</b>为长远志业与晚辈。日主${esc(dm.stem||'')}要立得住，先看有没有<b>${esc(list(pick('正官','七杀'))||'官杀未显')}</b>给结构与责任，再看有没有<b>${esc(list(pick('食神','伤官'))||'食伤未显')}</b>把能力变成作品。</p>
    <p>${godCount['正官']||godCount['七杀']?'官杀在盘，宜走有职责、有评价体系的路径，把「被要求」转成「可交付」。':'官杀不显，不必强求在科层里被规训，更适合靠专业深度、作品与口碑建立位置。'}${godCount['食神']||godCount['伤官']?'食伤有力，输出型工作（表达、设计、教学、技术方案）比纯执行更容易出成绩。':'食伤偏弱，宜先把方法论沉淀下来，避免只做不说、成果无人识。'}</p>`,
   [`月柱 ${gz(monthP)||'—'}`,`时柱 ${gz(hourP)||'—'}`,`${list(pick('正官','七杀'))||'官杀未显'}`]),

  dim('05','财务与风险',
   `<p>财星取<b>${esc(list(pick('正财','偏财'))||'财星未显')}</b>。${godCount['正财']||godCount['偏财']?'财在盘中有落点，宜以主业现金流为底，再谈配置；财多身弱者最忌以杠杆补底气。':'财星不透，财富更依赖「技能定价」而非「机会捕捉」，把一门手艺做到可被反复购买，比追风口稳。'}</p>
    <p>风险端看<b>${esc(list(pick('比肩','劫财'))||'比劫未显')}</b>：比劫重则易有人情与合伙上的分账问题，事先写清权责与退出条件，比事后讲情面有用。调候取<b>${esc(tiao)}</b>，环境过寒或过燥时，决策容易走极端，重大财务安排宜避开情绪高点。</p>`,
   [`财星 ${list(pick('正财','偏财'))||'未显'}`,`比劫 ${list(pick('比肩','劫财'))||'未显'}`,`调候 ${tiao}`]),

  dim('06','成长课题',
   `<p>喜用参考<b>${esc(list(st.useful)||'未单列')}</b>，忌偏参考<b>${esc(list(st.caution)||'未单列')}</b>。${
    (st.useful||[]).length?'这两组五行不是吉凶标签，而是「补哪一边更省力」的提示：把喜用落到作息、居处、合作对象与工作方式上，比空喊补运有效。':'本盘旺衰接近中和，喜忌差距不大，成长课题不在「补什么」，而在「别把哪一边用过头」。'}${esc(ns.method||'')?'':''}</p>
    <p>本命只是底盘，真正的课题在岁运引动时才显形：${hard.length?`原局已有${esc(hard.map(x=>x.pattern).join('、'))}，逢岁运再来同气，变化会加深；`:'原局关系平和，逢冲合之年才会明显感到方向被推动；'}此时先辨「可控与不可控」，再定进退。命理给出的是结构与节奏，不替代对合同、资金与健康的事实判断。</p>`,
   [`喜用 ${list(st.useful)||'未单列'}`,`忌偏 ${list(st.caution)||'未单列'}`,`${hard.length?hard.length+' 处冲刑':'关系平和'}`])
 ];

 return {summary,dims};
}

/* ---------------- 紫微斗数 ---------------- */
function ziweiBlocks(z){
 if(!z?.palaces?.length)return null;
 const P=name=>z.palaces.find(x=>x.name===name)||{};
 const stars=x=>(x.majorStars||[]).map(s=>s.name+(s.brightness?'（'+s.brightness+'）':'')).join('、')||'空宫';
 const minors=x=>(x.minorStars||[]).map(s=>s.name);
 const life=P('命宫'),career=P('官禄'),wealth=P('财帛'),travel=P('迁移'),spouse=P('夫妻'),kids=P('子女'),home=P('田宅'),fortune=P('福德');
 const lifeStars=(life.majorStars||[]).length?life.majorStars:(life.borrowedStars||[]);
 const sh=t=>z.sihua?.find(x=>x.type===t);
 const sha=['擎羊','陀罗','火星','铃星','地空','地劫'];
 const shaAt=sha.filter(s=>z.palaces.some(p=>(p.minorStars||[]).some(m=>m.name===s)));

 const summary={
  kicker:'本命主轴 · 紫微斗数',
  headline:`命宫${life.earthlyBranch||'—'} · ${stars(life)} · ${z.fiveElementsClass||''}`,
  chips:[`命宫 ${life.earthlyBranch||'—'}`,`命主 ${z.soul||'—'}`,`身主 ${z.body||'—'}`,`${z.fiveElementsClass||'—'}`]
 };

 const dims=[
  dim('01','命宫主轴',
   `<p>命宫在<b>${esc(life.earthlyBranch||'待定位')}</b>，${lifeStars.length?`主星为<b>${esc(lifeStars.map(x=>x.name).join('、'))}</b>，${esc(lifeStars.map(x=>x.name+'：'+(x.brightness||'本宫星曜')).join('；'))}`:'空宫，借对宫主星并参看三方四正'}。</p>
    <p>命宫是整盘的开关：${esc(lifeStars.map(x=>x.name).join('')||'本宫')}决定你「先出手的方式」——遇事先想组织、先想关系、还是先想执行。命主星为<b>${esc(z.soul||'—')}</b>、身主星为<b>${esc(z.body||'—')}</b>，前者主先天心性，后者主后天落点，两者不宜混谈。</p>`,
   []),

  dim('02','三方四正',
   `<p>官禄<b>${esc(career.earthlyBranch||'—')}</b>：${esc(stars(career))}；财帛<b>${esc(wealth.earthlyBranch||'—')}</b>：${esc(stars(wealth))}；迁移<b>${esc(travel.earthlyBranch||'—')}</b>：${esc(stars(travel))}。</p>
    <p>三方四正讲的不是「哪颗星好」，而是命宫与事业、资源、外部环境能否互相印证：命宫强而官禄空，容易心气高却缺舞台；官禄强而命宫弱，则是环境推着走。<b>${esc(stars(career))}</b>与<b>${esc(stars(wealth))}</b>同时看，才知道该靠职位、靠资源还是靠对外拓展取势。</p>`,
   [`官禄 ${stars(career)}`,`财帛 ${stars(wealth)}`,`迁移 ${stars(travel)}`]),

  dim('03','天赋与资源',
   `<p>生年四化为<b>${esc((z.sihua||[]).map(x=>x.type+'入'+x.palace).join('、')||'待定位')}</b>：化禄在<b>${esc(sh('禄')?.palace||'—')}</b>是资源入口，化权在<b>${esc(sh('权')?.palace||'—')}</b>是能扛的责任，化科在<b>${esc(sh('科')?.palace||'—')}</b>是名誉与文书的路。</p>
    <p>辅星决定「顺不顺」：${minors(life).length?`命宫见<b>${esc(minors(life).slice(0,4).join('、'))}</b>，`:'命宫辅星不显，'}${sha.length?`全盘煞星见于${esc(shaAt.map(s=>s+'（'+z.palaces.filter(p=>(p.minorStars||[]).some(m=>m.name===s)).map(p=>p.name).join('/')+'）').join('、')||'无')}——煞不是坏，是「必须自己动手解决」的领域。`:''}</p>`,
   [`化禄 ${sh('禄')?.palace||'—'}`,`化权 ${sh('权')?.palace||'—'}`,`化科 ${sh('科')?.palace||'—'}`]),

  dim('04','关系模式',
   `<p>夫妻宫在<b>${esc(spouse.earthlyBranch||'—')}</b>：${esc(stars(spouse))}；子女宫<b>${esc(kids.earthlyBranch||'—')}</b>：${esc(stars(kids))}。夫妻宫看「被什么吸引」，子女宫看「怎么对待亲近与创造」。</p>
    <p>${(z.sihua||[]).some(x=>x.type==='忌'&&['夫妻','子女'].includes(x.palace))?`化忌落在<b>${esc((z.sihua||[]).find(x=>x.type==='忌').palace)}</b>，亲密关系里的牵挂与反复会格外明显：不是遇不到人，而是容易在同一类课题上重来。宜把「期待」与「现实条件」分开谈。`:'四化未直接落入夫妻与子女，关系课题多在行运引动时才浮出；平时不必预设矛盾，先把沟通方式练熟更实际。'}三方会照的星要一起看，单看夫妻宫一颗星不足以断关系走向。</p>`,
   [`夫妻 ${stars(spouse)}`,`子女 ${stars(kids)}`,`化忌 ${sh('忌')?.palace||'—'}`]),

  dim('05','事业路径',
   `<p>官禄宫<b>${esc(career.earthlyBranch||'—')}</b>主星<b>${esc(stars(career))}</b>，${(z.sihua||[]).some(x=>x.palace==='官禄'&&x.type==='权')?'且带化权：适合承担责任、带团队或握实权，越有明确授权越能发挥。':'未见化权，更适合以专业与作品建立话语权，而非靠职位压人。'}</p>
    <p>财帛<b>${esc(stars(wealth))}</b>决定收入形态：${(wealth.majorStars||[]).some(s=>['武曲','太阴','天府','禄存'].includes(s.name))?'见财星或库星，收入靠积累与经营，宜长线；':'财星不显于本宫，收入更依赖专业定价与外部机会，宜留现金流缓冲。'}福德宫<b>${esc(stars(fortune))}</b>则决定你能不能长期扛住这条路——兴趣与耐力对不上时，再好的官禄也会做不久。</p>`,
   [`官禄 ${stars(career)}`,`财帛 ${stars(wealth)}`,`福德 ${stars(fortune)}`]),

  dim('06','成长课题',
   `<p>化忌在<b>${esc(sh('忌')?.palace||'—')}</b>：这一宫是「越在意越容易卡住」的地方，也是这一生真正要练的功课。化忌不等于灾，它是注意力被反复拉回去的位置。</p>
    <p>${shaAt.length?`煞星分布：${esc(shaAt.map(s=>s+'·'+z.palaces.filter(p=>(p.minorStars||[]).some(m=>m.name===s)).map(p=>p.name).join('/')).join('；'))}。这些宫位的课题没法靠运势绕开，只能靠具体方法解决——把问题拆小、找专业协助、留出修正时间。`:'本盘四煞未密集落宫，课题更多来自「顺境里的松懈」，宜主动给自己设检查点。'}田宅<b>${esc(home.earthlyBranch||'—')}</b>与福德<b>${esc(fortune.earthlyBranch||'—')}</b>一起看，才知道压力最终落在家里还是落在心里。</p>`,
   [`化忌 ${sh('忌')?.palace||'—'}`,`煞星 ${shaAt.length?shaAt.join('/'):'不显'}`,`田宅 ${stars(home)}`])
 ];
 return {summary,dims};
}

/* ---------------- 西洋占星 ---------------- */
function westernBlocks(w){
 if(!w?.planets?.length)return null;
 const get=k=>w.planets.find(x=>x.key===k)||{};
 const sun=get('sun'),moon=get('moon'),venus=get('venus'),saturn=get('saturn'),mars=get('mars');
 const asc=w.asc||{},mc=w.mc||{};
 const cusp7=w.cusps?.[6]!=null?signOf(w.cusps[6]):null;
 const cusp10=w.cusps?.[9]!=null?signOf(w.cusps[9]):mc.sign;
 const hard=(w.aspects||[]).filter(a=>['四分相','对分相','合相'].includes(a.type)).slice(0,5);
 const venusAsp=(w.aspects||[]).filter(a=>a.aKey==='venus'||a.bKey==='venus').slice(0,3).map(a=>`${a.a} ${a.type} ${a.b}（${a.orb.toFixed(1)}°）`);

 const summary={
  kicker:'本命主轴 · 西洋占星',
  headline:`太阳${sun.sign||'—'} · 月亮${moon.sign||'—'} · 上升${asc.sign||'—'}`,
  chips:[`太阳 ${sun.sign||'—'} 第${sun.house||'—'}宫`,`月亮 ${moon.sign||'—'} 第${moon.house||'—'}宫`,`上升 ${asc.sign||'—'}`,`天顶 ${mc.sign||'—'}`]
 };

 const dims=[
  dim('01','核心三要素',
   `<p>太阳<b>${esc(sun.sign||'—')}</b>第${esc(String(sun.house||'—'))}宫，月亮<b>${esc(moon.sign||'—')}</b>第${esc(String(moon.house||'—'))}宫，上升<b>${esc(asc.sign||'—')}</b>，天顶<b>${esc(mc.sign||'—')}</b>。</p>
    <p>三者是三种不同的语言：太阳说「你愿意长期投入什么」，月亮说「什么让你有安全感」，上升说「你进入陌生环境的第一反应」。${sun.sign===moon.sign?'日月同座，内外比较一致，好处是笃定，代价是转向慢。':`日月落在${esc(SIGN_ELEMENT[sun.sign]||'')}与${esc(SIGN_ELEMENT[moon.sign]||'')}两种元素上，内在需求与外在表现并不同步，需要刻意协调而不是互相否定。`}</p>`,
   []),

  dim('02','自我表达',
   `<p>太阳落第<b>${esc(String(sun.house||'—'))}</b>宫（${esc(HOUSE_THEME[sun.house]||'待定')}），说明「被认可」这件事最可能发生在这一领域。${esc(SIGN_ELEMENT[sun.sign]||'')}象${esc(SIGN_MODE[sun.sign]||'')}星座的表达方式：${SIGN_MODE[sun.sign]==='基本'?'起手快、愿意开局，但要防三分钟热度':SIGN_MODE[sun.sign]==='固定'?'能长期守一件事，代价是转弯难':SIGN_MODE[sun.sign]==='变动'?'适应力强、善于调整，要防方向被环境带走':'需结合星座性质判断'}。</p>
    <p>${(w.aspects||[]).some(a=>['sun','moon'].includes(a.aKey)&&a.type==='合相')?'日月成相位，意志与情绪容易同进同退：状态好时爆发力强，状态差时也一起沉。':'日月未见主要相位，意志与情绪各自运作，宜定期给自己留出「不产出」的恢复时间。'}</p>`,
   [`第${sun.house||'—'}宫 ${HOUSE_THEME[sun.house]||''}`,`${SIGN_ELEMENT[sun.sign]||''}象${SIGN_MODE[sun.sign]||''}`,`${sun.sign||'—'}`]),

  dim('03','情绪与安全感',
   `<p>月亮<b>${esc(moon.sign||'—')}</b>第${esc(String(moon.house||'—'))}宫，安全感建立在「${esc(HOUSE_THEME[moon.house]||'日常秩序')}」上。月亮${esc(SIGN_ELEMENT[moon.sign]||'')}象：${SIGN_ELEMENT[moon.sign]==='水'?'情绪感受深、易受氛围影响，需要稳定的私密空间':SIGN_ELEMENT[moon.sign]==='土'?'靠可预期的秩序与实物安心，突变最耗人':SIGN_ELEMENT[moon.sign]==='风'?'需要被理解与被回应，独处太久反而空':SIGN_ELEMENT[moon.sign]==='火'?'情绪来得快去得也快，需要一个能立刻行动的出口':'需结合星座性质判断'}。</p>
    <p>月亮与太阳的落宫差异，往往就是「你想要的」和「你需要的」不一致的地方。与其逼自己统一，不如把两者都排进日程：太阳的领域给成就，月亮的领域给休息。</p>`,
   [`月亮 ${moon.sign||'—'} 第${moon.house||'—'}宫`,`${SIGN_ELEMENT[moon.sign]||''}象`,`安全感在 ${HOUSE_THEME[moon.house]||'—'}`]),

  dim('04','关系模式',
   `<p>金星<b>${esc(venus.sign||'—')}</b>第${esc(String(venus.house||'—'))}宫，第七宫宫头在<b>${esc(cusp7||'—')}</b>（宫主星${esc(WEST_LORD[cusp7]||'—')}）。金星说「被什么吸引」，七宫说「怎么建立一对一关系」——两者不一致时，容易反复走进同一种关系再退出。</p>
    <p>${venusAsp.length?`金星相位：${esc(venusAsp.join('、'))}。`:''}${mars.house?'火星落第'+mars.house+'宫（'+esc(HOUSE_THEME[mars.house]||'')+'），是冲突时你会先动手的方向；看清这一点，比要求自己「别生气」有用。':'火星落宫待定。'}关系里最需要练的不是忍，是把需求说成具体可执行的话。</p>`,
   [`金星 ${venus.sign||'—'} 第${venus.house||'—'}宫`,`七宫 ${cusp7||'—'}`,`火星 第${mars.house||'—'}宫`]),

  dim('05','事业路径',
   `<p>天顶<b>${esc(mc.sign||'—')}</b>，第十宫宫头<b>${esc(cusp10||'—')}</b>（宫主星${esc(WEST_LORD[cusp10]||'—')}），社会角色趋向「${esc(HOUSE_THEME[10])}」。土星落第<b>${esc(String(saturn.house||'—'))}宫，是这条路必须交学费的地方——${esc(HOUSE_THEME[saturn.house]||'')}。</p>
    <p>${(w.planets||[]).filter(p=>p.house===10).length?`十宫内有${esc(w.planets.filter(p=>p.house===10).map(p=>p.name).join('、'))}，事业心与曝光度都不弱，宜主动争取可见度。`:'十宫无星，事业方向不必等「天降使命」，可以先从六宫的日常工作方式倒推：什么工作节奏你能长期做下去，那条路才走得远。'}${esc(HOUSE_THEME[6])}这一层容易被忽略，但它决定你能不能撑到第十宫。</p>`,
   [`天顶 ${mc.sign||'—'}`,`十宫 ${cusp10||'—'}`,`土星 第${saturn.house||'—'}宫`]),

  dim('06','成长课题',
   `<p>土星第<b>${esc(String(saturn.house||'—'))}</b>宫是「迟熟但有复利」的领域：${esc(HOUSE_THEME[saturn.house]||'')}。这里早期往往不顺，越到后面越稳，前提是不逃。</p>
    <p>${hard.length?`主要挑战相位：${esc(hard.map(a=>a.a+' '+a.type+' '+a.b).join('、'))}。这些相位提示张力所在，不是判决书——它们通常表现为「反复回到同一类情境」，直到你把方法换掉。`:'未见密集挑战相位，课题更像「顺境里的松懈」：越顺越要主动设检查点。'}本命盘只说明结构与倾向，具体事件仍取决于行运与现实选择。</p>`,
   [`土星 第${saturn.house||'—'}宫`,`挑战相位 ${hard.length} 组`,`${HOUSE_THEME[saturn.house]||'—'}`])
 ];
 return {summary,dims};
}

/* ---------------- 印度占星 ---------------- */
function vedicBlocks(v){
 if(!v?.planets?.length)return null;
 const get=k=>v.planets.find(x=>x.key===k)||{};
 const sun=get('sun'),moon=get('moon'),venus=get('venus'),saturn=get('saturn'),jup=get('jupiter'),rahu=get('rahu'),ketu=get('ketu');
 const h7=v.houseSigns?.[6],h10=v.houseSigns?.[9],h1=v.houseSigns?.[0]||v.lagna;
 const lord1=VEDIC_LORD[h1]||'—';
 const active=v.active||{};

 // 九曜逐星一行：按名称+星座+宫位+星宿扫读，比塞进正文里更快定位
 const planetList=`<ul class="insight-planet-list">${v.planets.map(x=>`<li><b>${esc(x.name)}</b><span>${esc(x.sign||'—')} · 第${esc(String(x.house||'—'))}宫 · ${esc(x.nakshatra||'—')} Pada ${esc(String(x.pada||'—'))}${x.retro?' · 逆行':''}</span></li>`).join('')}</ul>`;
 const summary={
  kicker:'本命主轴 · 印度占星',
  headline:`上升${v.lagna||'—'} · 月宿${moon.nakshatra||'—'} · ${active.lord||'—'}大运`,
  chips:[`上升 ${v.lagna||'—'}`,`命主星 ${lord1}`,`月宿 ${moon.nakshatra||'—'} Pada ${moon.pada||'—'}`,`当前 ${active.lord||'—'} 大运`]
 };

 const dims=[
  dim('01','上升与命主星',
   `<p>Lahiri 恒星黄道、整宫制，上升<b>${esc(v.lagna||'—')}</b>，命主星为<b>${esc(lord1)}</b>${get(VEDIC_KEY[lord1])?'（落第'+get(VEDIC_KEY[lord1]).house+'宫）':''}。上升决定整张盘的宫位框架，命主星落宫则说明「你把自己放在哪里用力」。</p>
    <p>${h1?`第一宫为${esc(h1)}，${esc(SIGN_ELEMENT[h1]||'')}象——这是你进入世界的默认姿态。`:'第一宫待定。'}命主星${esc(lord1)}${get(VEDIC_KEY[lord1])?.house?`落第${get(VEDIC_KEY[lord1]).house}宫（${esc(HOUSE_THEME[get(VEDIC_KEY[lord1]).house]||'')}），人生的注意力会长期投向这一领域`:''}。判断命主星强弱要看庙旺、落宫与相位，不能只看宫位数字。</p>`,
   []),

  dim('02','月亮与星宿',
   `<p>月亮<b>${esc(moon.sign||'—')}</b>第${esc(String(moon.house||'—'))}宫，星宿<b>${esc(moon.nakshatra||'—')}</b> Pada ${esc(String(moon.pada||'—'))}。星宿比星座细得多，它描述的是心智的运作质感与情绪的触发方式。</p>
    <p>月亮在印度占星里代表心（Manas），比太阳更贴近日常感受。落第<b>${esc(String(moon.house||'—'))}</b>宫，情绪与注意力会长期停驻在「${esc(HOUSE_THEME[moon.house]||'待定')}」。这也是 Vimshottari 大运的起运依据——月宿决定你从哪一段运程开始走。</p>`,
   [`月亮 ${moon.sign||'—'} 第${moon.house||'—'}宫`,`${moon.nakshatra||'—'} Pada ${moon.pada||'—'}`,`起运星 ${active.lord||'—'}`]),

  dim('03','太阳与方向',
   `<p>太阳<b>${esc(sun.sign||'—')}</b>第${esc(String(sun.house||'—'))}宫、星宿${esc(sun.nakshatra||'—')}。太阳代表自我、父亲、权威与生命方向，落宫说明「你在哪里最想被承认」。</p>
    <p>木星<b>${esc(jup.sign||'—')}</b>第${esc(String(jup.house||'—'))}宫，是判断力、信念与师长的位置；${jup.house===1||jup.house===4||jup.house===7||jup.house===10?'落在角宫，判断力与扩张力较强，宜以「教与学」的方式积累影响力。':'不在角宫，扩张力需要靠具体作品与长期投入兑现，不宜只靠口头愿景。'}太阳与木星的关系，往往决定一个人是「靠权威」还是「靠信念」立身。</p>`,
   [`太阳 ${sun.sign||'—'} 第${sun.house||'—'}宫`,`木星 第${jup.house||'—'}宫`,`${sun.nakshatra||'—'}`]),

  dim('04','关系模式',
   `<p>第七宫为<b>${esc(h7||'—')}</b>（宫主星${esc(VEDIC_LORD[h7]||'—')}），金星<b>${esc(venus.sign||'—')}</b>第${esc(String(venus.house||'—'))}宫。七宫看伴侣与契约关系，金星看吸引与价值交换——两者合看才知道「被什么吸引」与「能不能长期合作」是否一致。</p>
    <p>金星落第<b>${esc(String(venus.house||'—'))}</b>宫（${esc(HOUSE_THEME[venus.house]||'')}），关系往往从这一领域开始。${venus.house===7||venus.house===1?'落在一/七轴，关系对自我认同影响很大，宜避免把伴侣当成完整的自我。':'不必急于在关系里找答案，先把自己那一半站稳。'}契约关系里最忌只谈感情不谈条件。</p>`,
   [`七宫 ${h7||'—'}`,`金星 第${venus.house||'—'}宫`,`宫主 ${VEDIC_LORD[h7]||'—'}`]),

  dim('05','事业路径',
   `<p>第十宫为<b>${esc(h10||'—')}</b>（宫主星${esc(VEDIC_LORD[h10]||'—')}），土星<b>${esc(saturn.sign||'—')}</b>第${esc(String(saturn.house||'—'))}宫。十宫定社会角色，土星定「必须靠时间与纪律换来的那部分」。</p>
    <p>${saturn.house===10?'土星落十宫：事业是靠年限与责任堆出来的，早年慢、后期稳，最忌频繁换道。':saturn.house===1||saturn.house===7?'土星落角宫：自我或关系上要交学费，但一旦立住就是长期资产。':`土星落第${saturn.house||'—'}宫（${esc(HOUSE_THEME[saturn.house]||'')}），这一领域需要比别人多花时间，回报也更耐久。`}Rahu 第${esc(String(rahu.house||'—'))}宫提示「想快速突破」的方向，但突破要靠方法，不靠跳步。</p>`,
   [`十宫 ${h10||'—'}`,`土星 第${saturn.house||'—'}宫`,`Rahu 第${rahu.house||'—'}宫`]),

  dim('06','成长课题',
   `<p>Rahu–Ketu 轴线在第<b>${esc(String(rahu.house||'—'))}</b>宫与第<b>${esc(String(ketu.house||'—'))}</b>宫：Rahu 是「越渴望越容易上瘾」的方向，Ketu 是「天生就会、却容易忽略」的能力。</p>
    <p>${rahu.house&&ketu.house?`这一世的功课通常在「${esc(HOUSE_THEME[rahu.house]||'')}」与「${esc(HOUSE_THEME[ketu.house]||'')}」之间来回：追逐前者时容易丢掉后者，回到后者才稳。`:'轴线待定位。'}Saturn 的纪律、Jupiter 的信念与 Rahu 的渴望三者并不总能同时满足，成长就是学会给它们排序。</p>`,
   [`Rahu 第${rahu.house||'—'}宫`,`Ketu 第${ketu.house||'—'}宫`,`土星 第${saturn.house||'—'}宫`])
 ];
 return {summary,dims,evidence:`<section class="is-planets card liquid-glass"><p class="is-planets-kicker">九曜落宫 · 证据表</p>${planetList}</section>`};
}

const VEDIC_KEY={火星:'mars',金星:'venus',水星:'mercury',月亮:'moon',太阳:'sun',木星:'jupiter',土星:'saturn',罗睺:'rahu',计都:'ketu'};

/* ---------------- 深度详批 ---------------- */
function digestHtml(report){
 if(!report?.sections?.length)return '';
 const sec=s=>`<section class="is-deep-sec"><h4>${esc(cleanTitle(s.title))}</h4>${
  (s.lines||[]).map(l=>`<p>${esc(l)}</p>`).join('')
 }${s.table?`<div class="rpt-table-wrap">${s.table}</div>`:''}${s.html||''}</section>`;
 const head=report.sections.slice(0,3).map(sec).join('');
 const rest=report.sections.slice(3);
 return `<div class="is-deep">
  ${head}
  ${rest.length?`<details class="is-deep-more"><summary>展开其余 ${rest.length} 章详批</summary>${rest.map(sec).join('')}</details>`:''}
 </div>`;
}
const cleanTitle=t=>String(t||'').replace(/^\s*[（(]?[一二三四五六七八九十百零〇]+[）)]?\s*[、.．]\s*/,'').trim();

/* ---------------- 生命周期 ---------------- */
function lifecycleHtml(system,reading){
 const b=reading.bazi,z=reading.ziwei,v=reading.vedic,w=reading.western;
 if(system==='bazi'&&b){
  return `<p class="is-note">起运：${esc(b.info?.startAge||'以出生资料计算')}；${esc(b.info?.forward?'顺行':'逆行')}。大运十年一换，是「底色不变、重点转移」的节奏。</p>
   ${table(['阶段','干支','起止','十神'],(b.cycles||[]).map(x=>[x.age+'岁',x.stem+x.branch,x.startYear+'–'+x.endYear,x.tenGod]))}`;
 }
 if(system==='ziwei'&&z){
  return `<p class="is-note">每十年以大限宫为阶段主题；大限定框架，流年定点，两层要分开看。</p>
   ${table(['虚岁','年份','大限宫'],(z.decades||[]).map(x=>[x.ageRange.join('–')+'岁',x.yearRange.join('–'),x.palaceName]))}`;
 }
 if(system==='vedic'&&v){
  return `<p class="is-note">Vimshottari 以月宿起运，主运之间可叠 Antardasha，具体到某一年要两层同看。</p>
   ${table(['主运','起始','结束','状态'],(v.dashas||[]).map(x=>[x.lord,x.start.slice(0,10),x.end.slice(0,10),x.current?'当前':'—']))}`;
 }
 if(system==='west'&&w){
  return `<p class="is-note">次限一日推一年，行运以当前日期计；日返/月返按回归时刻起盘。本命是底盘，行运是节奏。</p>
   ${table(['层级','含义'],[['本命盘','终身结构（不变）'],['次限推运','内在成熟节奏'],['行运','外部事件的触发点'],['日返/月返','当年/当月的主题']])}`;
 }
 return '';
}

/* ---------------- 对外接口 ---------------- */
export function insightModel(system,reading,opt={}){
 const blocks=system==='bazi'?baziBlocks(reading?.bazi)
  :system==='ziwei'?ziweiBlocks(reading?.ziwei)
  :system==='vedic'?vedicBlocks(reading?.vedic)
  :westernBlocks(reading?.western);
 if(!blocks)return null;
 let report=null;
 try{
  if(system==='bazi')report=buildBaziDeepReport(reading.bazi);
  else if(system==='ziwei')report=buildZiweiDeepReport(reading.ziwei,opt.flow||null);
  else if(system==='vedic')report=buildVedicDeepReport(reading.vedic);
  else report=buildWesternDeepReport(reading.western,undefined,reading.analysis||reading.western?.analysis);
 }catch(error){console.warn('深度详批生成失败：'+error.message);}
 return {...blocks,report,digest:report?digestHtml(report):''};
}

export function summaryHtml(model){
 if(!model)return '';
 const {summary}=model;
 return `<section class="is-summary card liquid-glass">
  <p class="is-summary-kicker">${esc(summary.kicker)}</p>
  <p class="is-summary-head">${esc(summary.headline)}</p>
  <div class="is-chips">${summary.chips.map(c=>`<span class="is-chip">${esc(c)}</span>`).join('')}</div>
 </section>`;
}

export function dimsHtml(model){
 if(!model)return '';
 return `${model.evidence||''}<section class="is-dims-wrap">
  <header class="is-sec-head"><span class="is-sec-no">六维</span><h2>本命结构拆解</h2><span class="is-sec-rule" aria-hidden="true"></span></header>
  <ol class="is-dims">${model.dims.join('')}</ol>
 </section>`;
}

export function digestBlockHtml(model,chapterHint=''){
 if(!model?.digest)return '';
 const n=model.report?.sections?.length||0;
 return `<details class="card liquid-glass is-deep-wrap">
  <summary><span class="is-sum-title">深度详批</span><span class="is-sum-meta">${n} 章 · ${chapterHint||'盘面证据逐条推导'}</span></summary>
  <div class="is-deep-body">${model.digest}</div>
 </details>`;
}

export function lifecycleBlockHtml(system,reading){
 const body=lifecycleHtml(system,reading);
 if(!body)return '';
 return `<details class="card liquid-glass is-life-wrap">
  <summary><span class="is-sum-title">大运全序列</span><span class="is-sum-meta">终身周期 · 不含流年流月</span></summary>
  <div class="is-life-body" data-lifecycle-report>${body}</div>
 </details>`;
}

export const SYSTEM_LABEL={bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星'};
