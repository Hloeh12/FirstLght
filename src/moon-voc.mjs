import {bodyAt} from './ephemeris.mjs';
import {memoTTL} from './memo.mjs';
const H=3600000,wrap=x=>((x%360)+360)%360,signed=x=>wrap(x+180)-180;
const lon=(t,id)=>bodyAt(new Date(t),id).longitude;
export function moonVoc(at){
 const t=+new Date(at);if(!Number.isFinite(t))throw Error('月亮空亡时间无效');
 const currentSign=Math.floor(lon(t,1)/30);
 const range=memoTTL('voc|'+currentSign+'|'+Math.floor(t/(12*H)),60000,()=>{
  const cache=new Map(),raw=lon;const cached=(x,id)=>{const key=x+'|'+id;if(!cache.has(key))cache.set(key,raw(x,id));return cache.get(key);};
  const sign=Math.floor(cached(t,1)/30);
  const ingress=(direction)=>{let a=t,b=t;for(let i=0;i<100;i++){b+=direction*H;if(Math.floor(cached(b,1)/30)!==sign)break;}
   let inside=a,outside=b;for(let i=0;i<30;i++){const m=(inside+outside)/2;if(Math.floor(cached(m,1)/30)===sign)inside=m;else outside=m;}return (inside+outside)/2;};
  const start=ingress(-1),end=ingress(1),events=[];
  for(const id of [0,2,3,4,5,6])for(const angle of [0,60,90,120,180,240,270,300]){
   const f=x=>signed(cached(x,1)-cached(x,id)-angle);
   for(let a=start+1;a<end;){const b=Math.min(a+3*H,end-1),fa=f(a),fb=f(b);if(fa*fb<=0&&Math.abs(fa-fb)<90){let l=a,r=b;for(let k=0;k<24;k++){const m=(l+r)/2;if(f(l)*f(m)<=0)r=m;else l=m;}events.push({utc:new Date((l+r)/2).toISOString(),planet:['太阳','月亮','水星','金星','火星','木星','土星'][id],angle:Math.min(angle,360-angle)});}if(b>=end-1)break;a=b;}
  }
  events.sort((a,b)=>Date.parse(a.utc)-Date.parse(b.utc));const last=events.at(-1),from=last?Date.parse(last.utc):start;
  return {active:t>=from&&t<end,start:new Date(from).toISOString(),end:new Date(end).toISOString(),ingress:new Date(start).toISOString(),last: last||null,method:'回归黄道、日水金火木土六曜，入下一星座前最后一次精确主要相位；不使用固定容许度窗口。无相位时整星座为空亡。',events};
 });
 return {...range,active:t>=Date.parse(range.start)&&t<Date.parse(range.end)};
}
