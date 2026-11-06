import * as A from 'astronomy-engine';
import {readFileSync} from 'node:fs';
const bodies=[A.Body.Sun,A.Body.Moon,A.Body.Mercury,A.Body.Venus,A.Body.Mars,A.Body.Jupiter,A.Body.Saturn,A.Body.Uranus,A.Body.Neptune,A.Body.Pluto];
const elements=JSON.parse(readFileSync(new URL('./reference/minor-orbits.json',import.meta.url),'utf8'));
const DEG=Math.PI/180,DAY=86400000;
export const norm=x=>((x%360)+360)%360;
const signed=x=>norm(x+180)-180;
const sin=x=>Math.sin(x*DEG),cos=x=>Math.cos(x*DEG),tan=x=>Math.tan(x*DEG);
const atan2=(y,x)=>Math.atan2(y,x)/DEG;
const jd=t=>+t/DAY+2440587.5;
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0);
const vector=(lon,lat)=>[cos(lon)*cos(lat),sin(lon)*cos(lat),sin(lat)];
function minor(date,id){
 const j=jd(date),rows=elements[id];
 if(!rows?.length)throw Error('该小行星缺少轨道数据');
 const [epoch,e,i,node,peri,n,ma,a]=rows.reduce((best,r)=>Math.abs(r[0]-j)<Math.abs(best[0]-j)?r:best);
 const earth=A.RotateVector(A.Rotation_EQJ_ECL(),A.HelioVector(A.Body.Earth,date));
 const coordinate=t=>{
  const m=norm(ma+n*(t-epoch))*DEG;
  let E=m;
  for(let k=0;k<10;k++)E-=(E-e*Math.sin(E)-m)/(1-e*Math.cos(E));
  const x=a*(Math.cos(E)-e),y=a*Math.sqrt(1-e*e)*Math.sin(E);
  const r=Math.hypot(x,y),u=atan2(y,x)+peri;
  return [r*(cos(node)*cos(u)-sin(node)*sin(u)*cos(i))-earth.x,
   r*(sin(node)*cos(u)+cos(node)*sin(u)*cos(i))-earth.y,
   r*sin(u)*sin(i)-earth.z];
 };
 let v=coordinate(j);
 v=coordinate(j-Math.hypot(...v)/173.144632674);
 const eq=A.RotateVector(A.Rotation_ECL_EQJ(),new A.Vector(...v,A.MakeTime(date)));
 const p=A.Ecliptic(eq);
 return {longitude:p.elon,latitude:p.elat};
}
function moon(date){const p=A.EclipticGeoMoon(date);return {longitude:p.lon,latitude:p.lat};}
function lonlat(date,id){
 if(id===0)return {longitude:A.SunPosition(date).elon,latitude:0};
 if(id===1)return moon(date);
 if(id>=2&&id<=9){const p=A.Ecliptic(A.GeoVector(bodies[id],date,true));return {longitude:p.elon,latitude:p.elat};}
 const t=(jd(date)-2451545)/36525;
 if(id===10)return {longitude:norm(125.04452-1934.136261*t+.0020708*t*t+t*t*t/450000),latitude:0};
 if(id===11){
  const p=moon(date),q=moon(new Date(+date+DAY/1000)),r=moon(new Date(+date-DAY/1000));
  const v=vector(q.longitude,q.latitude).map((x,i)=>x-vector(r.longitude,r.latitude)[i]);
  const h=cross(vector(p.longitude,p.latitude),v);
  return {longitude:norm(atan2(h[0],-h[1])),latitude:0};
 }
 if(id===12)return {longitude:norm(83.3532465+4069.0137287*t-.01032*t*t-t*t*t/80053+180),latitude:0};
 return minor(date,id);
}
export function ayanamsa(date,mode){
 const t=(jd(date)-2451545)/36525;
 return ({lahiri:23.857092,fagan:24.740300,krishnamurti:23.760240})[mode]+(5028.796195*t+1.1054348*t*t+.00007964*t*t*t)/3600;
}
export function bodyAt(date,id,ayan){
 const p=lonlat(date,id),then=lonlat(new Date(+date+DAY/48),id),prev=lonlat(new Date(+date-DAY/48),id);
 const offset=ayan?ayanamsa(date,ayan):0;
 return {...p,longitude:norm(p.longitude-offset),longitudeSpeed:signed(then.longitude-prev.longitude)*24};
}
function intersection(plane,eps){
 return norm(atan2(-plane[0],plane[1]*cos(eps)+plane[2]*sin(eps)));
}
export function housesAt(date,city,system){
 const eps=A.e_tilt(A.MakeTime(date)).tobl,ramc=norm(A.SiderealTime(date)*15+city.lon);
 const lat=Math.max(-89.9999,Math.min(89.9999,city.lat));
 const ascAt=t=>norm(atan2(cos(t),-(sin(t)*cos(eps)+tan(lat)*sin(eps))));
 const asc=ascAt(ramc),mc=norm(atan2(sin(ramc),cos(ramc)*cos(eps))),ic=norm(mc+180),dsc=norm(asc+180);
 const east=[-sin(ramc),cos(ramc),0],zenith=[cos(lat)*cos(ramc),cos(lat)*sin(ramc),sin(lat)];
 const north=cross(zenith,east);
 const vert=intersection(cross(east,zenith),eps),v=[cos(vert),sin(vert)*cos(eps),sin(vert)*sin(eps)];
 const vertex=norm(vert+(dot(v,east)>0?180:0));
 const anchors=[asc,ic,dsc,mc];
 const porphyry=()=>anchors.flatMap((x,i)=>[x,norm(x+norm(anchors[(i+1)%4]-x)/3),norm(x+2*norm(anchors[(i+1)%4]-x)/3)]);
 let cusps,warning='';
 if(system==='equal'||system==='whole')cusps=Array.from({length:12},(_,i)=>norm((system==='whole'?Math.floor(asc/30)*30:asc)+i*30));
 else if(system==='porphyry')cusps=porphyry();
 else if(system==='campanus'||system==='regiomontanus'){
  cusps=Array.from({length:12},(_,i)=>{
   if(i%3===0)return anchors[i/3];
   const angle=i*30;
   const q=system==='campanus'?east.map((e,j)=>e*cos(angle)-zenith[j]*sin(angle)):[cos(ramc+90+angle),sin(ramc+90+angle),0];
   const p=intersection(cross(north,q),eps),start=anchors[Math.floor(i/3)],next=anchors[(Math.floor(i/3)+1)%4];
   return norm(p-start)<norm(next-start)?p:norm(p+180);
  });
 }else{
  const quadrant=[];
  if(Math.abs(lat)<90-eps){
   if(system==='koch'){
    const dec=Math.asin(sin(mc)*sin(eps))/DEG;
    const ad=Math.asin(tan(lat)*tan(dec))/DEG,arc=(90+ad)/3;
    for(const k of [1,2,4,5])quadrant.push(ascAt(ramc-ad-90+arc*k));
   }else{
    for(const [ratio,below] of [[2/3,true],[1/3,true],[1/3,false],[2/3,false]]){
     let theta=below?180-ratio*90:ratio*90;
     for(let i=0;i<50;i++){
      const d=Math.asin(sin(eps)*sin(atan2(sin(ramc+theta),cos(ramc+theta)*cos(eps))));
      const semi=Math.acos(-tan(lat)*Math.tan(d))/DEG;
      const next=below?180-ratio*(180-semi):ratio*semi;
      if(Math.abs(theta-next)<1e-10){theta=next;break;}theta=next;
     }
     quadrant.push(norm(atan2(sin(ramc+theta),cos(ramc+theta)*cos(eps))));
    }
   }
  }
  if(quadrant.length){
   const [b,c,k,l]=system==='koch'?[quadrant[2],quadrant[3],quadrant[0],quadrant[1]]:quadrant;
   cusps=[asc,b,c,ic,norm(k+180),norm(l+180),dsc,norm(b+180),norm(c+180),mc,k,l];
  }
 }
 const ordered=cusps?.every((x,i)=>Number.isFinite(x)&&(i===0||norm(x-cusps[0])>norm(cusps[i-1]-cusps[0])));
 if(!ordered){
  warning='该纬度或时刻无法稳定求得所选分宫制，采用 Porphyry。';system='porphyry';cusps=porphyry();
  if(!cusps.every((x,i)=>i===0||norm(x-cusps[0])>norm(cusps[i-1]-cusps[0]))){
   warning='极区宫头退化，采用等宫。';system='equal';cusps=Array.from({length:12},(_,i)=>norm(asc+30*i));
  }
 }
 return {asc,mc,vertex,cusps,system,warning};
}
