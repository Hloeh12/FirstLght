/* Jaimini 派专项计算（纯函数，无副作用）。
 * 与 Parashari（Vimshottari/功能吉凶）并行的一套印占方法：
 *   - Karaka：七曜按恒星黄经降序取 7 个灵魂指标星（排除罗睺/计都）。
 *   - Chara Dasha（Rashi Dasha）：从 AK 星座起，逐宫 1-12 年轮转。
 *   - Arudha Lagna（AL）：由上升主的落宫反推「社会呈现像」，非本命自我。
 * 各派口径分歧处一律在 method 字段写明所采规则，避免把流派差异伪装成定论。
 * 仅作传统术数文化参考，不构成事实预测。 */

const GRAHAS=['太阳','月亮','火星','水星','木星','金星','土星'];
// 传统星座守护星（七政，不含天海冥），索引 0=白羊。
const SIGN_LORD=['火星','金星','水星','月亮','太阳','水星','金星','火星','木星','土星','土星','木星'];
const SIGNS=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const HOUSES=['自我与体魄','财货与家声','勇气与同业','居所与心境','智识与子女','竞争与债务','伴侣与合作','隐秘与转化','信念与远行','事业与名誉','社群与收益','损耗与灵修'];
// Karaka 顺序（Jaimini 常用 7 星体系：七曜各得一职，DK 恰为第 7 位配偶指标）
const KARAKA_DEF=[
 {abbr:'AK',key:'atma',name:'Atma Karaka',theme:'灵魂自我 / 人生方向',hint:'整张盘的「我为何而来」，落入的宫位是此生最想活出的领域'},
 {abbr:'AmK',key:'amatya',name:'Amatya Karaka',theme:'事业执行 / 权力担当',hint:'做事的手与决断力，落入的宫位是要扛责任、拿结果的战场'},
 {abbr:'PuK',key:'putra',name:'Putra Karaka',theme:'子女 / 创作 / 智力',hint:'创造力的源头——子女、作品与思维的展开方式'},
 {abbr:'BK',key:'bhratri',name:'Bhratri Karaka',theme:'兄弟 / 同侪 / 勇气',hint:'平辈关系与行动胆识，落入的宫位见同侪助力或竞争'},
 {abbr:'MK',key:'matri',name:'Matri Karaka',theme:'母亲 / 养育 / 心境',hint:'养育与内在安稳的来源，落入的宫位见母缘与情绪根部'},
 {abbr:'PK',key:'pitru',name:'Pitru Karaka',theme:'父亲 / 传承 / 信念',hint:'传承与权威的承接，落入的宫位见父缘、传统与信仰'},
 {abbr:'DK',key:'dara',name:'Dara Karaka',theme:'配偶 / 合作 / 亲密关系',hint:'Jaimini 定配偶的核心指标星，落入的宫位与星座看伴侣特质与关系课题'}
];
// AK 落宫指向：灵魂课题如何落地（12 宫）
const AK_HOUSE=[
 '落在第1宫：灵魂课题是「成为自己」——一生围绕自我塑造与开创，靠独立立身，宜先修「我是谁」。',
 '落在第2宫：灵魂课题在价值与积累——财富、家族与表达方式是修行场，资源观决定心安程度。',
 '落在第3宫：灵魂课题在表达与行动——靠沟通、技艺与勇气立身，同侪竞争是常态，宜以手艺安身。',
 '落在第4宫：灵魂课题在内在安稳——家、母亲与心境是核心，外在成就须以内在不安的安抚为前提。',
 '落在第5宫：灵魂课题在创造与智慧——教学、创作与子女是出口，宜把才华落到可传承的作品上。',
 '落在第6宫：灵魂课题在服务与克服——迎难而上是命定节奏，竞争与债务反而是淬炼场，宜主动解决问题而非逃避。',
 '落在第7宫：灵魂课题在关系——伴侣与他人是灵魂的镜子，婚姻与合作是此生最重要的修行道场。',
 '落在第8宫：灵魂课题在蜕变——危机、隐秘与玄学是入口，宜接受反复的摧毁与重建，不宜求一劳永逸。',
 '落在第9宫：灵魂课题在信念与求道——师长、远行与更高学问是关键，宜以信念系统牵引人生方向。',
 '落在第10宫：灵魂课题在事业与公众角色——成事即修行，社会身份与公众贡献是自我实现的载体。',
 '落在第11宫：灵魂课题在群体与理想——社群是道场，愿景与收益须服务于更大的共同目标。',
 '落在第12宫：灵魂课题在放下与灵修——独处、幕后与彼岸是归处，宜学会松手，不宜执着于台前占有。'
];
// DK 落宫指向：伴侣与关系
const DK_HOUSE=[
 '第1宫：伴侣像「另一个自己」——关系即自我延伸，易在对方身上看见自己的课题。',
 '第2宫：伴侣重实际与家声——资源、家庭与价值观是关系的黏合剂，也易成为争执点。',
 '第3宫：伴侣重沟通与同侪——关系靠交流与共同兴趣维系，易是同学、同事或邻居缘。',
 '第4宫：伴侣重家庭与安心——对方是「家」的象征，关系质量直接牵动情绪安稳。',
 '第5宫：伴侣带创作与玩心——关系里有恋爱与游戏的成分，宜共同养育作品或子女。',
 '第6宫：伴侣带服务与磨合——关系在解决问题中深化，也须防把相处过成「事务处理」。',
 '第7宫：伴侣是正配之象——DK 落本命配偶宫，传统视为婚姻指向明确，关系即是核心课题。',
 '第8宫：伴侣带转化与隐秘——关系深刻而不透明，信任与共同面对危机是长期功课。',
 '第9宫：伴侣重信念与远方——对方带来价值观或跨文化的影响，宜共同成长与远行。',
 '第10宫：伴侣重事业与名分——对方在意社会身份，关系与事业相互牵动，宜对齐目标。',
 '第11宫：伴侣重社群与愿景——对方是朋友圈或共同理想的延伸，宜共享目标而非只谈感情。',
 '第12宫：伴侣带牺牲与灵性——关系有退让、距离或跨国/异质色彩，宜保留彼此空间。'
];
const idx=s=>SIGNS.indexOf(String(s||'').replace(/座$/,'')+'座');
const houseOf=(sign,lagnaIndex)=>idx(sign)<0||lagnaIndex==null?null:((idx(sign)-lagnaIndex+12)%12)+1;

function lordOf(signIndex){return SIGN_LORD[((signIndex%12)+12)%12];}
function lordSign(name,planets){const p=planets.find(x=>x.name===name);return p?idx(p.sign):null;}
function steps(from,to){return ((to-from+12)%12)+1;}

/* 1) Karaka：七曜按 sid 降序取 8 星 */
export function jaiminiKarakas(planets){
 const pool=(planets||[]).filter(p=>GRAHAS.includes(p.name)&&Number.isFinite(Number(p.sid)))
  .slice().sort((a,b)=>Number(b.sid)-Number(a.sid)||(b.retro?1:0)-(a.retro?1:0));
 const list=pool.slice(0,KARAKA_DEF.length).map((p,i)=>({
  name:p.name,key:p.key,sid:Number(p.sid),sign:p.sign,signIndex:idx(p.sign),house:p.house,retro:!!p.retro,
  degree:p.degree,karaka:KARAKA_DEF[i].abbr,role:KARAKA_DEF[i].name,theme:KARAKA_DEF[i].theme,hint:KARAKA_DEF[i].hint
 }));
 const ak=list.find(x=>x.karaka==='AK')||null,dk=list.find(x=>x.karaka==='DK')||null;
 return {list,ak,dk,
  method:'采用 Jaimini 常用 7 星 Karaka 体系（AK/AmK/PuK/BK/MK/PK/DK），七曜按恒星黄经 sid 降序赋值，罗睺计都（影曜）不参与；经度相同者逆行优先。另有 8 星（加 Guru Karaka）流派，本实现固定 7 星并显式声明，DK 恰为第 7 位配偶指标。'};
}

/* 2) AK / DK 落宫判读（依赖本命 lagnaIndex） */
export function karakaHouseReading(karakas,lagnaIndex){
 const out=[];
 for(const k of karakas?.list||[]){
  const h=Number.isFinite(k.house)?k.house:houseOf(k.sign,lagnaIndex);
  if(!h||h<1||h>12)continue;
  const text=k.karaka==='AK'?AK_HOUSE[h-1]:k.karaka==='DK'?DK_HOUSE[h-1]:`落入第${h}宫（${HOUSES[h-1]}）——以「${k.theme}」的方式牵动此宫议题。`;
  out.push({karaka:k.karaka,role:k.role,house:h,sign:k.sign,text});
 }
 return out;
}

/* 3) Chara Dasha：AK 星座起，逐宫 1-12 年
 * 方向口径：AK 星座之主与第 7 宫之主，若同落阳性星座（白羊/双子/…索引偶）或同落阴性星座 → 逆行；一阳一阴 → 顺行。
 * 年数口径：某宫大运年数 = 从该宫顺数到其守护星所在宫的宫数（1-12，含起止）。
 * 起运年龄：从 AK 星座起按方向逐宫累加，第 1 段自出生起。 */
export function charaDasha(karakas,planets,lagnaIndex){
 const akSignIdx=karakas?.ak?idx(karakas.ak.sign):null;
 if(akSignIdx==null||akSignIdx<0)return null;
 const l1=lordOf(akSignIdx),l7=lordOf(akSignIdx+6);
 const s1=lordSign(l1,planets),s7=lordSign(l7,planets);
 if(s1==null||s7==null)return null;
 const yang=x=>x%2===0;
 const reverse=yang(s1)===yang(s7);
 const dir=reverse?-1:1;
 let age=0;
 const sequence=[];
 for(let step=0;step<12;step++){
  const si=((akSignIdx+dir*step)%12+12)%12;
  const lord=lordOf(si);
  const lordAt=lordSign(lord,planets);
  const years=lordAt==null?1:steps(si,lordAt);
  sequence.push({sign:SIGNS[si],signIndex:si,lord,ageStart:age,years,ageEnd:age+years,fromLagnaHouse:((si-lagnaIndex+12)%12)+1,akHouse:step+1});
  age+=years;
 }
 return {akSign:SIGNS[akSignIdx],direction:reverse?'逆行（逆宫序）':'顺行（顺宫序）',l1,l7,l1Sign:SIGNS[s1],l7Sign:SIGNS[s7],sequence,totalYears:age,
  method:'采 BPHS/Common Chara Dasha 口径：AK 星座之主与第 7 宫之主同阴或同阳则逆行、阴阳相异则顺行；每宫年数＝从该宫顺数至其守护星所在宫的宫数（含起止，1-12）；自 AK 星座起按方向逐宫，第 1 段自出生起算。各派方向规则有分歧，此口径已显式声明。'};
}

/* 4) Arudha Lagna：社会呈现像
 * 口径：上升主所在星座 D，上升为奇数座（索引偶/阳性）则自 D 顺数 n 宫，偶数座则逆数 n 宫，n＝自上升顺数至 D 的宫数。
 * 修正：若 AL 落在上升或第 7 宫（经典视为「晕影/失控」），按常见做法移至下一宫并标注 halo。 */
export function arudhaLagna(lagnaIndex,planets){
 if(lagnaIndex==null||lagnaIndex<0||lagnaIndex>11)return null;
 const lord=lordOf(lagnaIndex),lordAt=lordSign(lord,planets);
 if(lordAt==null)return null;
 const n=steps(lagnaIndex,lordAt);
 const dir=lagnaIndex%2===0?1:-1;
 let al=((lordAt+dir*(n-1))%12+12)%12;
 const halo=(al===lagnaIndex||al===((lagnaIndex+6)%12));
 if(halo)al=(al+1)%12;
 return {sign:SIGNS[al],signIndex:al,house:((al-lagnaIndex+12)%12)+1,lord:lordOf(al),lordSign:lordAt,steps:n,direction:dir>0?'顺数':'逆数',halo,
  method:'采常见 Arudha Lagna 口径：上升主落星座 D，n＝自上升顺数至 D 的宫数；上升为阳性座自 D 顺数 n 宫、阴性座逆数 n 宫。若落点恰为上升或对宫（第7宫）触发 halo 修正移至下一宫。各派顺逆与修正法有分歧，此口径已显式声明。'};
}
