import {generateChart,detectPatterns,calculateTrueSolarTime,resolveZiweiDayOffset,shiftGregorianDate,schoolStarBrightness} from './renhuai-engine.mjs';
import { astro, util } from 'iztro';
import { Lunar, LunarYear } from 'lunar-javascript';
import { memoTTL, cacheKey } from './store.mjs';
/* 紫微盘：使用公开发布的 iztro 库（默认中州派配置）独立实现。
 * 未与原站服务端逐盘比对；原站版本/配置未知，结果不应视为与原站一致。 */
const STEMS='甲乙丙丁戊己庚辛壬癸',BRANCHES='子丑寅卯辰巳午未申酉戌亥';
const transformations=(names,palaces)=>names.map((star,index)=>({star,type:'禄权科忌'[index],branch:palaces.find(p=>p.stars.some(s=>s.name===star))?.branch??null}));
const norm=d=>{const m=String(d).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(!m)throw new Error('dateStr 需为 YYYY-MM-DD');return `${Number(m[1])}-${Number(m[2])}-${Number(m[3])}`;};
function cachedAstro(dateStr,timeIndex,gender,astroType){
 const options={dateStr:norm(dateStr),timeIndex:Number(timeIndex),gender:gender==='男'?'男':'女',astroType,fixLeap:true,language:'zh-CN'};
 return memoTTL('zw|'+cacheKey(options),30*60*1000,()=>astro.withOptions(options));
}
function validateAstroType(value='heaven'){
 if(!['heaven','earth','human'].includes(value))throw new Error('无效盘式');
 return value;
}
export function ziweiChart(input){
 const {dateStr,timeIndex,gender}=input;
 const astroType=validateAstroType(input.astroType);
 let [year,month,day]=String(dateStr).split('-').map(Number),hour=Number(timeIndex??0), correction=null;
 if(input.h!==undefined){
  if(!Number.isInteger(Number(input.h))||Number(input.h)<0||Number(input.h)>23||!Number.isInteger(Number(input.mi||0))||Number(input.mi||0)<0||Number(input.mi||0)>59)throw new Error('无效出生时间');
  if(input.useSolarTime&&(!Number.isFinite(Number(input.city?.lon))||Math.abs(Number(input.city?.lon))>180))throw new Error('真太阳时需要有效经度');
  correction=calculateTrueSolarTime({year,month,day,clockHour:Number(input.h),clockMinute:Number(input.mi||0),longitude:input.useSolarTime?Number(input.city?.lon):undefined,utcOffsetMinutes:Number(input.city?.tz??8)*60});
  if(!correction.dateValid)throw new Error('无效出生日期');
  ({year,month,day}=shiftGregorianDate({year,month,day},resolveZiweiDayOffset(correction,input.lateZishi||'next-day')));hour=correction.branch;
 }
 const c=generateChart({year,month,day,hour,gender:gender==='男'?'male':gender==='女'?'female':gender,longitude:Number(input.city?.lon??120)},{astroType});
 const patterns=detectPatterns(c);
 const palaces=c.palaces.map(p=>({name:p.name,heavenlyStem:STEMS[p.stem],earthlyBranch:BRANCHES[p.branch],branch:p.branch,isBodyPalace:p.isShenGong,decadal:p.daXianAge?{range:p.daXianAge}:null,majorStars:p.stars.filter(s=>s.type==='major').map(s=>({...s,mutagen:s.siHua||'',brightness:s.brightnessRaw||''})),minorStars:p.stars.filter(s=>s.type!=='major').map(s=>({...s,mutagen:s.siHua||'',brightness:s.brightnessRaw||''})),adjectiveStars:[],relatedBranches:[p.branch,(p.branch+4)%12,(p.branch+8)%12,(p.branch+6)%12],stars:p.stars}));
 for(const p of palaces){
  const opposite=palaces.find(q=>q.branch===(p.branch+6)%12);
  p.borrowedStars=p.majorStars.length?[]:opposite.majorStars.map(s=>({
   name:s.name,brightness:schoolStarBrightness(s.name,p.branch,'QS')||''
  }));
  p.flying=transformations(util.getMutagensByHeavenlyStem(p.heavenlyStem),palaces);
 }
 const effectiveDate=[year,String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-');
 const a=cachedAstro(effectiveDate,hour,gender,astroType);
 const decades=a.decadalList().map(({palaceName,ageRange,yearRange})=>({palaceName,ageRange,yearRange}));
 return {astroType,decades,effectiveDate,effectiveTimeIndex:hour,soul:c.mingZhu,body:c.shenZhu,fiveElementsClass:c.wuxingJuName,lunarDate:JSON.stringify(c.lunarInfo),palaces,patterns,correction,sihua:palaces.flatMap(p=>p.stars.filter(s=>s.siHua).map(s=>({star:s.name,type:s.siHua,palace:p.name}))),source:'Renhuai123/ziwei-doushu a600484 · MIT · iztro',rules:{lateZishi:input.lateZishi||'next-day',brightness:'QS（斗数全书）上游默认表',dataset:false}};
}
export function ziweiFlow({dateStr,timeIndex,gender,flowYear,astroType,scope,month,day}){
  astroType=validateAstroType(astroType);
  const a=cachedAstro(dateStr,timeIndex,gender,astroType);
  const y=Number(flowYear??new Date().getFullYear());
  if(!Number.isInteger(y)||y<1||y>9999)throw new Error('无效流年');
  if(scope!==undefined)return scopedFlow(a,y,scope,month,day);
  const date=new Date(0);
  date.setFullYear(y,6,1);
  const h=a.horoscope(date);
  return {year:y,astroType,ganZhi:`${h.yearly.heavenlyStem}${h.yearly.earthlyBranch}`,yearly:h.yearly,decadal:h.decadal,age:h.age,source:'iztro@2.6.3'};
}


// Signed months distinguish regular and intercalary lunar months.
function scopedFlow(a,year,scope,month,day){
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
 const mutagens=transformations(period.mutagen,palaces);
 return {year,date,scope,label:levels[scope],ganZhi:period.heavenlyStem+period.earthlyBranch,
  month:scopedMonth?selected.month:null,day:scope==='daily'?selectedDay:null,
  months,days,palaceNames,mutagens};
}
