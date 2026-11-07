import test from 'node:test';
import assert from 'node:assert/strict';
import {baziPro} from '../src/bazi-pro.mjs';

const birth={Y:1998,M:11,D:21,h:0,mi:2,gender:'女',dateStr:'1998-11-21',timeStr:'00:02',city:{lat:31.23,lon:121.47,tz:8,label:'上海'}};

test('flow day is a real local calendar day inside the selected solar-term month',()=>{
 const month=baziPro({birth,selection:{year:2026,month:9}});
 assert(month.days.length>=28&&month.days.length<=32);
 for(let i=1;i<month.days.length;i++)assert.equal(Date.parse(month.days[i].date)-Date.parse(month.days[i-1].date),86400000);
 const first=baziPro({birth,selection:{year:2026,month:9,day:0}});
 const next=baziPro({birth,selection:{year:2026,month:9,day:1}});
 assert.equal(first.selected.at(-1).name,'流日');
 assert.notEqual(first.selected.at(-1).stem+first.selected.at(-1).branch,next.selected.at(-1).stem+next.selected.at(-1).branch);
 assert(first.guidance.title.includes('流日'));
 assert.notEqual(first.guidance.title,next.guidance.title);
 assert.throws(()=>baziPro({birth,selection:{year:2026,month:9,day:99}}),/无效流日/);
});
