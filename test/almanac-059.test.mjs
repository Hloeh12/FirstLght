// v0.59.0 岁运层：择日必须落在「哪一步大运、哪一年」里算，且每一分仍要能由证据解释。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {almanac,natalBasis} from '../src/almanac.mjs';
import {baziPro} from '../src/bazi-pro.mjs';

const CITY={lat:31.23,lon:121.47,tz:8};
const birth={name:'岁运测试',gender:'男',Y:1988,M:7,D:20,h:14,mi:30,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};

test('every day reports the luck pillar that actually covers it',()=>{
 const basis=natalBasis(birth);
 assert(basis.cycles.length>0,'本命基盘必须带大运序列');
 const cycles=baziPro({birth}).cycles;
 const r=almanac({birth,date:'2026-11-24',days:31,event:'general'});
 for(const d of r.dates){
  assert(d.suiYun?.year?.gz,'每一天都要给出流年干支');
  assert.equal(d.suiYun.year.gz.length,2);
  assert(d.suiYun.luck,'命主已起运，择日必须落在大运里');
  const hit=cycles.find(c=>c.stem+c.branch===d.suiYun.luck.gz);
  assert(hit,`${d.date} 的大运 ${d.suiYun.luck.gz} 不在本命大运序列中`);
  assert.equal(d.suiYun.luck.startYear,hit.startYear);
  const at=Date.parse(d.date+'T04:00:00Z');
  assert(Date.parse(hit.startUtc)<=at&&at<Date.parse(hit.endUtc),`${d.date} 不在该大运的交运区间内`);
  assert(['喜','忌','平'].includes(d.suiYun.year.favor.label));
 }
});

test('luck and year interactions are itemized, not baked into the total',()=>{
 const r=almanac({birth,date:'2026-11-24',days:31,event:'contract'});
 const tagged=r.dates.flatMap(d=>[...d.plus,...d.minus]).filter(x=>/大运·|流年·|伏吟|岁运并临|运日天干相克/.test(x.k));
 assert(tagged.length>0,'31 天内应出现至少一条岁运层加减项');
 for(const item of tagged){
  assert(item.why.trim(),'岁运项必须带白话解释');
  assert(Number.isFinite(item.v)&&item.v!==0);
 }
 for(const d of r.dates){
  const sum=[...d.plus,...d.minus].reduce((n,x)=>n+x.v,0);
  assert(Math.abs(sum-d.raw)<0.35,`${d.date} 证据加总与 raw 不一致`);
  assert.equal(d.score,Math.max(3,Math.min(98,Math.round(50+45*Math.tanh(d.raw/9)))));
 }
 // 大运六冲属于真忌，必须落在减分侧
 for(const d of r.dates){
  const clash=d.minus.find(m=>m.k==='大运·六冲');
  if(clash)assert(clash.v<0);
 }
});

test('years and hours keep their traditional order for the moment chart',()=>{
 const r=almanac({birth,date:'2026-11-24',days:3,event:'travel'});
 for(const d of r.dates){
  assert.equal(d.hours.map(h=>h.branch).join(''),'子丑寅卯辰巳午未申酉戌亥','时辰必须按子起顺序排列');
  assert.equal(new Set(d.hours.map(h=>h.range)).size,12,'十二时辰区间不能重复');
  for(const h of d.bestHours)assert(d.hours.some(x=>x.branch===h.branch&&x.score===h.score));
  assert(d.hours.every(h=>/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(h.time)),'时柱必须是干支两位');
 }
});

test('public almanac still works without birth and never invents a luck pillar',()=>{
 const r=almanac({date:'2026-11-24',days:2,event:'general'});
 for(const d of r.dates){
  assert.equal(d.personal,false);
  assert(d.suiYun?.year?.gz,'流年干支是公共历法，不需要命主');
  assert.equal(d.suiYun.luck,null,'无命主时不得编造大运');
  assert(d.plus.concat(d.minus).every(x=>!/大运·|运日天干相克|岁运并临/.test(x.k)));
 }
});
