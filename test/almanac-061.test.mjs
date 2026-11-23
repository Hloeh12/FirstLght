// v0.61.0：日课带流月干支与喜忌（月历要同屏），且跨节气月时按实际换月点分段。
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {almanac,yearAgenda,EVENTS} from '../src/almanac.mjs';

const CITY={lat:31.23,lon:121.47,tz:8};
const birth={name:'月历测试',gender:'男',Y:1988,M:7,D:20,h:14,mi:30,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};

test('每一天都带流月干支与喜忌，月名按地支而不是公历月',()=>{
 const r=almanac({birth,date:'2026-11-01',days:30,event:'contract'});
 const LABEL={寅:'正月',卯:'二月',辰:'三月',巳:'四月',午:'五月',未:'六月',申:'七月',酉:'八月',戌:'九月',亥:'十月',子:'冬月',丑:'腊月'};
 for(const d of r.dates){
  assert.equal(d.monthGz.length,2,'流月干支必须是两字');
  assert(['喜','忌','平'].includes(d.monthFavor.label),'喜忌标签必须是喜／忌／平');
  assert.equal(d.monthLabel,LABEL[d.monthGz[1]],'月名由月支决定');
 }
});

test('公历月跨节气月时，换月点落在节气当天而不是月初',()=>{
 const r=almanac({birth,date:'2026-11-01',days:30,event:'contract'});
 const groups=[];
 for(const d of r.dates){
  const last=groups.at(-1);
  if(!last||last.gz!==d.monthGz)groups.push({gz:d.monthGz,start:d.date,end:d.date});
  groups.at(-1).end=d.date;
 }
 assert.equal(groups.length,2,'2026 年 11 月跨戌、亥两个流月');
 assert.equal(groups[0].gz[1],'戌');
 assert.equal(groups[1].gz[1],'亥');
 assert.equal(groups[1].start,'2026-11-07','立冬当天换月，不能沿用月初的月干支');
});

test('月历流月的喜忌与年运轴同一个月完全一致，不另算一套',()=>{
 const r=almanac({birth,date:'2026-11-01',days:30,event:'contract'});
 const a=yearAgenda({birth,year:2026,events:['contract'],event:'contract'});
 for(const gz of new Set(r.dates.map(d=>d.monthGz))){
  const day=r.dates.find(d=>d.monthGz===gz);
  const month=a.months.find(m=>m.gz===gz);
  assert(month,`年运轴应含流月 ${gz}`);
  assert.equal(day.monthFavor.label,month.favor.label,`${gz} 的喜忌在两处必须一致`);
 }
});

test('加流月字段不改分数：证据加总仍等于原始分',()=>{
 const r=almanac({birth,date:'2026-11-24',days:7,event:'open',events:Object.keys(EVENTS)});
 for(const d of r.dates){
  const sum=[...d.plus,...d.minus].reduce((n,x)=>n+x.v,0);
  assert(Math.abs(sum-d.raw)<0.35,`${d.date} 证据加总应等于 raw`);
  assert(d.byEvent?.open,'多事项分数仍要在');
 }
});
