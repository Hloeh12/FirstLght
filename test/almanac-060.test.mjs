// v0.60.0：一次基盘给多事项评分；年运轴按节气切十二流月，且与逐日择日同分。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {almanac,yearAgenda,EVENTS} from '../src/almanac.mjs';

const CITY={lat:31.23,lon:121.47,tz:8};
const birth={name:'运程轴测试',gender:'男',Y:1988,M:7,D:20,h:14,mi:30,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};

test('one scan scores every matter, and the primary one is the same number',()=>{
 const r=almanac({birth,date:'2026-11-24',days:10,event:'contract',events:['open','wedding','travel']});
 for(const d of r.dates){
  assert(d.byEvent,'多事项查询必须带 byEvent');
  assert.equal(d.byEvent.contract.score,d.score,'主事项分数必须与日分数一致，不能两套口径');
  for(const k of ['open','wedding','travel']){
   assert(d.byEvent[k],`缺少 ${k} 的分数`);
   assert(Number.isFinite(d.byEvent[k].delta));
  }
  const sum=[...d.plus,...d.minus].reduce((n,x)=>n+x.v,0);
  assert(Math.abs(sum-d.raw)<0.35,'证据加总仍要等于原始分');
 }
});

test('byEvent equals a dedicated query for the same day',()=>{
 const multi=almanac({birth,date:'2026-11-24',days:5,event:'general',events:['wedding','travel']});
 for(const k of ['wedding','travel']){
  const one=almanac({birth,date:'2026-11-24',days:5,event:k});
  multi.dates.forEach((d,i)=>assert.equal(d.byEvent[k].score,one.dates[i].score,`${d.date} 的 ${k} 应与单独查询一致`));
 }
});

test('year agenda cuts twelve solar months from 立春 to 立春',()=>{
 const a=yearAgenda({birth,year:2026,events:Object.keys(EVENTS),event:'contract'});
 assert.equal(a.months.length,12,'一年必须正好十二个流月');
 assert.equal(a.months[0].gz[1],'寅','首月是寅月（立春起）');
 assert.equal(a.months.at(-1).gz[1],'丑','末月是丑月');
 for(let i=1;i<a.months.length;i++){
  const prev=a.months[i-1].end,next=a.months[i].start;
  const gap=Math.round((Date.parse(next+'T00:00:00Z')-Date.parse(prev+'T00:00:00Z'))/86400000);
  assert.equal(gap,1,`${prev} 与 ${next} 之间必须紧邻，不能留缝或叠日`);
 }
 const winter=a.months.find(m=>m.gz[1]==='子');
 assert.equal(winter.end.slice(0,4),String(a.year+1),'冬月会跨到次年 1 月，年界按立春而非公历');
});

test('month best day scores exactly like a single-day almanac query',()=>{
 const a=yearAgenda({birth,year:2026,events:['open','wedding'],event:'contract'});
 for(const m of a.months.filter((_,i)=>i%4===0)){
  assert(m.bestFor,`${m.label} 应有最优日`);
  const one=almanac({birth,date:m.bestFor.date,days:1,event:'contract'}).dates[0];
  assert.equal(m.bestFor.score,one.score,`${m.bestFor.date} 的年运轴分数必须等于择日分数`);
  assert.equal(m.bestFor.tier,one.tier);
 }
});

test('every month lists at most three matters, each traced to its own best day',()=>{
 const a=yearAgenda({birth,year:2026,events:Object.keys(EVENTS),event:'general'});
 for(const m of a.months){
  assert(m.top.length>0,`${m.label} 不应完全没有可用之日`);
  assert(m.top.length<=3,'最多三件事');
  assert.equal(new Set(m.top.map(t=>t.event)).size,m.top.length,'三件事必须互不相同');
  for(const t of m.top){
   assert.equal(m.best[t.event].date,t.date,'列出的日期必须是该事项在该月的最优日');
   assert(EVENTS[t.event],'事项键必须有效');
  }
 }
});

test('year bounds and unknown matters are rejected instead of silently wrong',()=>{
 assert.throws(()=>yearAgenda({birth,year:1899}),/年份/);
 assert.throws(()=>yearAgenda({birth,year:2101}),/年份/);
 const a=yearAgenda({birth,year:2026,events:['not-a-thing'],event:'nope'});
 assert.equal(a.event,'general','未知事项退回综合参考');
 assert.deepEqual(a.byEvent,[],'无效事项键不进入多事项列表');
});
