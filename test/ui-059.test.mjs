// v0.59.0 UI 契约：择日卡片必须能一跳到时点盘、能把结果存成日程；岁运背景行要能读出喜忌。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('择日卡片带岁运背景行与喜忌标记',()=>{
 const src=read('assets/console/extras.js');
 assert.match(src,/function suiyunLine\(x\)/,'岁运背景行');
 assert.match(src,/流年 \$\{esc\(sy\.year\.gz\)\}/,'显示流年干支');
 assert.match(src,/大运 \$\{esc\(sy\.luck\.gz\)\}/,'显示当值大运');
 assert.match(src,/data-role="\$\{esc\(favor\.role\)\}"/,'喜忌以色块区分，不用颜色硬编码');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.cal-sui i\[data-role=use\]\{background:#ffe4ee/,'喜用高亮');
 assert.match(css,/\.cal-sui i\[data-role=avoid\]\{background:#e9edf2/,'忌神低对比');
});

test('时辰格可点，弹出时辰详情并给出两条出口',()=>{
 const src=read('assets/console/extras.js');
 assert.match(src,/data-cal-hour="\$\{date\}\|\$\{h\.branch\}"/,'每个时辰格携带日期与时辰');
 assert.match(src,/function hourSheet\(ctx,s,day,hour\)/,'时辰详情面板');
 assert.match(src,/data-hour-open>出这一刻的时点详批/,'出口一：时点详批');
 assert.match(src,/data-hour-plan>加入日程提醒/,'出口二：存入日程');
 assert.match(src,/ctx\.openMomentReport\(\{date:day\.date,hourBranch:hour\.branch/,'跳转时带上具体时辰');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.cal-hour\{font:inherit;color:inherit;width:100%;cursor:pointer/, 'button 化后不继承按钮默认样式');
});

test('择日结果写入案例日程：提醒 + 札记 + 原生通知',()=>{
 const app=read('assets/console/app.js');
 assert.match(app,/function addAlmanacPlan\(\{date,hourBranch='巳'/,'日程写入函数');
 assert.match(app,/kind:'almanac'/,'记录标记为择日日程，便于回看与备份');
 assert.match(app,/【择日日程】/,'札记留痕');
 assert.match(app,/messageHandlers\?\.caseReminder/,'有原生壳时排本地通知');
 assert.match(app,/addPlan:addAlmanacPlan/,'暴露给择日页');
 assert.match(app,/openMomentReport,addPlan/,'ctx 暴露时点盘入口');
 assert.match(read('assets/console/case-space.js'),/if\(r\.kind==='almanac'\)/,'备份恢复保留择日元数据');
 assert.match(read('assets/console/app.js'),/plan-badge/,'案例空间里能分辨择日日程');
});

test('时点详批在带到时辰一层时以流时为准',()=>{
 const src=read('assets/console/period-focus.mjs');
 assert.match(src,/find\(p=>\['流时','流日','流月','流年','大运'\]\.includes\(S\(p\.name\)\)\)/,'流时优先作为当前时点');
 const app=read('assets/console/app.js');
 assert.match(app,/buildPeriodReport\(ctx,'bazi','hour',selection,spot,'focus'\)/,'择日页复用时点专项同一内核');
 assert.match(app,/selection\.hour=hour/,'把时辰换算成流时索引');
});
