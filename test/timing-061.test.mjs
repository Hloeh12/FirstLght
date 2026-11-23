// v0.61.0：跨体系择时——紫微流时与印占 Muhurta 各自出结论，不相加成。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {timingCross} from '../src/timing-cross.mjs';
import {ziweiHourFlow} from '../src/ziwei.mjs';

const CITY={lat:31.23,lon:121.47,tz:8};
const birth={name:'跨体系测试',gender:'男',Y:1988,M:7,D:20,h:14,mi:30,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};

test('两支体系都给出可比对的分与档，且证据不等于空口',()=>{
 const r=timingCross({birth,date:'2026-11-28',hourBranch:'巳',event:'contract'});
 for(const key of ['ziwei','vedic']){
  const x=r[key];
  assert(x.ok,`${key} 应可计算`);
  assert(x.score>=3&&x.score<=98,`${key} 分数应在 3–98`);
  assert(['上吉','吉','平','慎','避'].includes(x.tier));
  assert(x.plus.length+x.minus.length>0,`${key} 必须给出至少一条证据`);
  const sum=[...x.plus,...x.minus].reduce((n,t)=>n+t.v,0);
  assert(Math.abs(sum-x.raw)<0.35,`${key} 证据加总应等于原始分`);
  assert(x.summary&&x.summary.length>8,`${key} 要给一句话结论`);
 }
 assert.equal(r.date,'2026-11-28');
 assert.equal(r.hourBranch,'巳');
});

test('紫微流时命宫与直接调用一致，且落宫是十二宫之一',()=>{
 const r=timingCross({birth,date:'2026-11-28',hourBranch:'巳',event:'contract'});
 const direct=ziweiHourFlow({dateStr:'1988-07-20',timeIndex:7,gender:'男',flowDate:'2026-11-28',hourIndex:5});
 assert.equal(r.ziwei.flowGz,direct.flowGz,'流时干支应与紫微流时一致');
 assert.equal(r.ziwei.ming.branch,direct.ming.branch);
 assert.equal(r.ziwei.ming.palace,direct.ming.palace);
 assert(r.ziwei.mutagens.length===4,'流时四化必须四颗');
});

test('十二时辰的紫微判断不能是一条直线',()=>{
 const scores='子丑寅卯辰巳午未申酉戌亥'.split('').map(b=>timingCross({birth,date:'2026-11-28',hourBranch:b,event:'contract'}).ziwei.score);
 assert(new Set(scores).size>=4,`十二时辰至少应出现四种不同分数，实测 ${scores.join(',')}`);
 assert(Math.max(...scores)-Math.min(...scores)>=8,'最高与最低应拉开至少 8 分，否则没有区分意义');
});

test('印占五要素字段齐全，Tithi 序号与月宿落在合法范围',()=>{
 const r=timingCross({birth,date:'2026-11-28',hourBranch:'巳',event:'contract'});
 const v=r.vedic;
 assert(v.tithi.index>=1&&v.tithi.index<=30,'Tithi 在一月三十日之内');
 assert(['白分','黑分'].includes(v.tithi.paksha));
 assert(v.nakshatra.name&&v.nakshatra.pada>=1&&v.nakshatra.pada<=4);
 assert(v.tara.index>=1&&v.tara.index<=9);
 assert(v.chandra.house>=1&&v.chandra.house<=12);
 assert(['动宫','固定宫','双体宫'].includes(v.lagna.quality));
 assert(v.vara.name.endsWith('日'));
});

test('非法的日期、时辰与缺案例都被明确拒绝',()=>{
 assert.throws(()=>timingCross({birth,date:'2026-13-01',hourBranch:'巳'}),/日期|无效/);
 assert.throws(()=>timingCross({birth,date:'2026-11-28',hourBranch:'午时'}),/时辰/);
 assert.throws(()=>timingCross({date:'2026-11-28',hourBranch:'巳'}),/案例/);
});

test('出生时刻未知时紫微如实标不可用，印占仍可用并说明偏差',()=>{
 const unknown={...birth,timeUnknown:true};
 const r=timingCross({birth:unknown,date:'2026-11-28',hourBranch:'巳',event:'contract'});
 assert.equal(r.ziwei.ok,false,'紫微命宫不可定，不能假装算得出流时');
 assert.match(r.ziwei.note,/出生时刻未知/);
 assert(r.vedic.ok,'印占只需月亮与上升，仍可给结论');
 assert.match(r.note,/出生时刻未知/);
});

test('三支各自的映射尺度写在方法学里，不假装同一把尺',()=>{
 const r=timingCross({birth,date:'2026-11-28',hourBranch:'巳',event:'contract'});
 assert.match(r.method,/不相加/);
 assert.match(r.ziwei.method,/raw\/5/);
 assert.match(r.vedic.method,/raw\/9/);
});
