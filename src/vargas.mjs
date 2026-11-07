export const VARGAS={1:'本命',2:'财富',3:'兄弟',4:'不动产',7:'子嗣',9:'命宿',10:'事业',12:'父母',16:'享乐',20:'灵修',24:'学业',27:'潜能',30:'灾厄',60:'因果'};
const norm=x=>((x%360)+360)%360;
export function vargaLongitude(lon,n){
 if(!Number.isInteger(n)||n<1||n>60)throw Error('分盘范围D1–D60');
 lon=norm(lon);const s=Math.floor(lon/30),d=lon%30,k=Math.floor(d*n/30),odd=s%2===0;
 let sign;
 switch(n){
 case 1:return lon;
 case 2:sign=d<15?(odd?4:3):(odd?3:4);break;
 case 3:sign=s+4*k;break;case 4:sign=s+3*k;break;
 case 7:sign=s+(odd?0:6)+k;break;case 9:sign=Math.floor(lon*9/30);break;
 case 10:sign=s+(odd?0:8)+k;break;case 12:sign=s+k;break;
 case 16:sign=[0,4,8][s%3]+k;break;case 20:sign=[0,8,4][s%3]+k;break;
 case 24:sign=(odd?4:3)+k;break;case 27:sign=(s%4)*3+k;break;
 case 30:{const cuts=odd?[5,10,18,25,30]:[5,12,20,25,30],signs=odd?[0,10,8,2,6]:[1,5,11,9,7];const i=cuts.findIndex(x=>d<x),start=i?cuts[i-1]:0;return signs[i]*30+(d-start)/(cuts[i]-start)*30;}
 case 60:sign=s+k;break;
 default:return norm(lon*n);
 }
 return norm(sign*30+(d*n)%30);
}
export function dashaChildren(parent){
 const names=['计都','金星','太阳','月亮','火星','罗睺','木星','土星','水星'],years=[7,20,6,10,7,18,16,19,17],index=names.indexOf(parent.lord),from=Date.parse(parent.start),to=Date.parse(parent.end);let cursor=from;
 return Array.from({length:9},(_,i)=>{const k=(index+i)%9,end=i===8?to:cursor+(to-from)*years[k]/120;const p={index:i,lord:names[k],start:new Date(cursor).toISOString(),end:new Date(end).toISOString()};cursor=end;return p;});
}
export function divisional(data,n){
 const signs=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'],asc=vargaLongitude(data.ascSid,n),lagnaIndex=Math.floor(asc/30);
 const planets=data.planets.map(p=>{const sid=vargaLongitude(p.sid,n),signIndex=Math.floor(sid/30);return {...p,sid,signIndex,sign:signs[signIndex],house:(signIndex-lagnaIndex+12)%12+1};});
 return {...data,n,ascSid:asc,lagnaIndex,lagna:signs[lagnaIndex],houseSigns:Array.from({length:12},(_,i)=>signs[(lagnaIndex+i)%12]),planets,method:VARGAS[n]?'Parashara所列分盘规则；D60采用从原星座顺数。':'非经典列示分盘，明确采用黄经谐波映射。'};
}
export function planetStates(p,all){
 const exalt={sun:0,moon:1,mars:9,mercury:5,jupiter:3,venus:11,saturn:6},root={sun:[4,0,20],moon:[1,3,30],mars:[0,0,12],mercury:[5,16,20],jupiter:[8,0,10],venus:[6,0,15],saturn:[10,0,20]},s=p.signIndex,d=p.sid%30,out=[];
 const own={sun:[4],moon:[3],mars:[0,7],mercury:[2,5],jupiter:[8,11],venus:[1,6],saturn:[9,10]};if(own[p.key]?.includes(s))out.push('庙 Swakshetra');
 if(exalt[p.key]===s)out.push('旺 Uccha');if(exalt[p.key]!==undefined&&(exalt[p.key]+6)%12===s)out.push('陷 Neecha');
 const r=root[p.key];if(r&&s===r[0]&&d>=r[1]&&d<r[2])out.push('根 Moolatrikona');if(p.retro)out.push('逆 Vakra');
 const gap=(a,b)=>Math.abs(((a-b+540)%360)-180),sun=all.find(x=>x.key==='sun');
 if(!['sun','rahu','ketu'].includes(p.key)&&sun&&gap(p.sid,sun.sid)<8)out.push('焦 Astangata');
 if(['mars','mercury','jupiter','venus','saturn'].includes(p.key)&&all.some(q=>q.key!==p.key&&['mars','mercury','jupiter','venus','saturn'].includes(q.key)&&gap(p.sid,q.sid)<1))out.push('战 Yuddha');return out;
}
