import test from 'node:test';
import assert from 'node:assert/strict';
import {SunPosition} from 'astronomy-engine';
import {housesAt} from '../src/ephemeris.mjs';
import {westernPro} from '../src/western-pro.mjs';
import {termNear,bazi,solarTerms} from '../src/bazi.mjs';
import {seasonalCommand} from '../src/seasonal-command.mjs';
import {ziweiChart,ziweiFlow} from '../src/ziwei.mjs';
import {mutagensFor} from '../src/ziwei-rules.mjs';
import {TROPICAL_YEAR_DAYS,TROPICAL_YEAR_MS,DAY_MS} from '../src/time-constants.mjs';
import {heluoNumbers,hexFromLines,yuantang,posterior,tianjiAnnual} from '../src/yijing-tianji.mjs';
import {dailyGuidance} from '../src/today-sky.mjs';
const birth={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{lat:31.23,lon:121.47,tz:8}};
const gap=(x,y)=>Math.abs(((x-y+540)%360)-180);

test('high-latitude house guard is explicit at 66 degrees and always has twelve finite ordered cusps',()=>{
 for(const lat of [66,-66,70,-78,89.99,90,-90])for(const system of ['placidus','koch']){
  const h=housesAt(new Date('2026-06-21T03:00Z'),{lat,lon:20},system);
  assert.equal(h.requestedSystem,system);assert(['porphyry','whole'].includes(h.system));
  assert(h.warning.includes('高纬度')||h.warning.includes('极区'));
  assert.equal(h.cusps.length,12);
  assert(h.cusps.every(Number.isFinite));
  const n=h.cusps.map(v=>((v-h.cusps[0]+360)%360));assert(n.every((v,i)=>!i||v>n[i-1]));
 }
 assert.equal(housesAt(new Date('2026-06-21T03:00Z'),{lat:65.99,lon:20},'placidus').requestedSystem,'placidus');
 assert.equal(housesAt(new Date(),{lat:70,lon:20},'whole').system,'whole');
});
test('solar longitude changes month and year pillars exactly across the Lichun numerical root',()=>{
 const edge=termNear(2026,315);
 assert(gap(SunPosition(edge).elon,315)<.0001);
 const calc=utc=>{const wall=new Date(+utc+8*3600000);return bazi({utc,local:{y:wall.getUTCFullYear(),m:wall.getUTCMonth()+1,d:wall.getUTCDate(),h:wall.getUTCHours(),mi:wall.getUTCMinutes()}});};
 const before=calc(new Date(+edge-1000)),after=calc(new Date(+edge+1000));
 assert.equal(before.pillars[1].branch,'丑');assert.equal(after.pillars[1].branch,'寅');
 assert.notEqual(before.pillars[0].stem,after.pillars[0].stem);
 for(const c of after.luck.cycles)assert(Math.abs(Date.parse(c.endUtc)-Date.parse(c.startUtc)-10*TROPICAL_YEAR_MS)<2);
 assert.equal(after.luck.tropicalYearDays,TROPICAL_YEAR_DAYS);
});
test('human-element commander switches on exact 24-hour phase boundaries from the real solar term',()=>{
 const jie=solarTerms(2026).find(t=>t.name==='立春').date;
 const a=seasonalCommand(+jie+5*DAY_MS-1),b=seasonalCommand(+jie+5*DAY_MS),c=seasonalCommand(+jie+10*DAY_MS);
 assert.equal(a.stem,'戊');assert.equal(b.stem,'丙');assert.equal(c.stem,'甲');
 assert.equal(b.term.utc,jie.toISOString());assert.equal(Date.parse(b.phaseStart),+jie+5*DAY_MS);
 assert.equal(seasonalCommand(+jie-1).branch,'丑');
});
test('four-transformation school applies consistently to natal stars, palace flights and annual/month/day scopes',()=>{
 const input={dateStr:'2000-08-16',timeIndex:6,gender:'女'};
 for(const [school,geng,xin] of [
  ['quanshu',['太阳','武曲','太阴','天同'],['巨门','太阳','文曲','文昌']],
  ['quanjiTong',['太阳','武曲','天同','天相'],['巨门','太阳','文昌','文曲']],
  ['quanjiYin',['太阳','武曲','太阴','天相'],['巨门','太阳','文昌','文曲']]
 ]){
  assert.deepEqual(mutagensFor('庚',school),geng);assert.deepEqual(mutagensFor('辛',school),xin);
  const z=ziweiChart({...input,ziweiSchool:school});assert.equal(z.school.id,school);
  assert.equal(z.sihua.find(x=>x.type==='忌').star,geng[3]);
  for(const p of z.palaces){
   assert.deepEqual(p.flying.map(f=>f.star),mutagensFor(p.heavenlyStem,school));
   assert.equal(p.triadWeight,Number(p.relatedBranches.reduce((n,b)=>n+z.palaces.find(q=>q.branch===b).starWeight,0).toFixed(2)));
   if(!p.majorStars.length)assert.deepEqual(p.borrowedStars.map(s=>s.name),z.palaces.find(q=>q.branch===(p.branch+6)%12).majorStars.map(s=>s.name));
  }
  for(const scope of ['decadal','yearly','monthly','daily']){
   const f=ziweiFlow({...input,ziweiSchool:school,flowYear:2030,scope,month:6,day:12});
   assert.deepEqual(f.mutagens.map(x=>x.star),mutagensFor(f.ganZhi[0],school));
  }
 }
 assert.throws(()=>mutagensFor('庚','unknown'),/口径/);
});
test('progressions use unrounded tropical years and returns converge through 0/360 without mean-year estimates',()=>{
 const at='2075-08-16T04:00Z';
 const natal=westernPro({birth,at}).chart;
 const secondary=westernPro({birth,at,mode:'secondary'});
 const expected=Date.parse(natal.utc)+(Date.parse(at)-Date.parse(natal.utc))*DAY_MS/TROPICAL_YEAR_MS;
 assert(Math.abs(Date.parse(secondary.outer.utc)-expected)<1);
 for(const mode of ['solar','lunar']){
  const r=westernPro({birth,at,mode});assert(r.returnEvent.errorDegrees<.0001);
 }
});
test('Tianji arithmetic, Yuantang and posterior rules follow independently checked textbook figures',()=>{
 const pillars=['己酉','戊辰','戊寅','甲寅'].map(p=>({stem:p[0],branch:p[1]}));
 const n=heluoNumbers(pillars,{year:1969,gender:'男'});
 assert.equal(n.heaven.sum,31);assert.equal(n.earth.sum,36);assert.equal(n.sky,'乾');assert.equal(n.land,'乾');
 const h={...hexFromLines([0,1,0,0,1,1],1),origin:1};
 assert.equal(h.number,59);assert.equal(yuantang(h.lines,3,'男',true),1);
 const p=posterior(h,1,true);assert.equal(p.number,46);assert.equal(p.origin,4);
 assert.deepEqual(Array.from({length:9},(_,i)=>tianjiAnnual(h,p,1954,1954+i).annual.number),[59,4,23,52,56,33,31,49,43]);
 assert.equal(tianjiAnnual(h,p,1954,1963).annual.number,57);
 for(const [number,line,negative,positive] of [[29,4,7,16],[3,4,24,23],[39,4,15,8],[29,5,48,42],[3,5,32,53],[39,5,18,59]]){
  const lines=number===29?[0,1,0,0,1,0]:number===3?[1,0,0,0,1,0]:[0,0,1,0,1,0];
  assert.equal(posterior(hexFromLines(lines),line,false).number,negative);
  assert.equal(posterior(hexFromLines(lines),line,true).number,positive);
 }
 for(let value=0;value<64;value++)for(let hour=0;hour<12;hour++)for(const gender of ['男','女'])for(const yang of [true,false]){
  const lines=Array.from({length:6},(_,i)=>(value>>i)&1),index=yuantang(lines,hour,gender,yang);
  assert(Number.isInteger(index)&&index>=0&&index<6);
 }
});
test('daily deterministic number uses full civil year month day hour and natal stem/element',()=>{
 const a=dailyGuidance({birth,at:'2026-11-07T04:05Z'}),b=dailyGuidance({birth,at:'2026-11-07T04:59Z'});
 assert.deepEqual(a,b);assert.notEqual(a.seed,dailyGuidance({birth,at:'2026-11-07T05:00Z'}).seed);
 assert.notEqual(a.seed,dailyGuidance({birth:{...birth,D:17},at:'2026-11-07T04:05Z'}).seed);
 assert(a.hexagram.number>=1&&a.hexagram.number<=64);
});
