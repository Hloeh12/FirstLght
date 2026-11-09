import {chart} from './chart.mjs';
import {TROPICAL_YEAR_MS} from './time-constants.mjs';
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
 const full=chart(birth,{baseOnly:true});return vedicReading(full.vedic,full.meta.utc,at);
}
