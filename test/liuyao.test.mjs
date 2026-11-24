import test from 'node:test';
import assert from 'node:assert/strict';
import {qiGuaByTime,castByTrigrams,palaceGua,GUA_ORDER} from '../src/liuyao.mjs';
import {dayPillar} from '../src/bazi.mjs';

test('liuyao: 八宫六十四卦齐全且宫归属正确',()=>{
 const org=palaceGua();
 assert.equal(org.length,8);
 const all=org.flatMap(p=>p.guas);
 assert.equal(new Set(all.map(g=>g.name)).size,64);
 // 权威抽查：夬=坤宫五世、履=艮宫五世、晋=乾宫游魂、大有=乾宫归魂
 const find=n=>all.find(g=>g.name===n);
 assert.equal(find('泽天夬').palace,'坤');
 assert.equal(find('泽天夬').moves,5);
 assert.equal(find('天泽履').palace,'艮');
 assert.equal(find('火地晋').palace,'乾');
 assert.equal(find('火地晋').moves,6);
 assert.equal(find('火天大有').palace,'乾');
 assert.equal(find('火天大有').moves,7);
});

test('liuyao: 时间起卦确定性 + 日干支与八字引擎一致',()=>{
 const a=qiGuaByTime({date:'2026-11-24T10:00:00'});
 const b=qiGuaByTime({date:'2026-11-24T10:00:00'});
 assert.deepEqual(a,b);
 const p=dayPillar({y:2026,m:11,d:24,h:12});
 assert.equal(a.question_date,p.stem+p.branch);
 assert.ok(a.ben.name&&a.bian.name&&a.move>=1&&a.move<=6);
 assert.equal(a.ying,(a.shi+3)%6);
});

test('liuyao: 纳甲六亲六兽齐全',()=>{
 const r=qiGuaByTime({date:'2026-11-24T10:00:00'});
 assert.equal(r.ben.yao.length,6);
 for(const y of r.ben.yao){
  assert.match(y.gz,/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/);
  assert.ok(['兄弟','父母','官鬼','妻财','子孙'].includes(y.relative));
  assert.ok(['青龙','朱雀','勾陈','螣蛇','白虎','玄武'].includes(y.animal));
 }
 // 六兽按日干起：壬日→玄武起初爻
 assert.equal(r.ben.yao[0].animal,'玄武');
});

test('liuyao: 动爻取反生成变卦',()=>{
 // 上乾下乾，动初爻 → 下卦变巽 = 天风姤（乾宫一世）
 const r=castByTrigrams({upper:'乾',lower:'乾',move:1,date:'2026-11-24T10:00:00'});
 assert.equal(r.ben.name,'乾为天');
 assert.equal(r.bian.name,'天风姤');
 assert.equal(r.bian.palace,'乾');
});
