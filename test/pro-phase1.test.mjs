import test from 'node:test';
import assert from 'node:assert/strict';
import {baziFromInput} from '../src/baziInput.mjs';
import {solarTerms} from '../src/bazi.mjs';
import {chart} from '../src/chart.mjs';
const a={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{lat:31.23,lon:121.47,tz:8}};
test('all twelve jie remain in requested calendar year',()=>{for(const t of solarTerms(2000))assert.equal(t.date.getUTCFullYear(),2000);});
test('bazi hidden ranks and normalized weighted elements',()=>{const b=baziFromInput(a);assert.equal(b.pillars.length,4);assert(Math.abs(Object.values(b.elementPercentages).reduce((a,b)=>a+b,0)-100)<0.03);for(const p of b.pillars)assert.equal(b.hiddenStems[p.name][0].rank,'本气');assert.equal(b.luck.cycles.length,8);assert(b.luck.startAge>=0&&b.luck.startAge<=11);});
test('chart exposes bazi and normalized western distributions',()=>{const c=chart(a);assert(c.bazi.pillars);assert.equal(c.analysis.elements.percentages.火+c.analysis.elements.percentages.土+c.analysis.elements.percentages.风+c.analysis.elements.percentages.水,100);assert(c.analysis.chartRuler.dignity);});
