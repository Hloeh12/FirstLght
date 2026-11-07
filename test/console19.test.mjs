import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {localNowParams} from '../assets/console/now.js';
import {migrateStorage,migrateProfile,SCHEMA_VERSION} from '../assets/console/schema.js';
import {vargaLongitude,divisional,dashaChildren,planetStates} from '../src/vargas.mjs';
import {vedicPro} from '../src/vedic-pro.mjs';
import {luckCycles} from '../src/bazi.mjs';
import {moonVoc} from '../src/moon-voc.mjs';
import {bodyAt} from '../src/ephemeris.mjs';
import {todaySky} from '../src/today-sky.mjs';
import {practicalZiwei} from '../src/ziwei-practical.mjs';
import {housingReading} from '../src/housing.mjs';
import {ashtakoota} from '../src/ashtakoota.mjs';
const birth={Y:1998,M:11,D:21,h:0,mi:2,gender:'女',city:{lat:31.23,lon:121.47,tz:8}};
const gap=(a,b)=>Math.abs(((a-b+540)%360)-180);
test('instant local clock survives midnight in UTC+8 and a negative offset without mutating city',()=>{
 const script=`import {localNowParams} from './assets/console/now.js';console.log(JSON.stringify(localNowParams(new Date('2026-11-07T18:30:00Z'),{label:'上海',lat:31.23,lon:121.47,tz:99})))`;
 const run=TZ=>JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',script],{env:{...process.env,TZ},encoding:'utf8'}));
 const cn=run('Asia/Shanghai');assert.equal(cn.dateStr,'2026-11-08');assert.equal(cn.timeStr,'02:30');assert.equal(cn.tz,8);assert.equal(cn.city.tz,8);
 const us=run('America/New_York');assert.equal(us.dateStr,'2026-11-07');assert.equal(us.timeStr,'13:30');assert.equal(us.tz,-5);
 const city={tz:8,lat:1,lon:2};localNowParams(new Date(),city);assert.equal(city.tz,8);
});
test('classical Vargas boundary fixtures and all selectable maps are finite',()=>{
 const sign=(lon,n)=>Math.floor(vargaLongitude(lon,n)/30);
 assert.equal(sign(1,2),4);assert.equal(sign(16,2),3);assert.equal(sign(31,2),3);assert.equal(sign(46,2),4);
 assert.equal(sign(11,3),4);assert.equal(sign(21,3),8);assert.equal(sign(41,7),9);assert.equal(sign(31,10),9);
 assert.equal(sign(30.2,16),4);assert.equal(sign(30.2,20),8);assert.equal(sign(60.2,27),6);
 assert.equal(sign(4.9,30),0);assert.equal(sign(5,30),10);assert.equal(sign(35,30),5);assert.equal(sign(30.5,60),2);
 for(let n=1;n<=60;n++)for(const longitude of [0,29.99999,30,99.123,359.99999])assert(vargaLongitude(longitude,n)>=0&&vargaLongitude(longitude,n)<360);
 const data=vedicPro({birth,at:'2026-11-08T00:00Z'}),d1=divisional(data,1),d9=divisional(data,9);
 assert.deepEqual(d1.planets.map(p=>p.house),data.planets.map(p=>p.house));assert(d9.planets.some((p,i)=>p.house!==data.planets[i].house));
});
test('Vimshottari four levels conserve parent intervals and select the current micro ruler',()=>{
 const data=vedicPro({birth,at:'2026-11-08T00:00Z'});let parent=data.active;
 for(let level=0;level<3;level++){
  const children=dashaChildren(parent);assert.equal(children.length,9);assert.equal(children[0].lord,parent.lord);assert.equal(children[0].start,parent.start);assert.equal(children.at(-1).end,parent.end);
  children.forEach((p,i)=>{assert(Date.parse(p.end)>Date.parse(p.start));if(i)assert.equal(p.start,children[i-1].end);});
  parent=children.find(p=>Date.parse(p.start)<=Date.parse(data.at)&&Date.parse(data.at)<Date.parse(p.end));assert(parent);
 }
 assert(Date.parse(parent.end)-Date.parse(parent.start)<31*86400000);
});
test('all four yin/yang gender combinations count toward the correct Jie and rotate months',()=>{
 const t=new Date('2000-06-01T04:30:00Z'),month={monthIndex:3,stem:'辛'};
 for(const [stem,gender,forward,label] of [[0,'男',true,'阳男顺行'],[1,'女',true,'阴女顺行'],[1,'男',false,'阴男逆行'],[0,'女',false,'阳女逆行']]){
  const r=luckCycles(t,2000,month,stem,gender);assert.equal(r.forward,forward);assert.equal(r.directionLabel,label);assert.equal(Date.parse(r.edge.utc)>+t,forward);
  assert.equal(r.cycles[0].stem,forward?'壬':'庚');assert(Math.abs(r.exactStartAge-Math.abs(Date.parse(r.edge.utc)-t)/86400000/3)<1e-10);
 }
});
test('VOC starts at the last exact traditional aspect and ends exactly at sign ingress',()=>{
 const at='2026-11-08T02:30:00Z',r=moonVoc(at);assert(r.events.length);assert.equal(r.start,r.last.utc);assert(Date.parse(r.end)>Date.parse(r.start));assert.equal(r.active,Date.parse(at)>=Date.parse(r.start));
 const planet=['太阳','月亮','水星','金星','火星','木星','土星'].indexOf(r.last.planet),date=new Date(r.last.utc),sep=gap(bodyAt(date,1).longitude,bodyAt(date,planet).longitude);assert(Math.abs(sep-r.last.angle)<.00001);
 assert(moonVoc(new Date(Date.parse(r.end)-1000)).active);assert(!moonVoc(new Date(Date.parse(r.start)-1000)).active);
 const old=Math.floor(bodyAt(new Date(Date.parse(r.end)-1000),1).longitude/30),next=Math.floor(bodyAt(new Date(Date.parse(r.end)+1000),1).longitude/30);assert.notEqual(old,next);
 const sky=todaySky({at});assert(sky.litPercent>=0&&sky.litPercent<=100);assert(sky.voc);
});
test('double Lu, Lu opposition and flank Ji require independent actual evidence',()=>{
 const z={palaces:Array.from({length:12},(_,branch)=>({branch,name:'宫'+branch,stars:[]}))};z.palaces[0].stars=[{name:'禄存'}];z.palaces[4].stars=[{name:'太阳',siHua:'禄'}];z.palaces[5].stars=[{name:'擎羊'}];z.palaces[7].stars=[{name:'陀罗'}];
 const r=practicalZiwei(z,{mutagens:[{branch:6,type:'忌'}]});assert(r.some(x=>x.name==='双禄交驰'));assert(r.some(x=>x.name==='禄逢冲破'));assert(r.some(x=>x.name==='羊陀夹忌'));z.palaces[7].stars=[];assert(!practicalZiwei(z,{mutagens:[{branch:6,type:'忌'}]}).some(x=>x.name==='羊陀夹忌'));
});
test('schema4 migration is idempotent, preserves birth data and refuses corrupt collections',()=>{
 const data=new Map([['xy:cases:v2',JSON.stringify([{id:4,name:'旧档案',category:'客户',fields:birth}])]]),store={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};migrateStorage(store);assert.equal(SCHEMA_VERSION,4);const first=data.get('xy:cases:v2');migrateStorage(store);assert.equal(data.get('xy:cases:v2'),first);const p=JSON.parse(first)[0];assert.equal(p.id,'4');assert.equal(p.category,'特别关注');assert.equal(p.fields.Y,1998);assert.equal(p.fields.housing,null);assert.equal(p.pinned,false);
 data.set('xy:cases:v2','[null]');assert.throws(()=>migrateStorage(store));assert.equal(data.get('xy:cases:v2'),'[null]');assert.equal(migrateProfile(null),null);
});
test('housing explicit trigram composition gives Qian, Tai and Da Zhuang',()=>{
 assert(housingReading({direction:'乾',member:'乾'}).hex.name.includes('乾'));assert(housingReading({direction:'坤',member:'乾'}).hex.name.includes('泰'));assert(housingReading({direction:'震',member:'乾'}).hex.name.includes('壯'));assert.equal(housingReading(null),null);
});
test('planet states separate domicile, exaltation, combustion and war',()=>{
 const sun={key:'sun',sid:121,signIndex:4},venus={key:'venus',sid:120.5,signIndex:4},mercury={key:'mercury',sid:120.6,signIndex:4};
 assert(planetStates(sun,[sun]).includes('庙 Swakshetra'));const flags=planetStates(venus,[sun,venus,mercury]);assert(flags.includes('焦 Astangata'));assert(flags.includes('战 Yuddha'));
});
test('eight Koota scores expose 36 points, Nadi and Bhakoot fixture boundaries',()=>{
 const moon=(signIndex,nakIndex,sid=signIndex*30)=>({planets:[{name:'月亮',signIndex,nakIndex,sid,pada:1}]});
 const r=ashtakoota(moon(0,0),moon(0,1));assert.equal(r.items.reduce((a,b)=>a+b.max,0),36);const yoni=(a,b)=>ashtakoota(moon(0,a),moon(0,b)).items.find(x=>x.key==='yoni').score;assert.equal(yoni(12,19),2);assert.equal(yoni(19,12),2);for(let a=0;a<27;a++)for(let b=0;b<27;b++)assert.equal(yoni(a,b),yoni(b,a));assert.equal(r.items.find(x=>x.key==='nadi').score,8);assert.equal(r.items.find(x=>x.key==='bhakoot').score,7);assert.equal(ashtakoota(moon(0,0),moon(1,3)).items.find(x=>x.key==='bhakoot').score,0);assert.equal(ashtakoota(moon(0,0),moon(0,0)).items.find(x=>x.key==='nadi').score,0);
});
