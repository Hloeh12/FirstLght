import test from 'node:test';
import assert from 'node:assert/strict';
import { chart } from '../src/chart.mjs';
import { timeline } from '../src/timeline.mjs';
const a={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{label:'上海',lat:31.2304,lon:121.4737,tz:8}};
test('timeline has decades and dashas',()=>{const t=timeline(chart(a),{months:12});assert.equal(t.zDecades.length,12);assert.equal(t.vDashas.length,9);assert.ok(t.flowBands.length>=1);});
test('timeline window ordered',()=>{const t=timeline(chart(a),{months:6});assert.ok(t.window.toTs>t.window.fromTs);});
test('transit events labeled',()=>{const t=timeline(chart(a),{months:12});for(const e of t.wEvents){assert.ok(['木星','土星'].some(p=>e.label.startsWith(p)));assert.equal(e.system,'west');}});
test('conjunction (合) transits are emitted',()=>{
 // 回归：sepOf 值域恒为 [0,180]，旧的 angle=0 穿越判断 d0<0 永不成立，
 // 导致"合"事件完全漏算。此测试确保合相被正确检测。
 const t=timeline(chart(a),{months:36});
 const conjunctions=t.wEvents.filter(e=>e.label.includes('合'));
 assert.ok(conjunctions.length>0,'木/土对本命点的合相事件应至少出现一次');
 for(const e of conjunctions){
  assert.ok(['木星合太阳','木星合月亮','木星合上升','木星合中天','土星合太阳','土星合月亮','土星合上升','土星合中天'].includes(e.label),'unexpected conjunction label: '+e.label);
  assert.ok(Number.isFinite(e.ts)&&e.ts>0,'合相事件时间戳有效');
 }
});
test('resonance clusters span <=14d',()=>{const t=timeline(chart(a),{months:24});for(const r of t.resonances)assert.ok(r.endTs-r.startTs<=14*86400000+1);});
