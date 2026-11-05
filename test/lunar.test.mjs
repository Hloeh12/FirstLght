import test from 'node:test';
import assert from 'node:assert/strict';
import { chart } from '../src/chart.mjs';
import { lunarToSolar, solarToLunar, leapMonth } from '../src/lunar.mjs';
import { validate } from '../src/validate.mjs';
test('lunar to solar known date',()=>{assert.equal(lunarToSolar(2000,7,17,false),'2000-08-16');});
test('leap month 2020 is 4',()=>{assert.equal(leapMonth(2020),4);});
test('leap month conversion',()=>{assert.equal(lunarToSolar(2020,4,1,true),'2020-05-23');});
test('roundtrip solar->lunar->solar',()=>{const s='2000-08-16';const l=solarToLunar(2000,8,16);assert.equal(lunarToSolar(l.y,l.m,l.d,l.leap),s);});
test('invalid lunar date returns null',()=>{assert.equal(lunarToSolar(2000,13,1,false),null);});
test('chart with lunar equals solar',()=>{
 const a=chart({Y:2000,M:7,D:17,h:12,mi:0,gender:'女',calendar:'lunar',city:{lat:31.23,lon:121.47,tz:8}});
 const b=chart({Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{lat:31.23,lon:121.47,tz:8}});
 assert.equal(a.meta.utc,b.meta.utc);assert.equal(a.western.asc.sign,b.western.asc.sign);assert.equal(a.meta.input.lunar.solar.D,16);
});
test('validate suite passes',()=>{const r=validate();assert.equal(r.total,11);assert.ok(r.passed===r.total,JSON.stringify(r.checks.filter(c=>!c.pass)));});
