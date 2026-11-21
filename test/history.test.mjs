import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {composeFullReport,reportHtml} from '../assets/console/full-report.js';

const NAMES={bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星'};
const baziState={
 system:'bazi',profile:{name:'测试命主'},
 reading:{bazi:{
  pillars:['年柱','月柱','日柱','时柱'].map((name,i)=>({name,stem:'甲乙丙丁'[i],branch:'子丑寅卯'[i],branchElement:'木'})),
  dayMaster:{stem:'甲',element:'木'},
  strength:{kind:'身强',support:55,method:'得令通根',useful:['火','土'],caution:['金','水']},
  relationships:[]
 }},
 chartState:{}
};

test('报告历史：整份报告快照可 JSON 序列化并原样复盘（点开即复盘）',()=>{
 const r=composeFullReport(baziState,NAMES);
 // 快照写入 localStorage 前要经过 JSON.stringify/parse round-trip。
 const snap=JSON.parse(JSON.stringify(r));
 for(const k of ['cover','title','kind','lead','body','sections','characters'])
  assert.ok(snap[k]!==undefined,`快照须保留 ${k}`);
 const before=reportHtml(r),after=reportHtml(snap);
 assert.equal(after,before,'复盘渲染结果须与原报告逐字一致');
 assert.ok(snap.body.length>500,'正文快照不得为空');
});

test('报告历史：library.js 提供打开/删除/读取快照的契约且限量防溢出',async()=>{
 const lib=await readFile(new URL('../assets/console/library.js',import.meta.url),'utf8');
 assert.match(lib,/export function recordHistory/,'须写历史');
 assert.match(lib,/snapshot:meta\.snapshot\|\|null/,'历史须存整份快照');
 assert.match(lib,/export const getHistoryEntry/,'须可按 id 取回快照');
 assert.match(lib,/export function deleteHistory/,'须可删除单条');
 assert.match(lib,/data-hist-open/,'须有打开报告按钮钩子');
 assert.match(lib,/data-hist-del/,'须有删除按钮钩子');
 assert.match(lib,/slice\(0,40\)/,'历史须限量 40 条');
 assert.match(lib,/QuotaExceeded|catch\(e\)/,'配额溢出须有降级处理');
});

test('报告历史：app.js 绑定打开（replay 不重复写历史）与二次点击删除',async()=>{
 const app=await readFile(new URL('../assets/console/app.js',import.meta.url),'utf8');
 assert.match(app,/getHistoryEntry,deleteHistory/,'须导入历史读取/删除函数');
 assert.match(app,/snapshot:report/,'生成时须把整份报告作快照写入');
 assert.match(app,/openFullReport\(entry\.snapshot,\{replay:true\}\)/,'点开历史须用快照复盘');
 assert.match(app,/if\(!opts\.replay\)/,'复盘不得重复写历史');
 assert.match(app,/data-hist-del/,'须绑定删除');
 assert.match(app,/dataset\.confirm/,'删除须二次确认，不依赖 window.confirm');
});
