import {DAY_MS,TROPICAL_YEAR_MS,TROPICAL_YEAR_DAYS} from './time-constants.mjs';
import {Solar,LunarUtil} from 'lunar-javascript';
import * as Astronomy from 'astronomy-engine';

const STEMS=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const STEM_ELEM=['木','木','火','火','土','土','金','金','水','水'];
const STEM_YIN=[false,true,false,true,false,true,false,true,false,true]; // true = 阴
const BRANCH_ELEM=['水','土','木','木','土','火','火','土','金','金','土','水'];
const HIDDEN={子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
const GENERATE={木:'火',火:'土',土:'金',金:'水',水:'木'};
const CONTROL={木:'土',土:'水',水:'火',火:'金',金:'木'};

const jdn=(y,m,d)=>Math.floor(Date.UTC(y,m-1,d)/86400000)+2440588;
const norm=x=>((x%360)+360)%360;
const sunLon=date=>norm(Astronomy.SunPosition(date).elon);

/** 求某年太阳黄经达到 lon 的时刻（就近搜索，返回 Date） */
const termCache=new Map();
export function termNear(year,lon){
 const key=year+':'+lon;
 if(termCache.has(key))return new Date(termCache.get(key));
 const target=norm(lon);
 const anchor=new Date(Date.UTC(year,2,20,12));
 const delta=norm(target-sunLon(anchor)+180)-180;
 const guess=new Date(+anchor+delta/.98565*DAY_MS);
 if(guess.getUTCFullYear()!==year)guess.setUTCFullYear(year);
 const event=Astronomy.SearchSunLongitude(target,new Date(+guess-7*DAY_MS),14);
 if(!event||event.date.getUTCFullYear()!==year)throw Error('节气搜索未收敛');
 let lo=+event.date-DAY_MS,hi=+event.date+DAY_MS;
 const residual=t=>norm(sunLon(new Date(t))-target+180)-180;
 if(residual(lo)>0||residual(hi)<0)throw Error('节气未形成有效搜索区间');
 while(hi-lo>1){const mid=Math.floor((lo+hi)/2);if(residual(mid)<0)lo=mid;else hi=mid;}
 const at=Math.abs(residual(lo))<=Math.abs(residual(hi))?lo:hi;
 if(Math.abs(residual(at))>=.0001)throw Error('节气数值残差超限');
 if(termCache.size>=2400)termCache.clear();
 termCache.set(key,at);return new Date(at);
}

/** 12 节的黄经：立春 315 起，每 30° 一个 */
const JIE=[315,345,15,45,75,105,135,165,195,225,255,285];

export function solarTerms(year){
  return JIE.map((lon,i)=>({name:['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'][i],lon,date:termNear(year,lon)}));
}

export function yearPillar(utc,localYear){
  const y=localYear;
  const lichun=termNear(y,315);
  const solarYear=utc<lichun?y-1:y;
  const idx=((solarYear-1984)%60+60)%60;
  return {year:solarYear,idx,stem:STEMS[idx%10],branch:BRANCHES[idx%12],lichun};
}

export function monthPillar(utc, localYear, yearStemIdx){
  const y=localYear;
  // 找出 date 落在哪个节之后
  const list=[];
  for(const yy of [y-1,y,y+1])for(const [i,lon] of JIE.entries())list.push({i,lon,date:termNear(yy,lon)});
  list.sort((a,b)=>a.date-b.date);
  let cur=null;
  for(const t of list)if(t.date<=utc)cur=t;
  const m=cur.i; // 0 = 寅月
  const stem=(yearStemIdx%5*2+2+m)%10;
  return {monthIndex:m,stem:STEMS[stem],branch:BRANCHES[(2+m)%12],start:cur.date};
}

export function dayPillar(local, dayBoundaryAt2300=false){
  let y=local.y,m=local.m,d=local.d;
  if(dayBoundaryAt2300&&local.h>=23){const t=new Date(Date.UTC(y,m-1,d+1));y=t.getUTCFullYear();m=t.getUTCMonth()+1;d=t.getUTCDate();}
  const idx=((jdn(y,m,d)+49)%60+60)%60;
  return {idx,stem:STEMS[idx%10],branch:BRANCHES[idx%12]};
}

export function hourPillar(local, dayStemIdx){
  const h=local.h+(local.mi||0)/60;
  const branch=Math.floor((h+1)/2)%12;
  const stem=(dayStemIdx%5*2+branch)%10;
  return {branchIdx:branch,stem:STEMS[stem],branch:BRANCHES[branch]};
}

export function tenGod(dayStemIdx, otherStemIdx){
  const de=STEM_ELEM[dayStemIdx], oe=STEM_ELEM[otherStemIdx];
  const same=STEM_YIN[dayStemIdx]===STEM_YIN[otherStemIdx];
  if(oe===de)return same?'比肩':'劫财';
  if(GENERATE[de]===oe)return same?'食神':'伤官';
  if(CONTROL[de]===oe)return same?'偏财':'正财';
  if(CONTROL[oe]===de)return same?'七杀':'正官';
  return same?'偏印':'正印';
}

/** 大运：阳年男/阴年女顺排，否则逆排。起运岁数 = 距下一/上一节天数 ÷ 3 */
export function luckCycles(utc, localYear, month, yearStemIdx, gender, count=8){
  const forward=(yearStemIdx%2===0&&gender==='男')||(yearStemIdx%2===1&&gender==='女');
  const all=[...solarTerms(localYear-1),...solarTerms(localYear),...solarTerms(localYear+1)].sort((a,b)=>a.date-b.date);
  const next=all.find(t=>t.date>utc),prev=[...all].reverse().find(t=>t.date<=utc);
  const edge=forward?next:prev;
  const days=Math.abs(+edge.date-+utc)/86400000;
  const startAge=Math.max(0,days/3);
  const monthIdx=month.monthIndex;
  const mStem=STEMS.indexOf(month.stem);
  const out=[];
  for(let i=1;i<=count;i++){
    const step=forward?i:-i;
    const sIdx=((mStem+step)%10+10)%10, bIdx=((2+monthIdx+step)%12+12)%12;
    const exactAge=startAge+(i-1)*10;
    const startUtc=new Date(+utc+exactAge*TROPICAL_YEAR_MS).toISOString(),endUtc=new Date(+utc+(exactAge+10)*TROPICAL_YEAR_MS).toISOString();
    out.push({age:Math.round(exactAge*10)/10,exactAge,stem:STEMS[sIdx],branch:BRANCHES[bIdx],startYear:new Date(startUtc).getUTCFullYear(),startUtc,endUtc});
  }
  const totalMonths=days*4,years=Math.floor(totalMonths/12),months=Math.floor(totalMonths-years*12);
  const remainderDays=(totalMonths-years*12-months)*30;
  const duration={years,months,days:Math.floor(remainderDays+1e-9),hours:Math.floor((remainderDays%1)*24+1e-7)};
  return {directionLabel:(yearStemIdx%2===0?'阳':'阴')+(gender==='男'?'男':'女')+(forward?'顺行':'逆行'),duration,intervalSeconds:Math.round(days*86400),forward,startAge:Math.round(startAge*10)/10,exactStartAge:startAge,tropicalYearDays:TROPICAL_YEAR_DAYS,edge:{name:edge.name,utc:edge.date.toISOString()},cycles:out};
}

export function flowYears(localYear,count=3,startYear=null){
  const y0=startYear||localYear;
  return Array.from({length:count},(_,i)=>{
    const y=y0+i;const idx=((y-1984)%60+60)%60;
    return {year:y,stem:STEMS[idx%10],branch:BRANCHES[idx%12],age:y-localYear};
  });
}

const stemPairs=['甲己','乙庚','丙辛','丁壬','戊癸'];
const branchRules=[
 ['三合',['申子辰','亥卯未','寅午戌','巳酉丑']],
 ['六合',['子丑','寅亥','卯戌','辰酉','巳申','午未']],
 ['六冲',['子午','丑未','寅申','卯酉','辰戌','巳亥']],
 ['六害',['子未','丑午','寅巳','卯辰','申亥','酉戌']],
 ['三刑',['寅巳申','丑戌未']],
 ['相刑',['子卯']],
 ['自刑',['辰辰','午午','酉酉','亥亥']]
];
function pillarStructure(pillars,hidden,dayIndex){
 const matching=(type,patterns,key)=>patterns.flatMap(pattern=>{
  const missing=[...pattern],matches=[];
  for(const p of pillars){
   const i=missing.indexOf(p[key]);
   if(i>=0){matches.push(p.name);missing.splice(i,1);}
  }
  return missing.length?[]:[{type,pattern,pillars:matches}];
 });
 const relationships=[
  ...matching('天干五合',stemPairs,'stem'),
  ...branchRules.flatMap(([type,patterns])=>matching(type,patterns,'branch'))
 ];
 const element=STEM_ELEM[pillars[2].stemIdx];
 const roots=pillars.flatMap(p=>hidden[p.name].filter(s=>s.element===element)
  .map(s=>({pillar:p.name,branch:p.branch,stem:s.stem,rank:s.rank})));
 const revealed=pillars.filter(p=>p.name!=='日柱').flatMap(p=>pillars
  .filter(q=>hidden[q.name].some(s=>s.stem===p.stem))
  .map(q=>({stem:p.stem,visibleAt:p.name,rootAt:q.name})));
 const start=Math.floor(dayIndex/10)*10;
 return {relationships,roots,revealed,voidBranches:[BRANCHES[(start+10)%12],BRANCHES[(start+11)%12]]};
}

export function bazi({utc,local,gender='男',dayBoundaryAt2300=false}){
  const yp=yearPillar(utc,local.y);
  const yIdx=STEMS.indexOf(yp.stem);
  const mp=monthPillar(utc,local.y,yIdx);
  const dp=dayPillar(local,dayBoundaryAt2300);
  const hp=hourPillar(local,STEMS.indexOf(dp.stem));
  const dIdx=STEMS.indexOf(dp.stem);
  const pillars=[
    {name:'年柱',stem:yp.stem,branch:yp.branch,stemIdx:yIdx,branchIdx:BRANCHES.indexOf(yp.branch),tenGod:tenGod(dIdx,yIdx)},
    {name:'月柱',stem:mp.stem,branch:mp.branch,stemIdx:STEMS.indexOf(mp.stem),branchIdx:BRANCHES.indexOf(mp.branch),tenGod:tenGod(dIdx,STEMS.indexOf(mp.stem))},
    {name:'日柱',stem:dp.stem,branch:dp.branch,stemIdx:dIdx,branchIdx:BRANCHES.indexOf(dp.branch),tenGod:'日主'},
    {name:'时柱',stem:hp.stem,branch:hp.branch,stemIdx:STEMS.indexOf(hp.stem),branchIdx:BRANCHES.indexOf(hp.branch),tenGod:tenGod(dIdx,STEMS.indexOf(hp.stem))}
  ];
  const eight=Solar.fromYmdHms(local.y,local.m,local.d,local.h,local.mi||0,0).getLunar().getEightChar();eight.setSect(dayBoundaryAt2300?1:2);
  for(const [i,p] of pillars.entries()){p.nayin=LunarUtil.NAYIN[p.stem+p.branch]||null;p.changsheng=eight[['getYearDiShi','getMonthDiShi','getDayDiShi','getTimeDiShi'][i]]();p.shensha={implemented:false,items:[],notice:'神煞尚未推算，不补造结果'};}
  const luck=luckCycles(utc,local.y,mp,yIdx,gender);
  const years=flowYears(local.y,3);
  const hidden=Object.fromEntries(pillars.map(p=>[p.name,HIDDEN[p.branch].map(s=>({stem:s,tenGod:tenGod(dIdx,STEMS.indexOf(s)),element:STEM_ELEM[STEMS.indexOf(s)],rank:['本气','中气','余气'][HIDDEN[p.branch].indexOf(s)]}))]));
  const elements={木:0,火:0,土:0,金:0,水:0};
  for(const p of pillars){elements[STEM_ELEM[p.stemIdx]]++;elements[BRANCH_ELEM[p.branchIdx]]++;}
  const weighted={木:0,火:0,土:0,金:0,水:0};
  for(const p of pillars){weighted[STEM_ELEM[p.stemIdx]]+=1;const hs=hidden[p.name];const weights=hs.length===1?[1]:hs.length===2?[0.7,0.3]:[0.6,0.25,0.15];hs.forEach((x,i)=>weighted[x.element]+=weights[i]);}
  const percentages=Object.fromEntries(Object.entries(weighted).map(([k,v])=>[k,Math.round(v/8*10000)/100]));
  const de=STEM_ELEM[dIdx],resource=Object.keys(GENERATE).find(k=>GENERATE[k]===de);
  const support=(weighted[de]+weighted[resource])/8;
  const strength={seasonSupported:[de,resource].includes(BRANCH_ELEM[pillars[1].branchIdx]),rooted:pillars.some(p=>hidden[p.name].some(x=>x.element===de)),assisted:pillars.filter(p=>p.name!=='日柱').some(p=>[de,resource].includes(STEM_ELEM[p.stemIdx])),supportRatio:support,reference:support>0.6?'身旺':support<0.4?'身弱':'中和',method:'天干等权、藏干按本中余气加权；旺衰为简化参考，非格局用神定论'};
  return {structure:pillarStructure(pillars,hidden,dp.idx),elementPercentages:percentages,elementWeights:weighted,strength,pillars,dayMaster:{stem:dp.stem,element:STEM_ELEM[dIdx],yin:STEM_YIN[dIdx]},hiddenStems:hidden,elements,luck,flowYears:years,meta:{yearPillarYear:yp.year,lichun:yp.lichun.toISOString(),monthStart:mp.start.toISOString(),dayBoundary:dayBoundaryAt2300?'23:00':'00:00',gender,note:'节气时刻按太阳视黄经计算；日柱以本地日期换日，可选 23:00 换日'}};
}

export function dynamicBazi(out,{luckIndex,flowYear}={}){
 const weights={...out.elementWeights},extra=[];
 if(luckIndex!==undefined&&luckIndex!==null&&luckIndex!==''){const i=Number(luckIndex);if(!Number.isInteger(i)||i<0||i>=out.luck.cycles.length)throw new Error('无效大运');extra.push({...out.luck.cycles[i],kind:'大运'});}
 if(flowYear!==undefined&&flowYear!==null&&flowYear!==''){const y=Number(flowYear);if(!Number.isInteger(y)||y<1800||y>2200)throw new Error('流年范围1800–2200');extra.push({...flowYears(y,1)[0],kind:'流年'});}
 for(const p of extra){weights[STEM_ELEM[STEMS.indexOf(p.stem)]]+=1;const h=HIDDEN[p.branch],ratios=h.length===1?[1]:h.length===2?[.7,.3]:[.6,.25,.15];h.forEach((s,i)=>weights[STEM_ELEM[STEMS.indexOf(s)]]+=ratios[i]);}
 const total=Object.values(weights).reduce((a,b)=>a+b,0),de=out.dayMaster.element,resource=Object.keys(GENERATE).find(e=>GENERATE[e]===de),support=(weights[de]+weights[resource])/total;
 const reference=support>.6?'身旺':support<.4?'身弱':'中和';
 return {selected:extra,weights,percentages:Object.fromEntries(Object.entries(weights).map(([k,v])=>[k,Math.round(v/total*10000)/100])),supportRatio:support,reference,favorableReference:reference==='身弱'?[resource,de]:reference==='身旺'?[GENERATE[de],CONTROL[de]]:[],method:'本命8单位，大运与流年各加2单位，藏干按本中余气加权；扶抑喜用仅为模型参考，未包含调候、合化、从格等完整用神判断'};
}
