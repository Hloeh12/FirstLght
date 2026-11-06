import {ayanamsa,bodyAt,housesAt} from './ephemeris.mjs';
import {baziFromInput} from './baziInput.mjs';
import {analyze} from './analysis.mjs';
import {Solar} from 'lunar-javascript';

export const HOUSE_SYSTEMS={placidus:'P',whole:'W',koch:'K',equal:'A',regiomontanus:'R',campanus:'C',porphyry:'O'};
export const OBJECTS=[
 ['sun','太阳','☉',0],['moon','月亮','☽',1],['mercury','水星','☿',2],['venus','金星','♀',3],['mars','火星','♂',4],
 ['jupiter','木星','♃',5],['saturn','土星','♄',6],['uranus','天王星','♅',7],['neptune','海王星','♆',8],['pluto','冥王星','♇',9],
 ['north','北交点','☊'],['south','南交点','☋'],['asc','上升','ASC'],['dsc','下降','DSC'],['mc','天顶','MC'],['ic','天底','IC'],
 ['fortune','福点','⊗'],['vertex','宿命点','Vx'],['chiron','凯龙星','⚷',15],['lilith','莉莉丝','⚸',12],
 ['juno','婚神星','⚵',19],['vesta','灶神星','⚶',20],['pallas','智神星','⚴',18],['ceres','谷神星','⚳',17]
];
const SIGNS=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'];
const RULERS=['火星','金星','水星','月亮','太阳','水星','金星','火星','木星','土星','土星','木星'];
const ASPECTS=[
 [0,'合相','☌',8,5],[60,'六合','⚹',5,3],[90,'刑相','□',7,5],[120,'三合','△',7,5],[180,'对冲','☍',8,5],
 [30,'半六合','⚺',2,0],[45,'半刑','∠',2,0],[135,'补八分','⚼',2,0],[150,'梅花相','⚻',2,1.5]
];
const DAY=86400000,YEAR=365.2422*DAY,MONTH=27.321661*DAY;
const AYAN={lahiri:1,fagan:0,krishnamurti:5};
export const normalize=x=>((x%360)+360)%360;
const signed=x=>normalize(x+180)-180;
const sign=x=>Math.floor(normalize(x)/30);
export function degree(x){
 const v=Math.round(normalize(x)*3600)%(360*3600),local=v%(30*3600);
 return {sign:SIGNS[Math.floor(v/(30*3600))],degrees:Math.floor(local/3600),minutes:Math.floor(local/60)%60,seconds:local%60};
}
const defaults=OBJECTS.slice(0,16).map(x=>x[0]);
function settings(raw={}){
 const house=Object.hasOwn(HOUSE_SYSTEMS,raw.house)?raw.house:'placidus';
 const sidereal=raw.zodiac==='sidereal';
 const ayan=Object.hasOwn(AYAN,raw.ayan)?raw.ayan:'lahiri';
 const preset=['default','strict','custom'].includes(raw.preset)?raw.preset:'default';
 const visible=Array.isArray(raw.visible)?OBJECTS.filter(p=>raw.visible.includes(p[0])).map(p=>p[0]):defaults;
 const orbs=Object.fromEntries(ASPECTS.map(([a,,,,])=>[a,Math.max(0,Math.min(15,Number.isFinite(+raw.orbs?.[a])?+raw.orbs[a]:ASPECTS.find(x=>x[0]===a)[3]))]));
 return {house,sidereal,ayan,preset,visible,orbs,phaseWeight:!!raw.phaseWeight,node:raw.node==='mean'?'mean':'true',nominalAge:!!raw.nominalAge};
}
function utcOf(input){
 if(!input?.city||![input.city.lat,input.city.lon].every(x=>typeof x==='number'&&Number.isFinite(x))||Math.abs(input.city.lat)>90||Math.abs(input.city.lon)>180)throw Error('需要有效出生经纬度');
 const year=Number(input.Y);
 if(!Number.isInteger(year)||year<1800||year>2399)throw Error('专业星历出生日期范围为 1800–2399');
 return new Date(baziFromInput({...input,h:input.timeUnknown?12:input.h,mi:input.timeUnknown?0:input.mi}).meta.utc);
}
export function houseOf(lon,cusps){
 const x=normalize(lon-cusps[0]);
 for(let i=1;i<12;i++)if(x<normalize(cusps[i]-cusps[0]))return i;
 return 12;
}
function chartAt(date,city,cfg){
 const ayan=cfg.sidereal?cfg.ayan:null,offset=ayan?ayanamsa(date,ayan):0;
 const h=housesAt(date,city,cfg.house),houseSystem=h.system,warning=h.warning;
 const asc=normalize(h.asc-offset),mc=normalize(h.mc-offset);
 const cusps=houseSystem==='whole'?Array.from({length:12},(_,i)=>normalize(sign(asc)*30+i*30)):h.cusps.map(x=>normalize(x-offset));
 const axes={asc,dsc:normalize(asc+180),mc,ic:normalize(mc+180)};
 const sun=bodyAt(date,0,ayan),moon=bodyAt(date,1,ayan);
 const diurnal=normalize(sun.longitude-asc)>=180;
 const node=cfg.visible.some(k=>k==='north'||k==='south')?bodyAt(date,cfg.node==='mean'?10:11,ayan):null;
 const raw=OBJECTS.filter(([key])=>cfg.visible.includes(key)).map(([key,name,symbol,id])=>{
  let lon,speed=null;
  if(Object.hasOwn(axes,key))lon=axes[key];
  else if(key==='vertex')lon=h.vertex-offset;
  else if(key==='fortune')lon=asc+(moon.longitude-sun.longitude)*(diurnal?1:-1);
  else if(key==='north'||key==='south'){lon=node.longitude+(key==='south'?180:0);speed=node.longitudeSpeed;}
  else {const p=id===0?sun:id===1?moon:bodyAt(date,id,ayan);lon=p.longitude;speed=p.longitudeSpeed;}
  lon=normalize(lon);
  const d=degree(lon);
  return {key,name,symbol,lon,speed,sign:d.sign,degree:d,house:houseOf(lon,cusps),retro:speed!==null&&speed<0,approximate:id>=15};
 });
 const aspects=aspectPairs(raw,raw,cfg,true);
 const majors=raw.filter(p=>defaults.slice(0,10).includes(p.key));
 const analysis=analyze({planets:majors,asc:{sign:degree(asc).sign},aspects:aspects.filter(a=>majors.some(p=>p.key===a.aKey)&&majors.some(p=>p.key===a.bKey))});
 for(const p of raw)p.dignity=analysis.planets.find(x=>x.name===p.name)?.dignitySystem==='classical'?analysis.planets.find(x=>x.name===p.name).dignity:null;
 const patterns=patternsOf(majors,aspects,analysis.patterns);
 return {utc:date.toISOString(),houseSystem,warning,zodiac:cfg.sidereal?'sidereal':'tropical',ayan:cfg.ayan,offset,axes,cusps,planets:raw,aspects,analysis:{...analysis,patterns},diurnal};
}
function aspectPairs(a,b,cfg,same){
 const result=[];
 for(const [i,p] of a.entries())for(let j=same?i+1:0;j<b.length;j++){
  const q=b[j];
  const sep=signed(q.lon-p.lon),gap=Math.abs(sep);
  const slope=p.speed===null||same&&q.speed===null?null:(same?q.speed-p.speed:-p.speed)*(sep<0?-1:1);
  const matches=ASPECTS.flatMap(([angle,type,symbol,normal,strict])=>{
   const deviation=gap-angle;
   const applying=slope===null||Math.abs(deviation)<1e-7?null:deviation*slope<0;
   let orb=cfg.preset==='custom'?cfg.orbs[angle]:cfg.preset==='strict'?strict:normal;
   if(cfg.phaseWeight&&applying===false)orb*=.8;
   return orb>0&&Math.abs(deviation)<=orb?[{a:p.name,b:q.name,aKey:p.key,bKey:q.key,type,symbol,angle,orb:Math.abs(deviation),deviation,applying}]:[];
  });
  matches.sort((x,y)=>x.orb-y.orb);
  if(matches.length)result.push(matches[0]);
 }
 return result;
}
function patternsOf(major,aspects,base){
 const names=major.map(p=>p.name),out=[...base];
 const has=(a,b,d)=>aspects.some(x=>x.angle===d&&(x.a===a&&x.b===b||x.b===a&&x.a===b));
 for(const tip of names)for(const [i,a] of names.entries())for(const b of names.slice(i+1)){
  if(tip!==a&&tip!==b&&has(a,b,60)&&has(a,tip,150)&&has(b,tip,150))out.push({type:'上帝之手',planets:[a,b,tip]});
 }
 for(const p of base.filter(x=>x.type==='大三角')){
  for(const apex of p.planets)for(const n of names.filter(x=>!p.planets.includes(x))){
   if(has(apex,n,180)&&p.planets.filter(x=>x!==apex).every(x=>has(x,n,60)))out.push({type:'风筝',planets:[...p.planets,n]});
  }
 }
 const opp=aspects.filter(x=>x.angle===180&&names.includes(x.a)&&names.includes(x.b));
 for(const [i,p] of opp.entries())for(const q of opp.slice(i+1)){
  if(new Set([p.a,p.b,q.a,q.b]).size===4&&[p.a,p.b].every(a=>[q.a,q.b].every(b=>has(a,b,90))))out.push({type:'大十字',planets:[p.a,p.b,q.a,q.b]});
 }
 return out;
}
export function findReturn(birth,target,id,ayan,zone=0){
 const lon=bodyAt(birth,id,ayan).longitude;
 const wall=new Date(+target+zone*3600000),year=wall.getUTCFullYear(),month=wall.getUTCMonth();
 const lo=Date.UTC(year,id===0?0:month,1)-zone*3600000,hi=Date.UTC(id===0?year+1:year,id===0?0:month+1,1)-zone*3600000;
 const diff=t=>signed(bodyAt(new Date(t),id,ayan).longitude-lon);
 const matches=[];
 let a=lo,fa=diff(a);
 while(a<hi){
  const b=Math.min(a+DAY,hi),fb=diff(b);
  if(fa<=0&&fb>=0&&fb-fa<180){
   let l=a,r=b;
   while(r-l>500){const m=Math.floor((l+r)/2);if(diff(m)<0)l=m;else r=m;}
   matches.push((l+r)/2);
  }
  a=b;fa=fb;
 }
 if(!matches.length)throw Error(id===0?'所选年份没有查得太阳返照':'所选月份没有月返，请切换月份');
 return new Date(matches.sort((a,b)=>Math.abs(a-target)-Math.abs(b-target))[0]);
}
const rulers=['太阳','金星','水星','月亮','土星','木星','火星','北交点','南交点'];
const lengths=[10,8,13,9,11,12,7,3,2];
function firdaria(birth,target,day){
 const order=day?[0,1,2,3,4,5,6,7,8]:[3,4,5,6,0,1,2,7,8];
 const age=Math.max(0,(target-birth)/YEAR),cycle=Math.floor(age/75);
 let start=cycle*75;
 const periods=order.map(idx=>{
  const from=start;start+=lengths[idx];
  const sub=idx<7?Array.from({length:7},(_,i)=>({lord:rulers[(idx+i)%7],start:from+lengths[idx]*i/7,end:from+lengths[idx]*(i+1)/7})):[];
  return {lord:rulers[idx],start:from,end:start,sub,from:new Date(+birth+from*YEAR).toISOString(),to:new Date(+birth+start*YEAR).toISOString()};
 });
 const active=periods.find(p=>p.start<=age&&age<p.end);
 return {diurnal:day,age,periods,active,sub:active?.sub.find(p=>p.start<=age&&age<p.end)||null};
}
export function westernPro({birth,config,mode='natal',at}){
 if(!['natal','sky','transit','secondary','tertiary','solar','lunar','firdaria','profection'].includes(mode))throw Error('未知占星盘类');
 const cfg=settings(config);
 const born=utcOf(birth),target=at?new Date(at):new Date();
 if(!Number.isFinite(+target)||target.getUTCFullYear()<1800||target.getUTCFullYear()>2399)throw Error('推运时间范围为 1800–2399');
 if(['secondary','tertiary','firdaria','profection'].includes(mode)&&target<born)throw Error('推运时间不能早于出生');
 const natal=chartAt(born,birth.city,cfg);
 if(mode==='natal')return {mode,chart:natal};
 if(mode==='firdaria')return {mode,chart:natal,firdaria:firdaria(born,target,natal.diurnal)};
 if(mode==='profection'){
  let age=target.getUTCFullYear()-born.getUTCFullYear();
  if(Date.UTC(target.getUTCFullYear(),born.getUTCMonth(),born.getUTCDate(),born.getUTCHours(),born.getUTCMinutes())>+target)age--;
  if(cfg.nominalAge){
   const wall=(date,offset)=>new Date(+date+offset*3600000).toISOString().slice(0,10).split('-').map(Number);
   const birthOffset=Number(birth.city.tz)||0;
   const lunarYear=date=>Solar.fromYmd(...wall(date,birthOffset)).getLunar().getYear();
   age=lunarYear(target)-lunarYear(born);
  }
  const house=age%12+1,idx=(sign(natal.axes.asc)+house-1)%12,ruler=RULERS[idx];
  const lord=natal.planets.find(p=>p.name===ruler)??chartAt(born,birth.city,{...cfg,visible:defaults}).planets.find(p=>p.name===ruler);
  return {mode,chart:natal,profection:{age:age+(cfg.nominalAge?1:0),nominal:cfg.nominalAge,house,sign:SIGNS[idx],ruler,lordHouse:lord.house,wholeStart:sign(natal.axes.asc)*30}};
 }
 let date=target;
 if(mode==='secondary'||mode==='tertiary')date=new Date(+born+(target-born)*DAY/(mode==='secondary'?YEAR:MONTH));
 if(mode==='solar'||mode==='lunar')date=findReturn(born,target,mode==='solar'?0:1,cfg.sidereal?cfg.ayan:null,Number(birth.city.tz)||0);
 const progressed=chartAt(date,birth.city,cfg);
 if(mode==='sky'||mode==='solar'||mode==='lunar')return {mode,chart:progressed};
 return {mode,chart:natal,outer:progressed,cross:aspectPairs(progressed.planets,natal.planets,cfg,false)};
}
export function ephemerisBody(date,id){return bodyAt(date,id,null);}
