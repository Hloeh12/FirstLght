// v0.57.0：实机反馈的 UI 修正——深浅双盘、底部时间联动、印占分盘两行、紫微收敛。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('西洋深浅双盘：wheel 支持 theme 参数，深色节点默认隐藏',()=>{
 const src=read('assets/console/western.js');
 assert.match(src,/export function wheel\(r,theme='light'\)/,'wheel 接受 theme 参数');
 assert.match(src,/const dark=theme==='dark'/,'深色分支');
 assert.match(src,/class="wheel\$\{dark\?' wheel-dark':''\}"/,'深色时给 svg 标记 wheel-dark');
 assert.match(src,/data-wheel-theme="light"/,'浅色切换按钮');
 assert.match(src,/data-wheel-theme="dark"/,'深色切换按钮');
 assert.match(src,/save\(key,\{\.\.\.cfg\(\),theme:b\.dataset\.wheelTheme\}\)/,'主题写入配置持久化');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.wheel \.wheel-star-short,\.wheel \.wheel-axis-short\{display:none\}/,'单字默认隐藏，浅色盘不受影响');
 assert.match(css,/\.wheel-dark \.wheel-star-short,\.wheel-dark \.wheel-axis-short\{display:block/,'仅深色盘显示单字');
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
