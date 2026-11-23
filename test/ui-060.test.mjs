// v0.60.0 UI 契约：择日页要能把「年运轴」拉出来并按月跳转，也要能把候选日并排比。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('择日请求一次带回十二事项，供并排对比直接复用',()=>{
 const src=read('assets/console/extras.js');
 const calls=[...src.matchAll(/\/api\/console\/calendar',\{birth:ctx\.birth,date:s\.date,days:s\.days[^}]*\}/g)].map(m=>m[0]);
 assert(calls.length>=2,'换事项与换条件都要重新取数');
 for(const c of calls)assert.match(c,/events:CAL_EVENTS/,'每次取数都带 events，否则对比矩阵缺列');
 assert.match(src,/\/api\/console\/year-agenda/,'年运轴走独立接口');
});

test('年运轴：十二流月可点、每月三件事可点、能跳回择日',()=>{
 const src=read('assets/console/extras.js');
 assert.match(src,/data-cal-agenda/,'入口按钮');
 assert.match(src,/async function agendaSheet\(ctx,s\)/,'年运轴面板');
 assert.match(src,/data-agenda-month="\$\{i\}"/,'每个流月可点');
 assert.match(src,/data-agenda-go="\$\{t\.date\}"/,'每月最宜三事可点');
 assert.match(src,/data-agenda-open="\$\{m\.start\}"/,'可看整月');
 assert.match(src,/本月最宜三事/,'面板标题与引擎口径一致');
 assert.match(src,/s\.date=date;s\.days=days;s\.result=null/,'跳转会重置日期窗并重算');
 // 只滚横轴自身，避免打开时选中格在屏外、又不牵动整页
 assert.match(src,/strip\.scrollLeft=Math\.abs|strip\.scrollLeft=Math\.max/,'选中月自动居中');
 assert.doesNotMatch(src,/cal-months[\s\S]{0,200}scrollIntoView/,'不得用 scrollIntoView 连带滚动祖先');
});

test('并排对比：先结论、再事项矩阵、最后证据差异',()=>{
 const src=read('assets/console/extras.js');
 assert.match(src,/function compareSheet\(ctx,s\)/,'对比面板');
 assert.match(src,/data-cal-compare-mode/,'对比模式开关');
 assert.match(src,/data-cal-pick="\$\{x\.date\}"/,'卡片可选中');
 assert.match(src,/最多并排三天/,'上限要有提示，不能静默丢弃');
 assert.match(src,/cmp-matrix/,'十二事项矩阵');
 assert.match(src,/cmp-diff/,'差异表');
 assert.match(src,/差异项/,'差异表头');
 assert.match(src,/const common=keys\.filter\(k=>maps\.every\(m=>m\.has\(k\)\)\)/,'共同项只列一次，差异项才逐条展开');
 assert.match(src,/至少选两天才能对比/,'下限要有提示');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.cmp-matrix td\.best\{background:#ffe9f2/,'每行最优要高亮，否则矩阵读不出结论');
 assert.match(css,/\.cal-day\[data-picked="1"\]/,'已选日期在列表里也要能看出来');
 assert.match(css,/\.cal-mth\[aria-pressed=true\]/,'当前流月要可辨');
});

test('年运轴与择日共用同一套分数语义，不另立口径',()=>{
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.cal-mth span\{[^}]*font-variant-numeric:tabular-nums/,'分数等宽对齐');
 const src=read('assets/console/extras.js');
 assert.match(src,/分数与择日同一公式，只算到日不到时辰/,'口径差异要写在面板上');
 // 方法学文案由引擎给出，前端只负责原样展示，避免两处各写一份口径。
 const engine=read('src/almanac.mjs');
 assert.match(engine,/不对同一件事重复占位/,'三件事的去重规则要说明');
 assert.match(src,/esc\(data\.method\)/,'方法学由引擎给出并原样渲染');
});
