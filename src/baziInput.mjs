import { birthCorrections } from './birth.mjs';
import { localToUtc } from './tz.mjs';
import { lunarToSolar } from './lunar.mjs';
import { bazi, dynamicBazi } from './bazi.mjs';

/** 把前端口径的出生输入转换为八字所需：绝对时刻 UTC + 本地钟面时间 */
export function baziFromInput(input){
  let Y=Number(input.Y),M=Number(input.M),D=Number(input.D);
  if(input.calendar==='lunar'){const s=lunarToSolar(Y,M,D,input.leapMonth);if(!s)throw new Error('农历日期无效');const p=s.split('-').map(Number);Y=p[0];M=p[1];D=p[2];}
  const h=Number(input.h??12),mi=Number(input.mi??0);
  const tz=Number(input.city?.tz??8),lon=Number(input.city?.lon);
  let utc,shift=0,eot=0,solarClock=null,local;
  if(input.city?.tzName){
    const r=localToUtc({Y,M,D,h,mi},input.city.tzName);
    utc=r.utc;shift=r.offsetMin/60;
  }else{
    const bc=birthCorrections({Y,M,D,h,mi,tz,lon,useSolarTime:false});
    utc=bc.utcDate;shift=(+new Date(Date.UTC(Y,M-1,D,h,mi))-+utc)/3600000;
  }
  if(input.useSolarTime){
    const doy=Math.floor((Date.UTC(Y,M-1,D)-Date.UTC(Y,0,1))/86400000)+1;
    const B=2*Math.PI*(doy-81)/364;
    eot=9.87*Math.sin(2*B)-7.53*Math.cos(B)-1.5*Math.sin(B);
    const lonMin=(lon-shift*15)*4;
    let mins=h*60+mi+lonMin+eot;
    mins=((mins%1440)+1440)%1440;
    const hh=Math.floor(mins/60),mm=Math.round(mins%60);
    local={y:Y,m:M,d:D,h:hh,mi:mm};
    solarClock=`${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}`;
  }else{
    local={y:Y,m:M,d:D,h,mi};
  }
  const out=bazi({utc,local,gender:input.gender==='女'?'女':'男',dayBoundaryAt2300:!!input.dayBoundaryAt2300});
  out.meta.input={...input,city:{label:input.city?.label,lat:input.city?.lat,lon,tz}};
  out.meta.solarClock=solarClock;out.meta.eotMin=Math.round(eot*10)/10;
  out.meta.utc=utc.toISOString();out.meta.local=local;
  out.dynamic=dynamicBazi(out,input);
  return out;
}

