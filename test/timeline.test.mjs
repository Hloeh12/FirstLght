import test from 'node:test';
import assert from 'node:assert/strict';
import { chart } from '../src/chart.mjs';
import { timeline } from '../src/timeline.mjs';
const a={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{label:'上海',lat:31.2304,lon:121.4737,tz:8}};
test('timeline has decades and dashas',()=>{const t=timeline(chart(a),{months:12});assert.equal(t.zDecades.length,12);assert.equal(t.vDashas.length,9);assert.ok(t.flowBands.length>=1);});
test('timeline window ordered',()=>{const t=timeline(chart(a),{months:6});assert.ok(t.window.toTs>t.window.fromTs);});
test('transit events labeled',()=>{const t=timeline(chart(a),{months:12});for(const e of t.wEvents){assert.ok(['木星','土星'].some(p=>e.label.startsWith(p)));assert.equal(e.system,'west');}});
test('resonance clusters span <=14d',()=>{const t=timeline(chart(a),{months:24});for(const r of t.resonances)assert.ok(r.endTs-r.startTs<=14*86400000+1);});
