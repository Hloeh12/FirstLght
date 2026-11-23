// v0.58.0 个性化择日引擎：证据链必须能解释分数、排序必须与分数一致、口径降级必须如实标出。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {almanac,natalBasis,EVENTS} from '../src/almanac.mjs';
import {baziPro} from '../src/bazi-pro.mjs';

const CITY={lat:31.23,lon:121.47,tz:8};
const birth={name:'择日测试',gender:'男',Y:1988,M:7,D:20,h:14,mi:30,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};
const neutral={name:'中和盘',gender:'男',Y:1990,M:2,D:10,h:10,mi:0,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};

test('almanac scores are fully explained by their evidence items',()=>{
 const r=almanac({birth,date:'2026-11-24',days:7,event:'contract'});
 assert.equal(r.dates.length,7);
 for(const d of r.dates){
  assert(d.plus.length+d.minus.length>0,`${d.date} 没有任何评分依据`);
  const sum=[...d.plus,...d.minus].reduce((n,x)=>n+x.v,0);
  assert(Math.abs(sum-d.raw)<0.35,`${d.date} 依据加总 ${sum} 与 raw ${d.raw} 不一致`);
  assert.equal(d.score,Math.max(3,Math.min(98,Math.round(50+45*Math.tanh(d.raw/9)))));
  for(const item of [...d.plus,...d.minus]){
   assert(item.k.trim()&&item.why.trim(),'评分项必须带名称与白话解释');
   assert(Number.isFinite(item.v));
  }
  // 正项不能出现在减分侧，反之亦然，避免前端色块与符号打架
  assert(d.plus.every(x=>x.v>0));
  assert(d.minus.every(x=>x.v<0));
 }
});

test('ranking is strictly by score and every day keeps its own hours',()=>{
 const r=almanac({birth,date:'2026-11-24',days:10,event:'open'});
 const ranks=r.dates.map(d=>d.rank).sort((a,b)=>a-b);
 assert.deepEqual(ranks,Array.from({length:10},(_,i)=>i+1));
 const sorted=[...r.dates].sort((a,b)=>b.score-a.score);
 assert.deepEqual(r.dates.find(d=>d.rank===1).date,sorted[0].date);
 assert.equal(r.best,sorted[0].date);
 for(const d of r.dates){
  assert.equal(d.hours.length,12);
  assert.equal(new Set(d.hours.map(h=>h.branch)).size,12);
  assert(d.hours.every(h=>/^\d{2}:\d{2}–\d{2}:\d{2}$/.test(h.range)),'时辰必须给出可读区间');
  assert(d.bestHours.length<=3);
  assert.deepEqual(d.bestHours.map(h=>h.score),[...d.bestHours.map(h=>h.score)].sort((a,b)=>b-a));
  assert(d.bestHours.every(h=>h.score>=55),'推荐时段必须过线');
  for(const h of d.hours){
   const sum=[...h.plus,...h.minus].reduce((n,x)=>n+x.v,0);
   assert.equal(h.score,Math.max(3,Math.min(98,Math.round(50+45*Math.tanh(sum/7)))));
  }
 }
});

test('the chosen event moves the score through yellow-calendar matches only',()=>{
 const general=almanac({birth,date:'2026-11-24',days:7,event:'general'});
 const contract=almanac({birth,date:'2026-11-24',days:7,event:'contract'});
 const hit=contract.dates.find(d=>d.eventHits.yi.length);
 assert(hit,'样例区间内应至少有一天宜项命中签约');
 const same=general.dates.find(d=>d.date===hit.date);
 assert(hit.score>same.score,'命中宜项的日子在对应事项下应更高');
 assert(hit.eventHits.ji.length===0||hit.minus.some(m=>m.k.includes('黄历忌')),'忌项命中必须出现在减分侧');
 assert(general.dates.every(d=>d.eventHits.yi.length===0&&d.eventHits.ji.length===0),'综合参考不套用事项词');
 assert.equal(contract.basis.use.length>0,true);
});

test('a weak chart uses 扶抑 favourites while a neutral chart falls back to 调候',()=>{
 const weak=natalBasis(birth);
 assert.equal(weak.source,'扶抑');
 assert(weak.use.length&&weak.avoid.length);
 assert(!weak.half);
 const mid=natalBasis(neutral);
 assert.equal(baziPro({birth:neutral}).strength.kind,'中和');
 assert.equal(mid.source,'调候');
 assert.equal(mid.half,true);
 assert(mid.use.length>0&&/调候|喜用未单列/.test(mid.note));
 // 中和盘不能把喜用权重打满：同一天的分差应明显小于强喜忌盘
 const midDay=almanac({birth:neutral,date:'2026-11-28',days:1,event:'general'}).dates[0];
 assert(midDay.plus.concat(midDay.minus).filter(x=>/日干|日支/.test(x.k)).every(x=>Math.abs(x.v)<=1.6),'调候权重应减半');
});

test('no birth still yields a usable public almanac',()=>{
 const r=almanac({date:'2026-11-24',days:3,event:'travel'});
 assert.equal(r.basis,null);
 assert(r.dates.every(d=>d.personal===false&&d.hours.length===12));
 assert(r.dates.every(d=>d.plus.concat(d.minus).every(x=>!/日干|日支|命局生肖|日干十神/.test(x.k))));
 assert(r.dates.every(d=>d.yi.length>0&&d.tenGod===null));
 assert(r.method.includes('tanh'));
});

test('almanac rejects bad ranges and unknown events fall back to general',()=>{
 assert.throws(()=>almanac({date:'2026-02-30'}),/日期/);
 assert.throws(()=>almanac({date:'2026-11-24',days:0}),/32 天/);
 assert.throws(()=>almanac({date:'2026-11-24',days:33}),/32 天/);
 const r=almanac({birth,date:'2026-11-24',days:2,event:'nope'});
 assert.equal(r.event,'general');
 assert.equal(r.eventLabel,EVENTS.general.label);
});
