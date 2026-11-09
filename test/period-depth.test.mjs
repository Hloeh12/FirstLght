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

test('natal favorable and unfavorable branch clashes lead to distinct advice',async()=>{
 const {generateTimeStepInsight}=await import('../src/bazi-guidance.mjs');
 const strength={useful:['火'],caution:['水'],support:70,kind:'身强',activated:[]};
 const current={name:'流年',stem:'丙',branch:'午',stemElement:'火',tenGod:'偏印'};
 const pillars=[{name:'年柱',branch:'子',branchElement:'水'},{name:'月柱',branch:'午',branchElement:'火'}];
 const clash=i=>({ids:[i,2],type:'六冲',pattern:'子午',meaning:'观察变动。'});
 const input={pillars,selected:[current],strength,natalStrength:strength};
 const opening=generateTimeStepInsight({...input,relationships:[clash(0)]});
 const defense=generateTimeStepInsight({...input,relationships:[clash(1)]});
 assert.match(opening.influences[0].text,/冲忌有松动旧局的机会/);
 assert.match(defense.influences[0].text,/用神受冲/);
 assert.notEqual(opening.advice[1].text,defense.advice[1].text);
});

test('annual Lu Cun and Hua Lu recognize meeting, opposition and natal Lu Cun',async()=>{
 const {practicalZiwei}=await import('../src/ziwei-practical.mjs');
 const chart={palaces:Array.from({length:12},(_,branch)=>({branch,name:'宫'+branch,stars:branch===4?[{name:'禄存'}]:[]}))};
 const annual=(branch,yearlyLuCunBranch)=>({scope:'yearly',yearlyLuCunBranch,mutagens:[{type:'禄',branch}]});
 for(const flow of [annual(2,2),annual(8,2),annual(4,3)])assert(practicalZiwei(chart,flow).some(item=>item.name==='双禄交驰'));
 assert(!practicalZiwei(chart,annual(3,2)).some(item=>item.name==='双禄交驰'));
});
