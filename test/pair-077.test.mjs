/* v0.77.0 双人模块回归：八字深度取证、西占重点星、紫微四化互飞、关系周期、报告成文。
 * 断言对象是「可复核的结构与文案」，不是截图或观感。 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {baziPro} from '../src/bazi-pro.mjs';
import {baziMatch,ziweiMatch,westernKeyStars,branchRelation} from '../src/match-making.mjs';
import {pairCycle} from '../src/pair-cycle.mjs';
import {localRequest} from '../src/console-engine.mjs';

const city={lat:31.2304,lon:121.4737,tz:8,label:'上海'};
const A={Y:1990,M:5,D:20,h:10,mi:30,gender:'女',city,name:'甲'};
const B={Y:1988,M:3,D:8,h:20,mi:10,gender:'男',city,name:'乙'};
const toSolar=x=>({...x,dateStr:`${x.Y}-${String(x.M).padStart(2,'0')}-${String(x.D).padStart(2,'0')}`});

test('六合化气按传统表输出，不混用日支与年支口径',()=>{
 const HUA={子丑:'土',寅亥:'木',卯戌:'火',辰酉:'金',巳申:'水',午未:'土'};
 for(const [k,v] of Object.entries(HUA)){
  const r=branchRelation(k[0],k[1]);
  assert.equal(r.kind,'六合',`${k} 应为六合`);
  assert.equal(r.hua,v,`${k} 应合化${v}`);
 }
});

test('三合局与生地/墓地半合可区分',()=>{
 assert.equal(branchRelation('申','辰').kind,'三合局');
 assert.equal(branchRelation('申','子').sub,'生地半合');
 assert.equal(branchRelation('子','辰').sub,'墓地半合');
 assert.equal(branchRelation('子','午').kind,'六冲');
 assert.equal(branchRelation('子','卯').kind,'相刑');
 assert.equal(branchRelation('子','未').kind,'相害');
 assert.equal(branchRelation('子','酉').kind,'相破');
});

test('八字合婚含年命纳音与生肖详断，且不给空文案',()=>{
 const bm=baziMatch(baziPro({birth:A}),baziPro({birth:B}));
 assert.ok(bm.items.length>=9,'证据项不足');
 const keys=bm.items.map(x=>x.key);
 for(const k of ['dayBranch','dayStem','zodiac','yearNayin','nayin','tenGod','useful','strengthBalance','yinyang'])assert.ok(keys.includes(k),'缺少 '+k);
 for(const x of bm.items)assert.ok(x.text&&x.text.length>30,`${x.key} 文案过短`);
 assert.ok(bm.items.find(x=>x.key==='dayBranch').detail.kind);
 assert.ok(bm.items.find(x=>x.key==='zodiac').detail.kind);
 assert.match(bm.method,/年命纳音/);
});

test('西占重点星只收金火月，按融合/和谐/张力三组归类并按容许度排序',()=>{
 const inter=[
  {a:'金星',b:'火星',type:'三分相',angle:120,orb:1.2},
  {a:'月亮',b:'月亮',type:'四分相',angle:90,orb:3.4},
  {a:'金星',b:'土星',type:'合相',angle:0,orb:0.6},
  {a:'太阳',b:'木星',type:'合相',angle:0,orb:0.5}
 ];
 const k=westernKeyStars(inter);
 assert.equal(k.items.length,3,'太阳木星应被过滤');
 assert.ok(!k.items.some(x=>x.a==='太阳'||x.b==='木星'));
 assert.equal(k.groups.harmony.length,1);
 assert.equal(k.groups.tension.length,1);
 assert.equal(k.groups.fusion.length,1);
 const bothFirst=k.items[0];
 assert.ok(bothFirst.both,'核心组合应排在最前');
 assert.ok(k.core[0].orb<=k.core[k.core.length-1].orb,'核心组合内部按容许度由紧到宽');
 for(const it of k.items)assert.ok(Math.abs(it.weight-(1-it.orb/8))<0.02,'权重应为 1-容许度/8（容许四舍五入）');
 assert.ok(k.core.length>=1);
});

test('紫微四化互飞：宫干四化落宫有效，并换算到对方盘',()=>{
 const zm=ziweiMatch(toSolar(A),toSolar(B));
 assert.ok(zm.ok);
 const f=zm.sihuaFly;
 assert.ok(f?.ok);
 for(const side of ['a','b'])for(const scope of ['life','spouse']){
  const g=f[side][scope];
  assert.equal(g.items.length,4,`${side}.${scope} 应有四化四条`);
  for(const it of g.items){
   assert.ok(['禄','权','科','忌'].includes(it.type));
   assert.ok(it.star&&it.to&&it.to!=='?',`落宫无效：${JSON.stringify(it)}`);
  }
 }
 assert.ok(f.hits.length>=1,'本例应至少一条飞入命宫/夫妻/官禄或自化');
 assert.ok(f.text.length>10);
});

test('关系周期：12 个月曲线有真实波动，婚期应期来自前 8 年合象窗口',()=>{
 const cyc=pairCycle({ba:baziPro({birth:A}),bb:baziPro({birth:B}),months:12,years:12,from:{Y:2026,M:11,D:1}});
 assert.equal(cyc.months.length,12);
 assert.ok(cyc.months.every(m=>/^[甲乙丙丁戊己庚辛壬癸]$/.test(m.gz[0])&&m.gz.length===2));
 assert.ok(new Set(cyc.months.map(m=>m.score)).size>1,'曲线不应恒定');
 assert.ok(cyc.months.every(m=>m.pct>=0&&m.pct<=100));
 assert.equal(cyc.years.length,12);
 for(const y of cyc.peakYears){assert.ok(y.score>=2);assert.ok(y.year<=2026+7,'应期不应取 8 年之外的年份');}
 assert.ok(cyc.peakYears.every((y,i,a)=>i===0||y.year>a[i-1].year),'应期按年份递增');
 assert.match(cyc.method,/权重/);
});

test('合盘接口在三种盘类与无时辰输入下都返回新字段',()=>{
 for(const mode of ['synastry','composite','davison']){
  const r=localRequest('/api/synastry/chart',{a:A,b:B,mode});
  assert.equal(r.ok,true);
  assert.equal(r.fit.kootaBoth.forward.items.length,8,'旧字段不应被打断');
  assert.ok(r.baziMatch.items.length>=9);
  assert.ok(r.ziweiMatch.sihuaFly.ok);
  assert.ok(Array.isArray(r.keyStars.items));
  assert.equal(r.cycle.months.length,12);
  assert.equal(r.summary.length,4);
  assert.equal(r.report.kind,'pair-report');
  for(const sec of ['p-summary','p-overview','p-bazi','p-ziwei','p-cycle','p-notes'])assert.ok(r.report.sections[sec]?.length,`报告缺少 ${sec}`);
 }
 const r2=localRequest('/api/synastry/chart',{a:A,b:{...B,timeUnknown:true},mode:'synastry'});
 assert.equal(r2.ok,true);
 assert.equal(r2.cycle.months.length,12);
});

test('报告成文不重复同一句，且紫微节包含四化互飞',()=>{
 const r=localRequest('/api/synastry/chart',{a:A,b:B,mode:'synastry'});
 const all=Object.values(r.report.sections).flat();
 assert.equal(new Set(all).size,all.length,'报告中出现重复句');
 assert.ok(r.report.sections['p-ziwei'].join('').includes('四化互飞'));
 assert.ok(r.report.sections['p-bazi'].join('').includes('年命纳音'));
 assert.ok(r.summary.every(s=>s.text&&!s.text.includes('。。')),'摘要不应出现重复句号');
});
