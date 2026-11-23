// v0.61.0 UI 契约：日程月历、方案存档、跨体系择时三块都要有可点的入口与可回看的证据。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('日程月历：入口、七列网格、跨节气月分段、过去日不可存日程',()=>{
 const src=read('assets/console/extras.js');
 assert.match(src,/data-cal-month/,'择日页要有月历入口');
 assert.match(src,/async function monthSheet\(ctx,s,ym\)/,'月历面板');
 assert.match(src,/data-calm-day="\$\{x\.date\}"/,'每天可点');
 assert.match(src,/data-calm-nav="\$\{monthShift\(month,-1\)\}"/,'可翻月');
 assert.match(src,/months\.length>1/,'公历月跨节气月时要按实际换月点分段');
 assert.match(src,/date<isoLocal\(\)/,'过去的日子只能回看，不能假装还能存日程');
 assert.match(src,/plansOf\(date\)/,'已存日程要按日期落到格子上');
 assert.match(src,/ctx\.almanacPlans/,'已存日程从案例提醒读回，不另建一份存储');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.calm-grid\{display:grid;grid-template-columns:repeat\(7,1fr\)/,'七列月历');
 assert.match(css,/\.calm-day\[data-tier=上吉\]/,'月历按分档上色');
});

test('方案存档：对比里能定 A/B/C，存档带证据快照且不重算',()=>{
 const src=read('assets/console/extras.js');
 assert.match(src,/data-cmp-decide="\$\{x\.date\}"/,'对比面板要有定方案按钮');
 assert.match(src,/'定为方案 '\+letter/,'字母按名次给，A 即第一');
 assert.match(src,/saveDecision\(\{caseId:pid/,'定案写入方案存档');
 assert.match(src,/evidence:\{plus:day\.plus,minus:day\.minus\}/,'证据随定案一起落盘');
 assert.match(src,/function bookSheet\(ctx,s\)/,'方案存档面板');
 assert.match(src,/data-book-open/,'可从存档回到时点盘');
 assert.match(src,/data-book-del/,'可删除方案');
 const book=read('assets/console/plan-book.js');
 assert.match(book,/const KEY='xy_plan_book'/,'方案存档独立存储，不混进案例提醒');
 assert.match(book,/atUtc:new Date\(\)\.toISOString\(\)/,'保留可排序的 UTC 时间');
 assert.match(book,/Math\.abs\(b\.v-a\.v\)|evidence/,'证据以快照保存');
 assert.doesNotMatch(book,/request\(|localRequest\(/,'回看不得重算：重算会把当时的依据改成今天的口径');
 assert.match(book,/slice\(0,MAX\)/,'要有上限，避免无限增长');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.book-card\{/,'方案卡片样式');
});

test('跨体系择时：时辰面板自动核对紫微与印占，并给同向结论',()=>{
 const src=read('assets/console/extras.js');
 assert.match(src,/'\/api\/console\/timing-cross'/,'走独立接口，不塞进择日分数');
 assert.match(src,/function crossBlock\(r,hour\)/,'跨体系面板');
 assert.match(src,/紫微 · 流时/);
 assert.match(src,/印度 · Muhurta/);
 assert.match(src,/同向核对/,'三支要有一句同向／分歧的结论');
 assert.match(src,/不相加|不给「综合分」/,'不能造一个谁都不认的综合分');
 const engine=read('src/timing-cross.mjs');
 assert.match(engine,/export function timingCross/);
 assert.match(engine,/不相加/);
 assert.match(engine,/Tara/,'印占要给 Tara Bala');
 assert.match(engine,/Chandra/,'印占要给 Chandra Bala');
 assert.match(engine,/流时命宫/,'紫微要给流时命宫落宫');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.xsys\{display:grid;grid-template-columns:1fr/,'中文摘要单列排，两列会挤成十来字一行');
});

test('月历与方案存档共用择日的分档语义，不另立口径',()=>{
 const almanac=read('src/almanac.mjs');
 assert.match(almanac,/monthGz:base\.lunar\.getMonthInGanZhi\(\)/,'流月干支由引擎给出');
 assert.match(almanac,/monthFavor:favorOf\(/,'流月喜忌只作背景标注');
 const src=read('assets/console/extras.js');
 assert.match(src,/月历里的分数与列表里的分数完全一致，不另算一套/,'口径一致性要写在面板上');
 assert.match(src,/流月干支旁的喜／忌只作背景，不参与当天分数/,'背景不是加减项');
});
