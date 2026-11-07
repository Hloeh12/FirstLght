import {resonance} from './resonance.mjs';
import {ashtakoota} from './ashtakoota.mjs';
import {chart,synastry} from './chart.mjs';
import {ziweiChart,ziweiFlow} from './ziwei.mjs';
import {localTemplateReport} from './report-template.mjs';
import {westernPro} from './western-pro.mjs';
import {baziPro,reverseBazi,convertBirth,relations} from './bazi-pro.mjs';
import {boneWeight,qizheng,yijing,almanac} from './traditions.mjs';
import {searchPlaces,resolvePlace} from './geo.mjs';
import {lunarToSolar} from './lunar.mjs';
import {todaySky,dailyGuidance} from './today-sky.mjs';

function solarInput(birth,bazi=baziPro({birth})){
 const [Y,M,D]=bazi.info.solar.split('-').map(Number);
 const h=birth.timeUnknown?12:birth.h,mi=birth.timeUnknown?0:birth.mi;
 return {...birth,Y,M,D,h,mi,dateStr:bazi.info.solar,calendar:'solar',dayBoundaryAt2300:birth.lateZishi!=='current-day'};
}
function consoleReading({birth}){
 const bazi=baziPro({birth}),standard=solarInput(birth,bazi);
 const {Y,M,D,h,mi}=standard;
 const utcOffset=(Date.UTC(Y,M-1,D,h,mi)-Date.parse(bazi.info.utc))/3600000;
 const ziwei=ziweiChart(standard);
 const full=chart({...standard,skipZiwei:true});
 return {bazi,ziwei,western:full.western,vedic:full.vedic,analysis:full.analysis,meta:full.meta,
  report:localTemplateReport({...full,ziwei})};
}
function pairReading({a,b,mode}){
 const ba=baziPro({birth:a}),bb=baziPro({birth:b});
 const result=synastry({...solarInput(a,ba),skipZiwei:true},{...solarInput(b,bb),skipZiwei:true},mode||'synastry');
 const {total:forward,max}=result.vedic.koota;
 const reverse=ashtakoota(result.vedic.b.d1,result.vedic.a.d1).total;
 const total=(forward+reverse)/2;
 const pillars=[...ba.pillars.map(p=>({...p,name:'当前案例'+p.name})),...bb.pillars.map(p=>({...p,name:'关联案例'+p.name}))];
 const cross=relations(pillars).filter(r=>r.ids.some(i=>i<4)&&r.ids.some(i=>i>=4));
 const supportive=cross.find(r=>['天干五合','六合','三合局'].includes(r.type));
 const challenging=cross.find(r=>['六冲','相刑','相害','相破'].includes(r.type));
 const aspects=[...result.western.interAspects].sort((x,y)=>x.orb-y.orb);
 const key=aspects.find(x=>[0,60,120].includes(x.angle)),tension=aspects.find(x=>[90,180].includes(x.angle));
 const label=r=>r.pattern+' · '+r.type;
 const aspect=x=>x.a+'与'+x.b+x.type+'（'+x.orb.toFixed(2)+'°）';
 const insights=[
  {name:'互动助力',text:[supportive?label(supportive):'',key?aspect(key):''].filter(Boolean).join('；')||'当前规则未检出突出的相合线索。'},
  {name:'相处留意',text:[challenging?label(challenging):'',tension?aspect(tension):''].filter(Boolean).join('；')||'当前规则未检出突出的冲克线索。'}
 ];
 const fit={total,max,percent:Math.round(100*total/max),highlight:supportive?label(supportive):challenging?label(challenging):key?aspect(key):'',insights};
 return {ok:true,...result,fit,crossRelations:cross};
}
export const consoleRoutes={
 '/api/console/resonance':resonance,'/api/console/reading':consoleReading,'/api/console/western':westernPro,'/api/console/bazi':baziPro,
 '/api/console/reverse-bazi':reverseBazi,'/api/console/convert':convertBirth,
 '/api/console/bones':({birth})=>boneWeight(birth),'/api/console/qizheng':({birth})=>qizheng(birth),
 '/api/console/yijing':yijing,'/api/console/calendar':almanac,
 '/api/console/today-sky':todaySky,'/api/console/daily-guidance':dailyGuidance,
 '/api/console/relationship':data=>pairReading(data).fit
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
  case '/api/synastry/chart': return pairReading(data);
  default: throw Error('本机不支持此计算');
 }
}
