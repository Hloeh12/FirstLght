import test from 'node:test';
import assert from 'node:assert/strict';
import {ziweiChart,ziweiFlow} from '../src/ziwei.mjs';
import {nearestPlace} from '../src/geo.mjs';
const input={dateStr:'2000-08-16',timeIndex:6,gender:'女'};
test('Renhuai core has 14 primary stars, four natal transformations and related palaces',()=>{const c=ziweiChart(input);assert.equal(c.palaces.length,12);assert.equal(c.palaces.flatMap(p=>p.majorStars).length,14);assert.equal(c.sihua.length,4);assert(Array.isArray(c.patterns));for(const p of c.palaces){assert.equal(new Set(p.relatedBranches).size,4);for(const star of p.majorStars)assert(['庙','旺','得','利','平','不','陷'].includes(star.brightness));}});
test('late Zi advances day while early Zi stays on date',()=>{const late=ziweiChart({...input,h:23,mi:30});const next=ziweiChart({...input,dateStr:'2000-08-17',h:0,mi:30});assert.deepEqual(late.palaces,next.palaces);assert.notDeepEqual(ziweiChart({...input,h:23,lateZishi:'current-day'}).palaces,late.palaces);});
test('true solar correction changes date and branch at boundary',()=>{const c=ziweiChart({...input,h:0,mi:10,useSolarTime:true,city:{lon:75,tz:8}});assert(c.correction.dayOffset<0);assert(c.correction.corrected);});
test('invalid date and hour are rejected',()=>{assert.throws(()=>ziweiChart({...input,dateStr:'2000-02-30'}));assert.throws(()=>ziweiChart({...input,timeIndex:99}));});
test('coordinate reverse lookup is marked approximate',()=>{assert.equal(nearestPlace(31.23,121.47).approximate,true);assert.throws(()=>nearestPlace(NaN,0));});
test('earth and human recalculate Ziwei from natal body and fortune palaces',()=>{
 const birth={...input,timeIndex:2};
 const heaven=ziweiChart(birth);
 for(const [astroType,anchor] of [['earth',p=>p.isBodyPalace],['human',p=>p.name==='福德']]){
  const z=ziweiChart({...birth,astroType});
  assert.equal(z.astroType,astroType);
  assert.equal(z.palaces.find(p=>p.name==='命宫').branch,heaven.palaces.find(anchor).branch);
  assert.equal(z.palaces.flatMap(p=>p.majorStars).length,14);
  assert.notDeepEqual(z.palaces,heaven.palaces);
  const f=ziweiFlow({...birth,astroType,flowYear:2026});
  assert.equal(f.astroType,astroType);
  assert.equal(f.yearly.earthlyBranch,'午');
  assert.equal(f.yearly.mutagen.length,4);
 }
 assert.throws(()=>ziweiChart({...birth,astroType:'other'}),/盘式/);
});
