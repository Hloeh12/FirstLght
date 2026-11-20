import {chart} from './chart.mjs';
import {TROPICAL_YEAR_MS} from './time-constants.mjs';
import {shadbala,bhavaBala,varshaphala} from './vedic-strong.mjs';
import {ashtakavarga} from './ashtakavarga.mjs';
import {yoginiDasha} from './yogini-dasha.mjs';
export const DASHA_LORDS=['计都','金星','太阳','月亮','火星','罗睺','木星','土星','水星'];
const years=[7,20,6,10,7,18,16,19,17],mansion=360/27;
const norm=x=>((x%360)+360)%360;
export function vedicReading(source,utc,at=new Date().toISOString()){
 const born=new Date(utc),target=new Date(at);if(!Number.isFinite(+target))throw Error('大运参考时间无效');
 const planets=source.planets.map(p=>{
  const lon=norm(p.sid),seconds=Math.floor((lon%30)*3600+1e-8),nak=lon%mansion;
  return {...p,degree:{degrees:Math.floor(seconds/3600),minutes:Math.floor(seconds/60)%60,seconds:seconds%60},nakDegree:nak,nakLord:DASHA_LORDS[p.nakIndex%9]};
 });
 const moon=planets.find(p=>p.key==='moon'),lord=moon.nakIndex%9,elapsed=moon.nakDegree/mansion;
 let cursor=+born-elapsed*years[lord]*TROPICAL_YEAR_MS;
 const all=[];
 for(let i=0;i<27;i++){
  const index=(lord+i)%9,end=cursor+years[index]*TROPICAL_YEAR_MS;
  all.push({index:i,lord:DASHA_LORDS[index],years:years[index],start:new Date(cursor).toISOString(),end:new Date(end).toISOString(),active:+target>=cursor&&+target<end});cursor=end;
 }
 const active=all.find(p=>p.active)||null,cycle=Math.floor((active?.index??0)/9);
 const dashas=all.slice(cycle*9,cycle*9+9);
 return {...source,planets,utc:born.toISOString(),at:target.toISOString(),zodiac:'sidereal',ayan:'lahiri',node:'mean',houseSystem:'whole',dashas,active,
  balanceYears:(1-elapsed)*years[lord],sequence:DASHA_LORDS,
  method:'Lahiri恒星黄道与整宫制；罗睺/计都采用平交点。27星宿每宿13°20′，月亮已行比例折算出生大运余额；Vimshottari共120年，年长采用365.24219878日。Lahiri岁差为本机近似模型。'};
}
export function vedicPro({birth,at}){
 const full=chart(birth,{baseOnly:true});
 const result=vedicReading(full.vedic,full.meta.utc,at);
 const strong=shadbala(result);
 result.shadbala=strong;
 result.bhavaBala=bhavaBala(result,strong);
 result.ashtakavarga=ashtakavarga(result);
 result.yogini=yoginiDasha(result,result.at);
 const year=new Date(result.at).getUTCFullYear();
 const tz=Number(birth.city?.tz??8);
 // 时点行运底盘：以所选时刻的天象在出生地起一张恒星黄道整宫制 D1。
 // 本命 D1 终身不变，时点盘必须随时点不同——报告快照据此绘制，避免「选不同时间盘面一样」。
 const atLocal=new Date(+new Date(result.at)+tz*3600000);
 result.atChart=chart({Y:atLocal.getUTCFullYear(),M:atLocal.getUTCMonth()+1,D:atLocal.getUTCDate(),
  h:atLocal.getUTCHours(),mi:atLocal.getUTCMinutes(),city:birth.city,calendar:'solar'},{baseOnly:true}).vedic;
 result.varshaphala=varshaphala({
  natal:result,birth,year,tz,
  buildChart:utc=>{
   const local=new Date(+utc+tz*3600000);
   return chart({Y:local.getUTCFullYear(),M:local.getUTCMonth()+1,D:local.getUTCDate(),h:local.getUTCHours(),mi:local.getUTCMinutes(),city:birth.city,calendar:'solar'},{baseOnly:true}).vedic;
  }
 });
 return result;
}
