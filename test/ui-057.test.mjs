// v0.57.0：实机反馈的 UI 修正——深浅双盘、底部时间联动、印占分盘两行、紫微收敛。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('西洋盘：wheel 支持皮肤参数，旧深浅切换已取消',()=>{
 const src=read('assets/console/western.js');
 assert.match(src,/export function wheel\(r,skin='cece',style='text'\)/,'wheel 接受 skin/style 参数');
 assert.match(src,/SKINS=/, '6 种皮肤定义存在');
 assert.match(src,/wheel-skin-\$\{skin\}/,'svg 标记皮肤类');
 assert.match(src,/wheel-skin-\$\{skin\}/,'皮肤类注入盘面');
 assert.doesNotMatch(src,/data-wheel-theme="light"/,'浅色切换按钮已移除');
 assert.doesNotMatch(src,/data-wheel-theme="dark"/,'深色切换按钮已移除');
 assert.doesNotMatch(src,/const dark=theme==='dark'/,'深色分支已移除');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.wheel-skin-degree\{/,'6 皮肤变量类齐全（度数）');
 assert.match(css,/\.wheel-skin-classic\{/,'6 皮肤变量类齐全（经典）');
 assert.match(css,/\.wheel-skin-cece\{/,'6 皮肤变量类齐全（测测）');
 assert.match(css,/\.wheel-skin-fresh\{/,'6 皮肤变量类齐全（清爽）');
 assert.match(css,/\.wheel-skin-cute\{/,'6 皮肤变量类齐全（可爱）');
 assert.match(css,/\.wheel-skin-night\{/,'6 皮肤变量类齐全（夜空）');
 assert.doesNotMatch(css,/\.wheel-dark\{/,'深色盘样式块已移除');
});

test('底部时间联动：常驻条 + 按天翻页自动进入行运',()=>{
 const src=read('assets/console/western.js');
 assert.match(src,/class="card west-time-strip" aria-label="推运时间联动"/,'常驻时间条');
 assert.match(src,/data-wts-display/,'当前时刻显示');
 assert.match(src,/data-time-step="-1"[\s\S]*data-time-step="1"/,'前后翻页按钮');
 assert.match(src,/const mode=s\.mode==='natal'\?'transit':s\.mode;\s*\n\s*update\(ctx,mode,shift\(s\.at,'day',\+b\.dataset\.timeStep\)\)/,'本命态翻页自动切行运，按天步进');
 assert.match(src,/data-astro-date/,'仍保留自选日期入口');
});

test('印度占星分盘改两行网格，不再横滚截断',()=>{
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.vedic-varga-rail\{[\s\S]*flex-wrap:wrap!important;overflow:visible!important/,
  '分盘轨改为换行、不横滚');
});

test('紫微盘面收敛，给下方时点控件留空间',()=>{
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.zi-board\{height:clamp\(400px,49svh,500px\)!important/,
  '盘面高度收敛且不用字级压缩（避免辅星叠字）');
});

test('顶部重排：功能按钮缩为 chip，时间说明收紧',()=>{
 const css=read('assets/console/liquid.css');
 assert.match(css,/font-size:11px!important;padding:3px 9px!important;min-height:26px!important/,
  '生克合化缩为小 chip');
 assert.match(css,/\.time-basis-note\{margin:0 0 8px!important;font-size:11px!important/,
  '时间口径说明收紧');
});
