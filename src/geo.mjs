import {legacyData} from './legacy-data.mjs';
const G=legacyData('geo-data');
export const provinces=()=>G.prov.map(p=>({name:p.n,code:p.code}));
export const cities=(provCode)=>G.city.filter(c=>c.p===Number(provCode)).map(c=>({name:c.n,code:c.code,lat:c.lat,lon:c.lon}));
export const counties=(cityCode)=>G.county.filter(c=>c.c===Number(cityCode)).map(c=>({name:c.n,code:c.code,lat:c.lat,lon:c.lon}));
export function resolvePlace({p,c,d}={}){
 const prov=G.prov.find(x=>x.code===Number(p));
 const city=G.city.find(x=>x.code===Number(c));
 const county=d?G.county.find(x=>x.code===Number(d)):null;
 const pick=county||city;
 if(!pick||pick.lat==null)return null;
 return {label:[prov?.n,city?.n,county?.n].filter(Boolean).join(' '),province:prov?.n||null,city:city?.n||null,county:county?.n||null,lat:pick.lat,lon:pick.lon,tz:8,datum:'GCJ-02',note:'区划坐标为 GCJ-02，与 WGS84 相差约数百米，对宫位影响可忽略'};
}
export function searchPlaces(q){
 const k=String(q||'').trim();if(!k)return [];
 const out=[];
 for(const c of G.city)if(c.n.includes(k))out.push({name:c.n,code:c.code,province:G.prov.find(p=>p.code===c.p)?.n,provinceCode:c.p,lat:c.lat,lon:c.lon,level:'city'});
 for(const d of G.county)if(d.n.includes(k)&&out.length<30){
  const city=G.city.find(c=>c.code===d.c);
  const prov=G.prov.find(p=>p.code===(city?city.p:d.c));
  out.push({name:d.n,code:d.code,lat:d.lat,lon:d.lon,level:'county',province:prov?.n||null,city:city?.n||null,provinceCode:prov?.code||null,cityCode:city?.code||null});
 }
 for(const pv of G.prov){
  if(!pv.n.includes(k)&&!k.includes(pv.n.replace(/(省|市|自治区|维吾尔|壮族|回族|特别行政区)/g,'')))continue;
  const kids=G.city.filter(c=>c.p===pv.code);
  const list=kids.length?kids:G.county.filter(c=>c.c===pv.code);
  if(!list.length)continue;
  const lat=list.reduce((a,b)=>a+(b.lat||0),0)/list.length;
  const lon=list.reduce((a,b)=>a+(b.lon||0),0)/list.length;
  out.unshift({name:pv.n,code:pv.code,lat,lon,level:'province',province:null,provinceCode:pv.code});
 }
 return out.slice(0,30);
}
export function nearestPlace(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw new Error('无效坐标');
 let best=null,distance=Infinity;
 for(const c of G.county){if(!Number.isFinite(c.lat)||!Number.isFinite(c.lon))continue;const d=(c.lat-lat)**2+((c.lon-lon)*Math.cos(lat*Math.PI/180))**2;if(d<distance){distance=d;best=c;}}
 if(!best||distance>4)return {label:'当前坐标（本地区划库覆盖范围外）',approximate:true};
 const city=G.city.find(c=>c.code===best.c),prov=G.prov.find(p=>p.code===(city?.p||best.c));
 return {label:[prov?.n,city?.n,best.n].filter(Boolean).join(' '),provinceCode:prov?.code,cityCode:city?.code,countyCode:best.code,approximate:true,note:'按本地区划中心点近似匹配，不是精确地址反查'};
}
