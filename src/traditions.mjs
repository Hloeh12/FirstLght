import bones from './reference/chenggu.json' with {type:'json'};
import mansions from './reference/mansions.json' with {type:'json'};
import {Solar,LunarYear} from 'lunar-javascript';
import * as Astronomy from 'astronomy-engine';
import {baziPro,branches,relations,civilSolar} from './bazi-pro.mjs';
import {ephemerisBody,normalize,houseOf} from './western-pro.mjs';

export function boneWeight(birth){
 if(birth.timeUnknown)throw Error('称骨需要已知出生时辰');
 const info=baziPro({birth}).info;
 const parts=[['年',bones.YEAR[info.lunarYear]],['月',bones.MONTH[info.lunarMonth]],['日',bones.DAY[info.lunarDay]],['时',bones.HOUR[info.hourBranch]]];
 const qian=parts.reduce((a,[,n])=>a+n,0);
 const reading=qian<33?'歌诀多用勤劳和渐进的意象，可借此回看如何积累资源和寻求支持。':qian<49?'歌诀多写独立经营和阶段转折，可借此梳理哪些事适合自己主导、哪些需要协作。':'歌诀多用福禄、名望或家业作比喻，可借此思考如何经营已有资源和责任。';
 return {parts,qian,song:bones.SONG[qian],reading,method:'农历年月日与时支四项相加。闰月并本月，歌诀采用通行单本。'};
}
export {yijing} from './yijing-tianji.mjs';
function validSolar(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(value??''))throw Error('请选择有效公历日期');
 const s=civilSolar(...value.split('-').map(Number));
 if(s.toYmd()!==value)throw Error('该日期不存在');
 return s;
}
const rank=(links,good,bad)=>links.reduce((n,r)=>n+(good.includes(r.type)?2:bad.includes(r.type)?-2:0),0);
export function almanac({birth,date,days=1}){
 if(!Number.isInteger(days)||days<1||days>31)throw Error('最多查询 31 天');
 const solar=validSolar(date),natal=birth?baziPro({birth}).pillars:null;
 const good=['天干五合','六合','三合局','三会方'],bad=['六冲','相刑','相害','相破'];
 return {dates:Array.from({length:days},(_,i)=>{
  const s=solar.next(i),l=s.getLunar();
  const gz=l.getDayInGanZhi();
  const links=natal?relations([...natal,{name:'日课',stem:gz[0],branch:gz[1]}]).filter(r=>r.ids.includes(4)):[];
  const hours=Array.from({length:12},(_,j)=>{
   const h=Solar.fromYmdHms(s.getYear(),s.getMonth(),s.getDay(),j*2,0,0).getLunar();
   const time=h.getTimeInGanZhi();
   const combined=natal?relations([...natal,{name:'日课',stem:gz[0],branch:gz[1]},{name:'时课',stem:time[0],branch:time[1]}]).filter(r=>r.ids.includes(5)):[];
   return {branch:branches[j],time,traditional:h.getTimeTianShenLuck(),god:h.getTimeTianShen(),links:combined.map(r=>r.pattern+' '+r.type),score:rank(combined,good,bad)+(h.getTimeTianShenLuck()==='吉'?1:-1)};
  });
  return {date:s.toYmd(),lunar:l.getMonthInChinese()+'月'+l.getDayInChinese(),gz,yi:l.getDayYi(),ji:l.getDayJi(),good:l.getDayJiShen(),bad:l.getDayXiongSha(),links,score:rank(links,good,bad),hours};
 }),method:'宜忌和日时值神来自农历黄历表。个人比较按日课、时课与本命的合会与冲刑破害计分，每项 +2 或 −2，时值神加减 1。'};
}
const RAD=Math.PI/180;
function raOfStar(ra,dec,date){
 const v=new Astronomy.Vector(Math.cos(ra*RAD)*Math.cos(dec*RAD),Math.sin(ra*RAD)*Math.cos(dec*RAD),Math.sin(dec*RAD),Astronomy.MakeTime(date));
 const p=Astronomy.RotateVector(Astronomy.Rotation_EQJ_EQD(date),v);
 return normalize(Math.atan2(p.y,p.x)/RAD);
}
export function qizheng(birth){
 const b=baziPro({birth}),date=new Date(b.info.utc);
 const anchors=mansions.map(([name,key,ra,dec])=>({key,name,ra:raOfStar(ra,dec,date)})).sort((a,b)=>a.ra-b.ra);
 const hour=branches.indexOf(b.info.hourBranch),names=['日','月','水','金','火','木','土','罗睺','计都','月孛','紫炁'];
 const node=ephemerisBody(date,10);
 const days=(+date-Date.UTC(1984,2,20))/86400000;
 const bodies=[...Array.from({length:7},(_,i)=>ephemerisBody(date,i)),node,{...node,longitude:normalize(node.longitude+180)},ephemerisBody(date,12),
  {longitude:normalize(days*360/(28*365.2422)),latitude:0,longitudeSpeed:360/(28*365.2422)}];
 const first=normalize(Math.floor(bodies[0].longitude/30)*30-hour*30);
 const cusps=Array.from({length:12},(_,i)=>normalize(first+i*30));
 const ob=23.4392911-((+date-Date.UTC(2000,0,1,12))/(36525*86400000))*.0130042;
 const stars=bodies.map((p,i)=>{
  const lon=p.longitude,lat=p.latitude,ra=normalize(Math.atan2(Math.sin(lon*RAD)*Math.cos(ob*RAD)-Math.tan(lat*RAD)*Math.sin(ob*RAD),Math.cos(lon*RAD))/RAD);
  const anchor=anchors.filter(a=>a.ra<=ra).at(-1)??anchors.at(-1);
  const house=houseOf(lon,cusps);
  return {name:names[i],lon,house,houseDegree:normalize(lon-cusps[house-1]),mansion:anchor.name,mansionDegree:normalize(ra-anchor.ra),retro:p.longitudeSpeed<0};
 });
 const conjunctions=stars.flatMap((a,i)=>stars.slice(i+1).map(b=>({a:a.name,b:b.name,orb:Math.min(normalize(a.lon-b.lon),normalize(b.lon-a.lon))})).filter(p=>p.orb<=3));
 const patterns=Array.from({length:12},(_,i)=>({house:i+1,stars:stars.slice(0,7).filter(s=>s.house===i+1).map(s=>s.name)})).filter(p=>p.stars.length>=3);
 return {stars,conjunctions,patterns,method:'日月五星用 Astronomy Engine。宿度从当天距星赤经起算；十二宫以太阳所在黄道宫逆数生时起命。罗计取平交点对宫，月孛取平远地点。紫炁用 28 年平均周期，以 1984-03-20 为零点的参考模型。'};
}
