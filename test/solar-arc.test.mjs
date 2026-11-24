import test from 'node:test';
import assert from 'node:assert/strict';
import {westernPro} from '../src/western-pro.mjs';

const birth={Y:1990,M:6,D:15,h:10,mi:0,gender:'男',city:{lat:39.9,lon:116.4,tz:8}};

test('solar-arc: 弧长为次限太阳行进(约36年≈34°)，星体统一推进',()=>{
 const r=westernPro({birth,mode:'arc',at:new Date('2026-06-15T00:00:00Z')});
 assert.ok(r.arc.years>35&&r.arc.years<37,r.arc.years);
 assert.ok(r.arc.degrees>30&&r.arc.degrees<40); // 太阳弧长=次限太阳行进≈34-36°，非严格等于年龄
 const natal=westernPro({birth}).chart;
 const sun=r.arc.planets.find(p=>p.key==='sun'),ns=natal.planets.find(p=>p.key==='sun');
 assert.ok(Math.abs(((sun.lon-ns.lon-r.arc.degrees)%360+540)%360-180)<1e-6);
});

test('solar-arc: hits 只有硬相位且容差≤1°',()=>{
 const r=westernPro({birth,mode:'arc',at:new Date('2026-06-15T00:00:00Z')});
 for(const h of r.arc.hits){assert.ok([0,45,90,135,180].includes(h.angle));assert.ok(h.orb<=1);}
});
