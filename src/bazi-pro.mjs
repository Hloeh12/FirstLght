import {offsetMinutes} from './tz.mjs';
import {seasonalCommand} from './seasonal-command.mjs';
import {periodGuidance} from './bazi-guidance.mjs';
import {Solar,Lunar,LunarUtil} from 'lunar-javascript';
import {baziFromInput} from './baziInput.mjs';
import {flowYears,tenGod,yearPillar,monthPillar,dayPillar,solarTerms} from './bazi.mjs';
import {calculateTrueSolarTime} from './renhuai-engine.mjs';

export const stems='甲乙丙丁戊己庚辛壬癸',branches='子丑寅卯辰巳午未申酉戌亥';
export const stemElements='木木火火土土金金水水',branchElements='水土木木土火火土金金土水';
const produce={木:'火',火:'土',土:'金',金:'水',水:'木'},control={木:'土',土:'水',水:'火',火:'金',金:'木'};
const hidden={子:'癸',丑:'己癸辛',寅:'甲丙戊',卯:'乙',辰:'戊乙癸',巳:'丙庚戊',午:'丁己',未:'己丁乙',申:'庚壬戊',酉:'辛',戌:'戊辛丁',亥:'壬甲'};
const rowRules=[
 ['天干五合','stem',['甲己土','乙庚金','丙辛水','丁壬木','戊癸火'],2],
 ['六合','branch',['子丑土','寅亥木','卯戌火','辰酉金','巳申水','午未土'],2],
 ['三合局','branch',['申子辰水','亥卯未木','寅午戌火','巳酉丑金'],3],
 ['三会方','branch',['寅卯辰木','巳午未火','申酉戌金','亥子丑水'],3],
 ['六冲','branch',['子午','丑未','寅申','卯酉','辰戌','巳亥'],2],
 ['相刑','branch',['子卯','辰辰','午午','酉酉','亥亥','寅巳申','丑戌未'],0],
 ['相害','branch',['子未','丑午','寅巳','卯辰','申亥','酉戌'],2],
 ['相破','branch',['子酉','卯午','辰丑','未戌','寅亥','巳申'],2]
];
const meanings={天干五合:'天干相合代表两种力量互相牵引，得令才列入合化参考。',六合:'两支彼此相合，可观察对应两柱的配合方式。',三合局:'三支齐备，以其中的旺支为轴，形成同一五行取向。',三会方:'三个相邻地支会成同一方位五行。',六冲:'对向两支相遇，提示两处主题有变动或拉扯。',相刑:'留意重复、约束或彼此牵制。',相害:'留意暗中消耗、误会和条件不匹配。',相破:'留意计划间的缺口与容易松动的环节。'};
export function relations(pillars){
 const results=[];
 for(const [type,key,patterns,size] of rowRules)for(const pattern of patterns){
  const needed=size||pattern.length;
  const chars=pattern.slice(0,needed),element=pattern[needed]||null;
  const match=(index,selected)=>{
   if(index===chars.length){
    const ids=[...selected].sort((a,b)=>a-b);
    if(!results.some(r=>r.type===type&&r.ids.join()===ids.join()&&r.pattern===chars))results.push({type,pattern:chars,element,ids,pillars:ids.map(i=>pillars[i].name),meaning:meanings[type]});
    return;
   }
   for(const [i,p] of pillars.entries())if(p[key]===chars[index]&&!selected.includes(i))match(index+1,[...selected,i]);
  };
  match(0,[]);
 }
 return results;
}
function gods(p,year,day,month){
 const shensha=new Set();
 const triads=['申子辰','寅午戌','巳酉丑','亥卯未'];
 for(const ref of [year,day]){
  const i=stems.indexOf(ref.stem);
  for(const [name,table] of [
   ['天乙贵人',['丑未','子申','亥酉','亥酉','丑未','子申','丑未','寅午','卯巳','卯巳']],
   ['太极贵人',['子午','子午','卯酉','卯酉','辰戌丑未','辰戌丑未','寅亥','寅亥','巳申','巳申']],
   ['文昌',['巳','午','申','酉','申','酉','亥','子','寅','卯']]
  ])if(table[i]?.includes(p.branch))shensha.add(name);
  const j=triads.findIndex(g=>g.includes(ref.branch));
  for(const [name,targets] of [['驿马','寅申亥巳'],['咸池桃花','酉卯午子'],['华盖','辰戌丑未'],['劫煞','巳亥寅申']])if(targets[j]===p.branch)shensha.add(name);
 }
 if(({甲:'卯',丙:'午',戊:'午',庚:'酉',壬:'子'})[day.stem]===p.branch)shensha.add('羊刃');
 if(branches[(branches.indexOf(month.branch)+11)%12]===p.branch)shensha.add('天医');
 return [...shensha];
}
const lifecycle=['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];
function stage(dayStem,branch){
 const i=stems.indexOf(dayStem),start=branches.indexOf('亥午寅酉寅酉巳子申卯'[i]);
 return lifecycle[((branches.indexOf(branch)-start)*(i%2?-1:1)+12)%12];
}
const elementOf=s=>stemElements[stems.indexOf(s)];
const compactDate=s=>[s.getYear(),s.getMonth(),s.getDay()].map((n,i)=>i?String(n).padStart(2,'0'):n).join('-');
function describePillar(p,day){
 return {...p,stemElement:elementOf(p.stem),branchElement:branchElements[branches.indexOf(p.branch)],
  tenGod:p.name==='日柱'?'日主':tenGod(stems.indexOf(day.stem),stems.indexOf(p.stem)),
  changsheng:stage(day.stem,p.branch),nayin:LunarUtil.NAYIN[p.stem+p.branch],
  hidden:[...hidden[p.branch]].map((stem,i)=>({stem,element:elementOf(stem),rank:['本气','中气','余气'][i],god:tenGod(stems.indexOf(day.stem),stems.indexOf(stem))}))};
}
function strength(pillars,relationships,enabled){
 const weights=Object.fromEntries([...new Set(stemElements)].map(e=>[e,0]));
 const dayStem=pillars[2].stem,polarity=stems.indexOf(dayStem)%2;
 const weight=s=>enabled&&stems.indexOf(s)%2===polarity?1.05:1;
 const contributions=pillars.map((p,i)=>{
  const ratio=[[],[1],[.7,.3],[.6,.25,.15]][p.hidden.length];
  return [{element:p.stemElement,value:weight(p.stem),key:'stem',pillar:i},...p.hidden.map((s,j)=>({element:s.element,value:ratio[j]*weight(s.stem)*(enabled&&i===1?1.8:1),key:'branch',pillar:i}))];
 }).flat();
 const month=pillars[1].branchElement;
 const activated=enabled?relationships.filter(r=>r.element&&(r.element===month||produce[month]===r.element)&&
  !relationships.some(c=>c.type==='六冲'&&r.ids.some(i=>c.ids.includes(i)))):[];
 for(const c of contributions){
  const r=activated.find(r=>r.ids.includes(c.pillar)&&(r.type==='天干五合')===(c.key==='stem'));
  const shifted=r?c.value*.45:0;
  weights[c.element]+=c.value-shifted;
  if(r)weights[r.element]+=shifted;
 }
 const day=pillars[2].stemElement,resource=Object.keys(produce).find(e=>produce[e]===day);
 const total=Object.values(weights).reduce((a,b)=>a+b,0),support=(weights[day]+weights[resource])/total;
 const kind=support>.6?'身强':support<.4?'身弱':'中和';
 return {weights,percentages:Object.fromEntries(Object.entries(weights).map(([k,v])=>[k,100*v/total])),support:support*100,kind,
  useful:kind==='身弱'?[resource,day]:kind==='身强'?[produce[day],control[day]]:[],
  caution:kind==='身弱'?[produce[day],control[day]]:kind==='身强'?[resource,day]:[],
  activated,method:enabled?'天干与藏干按各自基础权重，同日干阴阳 ×1.05，月支 ×1.8。合局得令或得月生且相关支未遭六冲时，将参与项 45% 权重归入化神。':'天干等权，藏干按本中余气；未启用月令与合化修正。'};
}
/* 四柱力量来源分解：把「身强/身弱」这个结论拆回得令、得地、得势、通根、透干五条证据。
   评分只用于说明力量从哪来，不替代 strength() 的五行权重口径。 */
function strengthBreakdown(pillars){
 const dayStem=pillars[2]?.stem||'甲',self=elementOf(dayStem);
 const resource=Object.keys(produce).find(e=>produce[e]===self)||'水';
 const output=produce[self],wealth=control[self],officer=Object.keys(control).find(e=>control[e]===self)||'木';
 const monthMain=pillars[1]?.hidden?.[0]?.element||pillars[1]?.branchElement||'';
 const deLing=monthMain===self?{ok:true,role:'同我',text:`月令本气为${monthMain||'—'}，与日主同气，得令——先天气势最足，做事有底`}
  :monthMain===resource?{ok:true,role:'生我',text:`月令本气为${monthMain||'—'}，生我日主，得令——如水源不断，后劲足`}
  :{ok:false,role:monthMain===output?'我生':monthMain===wealth?'我克':monthMain===officer?'克我':'失令',
    text:`月令本气为${monthMain||'—'}，${monthMain===output?'我生而泄气':monthMain===wealth?'我克而耗力':monthMain===officer?'克我而受制':'与日主无直接生克'}——失令，须靠他处补力`};
 const deDi=pillars.map(p=>({pillar:p.name,branch:p.branch,
  stems:(p.hidden||[]).filter(h=>h.element===self).map(h=>h.stem),
  strong:(p.hidden||[]).some(h=>h.element===self&&h.rank==='本气')
 })).filter(x=>x.stems.length);
 const deShi=pillars.map((p,i)=>({p,i})).filter(({p,i})=>i!==2&&(p.stemElement===self||p.stemElement===resource));
 const strongRoots=deDi.filter(x=>x.strong).length,weakRoots=deDi.length-strongRoots;
 const touGan=pillars.map((p,i)=>({p,i})).filter(({i})=>i!==2)
  .filter(({p})=>pillars.some(q=>(q.hidden||[]).some(h=>h.stem===p.stem))).map(({p})=>p.stem);
 const score=(deLing.ok?2:0)+Math.min(3,strongRoots*1.5+weakRoots*.75)+Math.min(1.5,deShi.length*.75);
 return {
  deLing,deDi,deShi:{stems:deShi.map(({p})=>p.stem),count:deShi.length,
   text:deShi.length?`天干${deShi.map(({p})=>p.stem).join('、')}${deShi.some(({p})=>p.stemElement===self)?'帮身':'生身'}，得势——同辈与资源可借力`:'天干无同我生我之神，不得势——凡事亲力亲为，助力多在后天经营'},
  tongGen:{count:deDi.length,text:deDi.length?`日主之根在${deDi.map(x=>`${x.pillar}${x.branch}（${x.stems.join('')}）`).join('、')}——${strongRoots?'有本气强根，根深能任事':'仅余气弱根，力量需积累'}`:'地支无同我之根——日主浮而不实，最忌单打独斗'},
  touGan:{count:touGan.length,stems:touGan,
   text:touGan.length?`天干${touGan.join('、')}透出且地支有根——这些力量不悬空，能落到现实（是助力还是压力，看它对日主是生扶还是克泄）`: '天干之字在地支无根，浮于表面，须行运引动才显'},
  score,full:6.5,
  verdict:score>=4.5?'力量来源充足：令、地、势三者至少得其两，属先天底气厚的一类'
   :score>=2.5?'力量来源中等：有一处得力的落脚点，成败多取决于行运是否补足'
   :'力量来源偏薄：令地势力皆弱，须以平台、团队与后天节奏补足',
  method:'得令看月令本气与日主的生克；得地看四支藏干中同我之根（本气强根、余气弱根）；得势看天干同我生我之数。评分 0–6.5，仅用于说明力量来源结构，不替代五行权重扶助度。'
 };
}
export function civilSolar(Y,M,D){
 const d=new Date(Date.UTC(Y,M-1,D));
 if(d.getUTCFullYear()!==Y||d.getUTCMonth()+1!==M||d.getUTCDate()!==D)throw Error('该公历日期不存在');
 return Solar.fromYmd(Y,M,D);
}
function validateBirth(input){
 const {Y,M,D,city}=input;
 if(![Y,M,D].every(Number.isInteger)||Y<1800||Y>2200||M<1||M>12||D<1||D>31)throw Error('出生日期超出范围');
 if(![city?.lat,city?.lon,city?.tz].every(Number.isFinite)||Math.abs(city.lat)>90||Math.abs(city.lon)>180||city.tz< -12||city.tz>14)throw Error('出生经纬度或时区无效');
 if(!input.timeUnknown&&(!Number.isInteger(input.h)||input.h<0||input.h>23||!Number.isInteger(input.mi)||input.mi<0||input.mi>59))throw Error('出生时间无效');
 if(input.calendar==='lunar')return Lunar.fromYmd(Y,input.leapMonth?-M:M,D).getSolar();
 return civilSolar(Y,M,D);
}
export function baziPro({birth,selection={},combine=false}){
 const solar=validateBirth(birth);
 const date=compactDate(solar);
 if(birth.calendar!=='lunar'&&date!==[birth.Y,String(birth.M).padStart(2,'0'),String(birth.D).padStart(2,'0')].join('-'))throw Error('出生公历日期无效');
 const h=birth.timeUnknown?12:birth.h,mi=birth.timeUnknown?0:birth.mi;
 const normal={...birth,Y:solar.getYear(),M:solar.getMonth(),D:solar.getDay(),dateStr:date,calendar:'solar',h,mi};
 const b=baziFromInput({...normal,dayBoundaryAt2300:birth.lateZishi!=='current-day'});
 const offset=(Date.UTC(normal.Y,normal.M-1,normal.D,h,mi)-Date.parse(b.meta.utc))/60000;
 const standard=b.meta.timeCorrection.standard;
 const correctedClock=birth.useSolarTime?{Y:normal.Y,M:normal.M,D:normal.D,h,mi}:standard;
 const correction=calculateTrueSolarTime({year:correctedClock.Y,month:correctedClock.M,day:correctedClock.D,clockHour:correctedClock.h,clockMinute:correctedClock.mi,longitude:birth.useSolarTime?birth.city.lon:undefined,utcOffsetMinutes:offset});
 const birthLunar=solar.getLunar(), lunar=Solar.fromYmdHms(normal.Y,normal.M,normal.D,h,mi,0).getLunar();
 const [year,,day]=b.pillars;
 const add=p=>({...describePillar(p,day),shensha:gods(p,year,day,b.pillars[1])});
 const pillars=b.pillars.map(add);
 if(birth.timeUnknown)pillars[3]={...pillars[3],unknown:true,tenGod:'时辰未知',shensha:[],hidden:[],changsheng:'—',nayin:'—'};
 const commander=seasonalCommand(b.meta.utc);
 for(const item of pillars[1].hidden)item.commanding=item.stem===commander.stem;
 pillars[1].commander=commander;
 const cycles=b.luck.cycles.map((p,i)=>({...add({...p,name:'大运'}),index:i}));
 const selected=[];
 let cycle=null;
 if(selection.luck!==undefined&&selection.luck!==null){
  cycle=cycles[selection.luck];
  if(!cycle)throw Error('无效大运');
  selected.push(cycle);
 }
 const first=cycle?.startYear??Number(normal.Y),years=flowYears(first,10).map(p=>({...add({...p,name:'流年'}),age:p.year-normal.Y+1}));
 let months=[],days=[];
 const termsOf=y=>[...solarTerms(y).filter(t=>t.lon!==285),...solarTerms(y+1).filter(t=>t.lon===285)].sort((a,b)=>a.date-b.date);
 const nowYear=new Date().getUTCFullYear();
 let flowYear=years.find(y=>y.year===nowYear)?.year??Number(years[0]?.year??normal.Y);
 if(selection.year!==undefined&&selection.year!==null){
  const y=Number(selection.year);
  if(!Number.isInteger(y)||y<1800||y>2330)throw Error('无效流年');
  selected.push(add({...flowYears(y,1)[0],name:'流年'}));
  flowYear=y;
 }
 const terms=termsOf(flowYear);
 months=terms.map((term,i)=>{
  const at=new Date(+term.date+1),yp=yearPillar(at,at.getUTCFullYear()),mp=monthPillar(at,at.getUTCFullYear(),stems.indexOf(yp.stem));
  return {...add({...mp,name:'流月'}),index:i,label:term.name,date:term.date.toISOString(),longitude:term.lon};
 });
 const nowIso=new Date().toISOString().slice(0,10);
 let baseMonth=months.findIndex((m,i)=>m.date.slice(0,10)<=nowIso&&(months[i+1]?.date.slice(0,10)??'9999')>nowIso);
 if(baseMonth<0)baseMonth=0;
 if(selection.month!==undefined&&selection.month!==null){
  if(!months[selection.month])throw Error('无效流月');
  selected.push(months[selection.month]);
  baseMonth=selection.month;
 }
 const offsetHours=Number(birth.city.tz??8),localDate=at=>new Date(+at+offsetHours*3600000).toISOString().slice(0,10);
 const begin=terms[baseMonth].date,next=terms[baseMonth+1]?.date??solarTerms(flowYear+1).find(t=>t.lon===315).date;
 const mStart=localDate(begin),mEnd=localDate(next);
 for(let date=mStart;date<mEnd&&days.length<33;){
  const [yr,mo,da]=date.split('-').map(Number),p=dayPillar({y:yr,m:mo,d:da,h:12});
  days.push({...add({...p,name:'流日'}),index:days.length,date});
  date=new Date(Date.parse(date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 }
 if(selection.day!==undefined&&selection.day!==null){
  if(!Number.isInteger(selection.day)||!days[selection.day])throw Error('无效流日');
  selected.push(days[selection.day]);
 }
 // 流时：选中流日后按「五鼠遁」起十二时辰时柱（甲己日起甲子、乙庚日起丙子……）
 let hours=[];
 if(days[selection.day??0]&&!birth.timeUnknown){
  const base=days[selection.day??0],dayStemIdx=stems.indexOf(base.stem);
  hours=Array.from({length:12},(_,i)=>{
   const p={stem:stems[(dayStemIdx*2+i)%10],branch:branches[i],name:'流时'};
   return {...add(p),index:i,label:branches[i]+'时',clock:`${String((i*2+23)%24).padStart(2,'0')}:00–${String((i*2+25)%24).padStart(2,'0')}:00`};
  });
  if(selection.hour!==undefined&&selection.hour!==null){
   if(!Number.isInteger(selection.hour)||!hours[selection.hour])throw Error('无效流时');
   selected.push(hours[selection.hour]);
  }
 }
 const matrix=[...pillars,...selected],links=relations(matrix);
 const node=b.luck.edge;
 const nodeWall=new Date(Date.parse(node.utc)+8*3600000).toISOString().slice(0,19).replace('T',' ');
 const start=new Date(cycles[0].startUtc),startYear=start.getUTCFullYear();
 const prior=[...solarTerms(startYear-1),...solarTerms(startYear)].filter(t=>t.date<=start).sort((a,b)=>b.date-a.date)[0];
 const elapsedDays=Math.floor((start-prior.date)/86400000),entryYear=yearPillar(start,startYear);
 const entryOffset=birth.city.tzName?offsetMinutes(+start,birth.city.tzName):Number(birth.city.tz??8)*60;
 const startLocal=new Date(+start+entryOffset*60000).toISOString().slice(0,19).replace('T',' ');
 const entry={directionLabel:b.luck.directionLabel,duration:b.luck.duration,intervalSeconds:b.luck.intervalSeconds,utc:cycles[0].startUtc,local:startLocal,offsetMinutes:entryOffset,
  term:prior.name,termUtc:prior.date.toISOString(),daysAfter:elapsedDays,year:entryYear.stem+entryYear.branch,
  method:'起运年龄按三天一年、一日四月、一时辰十天折算；交运UT按365.24219878日回归年累计。年龄年月日为传统360日年表示。'};
const natalStrength=strength(pillars,relations(pillars),combine);
// 传统三垣：胎元（受胎之气）、命宫（先天禀赋与人生主轴）、身宫（后天作为与身体）。
// 依赖月柱与时支，时辰未知时命宫/身宫不成立，只保留胎元与胎息。
const ec=Solar.fromYmdHms(normal.Y,normal.M,normal.D,h,mi,0).getLunar().getEightChar();
const annotateTriple=gz=>{
 if(!gz||gz.length<2)return null;
 const stem=gz[0],branch=gz[1];
 return {ganzhi:gz,stem,branch,tenGod:tenGod(stems.indexOf(b.dayMaster.stem),stems.indexOf(stem)),nayin:LunarUtil.NAYIN[gz]||''};
};
const traditional={
 taiYuan:annotateTriple(ec.getTaiYuan()),
 taiXi:annotateTriple(ec.getTaiXi()),
 mingGong:birth.timeUnknown?null:annotateTriple(ec.getMingGong()),
 shenGong:birth.timeUnknown?null:annotateTriple(ec.getShenGong()),
 unknown:!!birth.timeUnknown,
 method:'胎元＝月柱天干进一位、地支进三位；命宫以生月与生时定位（子平法）；身宫＝月支与时支相加定支，天干由年干五虎遁推出。三垣补四柱之未备，用于参照先天禀赋与后天作为，不改动四柱主体。'
};
const result={entry,pillars,cycles,years,months,days,hours,selected,relationships:links,strength:strength(matrix,links,combine),natalStrength,
 traditional,strengthBreakdown:strengthBreakdown(pillars),
  dayMaster:b.dayMaster,voidBranches:b.structure.voidBranches,roots:b.structure.roots,revealed:b.structure.revealed,
  commander,info:{solarYear:b.meta.yearPillarYear,solar:date,lunar:birthLunar.getYear()+'年'+birthLunar.getMonthInChinese()+'月'+birthLunar.getDayInChinese(),gender:birth.gender,
   clock:birth.timeUnknown?'时辰未知':birth.timeStr??[h,mi].map(n=>String(n).padStart(2,'0')).join(':'),
   lunarYear:birthLunar.getYearInGanZhi(),lunarMonth:Math.abs(birthLunar.getMonth()),lunarDay:birthLunar.getDay(),
   startAge:b.luck.startAge,exactStartAge:b.luck.exactStartAge,startUtc:cycles[0].startUtc,forward:b.luck.forward,node:{name:node.name,utc:node.utc,at:nodeWall},tropicalYearDays:b.luck.tropicalYearDays,
   effectiveHour:b.meta.local.h,timeCorrection:b.meta.timeCorrection,correction,lateZishi:birth.lateZishi||'next-day',hourBranch:pillars[3].branch,utc:b.meta.utc}};
 const monthWindows=months.map(month=>({
  ...month,links:relations([...pillars,month]).filter(link=>link.ids.includes(pillars.length))
   .map(link=>link.pattern+link.type)
 })).filter(month=>month.links.length).sort((a,b)=>b.links.length-a.links.length)
  .slice(0,3).sort((a,b)=>a.index-b.index);
 // 图形化时间轴数据：把每个流年/大运干支单独并入原局，用与「岁运提要」完全相同的
 // 五行权重模型计算日主扶助度。数值口径与选中该年时的 guidance.strength 一致，非拍脑袋估算。
 const supportOf=p=>strength([...pillars,p],relations([...pillars,p]),combine).support;
 result.trend={
  natal:{support:natalStrength.support,kind:natalStrength.kind},
  years:years.map(y=>({year:y.year,ganzhi:y.stem+y.branch,element:y.stemElement,support:supportOf(y)})),
  cycles:cycles.map(c=>({index:c.index,age:c.age,startYear:c.startYear,endYear:c.endUtc?new Date(c.endUtc).getUTCFullYear():c.startYear+9,ganzhi:c.stem+c.branch,element:c.stemElement,support:supportOf(c)})),
  method:'流年与大运干支单独并入原局重算日主扶助度，口径与岁运提要一致。'
 };
 result.guidance=periodGuidance({...result,monthWindows});
 return result;
}
export function reverseBazi({pillars,start=1900,end=2100,lateZishi}){
 if(!Array.isArray(pillars)||pillars.length!==4||pillars.some(p=>typeof p!=='string'||p.length!==2||!stems.includes(p[0])||!branches.includes(p[1])))throw Error('请依次输入四组有效干支');
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<1800||end>2200||end<start||end-start>200)throw Error('反查区间最多 200 年，范围 1800–2200');
 return Solar.fromBaZi(...pillars,lateZishi==='current-day'?2:1,start)
  .filter(s=>s.getYear()<=end).map(s=>({date:s.toYmd(),time:s.toYmdHms().slice(11,16)}));
}
export function convertBirth({Y,M,D,calendar,leapMonth}){
 if(![Y,M,D].every(Number.isInteger)||Y<1800||Y>2200||M<1||M>12||D<1||D>31)throw Error('无效日期');
 const s=calendar==='lunar'?Lunar.fromYmd(Y,leapMonth?-M:M,D).getSolar():civilSolar(Y,M,D);
 const l=s.getLunar();
 return {solar:s.toYmd(),lunar:[l.getYear(),Math.abs(l.getMonth()),l.getDay()].map(n=>String(n).padStart(2,'0')).join('-'),leap:l.getMonth()<0};
}
