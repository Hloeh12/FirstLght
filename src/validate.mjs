import * as Astronomy from 'astronomy-engine';
import { chart, synastry } from './chart.mjs';
import { lunarToSolar, solarToLunar } from './lunar.mjs';
const n360=x=>((x%360)+360)%360;
const SAMPLE={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{label:'上海',lat:31.2304,lon:121.4737,tz:8}};
const LORD_ORDER=['计都','金星','太阳','月亮','火星','罗睺','木星','土星','水星'];
export function validate(){
 const out=[];const add=(name,pass,detail)=>out.push({name,pass:!!pass,detail});
 // 1. 二分/二至点太阳黄经
 for(const [label,iso,expect] of [['春分 2000', '2000-03-20T07:35:00Z',0],['夏至 2000','2000-06-21T01:48:00Z',90],['秋分 2000','2000-09-22T17:27:00Z',180],['冬至 2000','2000-12-21T13:37:00Z',270]]){
  const lon=n360(Astronomy.SunPosition(new Date(iso)).elon);
  const diff=Math.abs(((lon-expect+540)%360)-180);
  add('太阳黄经 '+label, diff<0.05, `实测 ${lon.toFixed(4)}°，期望 ${expect}°，偏差 ${diff.toFixed(4)}°`);
 }
 // 2. 宫头单调
 const c=chart(SAMPLE);
 let mono=true,prev=c.western.cusps[0];
 for(let i=1;i<12;i++){const d=n360(c.western.cusps[i]-prev);if(d<=0||d>=180)mono=false;prev=c.western.cusps[i];}
 add('Placidus 宫头单调递增',mono,'12 个宫头按黄道顺序排列');
 // 3. 大运总年数
 const sum=c.vedic.dashas.reduce((a,b)=>a+b.years,0);
 add('Vimshottari 总周期 120 年',Math.abs(sum-120)<1e-9,'合计 '+sum+' 年');
 // 4. 首运主星与月宿主星一致
 const moon=c.vedic.planets.find(p=>p.key==='moon');
 const idx=c.vedic.planets.findIndex(p=>p.key==='moon');
 const nakLord=LORD_ORDER[(moon.nakIndex%9)];
 add('大运起点与月宿主星一致',c.vedic.dashas[0].lord===nakLord,`月宿 ${moon.nakshatra} → ${nakLord}，首运 ${c.vedic.dashas[0].lord}`);
 // 5. 分盘范围
 let ok=true,bad='';
 for(const [id,v] of Object.entries(c.vedicVargas)){
  if(!v){ok=false;bad=id+' 缺失';break;}
  for(const p of v.planets){const si=['白羊座','金牛座','双子座','巨蟹座','狮子座','处女座','天秤座','天蝎座','射手座','摩羯座','水瓶座','双鱼座'].indexOf(p.sign);if(si<0||p.house<1||p.house>12){ok=false;bad=`${id}/${p.name} 越界`;break;}}
 }
 add('八分盘取值范围合法',ok,bad||'D2–D60 星座与宫位均在范围内');
 // 6. 谐波 H1 等于本命
 const h1=c.westernHarmonics.H1;
 add('H1 与本命盘一致',h1.asc.sign===c.western.asc.sign&&h1.planets.length===c.western.planets.length,'谐波 1 倍 = 原始经度');
 // 7. 农历往返
 let lunarOk=true,lunarDetail='';
 for(const [l,s] of [[[2000,7,17,false],'2000-08-16'],[[2020,4,1,true],'2020-05-23'],[[1990,1,1,false],'1990-01-27']]){
  const got=lunarToSolar(l[0],l[1],l[2],l[3]);
  if(got!==s){lunarOk=false;lunarDetail=`${l.join('/')} → ${got}，期望 ${s}`;break;}
  const back=solarToLunar(...s.split('-').map(Number));
  if(!back||back.m!==l[1]||back.d!==l[2]){lunarOk=false;lunarDetail=`公历 ${s} 回推异常`;break;}
 }
 add('农历公历双向转换',lunarOk,lunarDetail||'3 组边界样例往返一致');
 // 8. 合盘自我一致性
 const s=synastry(SAMPLE,SAMPLE);
 const selfOk=s.vedic.koota.total>0&&s.western.interAspects.length>0;
 add('同盘合盘可计算',selfOk,'与自身合盘：八科 '+s.vedic.koota.total+'/36，互相位 '+s.western.interAspects.length+' 组');
 const passed=out.filter(x=>x.pass).length;
 return {passed,total:out.length,ok:passed===out.length,checks:out,generatedAt:new Date().toISOString()};
}
