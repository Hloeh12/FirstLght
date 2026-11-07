import {westernPro,degree,calculateAspects,OBJECTS} from './western-pro.mjs';
import {analyze} from './analysis.mjs';
const norm=x=>((x%360)+360)%360;
export function midpointLongitude(a,b){
 a=norm(a);b=norm(b);const gap=norm(b-a);
 // Antipodes have two equally short arcs. Make the tie symmetric and report it.
 if(Math.abs(gap-180)<1e-8)return norm((a+b)/2);
 return norm(a+(gap>180?gap-360:gap)/2);
}
const themes=['共同身份与相处节奏','资源、价值观与收支','日常沟通与学习','家庭、安全感与归属','创造、约会与共同爱好','生活分工、作息与照料','承诺、协商与相处边界','共享资源与信任','远行、信念与长期学习','公开目标与责任','朋友网络与共同愿景','独处、隐私与休息'];
export function compositePro({a,b,config={}}){
 const wanted=OBJECTS.slice(0,10).map(p=>p[0]);
 const first=westernPro({birth:a,config:{...config,visible:wanted},mode:'natal'}).chart;
 const second=westernPro({birth:b,config:{...config,visible:wanted},mode:'natal'}).chart;
 const asc=midpointLongitude(first.axes.asc,second.axes.asc),mc=midpointLongitude(first.axes.mc,second.axes.mc);
 const ambiguity=[];
 const midpoint=(x,y,name)=>{if(Math.abs(norm(y-x)-180)<1e-8)ambiguity.push(name+'接近精确对跖，短弧中点有二义；本盘采用对称算术中点。');return midpointLongitude(x,y);};
 const planets=first.planets.map(p=>{
  const other=second.planets.find(q=>q.key===p.key),lon=midpoint(p.lon,other.lon,p.name),d=degree(lon);
  return {...p,lon,sign:d.sign,degree:d,house:Math.floor(norm(lon-asc)/30)+1,speed:null,retro:false,dignity:null};
 });
 midpoint(first.axes.asc,second.axes.asc,'ASC');midpoint(first.axes.mc,second.axes.mc,'MC');
 const aspects=calculateAspects(planets,config),axes={asc,dsc:norm(asc+180),mc,ic:norm(mc+180)},cusps=Array.from({length:12},(_,i)=>norm(asc+i*30));
 const analysis=analyze({planets,asc:{sign:degree(asc).sign},aspects});
 const readings=['sun','moon','venus'].map(key=>{
  const p=planets.find(p=>p.key===key);return {title:{sun:'关系的共同目标',moon:'关系的情绪需求',venus:'关系的亲近方式'}[key],text:'组合'+p.name+'落'+p.sign+'第'+p.house+'宫，可把'+themes[p.house-1]+'作为双方共同讨论的主题。'};
 });
 const tight=aspects.filter(x=>[0,60,90,120,180].includes(x.angle)).sort((x,y)=>x.orb-y.orb)[0];
 if(tight)readings.push({title:'最紧密的关系结构',text:'组合'+tight.a+' '+tight.type+' '+tight.b+'，容许度 '+tight.orb.toFixed(3)+'°。可结合两星所在宫位观察合作与摩擦，不将其当作结果保证。'});
 return {mode:'composite',chart:{asc:{lon:asc,sign:degree(asc).sign,degree:degree(asc)},mc:{lon:mc,sign:degree(mc).sign,degree:degree(mc)},axes,cusps,planets,aspects,analysis,houseSystem:'equal-midpoint',zodiac:first.zodiac,ayan:first.ayan},readings,ambiguity,
  method:'组合中点盘：每颗行星与ASC/MC取双人黄经短弧中点；宫位采用ASC中点起等宫制。它是关系的象征盘，没有实际事件UT，也不为中点星体定义逆行或入/出相位。不是Davison时间地点中点事件盘。'};
}
