import {resolveBirthTime} from './birth.mjs';
import {mutagensFor,ziweiSchool} from './ziwei-rules.mjs';
import {enrichFlying,borrowForEmpty} from './ziwei-flying.mjs';
import {generateChart,resolveEffectiveLunarDate,detectPatterns,calculateTrueSolarTime,resolveZiweiDayOffset,shiftGregorianDate,schoolStarBrightness} from './renhuai-engine.mjs';
import { astro } from 'iztro';
import { Lunar, LunarYear } from 'lunar-javascript';
import { memoTTL, cacheKey } from './memo.mjs';
/* 紫微盘：使用公开发布的 iztro 库（默认中州派配置）独立实现。
 * 未与原站服务端逐盘比对；原站版本/配置未知，结果不应视为与原站一致。 */
const STEMS='甲乙丙丁戊己庚辛壬癸',BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const transformations=(names,palaces)=>names.map((star,index)=>({star,type:'禄权科忌'[index],branch:palaces.find(p=>p.stars.some(s=>s.name===star))?.branch??null}));
const norm=d=>{const m=String(d).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(!m)throw new Error('dateStr 需为 YYYY-MM-DD');return `${Number(m[1])}-${Number(m[2])}-${Number(m[3])}`;};
export const ZIWEI_LEAP_RULES={split:'15日分界','prev-month':'视作本月','next-month':'视作下月'};
function leapPolicy(value='split'){if(!Object.hasOwn(ZIWEI_LEAP_RULES,value))throw Error('无效闰月规则');return value;}
function cachedAstro(dateStr,timeIndex,gender,astroType,ziweiLeap='split'){
 const policy=leapPolicy(ziweiLeap),[year,month,day]=norm(dateStr).split('-').map(Number);
 const lunar=resolveEffectiveLunarDate(year,month,day,policy);
 const adjusted=policy!=='split'&&lunar.rawLunarMonth<0;
 const options={dateStr:adjusted?[lunar.lunarYear,lunar.lunarMonth,lunar.lunarDay].join('-'):norm(dateStr),type:adjusted?'lunar':'solar',isLeapMonth:false,timeIndex:Number(timeIndex),gender:gender==='男'?'男':'女',astroType,fixLeap:!adjusted,language:'zh-CN'};
 return memoTTL('zw|'+cacheKey(options),30*60*1000,()=>astro.withOptions(options));
}
function validateAstroType(value='heaven'){
 if(!['heaven','earth','human'].includes(value))throw new Error('无效盘式');
 return value;
}
export function ziweiChart(input){
 const {dateStr,timeIndex,gender}=input;
 const astroType=validateAstroType(input.astroType),ziweiLeap=leapPolicy(input.ziweiLeap);
 let [year,month,day]=String(dateStr).split('-').map(Number),hour=Number(timeIndex??0), correction=null;
 if(input.h!==undefined){
  if(!Number.isInteger(Number(input.h))||Number(input.h)<0||Number(input.h)>23||!Number.isInteger(Number(input.mi||0))||Number(input.mi||0)<0||Number(input.mi||0)>59)throw new Error('无效出生时间');
  if(input.useSolarTime&&(!Number.isFinite(Number(input.city?.lon))||Math.abs(Number(input.city?.lon))>180))throw new Error('真太阳时需要有效经度');
  const resolved=resolveBirthTime({Y:year,M:month,D:day,h:Number(input.h),mi:Number(input.mi||0),city:input.city,dst1988Rule:input.dst1988Rule});
  const standard=resolved.standard;
  if(!input.useSolarTime){year=standard.Y;month=standard.M;day=standard.D;}
  correction=calculateTrueSolarTime({year,month,day,clockHour:input.useSolarTime?Number(input.h):standard.h,clockMinute:input.useSolarTime?Number(input.mi||0):standard.mi,longitude:input.useSolarTime?Number(input.city?.lon):undefined,utcOffsetMinutes:resolved.offsetMin});
  if(!correction.dateValid)throw new Error('无效出生日期');
  ({year,month,day}=shiftGregorianDate({year,month,day},resolveZiweiDayOffset(correction,input.lateZishi||'next-day')));hour=correction.branch;
 }
 const c=generateChart({year,month,day,hour,gender:gender==='男'?'male':gender==='女'?'female':gender,longitude:Number(input.city?.lon??120)},{astroType,leapMonth:ziweiLeap});
 const school=ziweiSchool(input.ziweiSchool);
 const natal=mutagensFor(STEMS[c.lunarInfo.yearStem],school.id);
 for(const p of c.palaces)for(const star of p.stars){const i=natal.indexOf(star.name);star.siHua=i<0?'':'禄权科忌'[i];}
 const patterns=detectPatterns(c);
 const palaces=c.palaces.map(p=>({name:p.name,heavenlyStem:STEMS[p.stem],earthlyBranch:BRANCHES[p.branch],branch:p.branch,isBodyPalace:p.isShenGong,decadal:p.daXianAge?{range:p.daXianAge}:null,majorStars:p.stars.filter(s=>s.type==='major').map(s=>({...s,mutagen:s.siHua||'',brightness:s.brightnessRaw||''})),minorStars:p.stars.filter(s=>s.type!=='major').map(s=>({...s,mutagen:s.siHua||'',brightness:s.brightnessRaw||''})),adjectiveStars:[],relatedBranches:[p.branch,(p.branch+4)%12,(p.branch+8)%12,(p.branch+6)%12],stars:p.stars}));
 for(const p of palaces){
  const opposite=palaces.find(q=>q.branch===(p.branch+6)%12);
  p.borrowedStars=p.majorStars.length?[]:opposite.majorStars.map(s=>({
   name:s.name,brightness:schoolStarBrightness(s.name,p.branch,'QS')||''
  }));
  p.borrowedFrom=p.majorStars.length?null:opposite.name;
  const natalMap={};for(const t of ['禄','权','科','忌']){const st=mutagensFor(STEMS[c.lunarInfo.yearStem],school.id)[t==='禄'?0:t==='权'?1:t==='科'?2:3];natalMap[st]=t;}
  for(const bs of p.borrowedStars)bs.mutagen=natalMap[bs.name]||undefined;
  const basis=p.majorStars.length?p.majorStars:p.borrowedStars;
  const brightnessWeights={};
  for(const [i,grade] of [...'庙旺得利平不陷'].entries())brightnessWeights[grade]=(7-i)/7;
  p.starWeight=Number(basis.reduce((sum,star)=>sum+(brightnessWeights[star.brightness]??0)*(p.majorStars.length?1:.6),0).toFixed(2));
  p.flying=transformations(mutagensFor(p.heavenlyStem,school.id),palaces);
 }
 for(const p of palaces){p.triadWeight=Number(p.relatedBranches.reduce((sum,b)=>sum+palaces.find(q=>q.branch===b).starWeight,0).toFixed(2));}
 borrowForEmpty(palaces);
 const schoolObj=ziweiSchool(input.ziweiSchool);
 const laiyin=enrichFlying(palaces,STEMS[c.lunarInfo.yearStem],schoolObj);
 palaces.length=0;palaces.push(...laiyin.palaces);
 const effectiveDate=[year,String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
 const a=cachedAstro(effectiveDate,hour,gender,astroType,ziweiLeap);
 for(const p of palaces){
  const ring=a.palaces.find(x=>x.earthlyBranch===p.earthlyBranch);
  p.annualStars=[ring?.suiqian12,ring?.jiangqian12].filter(Boolean);
 }
 const decades=a.decadalList().map(({palaceName,ageRange,yearRange})=>({palaceName,ageRange,yearRange}));
 return {leapPolicy:ziweiLeap,leapLabel:ZIWEI_LEAP_RULES[ziweiLeap],school,astroType,decades,effectiveDate,effectiveTimeIndex:hour,soul:c.mingZhu,body:c.shenZhu,fiveElementsClass:c.wuxingJuName,lunarDate:JSON.stringify(c.lunarInfo),palaces,patterns,correction,laiyin,sihua:palaces.flatMap(p=>p.stars.filter(s=>s.siHua).map(s=>({star:s.name,type:s.siHua,palace:p.name}))),source:'Renhuai123/ziwei-doushu a600484 · MIT · iztro',rules:{school:school.id,lateZishi:input.lateZishi||'next-day',brightness:'QS（斗数全书）上游默认表',dataset:false}};
}
export function ziweiFlow({dateStr,timeIndex,gender,flowYear,astroType,scope,month,day,ziweiSchool:schoolId,ziweiLeap}){
  const school=ziweiSchool(schoolId);
  astroType=validateAstroType(astroType);
  const a=cachedAstro(dateStr,timeIndex,gender,astroType,ziweiLeap);
  const y=Number(flowYear??new Date().getFullYear());
  if(!Number.isInteger(y)||y<1||y>9999)throw new Error('无效流年');
  if(scope!==undefined)return scopedFlow(a,y,scope,month,day,school);
  const date=new Date(0);
  date.setFullYear(y,6,1);
  const h=a.horoscope(date);
  for(const layer of ['yearly','decadal'])h[layer].mutagen=mutagensFor(h[layer].heavenlyStem,school.id);
  return {school,year:y,astroType,ganZhi:`${h.yearly.heavenlyStem}${h.yearly.earthlyBranch}`,yearly:h.yearly,decadal:h.decadal,age:h.age,source:'iztro@2.6.3'};
}


// 流时（v0.61.0）：择时不能只走八字时柱，紫微要给出「这一时辰的流时命宫落在本命哪一宫、
// 流时四化落何宫」。iztro 的 horoscope(date,timeIndex) 本身含 hourly 层，这里只做映射与取用，
// 不另造一套流时算法。亮度权重沿用本文件 ziweiChart 的明示权重（庙1→陷1/7），不是概率。
export function ziweiHourFlow({dateStr,timeIndex,gender,flowDate,hourIndex=0,astroType,ziweiLeap,ziweiSchool:schoolId}){
 const type=validateAstroType(astroType),policy=leapPolicy(ziweiLeap),school=ziweiSchool(schoolId);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(flowDate)))throw Error('流时日期无效');
 const idx=Number(hourIndex);
 if(!Number.isInteger(idx)||idx<0||idx>12)throw Error('无效流时时辰');
 const a=cachedAstro(dateStr,timeIndex,gender,type,policy);
 const hour=a.horoscope(flowDate,idx).hourly;
 const mingIndex=hour.palaceNames.indexOf('命宫');
 if(mingIndex<0)throw Error('无法定位流时命宫');
 const branch=a.palaces[mingIndex]?.earthlyBranch;
 const natal=a.palaces.find(p=>p.earthlyBranch===branch);
 if(!natal)throw Error('无法定位流时命宫所在本命宫位');
 // 对宫按地支六冲取（子午、丑未…），空宫借对宫主星，权重乘 0.6，与 ziweiChart 的借星口径一致。
 const opposite=a.palaces.find(p=>p.earthlyBranch===BRANCHES[(BRANCHES.indexOf(branch)+6)%12]);
 const grade=name=>Math.max(0,'庙旺得利平不陷'.indexOf(name));
 const weigh=palace=>Number(((palace?.majorStars)||[]).reduce((sum,star)=>sum+(7-grade(star.brightness))/7,0).toFixed(2));
 const own=weigh(natal),borrowed=own>0?0:Number((weigh(opposite)*0.6).toFixed(2));
 const majors=(natal.majorStars||[]).map(star=>({name:star.name,brightness:star.brightness||''}));
 // 流时四化：按流时天干与当前四化口径（全书/北派）取四颗星，落宫用本命盘同一颗星所在宫位判定。
 const mutagens=mutagensFor(hour.heavenlyStem,school.id).map((star,index)=>{
  const palace=a.palaces.find(p=>[...(p.majorStars||[]),...(p.minorStars||[])].some(s=>s.name===star));
  return {star,type:'禄权科忌'[index],palace:palace?.name??null,branch:palace?.earthlyBranch??null,
   core:Boolean(palace&&(palace.name==='命宫'||palace.isBodyPalace))};
 }).filter(x=>x.star);
 // 时系星曜（时禄、时昌、时曲、时魁、时钺、时鸾、时喜、时马、时羊、时陀）落宫，仅作证据展示。
 const hourStars=[];
 (hour.stars||[]).forEach((list,index)=>{
  const palace=hour.palaceNames[index],b=a.palaces[index]?.earthlyBranch;
  for(const star of list||[])hourStars.push({name:star.name,kind:star.type||'',palace,branch:b});
 });
 return {
  flowGz:hour.heavenlyStem+hour.earthlyBranch,
  ming:{palace:natal.name,branch,major:majors,weight:own,borrowed,
   opposite:opposite?.name??null,empty:majors.length===0},
  mutagens,hourStars,
  palaces:hour.palaceNames.map((name,i)=>({name,branch:a.palaces[i].earthlyBranch,
   stars:[...(hour.stars?.[i]||[])].map(s=>s.name)})),
  stemIndex:STEMS.indexOf(hour.heavenlyStem)
 };
}

// Signed months distinguish regular and intercalary lunar months.
function scopedFlow(a,year,scope,month,day,school){
 const levels={decadal:'大限',yearly:'流年',monthly:'流月',daily:'流日'};
 if(!Object.hasOwn(levels,scope))throw new Error('无效运限层级');
 const months=LunarYear.fromYear(year).getMonthsInYear().map(m=>({
  month:m.getMonth(),days:m.getDayCount()
 }));
 const scopedMonth=scope==='monthly'||scope==='daily';
 const selected=scopedMonth?months.find(m=>m.month===Number(month)):months.find(m=>m.month===6);
 const selectedDay=scope==='daily'?Number(day):1;
 if(!selected||!Number.isInteger(selectedDay)||selectedDay<1||selectedDay>selected.days)throw new Error('该农历日期不存在');
 const lunar=Lunar.fromYmd(year,selected.month,selectedDay);
 const date=lunar.getSolar().toYmd();
 const horoscope=a.horoscope(date,6);
 const period=horoscope[scope];
 const days=scopedMonth?Array.from({length:selected.days},(_,i)=>({
  day:i+1,ganZhi:Lunar.fromYmd(year,selected.month,i+1).getDayInGanZhi()
 })):[];
 const palaceNames=Object.fromEntries(a.palaces.map((p,i)=>[BRANCHES.indexOf(p.earthlyBranch),period.palaceNames[i]]));
 const palaces=a.palaces.map(p=>({
  branch:BRANCHES.indexOf(p.earthlyBranch),stars:[...p.majorStars,...p.minorStars,...p.adjectiveStars]
 }));
 const mutagens=transformations(mutagensFor(period.heavenlyStem,school.id),palaces);
 return {school,year,date,scope,label:levels[scope],ganZhi:period.heavenlyStem+period.earthlyBranch,
  month:scopedMonth?selected.month:null,day:scope==='daily'?selectedDay:null,
  months,days,palaceNames,mutagens,yearlyLuCunBranch:BRANCHES.indexOf('寅卯巳午巳午申酉亥子'[STEMS.indexOf(horoscope.yearly.heavenlyStem)])};
}
