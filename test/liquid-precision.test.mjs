import {readFileSync} from 'node:fs';
import {bodyAt,housesAt} from '../src/ephemeris.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {CHINA_DST,resolveBirthTime,chinaDstState} from '../src/birth.mjs';
import {baziPro} from '../src/bazi-pro.mjs';
import {chart} from '../src/chart.mjs';
import {westernPro,effectiveOrb} from '../src/western-pro.mjs';
import {ziweiChart,ziweiFlow} from '../src/ziwei.mjs';
import {resonance} from '../src/resonance.mjs';
import {Lunar} from 'lunar-javascript';
const city={lat:31.23,lon:121.47,tz:8,tzName:'Asia/Shanghai'};
const birth={Y:1988,M:5,D:4,h:12,mi:0,gender:'女',city};
test('all six PRC DST seasons have hour-exact gap/fold handling and explicitly selected 1988 compatibility',()=>{
 for(const [Y,M,D,em,ed] of CHINA_DST){
  assert.equal(chinaDstState({Y,M,D,h:1,mi:59}).applied,false);
  assert.throws(()=>chinaDstState({Y,M,D,h:2,mi:0}),/不存在/);
  assert.throws(()=>chinaDstState({Y,M,D,h:2,mi:59}),/不存在/);
  assert.equal(chinaDstState({Y,M,D,h:3,mi:0}).applied,true);
  assert.equal(chinaDstState({Y,M:em,D:ed,h:0,mi:59}).applied,true);
  const fold=chinaDstState({Y,M:em,D:ed,h:1,mi:30});assert.equal(fold.applied,false);assert(fold.warning.includes('第二次'));
  assert.equal(chinaDstState({Y,M:em,D:ed,h:2}).applied,false);
 }
 const input={Y:1988,M:4,D:12,h:12,mi:0,city};
 assert.equal(resolveBirthTime(input).utc.toISOString(),'1988-04-12T04:00:00.000Z');
 assert.equal(resolveBirthTime({...input,dst1988Rule:'compat-apr10'}).utc.toISOString(),'1988-04-12T03:00:00.000Z');
 assert.equal(resolveBirthTime({...input,city:{...city,tzName:'Asia/Hong_Kong'}}).offsetMin,480);
});
test('all chart entry points resolve the same historic instant, with DST removed exactly once',()=>{
 for(const tzName of [undefined,'Asia/Shanghai']){
  const b={...birth,city:{...city,tzName}},ba=baziPro({birth:b}),old=chart({...b,skipZiwei:true}),w=westernPro({birth:b}),z=ziweiChart({...b,dateStr:'1988-05-04'});
  assert.equal(ba.info.utc,'1988-05-04T03:00:00.000Z');assert.equal(old.meta.utc,ba.info.utc);assert.equal(w.chart.utc,ba.info.utc);
  assert(ba.info.timeCorrection.dstApplied);assert.equal(z.correction.hour,11);
  const solar=baziPro({birth:{...b,useSolarTime:true}});assert.equal(solar.info.utc,ba.info.utc);
  assert.equal(ba.entry.offsetMinutes,480);assert(ba.entry.local.startsWith('1998-03-11 19:02:'));
 }
});
test('professional aspect limits preserve luminary orbs, cap outer pairs and minor custom orbs',()=>{
 const p=key=>({key});
 assert.equal(effectiveOrb(p('sun'),p('pluto'),0),8);
 assert.equal(effectiveOrb(p('moon'),p('saturn'),90),7);
 assert.equal(effectiveOrb(p('mercury'),p('pluto'),0),6);
 assert.equal(effectiveOrb(p('saturn'),p('uranus'),120),6);
 assert.equal(effectiveOrb(p('saturn'),p('uranus'),60),5);
 for(const angle of [30,45,135,150])assert.equal(effectiveOrb(p('sun'),p('moon'),angle,{preset:'custom',orbs:{[angle]:9}}),2);
 const w=westernPro({birth});
 for(const a of w.chart.aspects)assert(a.orb<=a.allowedOrb);
});
test('leap month policies apply consistently to all three chart types, decades and flow overlays',()=>{
 const dateStr=Lunar.fromYmd(2023,-2,20).getSolar().toYmd();
 for(const astroType of ['heaven','earth','human']){
  const results=[];
  for(const ziweiLeap of ['split','prev-month','next-month']){
   const c=ziweiChart({dateStr,timeIndex:2,gender:'女',astroType,ziweiLeap});results.push(c);
   assert.equal(c.leapPolicy,ziweiLeap);assert(c.leapLabel);assert.equal(c.palaces.length,12);
   const first=c.decades[0];assert(c.palaces.some(p=>p.name===first.palaceName&&p.decadal.range.join()===first.ageRange.join()));
   const f=ziweiFlow({dateStr:c.effectiveDate,timeIndex:c.effectiveTimeIndex,gender:'女',astroType,ziweiLeap,flowYear:2026,scope:'yearly'});
   for(const m of f.mutagens){assert.equal(c.palaces.find(p=>p.branch===m.branch)?.stars.some(s=>s.name===m.star),true);}
  }
  assert.notEqual(results[1].fiveElementsClass+JSON.stringify(results[1].sihua),results[2].fiveElementsClass+JSON.stringify(results[2].sihua));
 }
});
test('traditional start age is unfolded from the measured term interval and entry is tied to an actual preceding node',()=>{
 const r=baziPro({birth}),{duration,intervalSeconds}=r.entry;
 const converted=duration.years*360+duration.months*30+duration.days+duration.hours/24;
 assert(Math.abs(converted-intervalSeconds/720)<1/24+.003);
 assert.equal(r.entry.utc,r.cycles[0].startUtc);assert(Date.parse(r.entry.termUtc)<=Date.parse(r.entry.utc));
 assert.equal(Math.floor((Date.parse(r.entry.utc)-Date.parse(r.entry.termUtc))/86400000),r.entry.daysAfter);
});
test('cross-system resonance uses real contemporaneous relations and never invents a third matching system',()=>{
 const a=resonance({birth,at:'2026-11-07T00:00Z'}),b=resonance({birth,at:'2027-05-07T00:00Z'});
 assert.notDeepEqual(a.chains,b.chains);
 for(const c of a.chains){assert.equal(c.coverage,new Set(c.items.map(e=>e.system)).size);for(const e of c.items){assert(e.source);assert.equal(e.direction,c.direction);}}
 assert(a.consensus.every(c=>c.coverage===3&&c.systems.length===3));
});

test('apparent tropical positions and Placidus match independent Swiss/Moshier reference samples within a documented tolerance',()=>{
 const ref=JSON.parse(readFileSync('test/fixtures/apparent-reference.json','utf8'));
 const difference=(x,y)=>Math.abs(((x-y+540)%360)-180)*3600;
 for(const row of ref.rows){
  const date=new Date(row.utc),h=housesAt(date,row.placidus.city,'placidus');
  for(const p of row.planets){assert.equal(p.flags&4,4,'reference uses Moshier, not missing Swiss data fallback');assert(difference(bodyAt(date,p.id).longitude,p.longitude)<30,JSON.stringify({utc:row.utc,id:p.id}));}
  for(const [i,cusp] of h.cusps.entries())assert(difference(cusp,row.placidus.cusps[i])<.5);
  assert(difference(h.asc,row.placidus.asc)<.5);assert(difference(h.mc,row.placidus.mc)<.5);
 }
});
