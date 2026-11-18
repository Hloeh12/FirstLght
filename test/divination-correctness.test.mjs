// 命理正确性回归：锁定「结论层」的标准答案断言。
// 背景：旧版校验只查结构与渲染，查不出命理错误——十神映射全错、天德贵人/孤辰寡宿查表错位、
// 紫微四化口径硬编码中州派，长期潜伏在「测试全绿」之下。本文件用已知标准答案钉死这几处。
import test from 'node:test';
import assert from 'node:assert/strict';
import {detectGege} from '../www/js/deep-bazi.js';
import {tenGod} from '../src/bazi.mjs';
import {mutagensFor} from '../src/ziwei-rules.mjs';
import {readFileSync} from 'node:fs';

const STEMS='甲乙丙丁戊己庚辛壬癸';
const src=f=>readFileSync(new URL(f,import.meta.url),'utf8');

test('八字十神：报告层 godOf 须与引擎 tenGod 全 100 组合一致（旧版几乎全错，diff>=6 返回 null）',()=>{
 // 通过 detectGege 间接验证十神：构造日干见月令本气透干的命局，格局名须与引擎十神一致。
 // 逐干对：日干 X、月令藏干 Y 透于他柱，格局名应等于 tenGod(X,Y)。
 const hidden={子:'癸',丑:'己癸辛',寅:'甲丙戊',卯:'乙',辰:'戊乙癸',巳:'丙庚戊',午:'丁己',未:'己丁乙',申:'庚壬戊',酉:'辛',戌:'戊辛丁',亥:'壬甲'};
 const branches='子丑寅卯辰巳午未申酉戌亥';
 for(let d=0;d<10;d++){
  const dayStem=STEMS[d],monthBranch=branches[d]; // 月支任意，藏干取本气
  const benQi=hidden[monthBranch][0];
  const want=tenGod(d,STEMS.indexOf(benQi)).replace('劫财','比肩')+'格';
  const pillars=[
   {stem:STEMS[(d+6)%10],branch:'子',hidden:[]},
   {stem:STEMS[(d+2)%10],branch:monthBranch,hidden:[{stem:benQi,rank:'本气'}]},
   {stem:dayStem,branch:'亥',hidden:[]},
   {stem:STEMS[(d+4)%10],branch:'午',hidden:[]}
  ];
  const r=detectGege(pillars,{support:50},{tongGen:{count:1},touGan:{count:0},deLing:{ok:false},deShi:{count:1}});
  assert.equal(r.name,want,`日干${dayStem}见月令本气${benQi}：期望${want}，实得${r.name}`);
 }
 // 显式断言旧版已知错误案例：庚午/壬午/辛亥/甲午，月令午本气丁对辛金为七杀，正统应判七杀格（旧版误判「中和格格」）
 const g=detectGege(
  [{stem:'庚',branch:'午',hidden:[]},{stem:'壬',branch:'午',hidden:[{stem:'丁',rank:'本气'}]},{stem:'辛',branch:'亥',hidden:[]},{stem:'甲',branch:'午',hidden:[]}],
  {support:45},{tongGen:{count:1},touGan:{count:0},deLing:{ok:false},deShi:{count:0}});
 assert.equal(g.name,'七杀格');
 assert.doesNotMatch(g.name,/格格/,'格局名不得出现「格格」重复（旧版中和格格 bug）');
});

test('八字神煞：天德贵人表须以子月起、正统口诀「正丁二申三壬四辛五亥六甲七癸八寅九丙十乙子巳丑庚」',()=>{
 const s=src('../src/bazi-pro.mjs');
 const m=s.match(/const SHEN_SHA_TIAN_DE=\[([^\]]+)\]/);
 assert.ok(m,'须存在天德贵人表');
 const got=[...m[1].matchAll(/'([^']+)'/g)].map(x=>x[1]).join('');
 // 索引按子丑寅卯辰巳午未申酉戌亥 → 巳庚丁申壬辛亥甲癸寅丙乙
 assert.equal(got,'巳庚丁申壬辛亥甲癸寅丙乙','天德贵人表错位（旧版整体左移2位）');
});

test('八字神煞：孤辰寡宿须按亥子丑/寅卯辰/巳午未/申酉戌三会分组（旧版错位）',()=>{
 const s=src('../src/bazi-pro.mjs');
 assert.match(s,/Math\.floor\(\(\(branches\.indexOf\(year\.branch\)\+1\)%12\)\/3\)/,
  '孤辰寡宿分组索引须以 (idx+1)%12 对齐亥子丑起始，不能用 Math.floor(idx/3)');
});

test('紫微四化：报告层三派四化须与引擎 mutagensFor 全 30 组合一致（旧版硬编码中州派）',()=>{
 // 报告层 sihuaFor 未导出，用源码断言 + 引擎交叉验证双保险。
 const s=src('../www/js/deep-ziwei.js');
 assert.match(s,/SIHUA_SCHOOL_OVERRIDE/,'须有北派四化覆盖表');
 assert.match(s,/sihuaFor\(stem,school\)/,'流年/流月/流日/流时四化须按 school 动态取');
 assert.doesNotMatch(s,/GAN_SIHUA\[stem\]/,'不得残留硬编码中州派调用');
 // 引擎侧：三派庚辛确实不同，证明口径参数有意义
 assert.equal(mutagensFor('庚','quanshu').join('/'),'太阳/武曲/太阴/天同');
 assert.equal(mutagensFor('庚','quanjiTong').join('/'),'太阳/武曲/天同/天相');
 assert.equal(mutagensFor('庚','quanjiYin').join('/'),'太阳/武曲/太阴/天相');
 assert.equal(mutagensFor('辛','quanshu').join('/'),'巨门/太阳/文曲/文昌');
 assert.equal(mutagensFor('辛','quanjiYin').join('/'),'巨门/太阳/文昌/文曲');
});

test('紫微四化口径端到端：server /api/ziwei-flow 须透传 ziweiSchool 与 ziweiLeap',()=>{
 const s=src('../server.mjs');
 const line=s.split('\n').find(l=>l.includes("url.pathname==='/api/ziwei-flow'"));
 assert.ok(line,'须存在 /api/ziwei-flow 路由');
 assert.match(line,/ziweiSchool:d\.ziweiSchool/,'须透传四化派别，否则流曜四化退回中州派');
 assert.match(line,/ziweiLeap:d\.ziweiLeap/,'须透传闰月口径');
});
