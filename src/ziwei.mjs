import { astro } from 'iztro';
import { memoTTL, cacheKey } from './store.mjs';
/* 紫微盘：使用公开发布的 iztro 库（默认中州派配置）独立实现。
 * 未与原站服务端逐盘比对；原站版本/配置未知，结果不应视为与原站一致。 */
const pick=s=>({name:s.name,brightness:s.brightness||'',mutagen:s.mutagen||''});
const norm=d=>{const m=String(d).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);if(!m)throw new Error('dateStr 需为 YYYY-MM-DD');return `${Number(m[1])}-${Number(m[2])}-${Number(m[3])}`;};
function build(dateStr,timeIndex,gender,fixLeap){return astro.bySolar(norm(dateStr),Number(timeIndex)||0,gender==='男'?'男':'女',!!fixLeap,'zh-CN');}
function cachedAstro(dateStr,timeIndex,gender,fixLeap){return memoTTL('zw|'+cacheKey({dateStr:norm(dateStr),timeIndex,gender,fixLeap}),30*60*1000,()=>build(dateStr,timeIndex,gender,fixLeap));}
export function ziweiChart({dateStr,timeIndex,gender,fixLeap=true}){
  const a=cachedAstro(dateStr,timeIndex,gender,fixLeap);
  const palaces=a.palaces.map(p=>({name:p.name,heavenlyStem:p.heavenlyStem,earthlyBranch:p.earthlyBranch,isBodyPalace:!!p.isBodyPalace,decadal:p.decadal?{range:p.decadal.range,heavenlyStem:p.decadal.heavenlyStem,earthlyBranch:p.decadal.earthlyBranch}:null,majorStars:(p.majorStars||[]).map(pick),minorStars:(p.minorStars||[]).map(pick),adjectiveStars:(p.adjectiveStars||[]).map(s=>s.name)}));
  return {soul:a.soul,body:a.body,fiveElementsClass:a.fiveElementsClass,solarDate:a.solarDate,lunarDate:a.lunarDate,chineseDate:a.chineseDate,zodiac:a.zodiac,sign:a.sign,palaces,source:'iztro@2.6.3 public library; not verified against the original server'};
}
export function ziweiFlow({dateStr,timeIndex,gender,flowYear}){
  const a=cachedAstro(dateStr,timeIndex,gender,true);
  const y=Number(flowYear)||new Date().getFullYear();
  const h=a.horoscope(new Date(y,6,1));
  return {year:y,ganZhi:`${h.yearly.heavenlyStem}${h.yearly.earthlyBranch}`,yearly:h.yearly,decadal:h.decadal,age:h.age,source:'iztro@2.6.3 public library; not verified against the original server'};
}
