import {chart,synastry} from './chart.mjs';
import {ziweiChart,ziweiFlow} from './ziwei.mjs';
import {localTemplateReport} from './report-template.mjs';
import {westernPro} from './western-pro.mjs';
import {baziPro,reverseBazi,convertBirth} from './bazi-pro.mjs';
import {boneWeight,qizheng,yijing,almanac} from './traditions.mjs';
import {searchPlaces,resolvePlace} from './geo.mjs';
import {lunarToSolar} from './lunar.mjs';

function solarInput(birth,bazi=baziPro({birth})){
 const [Y,M,D]=bazi.info.solar.split('-').map(Number);
 const h=birth.timeUnknown?12:birth.h,mi=birth.timeUnknown?0:birth.mi;
 return {...birth,Y,M,D,h,mi,dateStr:bazi.info.solar,calendar:'solar',dayBoundaryAt2300:birth.lateZishi!=='current-day'};
}
function consoleReading({birth}){
 const bazi=baziPro({birth}),standard=solarInput(birth,bazi);
 const {Y,M,D,h,mi}=standard;
 const utcOffset=(Date.UTC(Y,M-1,D,h,mi)-Date.parse(bazi.info.utc))/3600000;
 const ziwei=ziweiChart({...standard,city:{...birth.city,tz:utcOffset}});
 const full=chart({...standard,skipZiwei:true});
 return {bazi,ziwei,western:full.western,vedic:full.vedic,analysis:full.analysis,meta:full.meta,
  report:localTemplateReport({...full,ziwei})};
}
export const consoleRoutes={
 '/api/console/reading':consoleReading,'/api/console/western':westernPro,'/api/console/bazi':baziPro,
 '/api/console/reverse-bazi':reverseBazi,'/api/console/convert':convertBirth,
 '/api/console/bones':({birth})=>boneWeight(birth),'/api/console/qizheng':({birth})=>qizheng(birth),
 '/api/console/yijing':yijing,'/api/console/calendar':almanac,
 '/api/console/relationship':({a,b})=>{
  const {total,max}=synastry({...solarInput(a),skipZiwei:true},{...solarInput(b),skipZiwei:true}).vedic.koota;
  return {total,max,percent:Math.round(100*total/max)};
 }
};

export function localRequest(path, data) {
 const url = new URL(path, 'https://firstlight.local');
 if (Object.hasOwn(consoleRoutes, url.pathname)) return consoleRoutes[url.pathname](data);
 switch (url.pathname) {
  case '/api/geo/search': return {items:searchPlaces(url.searchParams.get('q'))};
  case '/api/geo/resolve': {
   const place = resolvePlace(Object.fromEntries(url.searchParams));
   if (!place) throw Error('未找到该地区坐标');
   return place;
  }
  case '/api/ziwei': {
   const dateStr = data.calendar === 'lunar' ? lunarToSolar(data.Y,data.M,data.D,!!data.leapMonth) : data.dateStr;
   if (!dateStr) throw Error('农历日期无效');
   return ziweiChart({...data,dateStr});
  }
  case '/api/ziwei-flow': return ziweiFlow({...data,timeIndex:data.ziweiTimeIndex??data.timeIndex??0});
  case '/api/synastry/chart': return {ok:true,...synastry({...solarInput(data.a),skipZiwei:true},{...solarInput(data.b),skipZiwei:true},data.mode||'synastry')};
  default: throw Error('本机不支持此计算');
 }
}
