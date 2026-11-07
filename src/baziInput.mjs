import { resolveBirthTime } from './birth.mjs';
import { lunarToSolar } from './lunar.mjs';
import { calculateTrueSolarTime } from './renhuai-engine.mjs';
import { bazi, dynamicBazi } from './bazi.mjs';

/** 把前端口径的出生输入转换为八字所需：绝对时刻 UTC + 本地钟面时间 */
export function baziFromInput(input){
  let Y=Number(input.Y),M=Number(input.M),D=Number(input.D);
  if(input.calendar==='lunar'){const s=lunarToSolar(Y,M,D,input.leapMonth);if(!s)throw new Error('农历日期无效');const p=s.split('-').map(Number);Y=p[0];M=p[1];D=p[2];}
  const h=Number(input.h??12),mi=Number(input.mi??0);
  const tz=Number(input.city?.tz??8),lon=Number(input.city?.lon);
  let utc,shift=0,eot=0,solarClock=null,local;
  const resolved=resolveBirthTime({Y,M,D,h,mi,city:input.city,dst1988Rule:input.dst1988Rule});
  utc=resolved.utc;shift=resolved.offsetMin/60;
  if(input.useSolarTime){
    const c=calculateTrueSolarTime({year:Y,month:M,day:D,clockHour:h,clockMinute:mi,longitude:lon,utcOffsetMinutes:shift*60});
    if(!c.dateValid)throw Error('无效出生日期');
    const corrected=new Date(Date.UTC(Y,M-1,D+c.dayOffset));
    local={y:corrected.getUTCFullYear(),m:corrected.getUTCMonth()+1,d:corrected.getUTCDate(),h:c.hour,mi:c.minute};
    solarClock=`${String(c.hour).padStart(2,'0')}:${String(c.minute).padStart(2,'0')}`;
    eot=c.equationOfTimeMinutes;
  }else{
    const c=resolved.standard;local={y:c.Y,m:c.M,d:c.D,h:c.h,mi:c.mi};
  }
  const out=bazi({utc,local,gender:input.gender==='女'?'女':'男',dayBoundaryAt2300:!!input.dayBoundaryAt2300});
  out.meta.input={...input,city:{label:input.city?.label,lat:input.city?.lat,lon,tz}};
  out.meta.solarClock=solarClock;out.meta.eotMin=Math.round(eot*10)/10;
  out.meta.timeCorrection={dstApplied:resolved.dstApplied,dstRule:resolved.dstRule,warning:resolved.warning,standard:resolved.standard,offsetMin:resolved.offsetMin};
  out.meta.utc=utc.toISOString();out.meta.local=local;
  out.dynamic=dynamicBazi(out,input);
  return out;
}

