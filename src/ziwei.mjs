import {generateChart,detectPatterns,calculateTrueSolarTime,resolveZiweiDayOffset,shiftGregorianDate} from './renhuai-engine.mjs';
import { astro } from 'iztro';
import { memoTTL, cacheKey } from './store.mjs';
/* 紫微盘：使用公开发布的 iztro 库（默认中州派配置）独立实现。
 * 未与原站服务端逐盘比对；原站版本/配置未知，结果不应视为与原站一致。 */
const pick=s=>({name:s.name,brightness:s.brightness||'',mutagen:s.mutagen||''});
const norm=d=>{const m=String(d).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(!m)throw new Error('dateStr 需为 YYYY-MM-DD');return `${Number(m[1])}-${Number(m[2])}-${Number(m[3])}`;};
function build(dateStr,timeIndex,gender,fixLeap){return astro.bySolar(norm(dateStr),Number(timeIndex)||0,gender==='男'?'男':'女',!!fixLeap,'zh-CN');}
function cachedAstro(dateStr,timeIndex,gender,fixLeap){return memoTTL('zw|'+cacheKey({dateStr:norm(dateStr),timeIndex,gender,fixLeap}),30*60*1000,()=>build(dateStr,timeIndex,gender,fixLeap));}
export function ziweiChart(input){
 const {dateStr,timeIndex,gender}=input;
 let [year,month,day]=String(dateStr).split('-').map(Number),hour=Number(timeIndex??0), correction=null;
 if(input.h!==undefined){
  if(!Number.isInteger(Number(input.h))||Number(input.h)<0||Number(input.h)>23||!Number.isInteger(Number(input.mi||0))||Number(input.mi||0)<0||Number(input.mi||0)>59)throw new Error('无效出生时间');
  if(input.useSolarTime&&(!Number.isFinite(Number(input.city?.lon))||Math.abs(Number(input.city?.lon))>180))throw new Error('真太阳时需要有效经度');
  correction=calculateTrueSolarTime({year,month,day,clockHour:Number(input.h),clockMinute:Number(input.mi||0),longitude:input.useSolarTime?Number(input.city?.lon):undefined,utcOffsetMinutes:Number(input.city?.tz??8)*60});
  if(!correction.dateValid)throw new Error('无效出生日期');
  ({year,month,day}=shiftGregorianDate({year,month,day},resolveZiweiDayOffset(correction,input.lateZishi||'next-day')));hour=correction.branch;
 }
 const c=generateChart({year,month,day,hour,gender:gender==='男'?'male':gender==='女'?'female':gender,longitude:Number(input.city?.lon??120)});
 const patterns=detectPatterns(c);
 const palaces=c.palaces.map(p=>({name:p.name,heavenlyStem:'甲乙丙丁戊己庚辛壬癸'[p.stem],earthlyBranch:'子丑寅卯辰巳午未申酉戌亥'[p.branch],branch:p.branch,isBodyPalace:p.isShenGong,decadal:p.daXianAge?{range:p.daXianAge}:null,majorStars:p.stars.filter(s=>s.type==='major').map(s=>({...s,mutagen:s.siHua||'',brightness:s.brightnessRaw||''})),minorStars:p.stars.filter(s=>s.type!=='major').map(s=>({...s,mutagen:s.siHua||'',brightness:s.brightnessRaw||''})),adjectiveStars:[],relatedBranches:[p.branch,(p.branch+4)%12,(p.branch+8)%12,(p.branch+6)%12],stars:p.stars}));
 return {soul:c.mingZhu,body:c.shenZhu,fiveElementsClass:c.wuxingJuName,lunarDate:JSON.stringify(c.lunarInfo),palaces,patterns,correction,sihua:palaces.flatMap(p=>p.stars.filter(s=>s.siHua).map(s=>({star:s.name,type:s.siHua,palace:p.name}))),source:'Renhuai123/ziwei-doushu a600484 · MIT · iztro',rules:{lateZishi:input.lateZishi||'next-day',brightness:'QS（斗数全书）上游默认表',dataset:false}};
}
export function ziweiFlow({dateStr,timeIndex,gender,flowYear}){
  const a=cachedAstro(dateStr,timeIndex,gender,true);
  const y=Number(flowYear)||new Date().getFullYear();
  const h=a.horoscope(new Date(y,6,1));
  return {year:y,ganZhi:`${h.yearly.heavenlyStem}${h.yearly.earthlyBranch}`,yearly:h.yearly,decadal:h.decadal,age:h.age,source:'iztro@2.6.3 public library; not verified against the original server'};
}
