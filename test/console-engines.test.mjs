import test from 'node:test';
import assert from 'node:assert/strict';
import {westernPro,normalize} from '../src/western-pro.mjs';
import {bodyAt,housesAt} from '../src/ephemeris.mjs';
import {baziPro,reverseBazi,convertBirth,relations} from '../src/bazi-pro.mjs';
import {almanac,boneWeight,qizheng,yijing} from '../src/traditions.mjs';
import {ziweiChart} from '../src/ziwei.mjs';
import {localRequest} from '../src/console-engine.mjs';
import {mergeBackup} from '../assets/console/case-space.js';

const city={lat:30.361448,lon:109.492552,tz:8,label:'恩施'};
const birth={Y:1998,M:11,D:21,h:0,mi:2,gender:'女',city,dateStr:'1998-11-21',timeStr:'00:02'};
const at='2026-11-06T04:00:00Z';
const delta=(a,b)=>Math.min(normalize(a-b),normalize(b-a));

test('seven house computations have ordered real cusps and quadrant systems are distinct',()=>{
 const names=['placidus','koch','regiomontanus','campanus','whole','equal','porphyry'];
 const charts=names.map(h=>housesAt(new Date('1998-11-21T00:30Z'),city,h));
 assert.deepEqual(charts.map(h=>h.system),names);
 assert.equal(new Set(charts.map(h=>h.cusps[1].toFixed(3))).size,7);
 for(const c of charts){
  const advances=c.cusps.map(x=>normalize(x-c.cusps[0]));
  assert(advances.every((v,i)=>i===0||v>advances[i-1]));
  assert(delta(c.cusps[0]+180,c.cusps[6])<1e-7);
 }
 assert(housesAt(new Date(at),{lat:78,lon:20},'koch').warning);
});
test('western settings change calculated star sets and sidereal standards',()=>{
 const visible=['sun','moon','north','south','asc','dsc','mc','ic','fortune','vertex','lilith','chiron','juno','vesta','pallas','ceres'];
 const value=ayan=>westernPro({birth,at,config:{visible,zodiac:'sidereal',ayan,preset:'custom',orbs:{0:0,60:0,90:0,120:0,180:0}}}).chart;
 const l=value('lahiri'),f=value('fagan'),k=value('krishnamurti');
 assert.equal(l.planets.length,visible.length);
 assert.equal(l.planets.filter(x=>x.approximate).length,5);
 assert(l.planets.every(x=>x.degree.minutes<60&&x.degree.seconds<60&&x.house>=1&&x.house<=12));
 assert(l.aspects.every(a=>![0,60,90,120,180].includes(a.angle)));
 assert(new Set([l.offset,f.offset,k.offset]).size===3);
 assert(delta(l.planets.find(x=>x.key==='north').lon+180,l.planets.find(x=>x.key==='south').lon)<1e-7);
 const d=new Date('1998-11-21T00:30Z');
 assert(Math.abs(bodyAt(d,17).longitude-68.319)<.06);
});
test('all nine Western modes return their own date or time-lord data',()=>{
 const get=mode=>westernPro({birth,at,mode});
 const natal=get('natal').chart,sky=get('sky'),transit=get('transit'),secondary=get('secondary'),tertiary=get('tertiary');
 assert.equal(sky.chart.utc,'2026-11-06T04:00:00.000Z');
 assert.equal(transit.chart.utc,natal.utc);
 assert.equal(transit.outer.utc,sky.chart.utc);
 assert(transit.cross.length>0);
 assert(Date.parse(secondary.outer.utc)<Date.parse(tertiary.outer.utc));
 for(const [mode,key] of [['solar','sun'],['lunar','moon']]){
  const {chart,returnEvent}=get(mode);
  assert.equal(returnEvent.utc,chart.utc);
  assert(returnEvent.errorDegrees<=.0001);
  assert(delta(chart.planets.find(x=>x.key===key).lon,natal.planets.find(x=>x.key===key).lon)<=.0001);
  assert.equal(new Date(chart.utc).getUTCFullYear(),2026);
 }
 assert(get('firdaria').firdaria.active.lord);
 const f=get('firdaria').firdaria;
 assert.equal(f.periods.length,9);
 for(const p of f.periods){
  assert.equal(p.sub.length,7);
  assert.equal(p.sub[0].from,p.from);
  assert.equal(p.sub.at(-1).to,p.to);
  const elapsed=(Date.parse(p.to)-Date.parse(p.from))/7;
  for(const [i,q] of p.sub.entries()){
   if(i)assert.equal(q.from,p.sub[i-1].to);
   assert(Math.abs(Date.parse(q.to)-Date.parse(q.from)-elapsed)<=1);
  }
 }
 assert(f.sub&&Date.parse(f.sub.from)<=Date.parse(at)&&Date.parse(at)<Date.parse(f.sub.to));
 assert(get('profection').profection.ruler);
});
test('BaZi timeline, six tools, correction and reverse conversion use the same input',()=>{
 const base=baziPro({birth}),timed=baziPro({birth,selection:{luck:2,year:2026,month:11},combine:true});
 assert.equal(base.pillars.length,4);
 assert(base.pillars.every(p=>p.changsheng&&p.nayin&&p.hidden.length&&Array.isArray(p.shensha)));
 assert.equal(timed.years.length,10);
 assert.equal(timed.months.length,12);
 assert(timed.months.at(-1).date.startsWith('2027-01-'));
 assert.equal(timed.selected.length,3);
 assert(Math.abs(Object.values(timed.strength.percentages).reduce((a,b)=>a+b,0)-100)<1e-7);
 const p=base.pillars.map(x=>x.stem+x.branch);
 assert(reverseBazi({pillars:p,start:1990,end:2050}).some(x=>x.date==='1998-11-21'));
 assert.equal(convertBirth({Y:1998,M:11,D:21}).lunar,'1998-10-03');
 assert.equal(boneWeight(birth).qian,40);
 assert.throws(()=>baziPro({birth:{...birth,city:{...city,lat:null}}}),/坐标|经纬/);
 const local={...birth,h:0,mi:5,useSolarTime:true};
 assert.equal(baziPro({birth:local}).info.correction.dayOffset,-1);
 const late={...birth,h:23,mi:45};
 assert.notEqual(baziPro({birth:late}).pillars[2].branch,baziPro({birth:{...late,lateZishi:'current-day'}}).pillars[2].branch);
 assert(relations([{name:'年',stem:'甲',branch:'寅'},{name:'月',stem:'己',branch:'卯'},{name:'日',stem:'戊',branch:'辰'}]).some(r=>r.type==='三会方'));
});
test('natal transformations, eleven luminaries, hexagrams and almanac have computed positions',()=>{
 const zw=ziweiChart({dateStr:birth.dateStr,timeIndex:0,gender:'女'});
 for(const p of zw.palaces){
  assert(Number.isFinite(p.starWeight));
  assert.equal(p.flying.length,4);
 }
 const q=qizheng(birth);
 assert.equal(q.stars.length,11);
 assert(q.stars.every(s=>s.mansion&&s.houseDegree>=0&&s.houseDegree<30));
 assert(delta(q.stars[7].lon+180,q.stars[8].lon)<1e-7);
 const z=yijing({birth,year:2026});
 assert.equal(z.library.length,64);
 assert.equal(new Set(z.library.map(g=>g.lines.join(''))).size,64);
 assert(z.numbers.heaven.sum>0&&z.numbers.earth.sum>0);
 assert(Number.isInteger(z.natal.origin)&&z.natal.origin>=0&&z.natal.origin<6);
 const a=almanac({birth,date:'2026-11-06',days:2});
 assert.equal(a.dates.length,2);
 assert(a.dates.every(d=>d.hours.length===12&&d.yi.length>0));
 assert.throws(()=>almanac({date:'2026-02-30'}),/日期/);
});

test('case backup preserves both directions, reminders, groups and active case across repeat imports',()=>{
 const a={id:'a',name:'甲',fields:birth},b={id:'b',name:'乙',fields:{...birth,h:1}};
 const space={links:[{ids:['b','a'],type:'灵魂共振',closeness:75}],notes:{a:'札记'},reminders:{a:[{id:'r',when:'2030-01-01T09:00',message:'回顾'}]}};
 const input={format:'firstlight-cases',version:3,cases:[a,b],activeId:'a',groups:['旧友'],recent:['b','a'],space};
 const restored=mergeBackup(input,{cases:[],groups:[],recent:[],profile:null},{links:[],notes:{},reminders:{}});
 assert.deepEqual(restored.space.links[0].ids,['a','b']);
 assert.equal(restored.profile.id,'a');
 assert.equal(restored.space.notes.a,'札记');
 assert.equal(restored.newReminders.length,1);
 assert.deepEqual(restored.groups,['旧友']);
 const repeated=mergeBackup(input,restored,restored.space);
 assert.equal(repeated.cases.length,2);
 assert.equal(repeated.space.links.length,1);
 assert.equal(repeated.newReminders.length,0);
 const score=localRequest('/api/console/relationship',{a:birth,b:b.fields});
 const synastry=localRequest('/api/synastry/chart',{a:birth,b:b.fields});
 assert.deepEqual(score,synastry.fit);
 assert.equal(score.percent,localRequest('/api/console/relationship',{a:b.fields,b:birth}).percent);
 assert(synastry.crossRelations.every(r=>r.ids.some(i=>i<4)&&r.ids.some(i=>i>=4)));
 assert.equal(score.max,36);
});

test('local sky derives real new/full moon and daily draws use the Shanghai double-hour',()=>{
 const sky=at=>localRequest('/api/console/today-sky',{at});
 assert.equal(sky('2024-04-08T18:21:00Z').phase,'新月');
 assert(sky('2024-04-08T18:21:00Z').litPercent<1);
 assert.equal(sky('2024-04-23T23:49:00Z').phase,'满月');
 assert(sky('2024-04-23T23:49:00Z').litPercent>99);
 const guide=at=>localRequest('/api/console/daily-guidance',{at,birth});
 assert.deepEqual(guide('2026-11-06T15:03:00Z'),guide('2026-11-06T15:55:00Z'));
 assert.equal(guide('2026-11-06T15:03:00Z').branch,'子');
 assert.equal(guide('2026-11-06T16:03:00Z').day,'2026-11-07');
 assert.equal(guide('2026-11-06T17:03:00Z').branch,'丑');
});

test('daily guidance differentiates Bing-fire and Gui-water and Bazi readings follow the selected flow',()=>{
 const a={...birth,Y:2000,M:8,D:16,h:12,mi:0,dateStr:'2000-08-16',timeStr:'12:00'};
 const b={...birth,D:22,dateStr:'1998-11-22'};
 const fire=localRequest('/api/console/daily-guidance',{birth:a,at});
 const water=localRequest('/api/console/daily-guidance',{birth:b,at});
 assert.equal(fire.dayMaster,'丙火');
 assert.equal(water.dayMaster,'癸水');
 assert.notDeepEqual(fire,water);
 assert.notEqual(fire.energy,water.energy);
 assert.notEqual(fire.motto,water.motto);
 assert(Number.isFinite(fire.support)&&fire.energy.includes('丙火日主'));
 assert.equal(fire.seedSource.stem,'丙');
 assert.equal(water.seedSource.stem,'癸');
 assert.throws(()=>localRequest('/api/console/daily-guidance',{at}),/先选择命主/);
 const natal=baziPro({birth});
 assert.equal(natal.guidance,null);
 const timed=baziPro({birth,selection:{year:2026}});
 assert(timed.guidance.influences.some(r=>r.type==='六冲'&&r.pattern==='子午'));
 assert(timed.guidance.summary.includes('流年'));
 assert.equal(timed.guidance.advice.length,3);
 const month=baziPro({birth,selection:{year:2026,month:9}});
 assert.equal(month.guidance.scope,'流月');
 assert.notEqual(month.guidance.title,timed.guidance.title);
});
