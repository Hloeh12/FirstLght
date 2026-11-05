import * as Astronomy from 'astronomy-engine';
import { astro as IZTRO } from 'iztro';
/* 三体系时间轴：紫微大限（虚岁折算）× 印度大运 × 木土过运。
 * 规则取自公开前端图例：过运＝木/土对本命日、月、上升、中天的合/刑/拱/冲；
 * 共振＝不同体系的跨体系事件落在 14 天内。窗口聚合与强弱为本地实现，非原站后端。 */
const D=86400000, n360=x=>((x%360)+360)%360;
export function timeline(res, opts={}){
 const {western,vedic,ziwei}=res;
 const months=Number(opts.months)||30;
 const now=opts.now?new Date(opts.now):new Date();
 const from=new Date(now), to=new Date(+now+months*30.44*D);
 const birthYear=new Date(western.utc).getUTCFullYear();
 // 紫微大限
 const zDecades=(ziwei&&ziwei.palaces?ziwei.palaces:[]).map(p=>{
  const r=p.decadal&&p.decadal.range;
  if(!r)return null;
  return {name:p.name,branch:p.earthlyBranch,startYear:birthYear+r[0]-1,endYear:birthYear+r[1]-1};
 }).filter(Boolean).sort((a,b)=>a.startYear-b.startYear);
 // 紫微流年带
 const flowBands=[];const y0=from.getUTCFullYear(),y1=to.getUTCFullYear();
 if(ziwei&&ziwei.palaces)for(let y=y0;y<=y1;y++){
  const idx=ziweiYearIndex(res,y);
  const pal=idx!=null?ziwei.palaces[idx]:null;
  flowBands.push({label:String(y),palace:pal?pal.name:'—',startTs:+new Date(Date.UTC(y,1,4)),endTs:+new Date(Date.UTC(y+1,1,4))});
 }
 // 印度大运
 const vDashas=vedic.dashas.map(d=>({lord:d.lord,startTs:+new Date(d.start),endTs:+new Date(d.end),current:now>=new Date(d.start)&&now<new Date(d.end)}));
 const bounds=vedic.dashas.map(d=>({ts:+new Date(d.start),label:d.lord+' 大运',system:'vedic'}));
 // 木土过运
 const targets=[{key:'sun',label:'太阳',lon:byKey(western,'sun')},{key:'moon',label:'月亮',lon:byKey(western,'moon')},{key:'asc',label:'上升',lon:western.asc.lon},{key:'mc',label:'中天',lon:western.mc.lon}].filter(x=>x.lon!=null);
 const wEvents=[];
 const bodies=[{key:'jupiter',name:'木星',body:Astronomy.Body.Jupiter},{key:'saturn',name:'土星',body:Astronomy.Body.Saturn}];
 const samples=[];
 for(let t=+from;t<=+to;t+=8*D)samples.push({t,lon:{jupiter:lonOf(Astronomy.Body.Jupiter,t),saturn:lonOf(Astronomy.Body.Saturn,t)}});
 const sepOf=(a,b)=>{let d=Math.abs(n360(a-b));return d>180?360-d:d;};
 for(const bd of bodies)for(const tg of targets)for(const [angle,name] of [[0,'合'],[90,'刑'],[120,'拱'],[180,'冲']]){
  const f=t=>{let lo=0,hi=samples.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(samples[mid].t<t)lo=mid+1;else hi=mid;}return sepOf(lonOf(bd.body,t),tg.lon)-angle;};
  for(let i=1;i<samples.length;i++){
   const d0=sepOf(samples[i-1].lon[bd.key],tg.lon)-angle,d1=sepOf(samples[i].lon[bd.key],tg.lon)-angle;
   if(d0<0&&d1>=0){let lo=samples[i-1].t,hi=samples[i].t;for(let k=0;k<12;k++){const mid=(lo+hi)/2;if(sepOf(lonOf(bd.body,mid),tg.lon)-angle<0)lo=mid;else hi=mid;}wEvents.push({ts:Math.round((lo+hi)/2),label:`${bd.name}${name}${tg.label}`,system:'west'});}
  }
 }
 // 共振：跨体系事件 14 天内聚合
 const zEvents=[];for(let i=1;i<flowBands.length;i++){if(flowBands[i].palace!==flowBands[i-1].palace)zEvents.push({ts:flowBands[i].startTs,label:`流年命宫移入${flowBands[i].palace}`,system:'ziwei'});}for(const z of zDecades)if(z.startYear>=from.getUTCFullYear()&&z.startYear<=to.getUTCFullYear())zEvents.push({ts:+new Date(Date.UTC(z.startYear,0,1)),label:`${z.name}大限起（${z.startYear}）`,system:'ziwei'});
 const all=[...wEvents.map(e=>({ts:e.ts,label:e.label,system:'west'})),...vDashas.map(v=>({ts:v.startTs,label:v.lord+' 大运起',system:'vedic'})),...zEvents].sort((a,b)=>a.ts-b.ts);
 const resonances=[];let cluster=[];
 for(const e of all){
  if(cluster.length&&e.ts-cluster[cluster.length-1].ts>14*D){pushCluster(cluster);cluster=[];}
  cluster.push(e);
 }
 if(cluster.length)pushCluster(cluster);
 function pushCluster(c){
  const systems=[...new Set(c.map(x=>x.system))];
  if(systems.length<2)return;
  resonances.push({startTs:c[0].ts,endTs:c[c.length-1].ts,label:`共振：${c.map(x=>x.label).join('；')}`,systems,count:c.length});
 }
 return {birthYear,window:{fromTs:+from,toTs:+to},nowTs:+now,zDecades,vDashas,wEvents,flowBands,bounds,resonances,notice:'公开图例口径：过运为木/土对本命日、月、上升、中天的合刑拱冲；共振为跨体系 14 天内事件。聚合与强弱为本地实现。'};
}
function lonOf(body,t){return n360(Astronomy.Ecliptic(Astronomy.GeoVector(body,new Date(t),true)).elon);}
function byKey(w,k){const p=w.planets.find(x=>x.key===k);return p?p.lon:null;}
function ziweiYearIndex(res,year){
 try{
  const i=res.meta.input;const d=i.dateStr;const m=String(d).match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const a=IZTRO.bySolar(`${Number(m[1])}-${Number(m[2])}-${Number(m[3])}`,Number(i.ziweiTimeIndex)||0,i.gender==='男'?'男':'女',true,'zh-CN');
  return a.horoscope(new Date(year,6,1)).yearly.index;
 }catch(e){return null;}
}
