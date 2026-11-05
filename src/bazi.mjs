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
function termNear(year, lon){
  // 以黄经 0° 约在 3/20 为基准估算日期，再在 ±25 天内二分
  const target=norm(lon);
  let guess=new Date(Date.UTC(year,2,20,12)-((340-target+360)%360)*0.9856*86400000/0.9856*1);
  // 用粗略比例：黄经每天约 +0.9856°
  const nowLon=sunLon(new Date(Date.UTC(year,2,20,12)));
  const delta=((target-nowLon+540)%360)-180;
  guess=new Date(Date.UTC(year,2,20,12)+delta/0.98565*86400000);
  let lo=+guess-3*86400000, hi=+guess+3*86400000;
  const f=t=>{const d=((sunLon(new Date(t))-target+540)%360)-180;return d;};
  for(let i=0;i<60;i++){const mid=(lo+hi)/2;if(f(mid)<0)lo=mid;else hi=mid;}
  return new Date(Math.round((lo+hi)/2));
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
    out.push({age:Math.round((startAge+(i-1)*10)*10)/10,stem:STEMS[sIdx],branch:BRANCHES[bIdx],startYear:localYear+Math.floor(startAge+(i-1)*10)});
  }
  return {forward,startAge:Math.round(startAge*10)/10,cycles:out};
}

export function flowYears(localYear,count=3,startYear=null){
  const y0=startYear||localYear;
  return Array.from({length:count},(_,i)=>{
    const y=y0+i;const idx=((y-1984)%60+60)%60;
    return {year:y,stem:STEMS[idx%10],branch:BRANCHES[idx%12],age:y-localYear};
  });
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
  const luck=luckCycles(utc,local.y,mp,yIdx,gender);
  const years=flowYears(local.y,3);
  const hidden=Object.fromEntries(pillars.map(p=>[p.name,HIDDEN[p.branch].map(s=>({stem:s,tenGod:tenGod(dIdx,STEMS.indexOf(s))}))]));
  const elements={木:0,火:0,土:0,金:0,水:0};
  for(const p of pillars){elements[STEM_ELEM[p.stemIdx]]++;elements[BRANCH_ELEM[p.branchIdx]]++;}
  return {pillars,dayMaster:{stem:dp.stem,element:STEM_ELEM[dIdx],yin:STEM_YIN[dIdx]},hiddenStems:hidden,elements,luck,flowYears:years,meta:{yearPillarYear:yp.year,lichun:yp.lichun.toISOString(),monthStart:mp.start.toISOString(),dayBoundary:dayBoundaryAt2300?'23:00':'00:00',gender,note:'节气时刻按太阳视黄经计算；日柱以本地日期换日，可选 23:00 换日'}};
}
