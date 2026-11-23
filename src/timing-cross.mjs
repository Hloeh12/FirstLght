// 跨体系择时（v0.61.0）：八字时辰层之外，补紫微流时与印度 Muhurta 两支独立口径。
// 三套体系各看不同的东西——八字看时柱与命局、紫微看流时命宫与四化、印占看五要素与
// Tara/Chandra Bala——**不相加成**一个总分，只并列给出各自结论与同向与否。
// 混算会造出一个任何一支都不承认的分数；本模块宁可不给那个数字。
import {chart} from './chart.mjs';
import {ziweiHourFlow} from './ziwei.mjs';

const BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const round1=v=>Math.round(v*10)/10;
// 与择日同一映射函数：饱和而不放大，便于把三支放在同一把尺上看高低，但不相加。
const scoreOf=(raw,scale)=>clamp(Math.round(50+45*Math.tanh(raw/scale)),3,98);
const tierOf=score=>score>=82?'上吉':score>=68?'吉':score>=52?'平':score>=38?'慎':'避';
const TIER_MEAN={上吉:'诸事顺遂',吉:'条件偏顺',平:'吉凶参半',慎:'有明确阻力',避:'冲忌较重'};
const CN=['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四'];
// 九曜（Tara Bala）：由本命月宿数到当日月宿，第几宿决定吉凶。Janma 与 Vadha 最忌。
const TARA=[
 {name:'Janma 命宿',v:-1.5,why:'月宿回到本命月宿，主身心耗损，传统忌远行与大事'},
 {name:'Sampat 财宿',v:2.5,why:'第二宿主财利，宜交易、签约、求财'},
 {name:'Vipat 危宿',v:-2.5,why:'第三宿主危厄，忌出行与动土'},
 {name:'Kshema 安宿',v:2,why:'第四宿主安稳，宜安居、修整、疗愈'},
 {name:'Pratyak 碍宿',v:-2,why:'第五宿主阻碍，事多反复'},
 {name:'Sadhaka 成宿',v:2.5,why:'第六宿主成事，宜推进要事'},
 {name:'Vadha 杀宿',v:-3,why:'第七宿主折损，传统列为最忌'},
 {name:'Mitra 友宿',v:2,why:'第八宿主友助，宜合作与议价'},
 {name:'Atimitra 亲宿',v:1.5,why:'第九宿主亲厚，宜结缘与订盟'}
];
// Chandra Bala：以本命月亮所在宫为第一宫，数到当日月亮。1/3/6/7/10/11 为有力。
const CHANDRA_GOOD=[1,3,6,7,10,11],CHANDRA_BAD=[4,8,12];
const LAGNA_QUALITY=['chara','sthira','dual'];
const LAGNA_LABEL={chara:'动宫',sthira:'固定宫',dual:'双体宫'};
// 事项对应的上升宫性：固定宫利持久承诺，动宫利启动与迁移，双体宫利沟通与学习。
const FAMILY={contract:'sthira',open:'sthira',wedding:'sthira',build:'sthira',medical:'sthira',
 burial:'sthira',pray:'sthira',travel:'chara',move:'chara',exam:'dual',negotiate:'dual',general:''};
const VARA=['日曜日','月曜日','火曜日','水曜日','木曜日','金曜日','土曜日'];
const WEEKDAY=['周日','周一','周二','周三','周四','周五','周六'];
// 四化落宫的分量：本命命宫/身宫最重，财官迁田次之，其余只作轻提示。
const MAIN_PALACES=['财帛','官禄','迁移','田宅'];

const capItems=(plus,minus,limit)=>{
 const total=[...plus,...minus].reduce((n,x)=>n+x.v,0);
 if(Math.abs(total)<=limit)return {plus,minus,raw:round1(total)};
 const ratio=limit/Math.abs(total);
 return {plus:plus.map(x=>({...x,v:round1(x.v*ratio)})),minus:minus.map(x=>({...x,v:round1(x.v*ratio)})),
  raw:round1([...plus,...minus].reduce((n,x)=>n+round1(x.v*ratio),0))};
};

// 紫微流时：命宫落宫决定这一时辰的主题落在本命哪一宫，四化决定主题往哪个方向走。
function ziweiSide({birth,date,branch,event,schoolId}){
 const hourIndex=branch==='子'?0:BRANCHES.indexOf(branch);
 const flow=ziweiHourFlow({dateStr:birth.dateStr,timeIndex:birth.timeIndex,gender:birth.gender,
  flowDate:date,hourIndex,astroType:'heaven',ziweiSchool:schoolId});
 const plus=[],minus=[];
 const add=(list,label,delta,why)=>{if(delta)list.push({k:label,v:round1(delta),why});};
 const {ming}=flow;
 const nameList=ming.major.map(s=>s.name+(s.brightness?'·'+s.brightness:'')).join('、')||'无主星';
 // 主星庙旺加权：庙1→陷1/7 之和。两支主星同宫时上限为 2。
 if(ming.empty){
  if(ming.borrowed>0)add(plus,`流时命宫落本命${ming.palace}·借${ming.opposite}`,0.5,
   `流时命宫落本命${ming.palace}（${ming.branch}），本宫无主星，借对宫${ming.opposite}主星，事多借力而成`);
  else add(minus,`流时命宫落本命${ming.palace}·空宫`, -1.5,
   `流时命宫落本命${ming.palace}（${ming.branch}），本宫与对宫皆无主星，主题不显，宜守成`);
 }else{
  const delta=ming.weight>=1.6?2:ming.weight>=0.8?1:0.5;
  add(delta>0?plus:minus,`流时命宫落本命${ming.palace}·${nameList}`,delta,
   `流时命宫落本命${ming.palace}（${ming.branch}），主星${nameList}，庙旺权重 ${ming.weight}`);
 }
 for(const m of flow.mutagens){
  // 四化四星每时辰都在，若按固定分值直接相加，净和几乎恒定，等于没有区分。
  // 所以按落宫分量：本命命宫/身宫 1、财官迁田 0.6、其余 0.25，化忌再重一档。
  const key=m.core?1:MAIN_PALACES.includes(m.palace)?0.6:0.25;
  const base=(m.type==='禄'?2:m.type==='权'?1.5:m.type==='科'?1:-3)*key;
  const seat=m.palace?`落本命${m.palace}${m.branch?'（'+m.branch+'）':''}`:'未在本命盘中找到';
  add(base>0?plus:minus,`流时化${m.type}·${m.star}${m.palace?'·'+m.palace:''}`,base,
   `时干化${m.type}${m.star}，${seat}${m.type==='忌'?'，该宫主题易起阻滞':'，该宫主题得助力'}`);
  if(m.type==='忌'&&m.core)add(minus,`化忌落本命${m.palace}`, -1,'化忌落在本命命宫或身宫，主题最易被动摇');
 }
 // 时系星曜只取落在流时命宫附近的情形：时禄/昌/曲进门为助，羊陀入命为阻。
 const mingStars=flow.hourStars.filter(s=>s.palace==='命宫').map(s=>s.name);
 for(const s of mingStars){
  if(s==='时禄')add(plus,'时禄入流时命宫',1,'时禄落流时命宫，主这一时辰有实利可拿');
  if(s==='时昌'||s==='时曲')add(plus,`${s}入流时命宫`,0.5,`${s}落流时命宫，主文书、言辞得用`);
  if(s==='时羊'||s==='时陀')add(minus,`${s}入流时命宫`,-1,`${s}落流时命宫，主这一时辰易起摩擦`);
 }
 const {plus:p,minus:m,raw}=capItems(plus,minus,6);
 // 紫微可计项上限 ±6，映射用 raw/5（八字时辰层是 raw/7）：各自在自己体系内比较，
 // 两个分数不相加、也不承诺同一把尺。
 const score=scoreOf(raw,5);
 const lead=flow.mutagens.find(x=>x.type==='忌');
 return {
  ok:true,flowGz:flow.flowGz,
  ming:{palace:ming.palace,branch:ming.branch,major:ming.major,empty:ming.empty,weight:ming.weight,opposite:ming.opposite},
  mutagens:flow.mutagens,hourStars:mingStars,
  plus:p,minus:m,raw,score,tier:tierOf(score),
  summary:`流时命宫落本命${ming.palace}${ming.empty?'（空宫借'+ming.opposite+'）':'（'+nameList+'）'}；时干${flow.flowGz}四化：`+
   flow.mutagens.map(x=>x.type+x.star+(x.palace?'→'+x.palace:'')).join('、')+
   (lead?`，化忌在${lead.palace||'本命盘外'}需留意`:'')+'。',
  method:'紫微只看「流时」一层：以 iztro 的 hourly 运限取流时命宫与流时四化，落宫取本命十二宫，主星亮度按斗数全书表折算为明示权重（庙1→陷1/7），空宫借对宫乘 0.6。未计流曜全盘、未做三合派与四化派的取舍，因此只作这一时辰的紫微侧参考，不与八字分数相加。分数按 raw/5 映射（可计项上限 ±6），只在本体系内排序。'
 };
}

// 印度择时（Muhurta）：五要素里只看与「这一刻」强相关的四项——Tithi、月宿（Tara Bala）、
// 月亮宫位（Chandra Bala）、上升宫性；Vara 只列不判，避免与黄历建除重复计分。
function vedicSide({birth,date,branch,event,instant}){
 const natal=chart(birth,{baseOnly:true}).vedic;
 const now=chart(instant,{baseOnly:true}).vedic;
 const moonNow=now.planets.find(p=>p.key==='moon'),sunNow=now.planets.find(p=>p.key==='sun');
 const plus=[],minus=[];
 const add=(list,label,delta,why)=>{if(delta)list.push({k:label,v:round1(delta),why});};
 const diff=((moonNow.sid-sunNow.sid)%360+360)%360;
 const tithiIndex=Math.floor(diff/12); // 0–29，白分 0–14，黑分 15–29
 const paksha=tithiIndex<15?0:1,day=tithiIndex%15+1;
 const tithiName=paksha===0?(day===15?'望日（满月）':'白分第'+CN[day-1]+'日'):(day===15?'朔日（新月）':'黑分第'+CN[day-1]+'日');
 if(paksha===1&&day===15)add(minus,'Tithi·朔日',-2,'朔日传统忌开新，宜静守与内省');
 else if(paksha===0&&day===15)add(plus,'Tithi·望日',1,'望日宜祈福、结缘、修好');
 else if([2,3,5,7,10,11,12,13].includes(day))add(plus,'Tithi·'+tithiName,2,'该分日在 Muhurta 传统中列为吉日');
 else if([4,6,8,9,14].includes(day))add(minus,'Tithi·'+tithiName,-2,'该分日在 Muhurta 传统中列为凶日');
 else add(minus,'Tithi·'+tithiName,-1,'初一（朔后首日）传统多不举大事');

 const nakNow=moonNow.nakIndex,nakNatal=natal.planets.find(p=>p.key==='moon').nakIndex;
 const count=((nakNow-nakNatal+27)%27)+1;
 const tara=TARA[(count-1)%9];
 add(tara.v>0?plus:minus,'Tara·'+tara.name,tara.v,`当日月宿 ${moonNow.nakshatra}（第${moonNow.pada}步）距本命月宿 ${natal.planets.find(p=>p.key==='moon').nakshatra} 第 ${count} 宿：${tara.why}`);

 const chandra=((moonNow.signIndex-natal.planets.find(p=>p.key==='moon').signIndex+12)%12)+1;
 if(CHANDRA_GOOD.includes(chandra))add(plus,`Chandra·第${chandra}宫`,2,`当日月亮落本命月亮起算第 ${chandra} 宫，为有力之位`);
 else if(CHANDRA_BAD.includes(chandra))add(minus,`Chandra·第${chandra}宫`,-2,`当日月亮落本命月亮起算第 ${chandra} 宫，为无力之位`);
 else add(minus,`Chandra·第${chandra}宫`,-0.5,`当日月亮落本命月亮起算第 ${chandra} 宫，力量平常`);

 const quality=LAGNA_QUALITY[now.lagnaIndex%3],want=FAMILY[event]||'';
 if(want&&quality===want)add(plus,`上升·${now.lagna}（${LAGNA_LABEL[quality]}）`,1.5,
  `此刻上升在${now.lagna}，属${LAGNA_LABEL[quality]}，与所选事项的宫性相合`);
 else if(want&&((want==='sthira'&&quality==='chara')||(want==='chara'&&quality==='sthira'))){
  add(minus,`上升·${now.lagna}（${LAGNA_LABEL[quality]}）`,-0.5,
   `此刻上升在${now.lagna}，属${LAGNA_LABEL[quality]}，与所选事项的宫性相反`);
 }
 const {plus:p,minus:m,raw}=capItems(plus,minus,6);
 // 印占可计四项、上限 ±6，但逐项幅度比紫微小，映射用 raw/9，避免「两项不利」直接掉到避。
 const score=scoreOf(raw,9);
 const vara=VARA[new Date(Date.parse(date+'T00:00:00Z')).getUTCDay()];
 return {
  ok:true,
  tithi:{index:tithiIndex+1,paksha:paksha===0?'白分':'黑分',day,name:tithiName},
  nakshatra:{name:moonNow.nakshatra,pada:moonNow.pada,lord:null,count},
  tara:{index:(count-1)%9+1,name:tara.name},
  chandra:{house:chandra},
  lagna:{sign:now.lagna,quality:LAGNA_LABEL[quality],want:want?LAGNA_LABEL[want]:null},
  vara:{name:vara,label:WEEKDAY[new Date(Date.parse(date+'T00:00:00Z')).getUTCDay()]},
  plus:p,minus:m,raw,score,tier:tierOf(score),
  summary:`${tithiName}（${vara}）· 月宿 ${moonNow.nakshatra} 第${moonNow.pada}步，为本命月宿起第 ${count} 宿（${tara.name}）；月亮在${now.lagna}、上升${LAGNA_LABEL[quality]}。`,
  method:'Lahiri 恒星黄道；分数按 raw/9 映射（八字时辰层 raw/7、紫微 raw/5），三者只在本体系内排序，不相加。Tithi 以日月黄经差每 12° 一分，白分/黑分各十五日；Tara Bala 由本命月宿数到当日月宿（九曜循环），Chandra Bala 以本命月亮所在宫起算。上升取该时刻出生地真实上升（Astronomy Engine，整宫制判宫性），宫性按动宫／固定宫／双体宫三分。Vara 只列不判，避免与黄历建除重复扣分；未计 Yoga、Karana、Hora 与 Lagna 具体宫位，因此只作这一时辰的印占侧参考。'
 };
}

export function timingCross({birth,date,hourBranch='巳',event='general',ziweiSchool:schoolId}){
 if(!birth)throw Error('请先关联一个案例，再做跨体系择时');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(date??'')))throw Error('请选择有效公历日期');
 const parsed=Date.parse(String(date)+'T00:00:00Z');
 if(!Number.isFinite(parsed)||new Date(parsed).toISOString().slice(0,10)!==String(date))throw Error('该日期不存在');
 if(!BRANCHES.includes(hourBranch))throw Error('无效时辰');
 const hourIndex=BRANCHES.indexOf(hourBranch);
 const clock=hourIndex===0?'00:30':String(hourIndex*2).padStart(2,'0')+':30';
 // 紫微沿用出生时的有效日期与时辰索引（真太阳时、晚子时已在排盘时归位）。
 const pad=n=>String(n).padStart(2,'0');
 const std={...birth,
  dateStr:birth.dateStr||`${birth.Y}-${pad(birth.M)}-${pad(birth.D)}`,
  timeIndex:birth.timeIndex??(birth.timeUnknown?0:Math.min(12,Math.floor((Number(birth.h??12)+1)/2)))};
 const [Y,M,D]=String(date).split('-').map(Number);
 const instant={Y,M,D,h:Number(clock.slice(0,2)),mi:30,city:birth.city,calendar:'solar'};
 let ziwei=null,vedic=null,ziError='',veError='';
 if(birth.timeUnknown){
  ziError='出生时刻未知，紫微命盘本身的命宫不可定，流时无从落宫；补上出生时刻后可算。';
 }else{
  try{ziwei=ziweiSide({birth:std,date,branch:hourBranch,event,schoolId});}catch(e){ziError=e.message;}
 }
 try{vedic=vedicSide({birth:std,date,branch:hourBranch,event,instant});}catch(e){veError=e.message;}
 if(!ziwei&&!vedic)throw Error('跨体系择时不可用：'+(ziError||veError));
 const note=birth.timeUnknown?'出生时刻未知：印占本命月亮按正午计，Tara／Chandra 判定偏保守，只作参考。':'';
 return {
  date,hourBranch,clock,event,
  ziwei:ziwei??{ok:false,note:ziError},
  vedic:vedic??{ok:false,note:veError},
  note,
  tierMean:TIER_MEAN,
  method:'三套体系各给各的分，不相加成：八字时辰层看时干时支与命局冲合并含日破时、旬空；紫微看流时命宫落宫与流时四化；印占看 Tithi、Tara Bala、Chandra Bala 与上升宫性。同向时结论更稳，分歧时以八字为主，另两系指出该时辰的隐性代价。'
 };
}
