// v0.62.0 导出契约：筛选视图导出的文档要保留原始章号、带题注，并把交互控件静态化。
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';

const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://firstlight.local/'});
globalThis.document=dom.window.document;
globalThis.window=dom.window;

const {buildReportDocument}=await import('../assets/console/report-export.js');

const report={
 title:'八字命理 · 终身详批',
 cover:{name:'甲',system:'四柱八字'},
 lead:'导语',
 characters:120,
 scopeNote:'筛选视图：只看「人生专题」· 保留 2/14 章（章号沿用原编号）',
 brief:{metrics:[{k:'日主',v:'丙火',s:'本命'}],
  points:[{t:'日主丙火，原局扶助 38.1%，判为身弱。',ev:['扶助 38.1%','喜 木火'],sec:4}],
  actions:[{k:'cal:general',label:'去择日'},{k:'copy',label:'复制速览'}]},
 sections:[
  {title:'四、事业方向',__no:4,lines:['第一段。']},
  {title:'六、婚姻与六亲',__no:6,lines:['第二段。']}
 ]
};

test('筛选视图导出：章号沿用原编号，不重排成 01/02',()=>{
 const html=buildReportDocument(report);
 assert.match(html,/id="rpt-sec-4"/,'第 4 章沿用原编号');
 assert.match(html,/id="rpt-sec-6"/,'第 6 章沿用原编号');
 assert.doesNotMatch(html,/id="rpt-sec-1"/,'筛选后不得从 01 重新编号');
 assert.match(html,/<span class="rpt-sec-no">04<\/span>/);
 assert.match(html,/筛选视图：只看「人生专题」/,'文档里要写明这是筛选视图');
});

test('离线文档：速览按钮静态化，不带没有落点的交互',()=>{
 const html=buildReportDocument(report);
 assert.match(html,/<div class="rpt-point-go"/,'要点降级为卡片');
 assert.doesNotMatch(html,/<button[^>]*rpt-point-go/,'不能留按钮');
 assert.doesNotMatch(html,/rpt-brief-act/,'出口按钮连同容器去掉');
 assert.doesNotMatch(html,/<script/i,'导出文档不得带脚本');
 assert.match(html,/\.rpt-brief\{/,'速览在离线文档里也要有样式，否则挤成一段');
 assert.match(html,/依据：扶助 38\.1%/,'依据要跟着导出');
});
