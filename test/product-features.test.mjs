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

test('深度报告：西洋生成四层成篇报告且含相位解读',()=>{
 const west=composeFullReport({...baziState,system:'west',reading:{western:{planets:[{key:'sun',name:'太阳',sign:'狮子',house:1,degree:{degrees:5,minutes:20}},{key:'moon',name:'月亮',sign:'水瓶',house:7,degree:{degrees:12,minutes:0}}],asc:{sign:'狮子'},mc:'金牛',aspects:[{a:'太阳',b:'月亮',type:'对冲',angle:180,orb:2.4}]}}},NAMES);
 assert.equal(west.kind,'west');
 assert.equal((west.body.match(/class="rpt-sec"/g)||[]).length,4,'应为四章');
 assert.ok(west.characters>=800,'成篇报告应有足够字数，实际 '+west.characters);
 assert.match(west.body,/相位格局/);
 assert.match(west.body,/核心三要素/);
 assert.doesNotMatch(west.body,/\[object Object\]/);
});

test('深度报告：印度占星生成四层成篇报告',()=>{
 const vedic=composeFullReport({...baziState,system:'vedic',reading:{vedic:{lagna:'狮子',ayan:'Lahiri',balanceYears:12.6,planets:[{name:'太阳',sign:'狮子',house:1,nakshatra:'Magha',pada:2,nakLord:'计都'},{name:'月亮',sign:'天蝎',house:4,nakshatra:'Anuradha',pada:1,nakLord:'土星'}],dashas:[{lord:'罗睺',start:'1983-01-27',end:'2001-01-26',active:false},{lord:'木星',start:'2001-01-26',end:'2017-01-26',active:true}]}}},NAMES);
 assert.equal(vedic.kind,'vedic');
 assert.equal((vedic.body.match(/class="rpt-sec"/g)||[]).length,4);
 assert.ok(vedic.characters>=1000,'印度报告应达千字体量，实际 '+vedic.characters);
 assert.match(vedic.body,/Vimshottari 大运/);
 assert.match(vedic.body,/rpt-table/);
});

test('深度报告：双人合盘生成专属报告，标题不再误用本命模板',()=>{
 const synState={system:'synastry',profile:{name:'甲命主'},chartState:{synastry:{other:'case-b',result:{
  fit:{percent:61,total:22,max:36,highlight:'乙庚合',insights:[{name:'互动助力',text:'海王合天王'}]},
  vedic:{koota:{total:22,max:36,items:[{zh:'Varna',score:3,note:'良好'},{zh:'Nadi',score:1,note:'需留意'}]}},
  western:{interAspects:[{a:'太阳',b:'月亮',type:'三合',angle:120,orb:2.1},{a:'金星',b:'火星',type:'刑相',angle:90,orb:3.0}]},
  crossRelations:[{type:'天干五合',pattern:'乙庚合',pillars:['年柱','月柱']}]
 }}},cases:[{id:'case-b',name:'乙命主'}]};
 const syn=composeFullReport(synState,NAMES);
 assert.equal(syn.kind,'synastry');
 assert.match(syn.title,/双人合盘/);
 assert.doesNotMatch(syn.title,/西洋占星/,'合盘标题不得误用本命模板');
 assert.equal((syn.body.match(/class="rpt-sec"/g)||[]).length,4);
 assert.match(syn.body,/契合度/);
 assert.match(syn.body,/印度八科/);
 assert.match(syn.body,/跨盘相位/);
 assert.match(syn.lead,/乙命主/,'应显示第二人姓名');
});

test('产品回归：八字术语按钮白框回归已被权威层修复',async()=>{
 const css=await readFile(new URL('../assets/console/design.css',import.meta.url),'utf8');
 // 必须存在针对 .term 的透明底 !important 规则，覆盖全局 button{background:...!important}
 assert.match(css,/\.term[\s\S]{0,600}background:transparent!important/,'.term 应有透明底高优先级规则');
 assert.match(css,/button\.term/,'应含 button.term 选择器');
});

test('运势趋势：引擎为每个流年/大运真算扶助度，口径与岁运提要一致',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const city={label:'上海',lat:31.2304,lon:121.4737,tz:8,tzName:'Asia/Shanghai'};
 const birth={Y:1998,M:11,D:21,h:0,mi:2,gender:'女',city,dateStr:'1998-11-21',timeStr:'00:02'};
 const base=baziPro({birth});
 assert.ok(base.trend,'应输出 trend 字段');
 assert.equal(base.trend.years.length,base.years.length,'流年趋势与流年列表同长');
 assert.equal(base.trend.cycles.length,base.cycles.length,'大运趋势与大运列表同长');
 for(const y of base.trend.years){
  assert.equal(typeof y.support,'number');assert.ok(y.support>0&&y.support<100,'扶助度应在 0-100 内');
  assert.ok(base.years.some(x=>x.year===y.year),'趋势年应存在于流年列表');
 }
 // 选中某流年后，guidance 的 strength.support 应与该年趋势值一致（同一口径）
 const pickYear=base.trend.years[3].year;
 const sel=baziPro({birth,selection:{year:pickYear}});
 assert.ok(Math.abs(sel.strength.support-base.trend.years[3].support)<0.01,'选中年扶助度应与趋势值一致');
 assert.equal(base.trend.natal.support,base.natalStrength.support,'本命扶助度一致');
});
