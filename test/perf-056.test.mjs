// v0.56.0：体系切换时共振卡片刷新延后一帧，让盘面先出。
// 计时收益由 build/probe-perceived.mjs 实测（点击→盘面出现 109–122ms → 53–64ms）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('onSelectTimeNode 把共振刷新延后到 rAF，盘面不被次要内容阻塞',()=>{
 const app=read('assets/console/app.js');
 assert.match(app,/requestAnimationFrame\(\(\)=>forceRefreshAllInsights\(\)\)/,
  '共振刷新必须包在 requestAnimationFrame 里，而不是同步调用');
 // 确保不是把整段 onSelectTimeNode 延后（那样 activeTimeSystem 赋值会晚，时点口径错）
 assert.match(app,/function onSelectTimeNode\(system\)\{\s*state\.activeTimeSystem=system;/,
  'activeTimeSystem 仍须同步置位，只有共振刷新延后');
});

test('forceRefreshAllInsights 内部 revision 防串台机制仍在',()=>{
 const app=read('assets/console/app.js');
 assert.match(app,/const revision=\+\+insightGeneration;/,'每次刷新有唯一 revision');
 assert.match(app,/if\(revision!==insightGeneration\)return;/,'过期结果被丢弃，快速连切不串台');
 assert.match(app,/state\.resonance=null;\s*paintResonance\(\);/,'同步置 loading 态后再发请求');
});
