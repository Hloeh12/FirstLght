import test from 'node:test';
import assert from 'node:assert/strict';
import { chart } from '../src/chart.mjs';
import { baziPro } from '../src/bazi-pro.mjs';

const city={label:'上海',lat:31.2304,lon:121.4737,tz:8,tzName:'Asia/Shanghai'};
const late={Y:2000,M:8,D:16,h:23,mi:30,gender:'女',city,dateStr:'2000-08-16'};
const gz=p=>p.stem+p.branch;

test('A2: 晚子时主接口八字遵循 lateZishi，三入口口径一致',()=>{
  const next=chart({...late,lateZishi:'next-day'});
  const curr=chart({...late,lateZishi:'current-day'});
  assert.equal(next.bazi.meta.dayBoundary,'23:00','next-day 应为 23:00 换日');
  assert.equal(curr.bazi.meta.dayBoundary,'00:00','current-day 应为 00:00 换日');
  assert.notEqual(gz(next.bazi.pillars[2]),gz(curr.bazi.pillars[2]),'两种口径日柱应不同');
  const proNext=baziPro({birth:{...late,lateZishi:'next-day'}});
  assert.equal(gz(next.bazi.pillars[2]),gz(proNext.pillars[2]),'主接口八字应与专业接口一致');
});

test('A4: 时间轴紫微盘与返回盘共用同一 effectiveDate/timeIndex',()=>{
  const c=chart(late);
  assert.ok(c.meta.ziweiEffective,'meta 应含 ziweiEffective');
  assert.equal(c.meta.ziweiEffective.date,c.ziwei.effectiveDate,'有效日期应与紫微盘一致');
  assert.equal(c.meta.ziweiEffective.timeIndex,c.ziwei.effectiveTimeIndex,'有效时辰应与紫微盘一致');
});
