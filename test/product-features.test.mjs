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
const ziweiState={
 system:'ziwei',profile:{name:'测试命主'},
 reading:{ziwei:{palaces:Array.from({length:12},(_,i)=>({branch:i,name:i===0?'命宫':'宫'+i,majorStars:i===0?[{name:'紫微',brightness:'庙'}]:[],minorStars:[]}))}},
 chartState:{}
};

test('深度报告：八字本命能生成成篇四章报告',()=>{
 const r=composeFullReport(baziState,NAMES);
 assert.equal(r.kind,'bazi');
 assert.ok(r.characters>=1000,'报告字数应达千字体量，实际 '+r.characters);
 assert.equal((r.body.match(/class="rpt-sec"/g)||[]).length,4,'应为四章');
 assert.match(r.title,/八字/);
 const html=reportHtml(r);
 assert.match(html,/data-full-report/);
 assert.match(html,/第一层|一、/);
 assert.match(html,/不构成事实预测/);
});

test('深度报告：紫微本命能生成报告并标注命宫主星',()=>{
 const r=composeFullReport(ziweiState,NAMES);
 assert.equal(r.kind,'ziwei');
 assert.match(r.lead,/紫微/);
 assert.ok((r.body.match(/class="rpt-sec"/g)||[]).length>=3);
});

test('深度报告：西洋/印度在无四层引擎时输出结构化盘面摘要，不伪造断语',()=>{
 const west=composeFullReport({...baziState,system:'west',reading:{western:{planets:[{key:'sun',name:'太阳',sign:'狮子',house:1}],asc:{sign:'狮子'}}}},NAMES);
 assert.equal(west.kind,'west');
 assert.match(west.body,/核心结构/);
 const vedic=composeFullReport({...baziState,system:'vedic',reading:{vedic:{lagna:'狮子',planets:[{name:'太阳',sign:'狮子',house:1,nakshatra:'Magha',pada:2}]}}},NAMES);
 assert.equal(vedic.kind,'vedic');
 assert.match(vedic.body,/rpt-table/);
});

test('产品回归：八字术语按钮白框回归已被权威层修复',async()=>{
 const css=await readFile(new URL('../assets/console/design.css',import.meta.url),'utf8');
 // 必须存在针对 .term 的透明底 !important 规则，覆盖全局 button{background:...!important}
 assert.match(css,/\.term[\s\S]{0,600}background:transparent!important/,'.term 应有透明底高优先级规则');
 assert.match(css,/button\.term/,'应含 button.term 选择器');
});
