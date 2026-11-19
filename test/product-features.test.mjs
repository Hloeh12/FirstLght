import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {composeFullReport,reportHtml} from '../assets/console/full-report.js';

const NAMES={bazi:'八字',ziwei:'紫微斗数',west:'西洋占星',vedic:'印度占星'};
const CITY={label:'上海',lat:31.2304,lon:121.4737,tz:8,tzName:'Asia/Shanghai'};
const BIRTH={Y:1998,M:11,D:21,h:0,mi:2,gender:'女',city:CITY,dateStr:'1998-11-21',timeStr:'00:02'};

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

test('深度报告：八字生成十章以上终身详批（格局/神煞/大运/流年逐年）',()=>{
 const r=composeFullReport(baziState,NAMES);
 assert.equal(r.kind,'bazi');
 const secs=(r.body.match(/class="rpt-sec"/g)||[]).length;
 assert.ok(secs>=10,'应至少十章（含术语词典），实际 '+secs);
 assert.ok(r.characters>=1500,'报告字数应达 1500 体量，实际 '+r.characters);
 assert.match(r.title,/八字/);
 assert.match(r.body,/大运逐运详批/);
 assert.match(r.body,/流年逐年详批/);
 assert.match(r.body,/术语小词典/);
 assert.match(r.body,/格局/);
 const html=reportHtml(r);
 assert.match(html,/data-full-report/);
 assert.match(html,/不构成事实预测/);
});

test('深度报告：八字真实引擎数据驱动——大运/流年逐年逐条成批',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const d=baziPro({birth:BIRTH,selection:{year:2026}});
 const state={system:'bazi',profile:{name:'测试命主'},reading:{bazi:d},chartState:{bazi:{data:d,pick:{year:2026}}}};
 const r=composeFullReport(state,NAMES);
 const items=(r.body.match(/class="rpt-list/g)||[]).length;
 assert.ok(items>=2,'大运与流年应各自成列表，实际 '+items);
 assert.match(r.body,new RegExp(String(d.years[0].year)),'首个流年应入批');
 assert.match(r.body,/第1步/);
});

test('深度报告：紫微生成七章详批（十二宫逐宫/大限逐限/指向事件）',()=>{
 const r=composeFullReport(ziweiState,NAMES);
 assert.equal(r.kind,'ziwei');
 assert.match(r.lead,/紫微/);
 assert.ok((r.body.match(/class="rpt-sec"/g)||[]).length>=6);
 assert.match(r.body,/十二宫逐宫详解/);
 assert.match(r.body,/大限逐限详批/);
 assert.match(r.body,/指向性事件/);
 assert.match(r.body,/生年四化与人生课题/);
});

test('深度报告：紫微真实盘——十二宫与大限逐条可核',async()=>{
 const {ziweiChart}=await import('../src/ziwei.mjs');
 const chart=ziweiChart({dateStr:'1990-06-15',timeIndex:7,gender:'男',h:14,mi:30,city:CITY});
 const state={system:'ziwei',profile:{name:'测试命主'},chartState:{ziwei:{chart}},reading:{ziwei:chart}};
 const r=composeFullReport(state,NAMES);
 const palaceItems=(r.body.match(/宫 · /g)||[]).length;
 assert.ok(palaceItems>=12,'十二宫应逐宫成条，实际 '+palaceItems);
 const decadeItems=(r.body.match(/大限 /g)||[]).length;
 assert.ok(decadeItems>=8,'大限应逐限成条，实际 '+decadeItems);
 assert.match(r.body,/【当前十年】/);
});

test('深度报告：西洋生成逐星成段报告并检测格局',()=>{
 const west=composeFullReport({...baziState,system:'west',reading:{western:{planets:[{key:'sun',name:'太阳',sign:'狮子座',house:1,degree:{degrees:5,minutes:20}},{key:'moon',name:'月亮',sign:'水瓶座',house:7,degree:{degrees:12,minutes:0}}],asc:{sign:'狮子'},mc:'金牛',aspects:[{a:'太阳',b:'月亮',type:'对冲',angle:180,orb:2.4}]}}},NAMES);
 assert.equal(west.kind,'west');
 assert.ok((west.body.match(/class="rpt-sec"/g)||[]).length>=5,'应至少五章');
 assert.ok(west.characters>=1000,'成篇报告应有足够字数，实际 '+west.characters);
 assert.match(west.body,/逐星解读/);
 assert.match(west.body,/盘面格局与元素/);
 assert.match(west.body,/核心三要素/);
 assert.doesNotMatch(west.body,/undefined/);
 assert.doesNotMatch(west.body,/\[object Object\]/);
});

test('深度报告：西洋真实盘——星群/三角/元素检测可用',async()=>{
 const {chart}=await import('../src/chart.mjs');
 const {buildWesternDeepReport}=await import('../www/js/deep-west.js');
 const full=chart({Y:1990,M:6,D:15,h:14,mi:30,gender:'男',city:CITY},{baseOnly:true});
 const r=buildWesternDeepReport(full.western);
 assert.ok(r.sections.length>=5);
 const patternSec=r.sections.find(x=>x.title.startsWith('四'));
 assert.match(patternSec.lines.join(''),/元素分布/);
 assert.doesNotMatch(patternSec.lines.join(''),/undefined/);
});

test('深度报告：印度占星生成七章详批（力量评级/Yoga/大运/人生格局）',()=>{
 const vedic=composeFullReport({...baziState,system:'vedic',reading:{vedic:{lagna:'狮子',ayan:'Lahiri',balanceYears:12.6,planets:[{name:'太阳',sign:'狮子',house:1,nakshatra:'Magha',pada:2,nakLord:'计都'},{name:'月亮',sign:'天蝎',house:4,nakshatra:'Anuradha',pada:1,nakLord:'土星'}],dashas:[{lord:'罗睺',start:'1983-01-27',end:'2001-01-26',active:false},{lord:'木星',start:'2001-01-26',end:'2017-01-26',active:true}]}}},NAMES);
 assert.equal(vedic.kind,'vedic');
 assert.ok((vedic.body.match(/class="rpt-sec"/g)||[]).length>=6);
 assert.ok(vedic.characters>=1200,'印度报告应达千字体量，实际 '+vedic.characters);
 assert.match(vedic.body,/行星力量评级/);
 assert.match(vedic.body,/Yoga 命格识别/);
 assert.match(vedic.body,/Vimshottari 大运逐运详批/);
 assert.match(vedic.body,/人生格局总结/);
 assert.match(vedic.body,/rpt-table/);
 assert.doesNotMatch(vedic.body,/undefined/);
});

test('深度报告：印占 Yoga 检测器可核（构造 Gaja Kesari 与 Budha-Aditya）',async()=>{
 const {detectYogas}=await import('../www/js/deep-vedic.js');
 // 月亮第4宫，木星第7宫（从月起第4宫）→ Gaja Kesari
 const v1={lagna:'狮子',planets:[
  {name:'月亮',sign:'天蝎',house:4},{name:'木星',sign:'水瓶',house:7},{name:'太阳',sign:'狮子',house:1},{name:'水星',sign:'狮子',house:1}
 ]};
 const y1=detectYogas(v1);
 assert.ok(y1.includes('GajaKesari'),'应检出大象狮子格：'+y1.join(','));
 assert.ok(y1.includes('BudhaAditya'),'日月同宫应检出智日同辉');
 // 月亮前后宫无星且无合相 → Kemadruma
 const v2={lagna:'白羊',planets:[{name:'月亮',sign:'双子',house:3},{name:'太阳',sign:'白羊',house:1},{name:'土星',sign:'天秤',house:7}]};
 assert.ok(detectYogas(v2).includes('Kemadruma'),'应检出孤月格');
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
 assert.ok((syn.body.match(/class="rpt-sec"/g)||[]).length>=7,'深度合盘应至少七章（含词典），实际 '+(syn.body.match(/class="rpt-sec"/g)||[]).length);
 assert.match(syn.body,/契合度/);
 assert.match(syn.body,/印度八科/);
 assert.match(syn.body,/跨盘相位逐条详解/);
 assert.match(syn.body,/五星对照/);
 assert.match(syn.body,/经营指南/);
 assert.match(syn.lead,/乙命主/,'应显示第二人姓名');
 assert.doesNotMatch(syn.body,/undefined/);
});

test('深度合盘：真实双盘驱动——五星对照/跨盘相位/八科化解逐条成篇',async()=>{
 const {localRequest}=await import('../src/console-engine.mjs');
 const B={Y:1992,M:3,D:8,h:9,mi:20,gender:'女',city:CITY,dateStr:'1992-03-08',timeStr:'09:20'};
 const result=localRequest('/api/synastry/chart',{a:BIRTH,b:B,mode:'synastry'});
 const {buildSynastryDeepReport}=await import('../www/js/deep-synastry.js');
 const r=buildSynastryDeepReport(result,'甲','乙');
 assert.equal(r.sections.length,9,'合盘应为九章（含八字合婚与紫微合盘）');
 assert.ok(r.characters>=3000,'深度合盘应达 3000 字，实际 '+r.characters);
 const bmSec=r.sections.find(x=>x.title.includes('八字合婚专项')),zmSec=r.sections.find(x=>x.title.includes('紫微合盘'));
 assert.ok(bmSec&&zmSec,'应含八字合婚与紫微合盘两章');
 assert.match(bmSec.lines.join(''),/日柱|生肖|十神|喜用/,'八字合婚应给结构化证据');
 assert.match(zmSec.lines.join(''),/命宫|夫妻宫/,'紫微合盘应含命宫夫妻宫互参');
 const pairSec=r.sections.find(x=>x.title.startsWith('二、'));
 assert.ok((pairSec.html.match(/<li>/g)||[]).length===5,'五星对照应五条');
 const aspSec=r.sections.find(x=>x.title.startsWith('三、'));
 assert.ok((aspSec.html.match(/<li>/g)||[]).length>=5,'跨盘相位应多条');
 const kootaSec=r.sections.find(x=>x.title.startsWith('四、'));
 assert.match(kootaSec.table,/rpt-warn|<td>/,'八科应有逐科表格');
 assert.doesNotMatch(JSON.stringify(r),/undefined/);
});

test('紫微流年逐年详批：未来十年——流年命宫按年支定位、四化按年干飞布',async()=>{
 const {ziweiChart}=await import('../src/ziwei.mjs');
 const {buildZiweiDeepReport}=await import('../www/js/deep-ziwei.js');
 const chart=ziweiChart({dateStr:'1990-06-15',timeIndex:7,gender:'男',h:14,mi:30,city:CITY});
 const r=buildZiweiDeepReport(chart,null);
 const sec=r.sections.find(x=>x.title.startsWith('六、流年逐流年'));
 assert.ok(sec,'应存在流年逐流年章节');
 const html=sec.html||'';
 const yearItems=(html.match(/<li/g)||[]).length;
 assert.equal(yearItems,10,'未来十年应逐年成条，实际 '+yearItems);
 const nowYear=new Date().getFullYear();
 assert.match(html,new RegExp(String(nowYear)+'年'));
 assert.match(html,/流年命宫/);
 assert.match(html,/流年四化/);
 assert.match(html,/【今年】/);
 // 流年命宫应随年支变化：2026 午 与 2027 未 命宫不同
 const t=html.replace(/<[^>]*>/g,'');
 const m26=t.match(/2026年 [^·]*· 流年命宫走([^宫]*)宫/);
 const m27=t.match(/2027年 [^·]*· 流年命宫走([^宫]*)宫/);
 assert.ok(m26&&m27&&m26[1]!==m27[1],'相邻年支流年命宫应不同');
 assert.doesNotMatch(t,/undefined/);
});

test('紫微流月流日：斗君起正月、十二月逐月成条、流日整月与十二时辰',async()=>{
 const {ziweiChart,ziweiFlow}=await import('../src/ziwei.mjs');
 const {buildZiweiDeepReport}=await import('../www/js/deep-ziwei.js');
 const {Solar}=await import('lunar-javascript');
 const chart=ziweiChart({dateStr:'1990-06-15',timeIndex:7,gender:'男'});
 const flow=ziweiFlow({dateStr:'1990-06-15',timeIndex:7,gender:'男',flowYear:2026,scope:'daily',month:6,day:10});
 // 即便用户未选任何流限（flow=null），流日流时也应自足生成
 for(const f of [flow,null]){
  const r=buildZiweiDeepReport(chart,f);
  assert.equal(r.sections.length,10,'紫微报告应为十章');
  const monthSec=r.sections.find(x=>x.title.includes('流月逐月'));
  assert.ok(monthSec,'应存在流月逐月章节');
  const monthHtml=monthSec.html||'';
  assert.equal((monthHtml.match(/<li/g)||[]).length,12,'十二个月应逐月成条');
  assert.match(monthSec.lines.join(''),/斗君/,'应说明斗君口径');
  assert.match(monthHtml,/月四化/);
  const daySec=r.sections.find(x=>x.title.includes('流日与流时'));
  assert.ok(daySec,'应存在流日与流时章节');
  const dayHtml=daySec.html||'';
  assert.ok((dayHtml.match(/<tr/g)||[]).length>=42,'应含整月流日与十二时辰两张表');
  assert.match(dayHtml,/流日命宫/);
  assert.match(daySec.lines.join(''),/五鼠遁/);
  assert.doesNotMatch(daySec.lines.join(''),/<table|<tr/,'lines 不得含表格标签');
  assert.doesNotMatch(dayHtml,/undefined/);
  // 流日干支应与所选日期（或本命报告的默认今天）一致（(JDN+49) mod 60）
  const d=f?new Date(f.year,f.month-1,f.day):new Date();
  const gz=Solar.fromYmd(d.getFullYear(),d.getMonth()+1,d.getDate()).getLunar().getDayInGanZhi();
  assert.ok(dayHtml.includes(gz),'流日表应含所选日期的干支 '+gz);
 }
});

test('印占小运细分：当前与下一大运各九段 Antardasha，合计恰满大运',async()=>{
 const {vedicPro}=await import('../src/vedic-pro.mjs');
 const {buildVedicDeepReport}=await import('../www/js/deep-vedic.js');
 const v=vedicPro({birth:{Y:1990,M:6,D:15,h:14,mi:30,gender:'男',city:CITY,dateStr:'1990-06-15',timeStr:'14:30'}});
 const r=buildVedicDeepReport(v);
 const sec=r.sections.find(x=>x.title.includes('小运细分'));
 assert.ok(sec,'应存在小运细分章节');
 const html=sec.html||'';
 assert.ok((html.match(/<li/g)||[]).length>=18,'两大运各九段小运');
 assert.match(html,/【当前小运】/,'应标出当前小运');
 // 首段小运与大运同主，且日期与大运起点一致
 const txt=html.replace(/<[^>]*>/g,'');
 const active=v.dashas.find(d=>d.active);
 const first=txt.match(new RegExp(active.lord+'运之'+active.lord+'小运 · (\\d{4}-\\d{2}-\\d{2})'));
 assert.ok(first,'首段小运应与大运同主');
 assert.equal(first[1],String(active.start).slice(0,10),'首段小运起点应等于大运起点');
 assert.doesNotMatch(txt,/undefined/);
});

test('印占 Shadbala 六力：七曜分项齐全、位次唯一、口径不虚报达标',async()=>{
 const {vedicPro}=await import('../src/vedic-pro.mjs');
 const {buildVedicDeepReport}=await import('../www/js/deep-vedic.js');
 const v=vedicPro({birth:{Y:1990,M:6,D:15,h:14,mi:30,gender:'男',city:CITY,dateStr:'1990-06-15',timeStr:'14:30'}});
 const s=v.shadbala;
 assert.ok(s,'应输出 shadbala');
 assert.equal(s.rows.length,7,'七颗主星');
 for(const r of s.rows){
  for(const k of ['uchcha','kendra','drek','dig','paksha','cheshta','naisargika','saptavargaja','drik','rupas','rank','weakestPart']){
   assert.ok(Number.isFinite(r[k])||k==='weakestPart','分项 '+k+' 应为数值');
  }
  assert.ok(r.saptavargaja>=0&&r.saptavargaja<=60,'七分友谊力应在 0–60 virupa');
  assert.ok(r.drik>=-90&&r.drik<=90,'相位力应在 ±90 virupa');
  assert.ok(r.rupas>=0&&r.rupas<=12,'Rupas 应在合理区间');
 }
 const ranks=s.rows.map(r=>r.rank).sort((a,b)=>a-b);
 assert.deepEqual(ranks,[1,2,3,4,5,6,7],'位次应为 1–7 无重复');
 assert.match(s.method,/Nathonnatha|未计|仍未计入/,'口径须说明 Kala 其余分项仍未计入');
 // 报告里不得出现绝对达标断言
 const r=buildVedicDeepReport(v);
 const sec=r.sections.find(x=>x.title.includes('Shadbala'));
 assert.ok(sec,'报告应含 Shadbala 章节');
 assert.doesNotMatch((sec.lines||[]).join(''),/未达标的有|全部达到经典最低线/,'不应给绝对达标结论');
});

test('印占岁运 Varshaphala：返照盘成立、Muntha 每年进一宫',async()=>{
 const {vedicPro}=await import('./../src/vedic-pro.mjs');
 const b={birth:{Y:1990,M:6,D:15,h:14,mi:30,gender:'男',city:CITY,dateStr:'1990-06-15',timeStr:'14:30'}};
 const a=vedicPro({...b,at:'2026-06-01T00:00:00Z'});
 const n=vedicPro({...b,at:'2027-06-01T00:00:00Z'});
 const vs=a.varshaphala;
 assert.ok(vs,'应输出岁运盘');
 assert.ok(vs.chart?.lagna,'返照盘应有上升');
 assert.equal(vs.chart.planets.length>=9,true,'返照盘应有九曜');
 assert.ok(vs.returnUtc&&vs.year===2026,'岁运年份与返照时刻');
 assert.equal(((vs.muntha.house-1+12)%12),((a.varshaphala.age%12)+12)%12,'Muntha 应与年龄同步进宫');
 assert.notEqual(n.varshaphala.muntha.house,vs.muntha.house,'相邻两年 Muntha 应进一宫');
 const {buildVedicDeepReport}=await import('./../www/js/deep-vedic.js');
 const sec=buildVedicDeepReport(a).sections.find(x=>x.title.includes('Varshaphala'));
 assert.ok(sec,'报告应含岁运章节');
 assert.match((sec.lines||[]).join(''),/Muntha 落第/);
});

test('西洋行运触发点：星历实算外行星对落宫与相位',async()=>{
 const {chart}=await import('../src/chart.mjs');
 const {buildWesternDeepReport}=await import('../www/js/deep-west.js');
 const full=chart({Y:1990,M:6,D:15,h:14,mi:30,gender:'男',city:CITY},{baseOnly:true});
 const r=buildWesternDeepReport(full.western);
 const sec=r.sections.find(x=>x.title.includes('行运触发点'));
 assert.ok(sec,'应存在行运触发点章节');
 const txt=(sec.html||'').replace(/<[^>]*>/g,'');
 for(const name of ['木星','土星','天王星','海王星','冥王星']){
  assert.ok(txt.includes(name),'行运应含 '+name);
  assert.match(txt,new RegExp(name+' · 现行 [^ ]+ · 你本命第\\d+宫'),'行运 '+name+' 应给出星座与落宫');
 }
 assert.doesNotMatch(txt,/undefined/);
});

test('八字流月逐月详批：所选流年十二个月逐月成条',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const d=baziPro({birth:BIRTH,selection:{year:2026}});
 const {buildBaziDeepReport}=await import('../www/js/deep-bazi.js');
 const r=buildBaziDeepReport(d);
 const sec=r.sections.find(x=>x.title.startsWith('十一、流月逐月'));
 assert.ok(sec,'应存在流月逐月章节');
 const html=sec.html||'';
 assert.equal((html.match(/<li/g)||[]).length,12,'十二个月应逐月成条，实际 '+(html.match(/<li/g)||[]).length);
 const txt=html.replace(/<[^>]*>/g,'');
 assert.match(txt,/立春/);
 assert.match(txt,/聚力|冲|相刑|相害|相破|三合局|平顺月/,'应给出刑冲合害破判读');
 assert.doesNotMatch(txt,/undefined/);
});

test('八字三垣与力量来源：胎元/命宫/身宫成立，得令得地得势可分解',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const d=baziPro({birth:BIRTH});
 assert.ok(d.traditional?.taiYuan?.ganzhi,'应输出胎元干支');
 assert.ok(d.traditional?.mingGong?.ganzhi,'应输出命宫干支');
 assert.ok(d.traditional?.shenGong?.ganzhi,'应输出身宫干支');
 assert.ok(d.traditional.taiYuan.tenGod,'三垣应带对日主的十神');
 const sb=d.strengthBreakdown;
 assert.ok(sb&&typeof sb.deLing.role==='string','力量分解应含得令');
 assert.ok(Array.isArray(sb.deDi)&&Array.isArray(sb.deShi.stems),'力量分解应含得地与得势');
 assert.ok(sb.score>=0&&sb.score<=sb.full,'评分应落在 0 到满分之间');
 const {buildBaziDeepReport}=await import('../www/js/deep-bazi.js');
 const r=buildBaziDeepReport(d);
 const sec=r.sections.find(x=>x.title.includes('三垣'));
 assert.ok(sec,'报告应含三垣章节');
 const txt=(sec.lines||[]).join('')+(sec.html||'');
 assert.match(txt,/胎元/);assert.match(txt,/命宫/);assert.match(txt,/身宫/);
 assert.doesNotMatch(txt,/undefined/);
});

test('八字流日流时：逐日成表、十二时辰带宜忌、重点日不重复',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const d=baziPro({birth:BIRTH,selection:{year:2026}});
 const {buildBaziDeepReport}=await import('../www/js/deep-bazi.js');
 const r=buildBaziDeepReport(d);
 const sec=r.sections.find(x=>x.title.includes('流日与流时'));
 assert.ok(sec,'报告应含流日流时章节');
 const txt=(sec.lines||[]).join('');
 assert.match(txt,/流日是把「择时」落到天/);
 assert.match(txt,/重点日/);
 assert.ok((txt.match(/时<br>|时辰/g)||[]).length>=0);
 const html=sec.html||'';
 const hours=(html.match(/<table[^>]*rpt-hours[\s\S]*?<\/table>/)||[''])[0];
 assert.equal((hours.match(/<tr/g)||[]).length,13,'应为 1 行表头 + 十二时辰');
 const days=(html.match(/<table[^>]*rpt-days[\s\S]*?<\/table>/)||[''])[0];
 assert.ok((days.match(/<tr>/g)||[]).length>=28,'流日表应覆盖整月');
 assert.doesNotMatch(txt,/undefined/);
 assert.doesNotMatch(txt,/冲日柱——[\s\S]{0,40}冲日柱/,'冲日柱不应在同一句重复出现');
 assert.doesNotMatch(txt,/<table|<tr/,'lines 不得含表格标签，否则会被渲染转义');
});

test('产品回归：八字术语按钮白框回归已被权威层修复',async()=>{
 const css=await readFile(new URL('../assets/console/design.css',import.meta.url),'utf8');
 // 必须存在针对 .term 的透明底 !important 规则，覆盖全局 button{background:...!important}
 assert.match(css,/\.term[\s\S]{0,600}background:transparent!important/,'.term 应有透明底高优先级规则');
 assert.match(css,/button\.term/,'应含 button.term 选择器');
});

test('液态玻璃层：liquid.css 已接入且含镜面与折射材质',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/assets\/console\/liquid\.css/,'index.html 应在 design.css 之后引入 liquid.css');
 const css=await readFile(new URL('../assets/console/liquid.css',import.meta.url),'utf8');
 assert.match(css,/backdrop-filter:blur\(26px\)/,'卡片应有深度模糊折射');
 assert.match(css,/\.rpt-list/,'深度报告列表应有玻璃样式');
 assert.match(css,/\.rpt-list li\.rpt-now/,'当前条目应有高亮');
 assert.match(css,/prefers-reduced-motion/,'动效应尊重减弱动画偏好');
});

test('运势趋势：引擎为每个流年/大运真算扶助度，口径与岁运提要一致',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const base=baziPro({birth:BIRTH});
 assert.ok(base.trend,'应输出 trend 字段');
 assert.equal(base.trend.years.length,base.years.length,'流年趋势与流年列表同长');
 assert.equal(base.trend.cycles.length,base.cycles.length,'大运趋势与大运列表同长');
 for(const y of base.trend.years){
  assert.equal(typeof y.support,'number');assert.ok(y.support>0&&y.support<100,'扶助度应在 0-100 内');
  assert.ok(base.years.some(x=>x.year===y.year),'趋势年应存在于流年列表');
 }
 // 选中某流年后，guidance 的 strength.support 应与该年趋势值一致（同一口径）
 const pickYear=base.trend.years[3].year;
 const sel=baziPro({birth:BIRTH,selection:{year:pickYear}});
 assert.ok(Math.abs(sel.strength.support-base.trend.years[3].support)<0.01,'选中年扶助度应与趋势值一致');
 assert.equal(base.trend.natal.support,base.natalStrength.support,'本命扶助度一致');
});

test('流时粒度：选中流日后输出十二时辰，可逐时选看',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const base=baziPro({birth:BIRTH});
 const dayIndex=0;
 const withDay=baziPro({birth:BIRTH,selection:{year:base.years[0].year,month:0,day:dayIndex}});
 assert.equal(withDay.hours.length,12,'应输出十二时辰');
 assert.equal(withDay.hours[0].label,'子时');
 assert.equal(withDay.hours[0].clock.slice(0,5),'23:00');
 // 各时辰时支应依次为子丑寅卯…（按日柱干支推时柱）
 for(let i=1;i<12;i++)assert.ok(withDay.hours[i].label.endsWith('时'));
 const withHour=baziPro({birth:BIRTH,selection:{year:base.years[0].year,month:0,day:dayIndex,hour:5}});
 assert.equal(withHour.selected.at(-1).name,'流时','选中的最后一柱应为流时');
 assert.ok(withHour.selected.length>=4,'应含流年+流月+流日+流时');
 // 五鼠遁：乙庚日起丙子（若当日日干为乙，子时应为丙子）
 const dayStem=withDay.days[dayIndex].stem;
 const expectZi={甲:'甲',乙:'丙',丙:'戊',丁:'庚',戊:'甲',己:'丙',庚:'戊',辛:'庚',壬:'壬',癸:'甲'}[dayStem]||'甲';
 // 甲己→甲子，乙庚→丙子，丙辛→戊子，丁壬→庚子，戊癸→壬子
 const table={甲:'甲',己:'甲',乙:'丙',庚:'丙',丙:'戊',辛:'戊',丁:'庚',壬:'庚',戊:'壬',癸:'壬'};
 assert.equal(withDay.hours[0].stem,table[dayStem],'子时天干应按五鼠遁起');
 // 时辰未知时不输出流时
 const noTime=baziPro({birth:{...BIRTH,timeUnknown:true}});
 assert.ok(!noTime.hours?.length,'时辰未知不得输出流时');
});

test('报告渲染契约：sections.lines 必须为纯文本，表格只能放 html/table 字段',async()=>{
 const {baziPro}=await import('../src/bazi-pro.mjs');
 const {buildBaziDeepReport}=await import('../www/js/deep-bazi.js');
 const {ziweiChart,ziweiFlow}=await import('../src/ziwei.mjs');
 const {buildZiweiDeepReport}=await import('../www/js/deep-ziwei.js');
 const {vedicPro}=await import('../src/vedic-pro.mjs');
 const {buildVedicDeepReport}=await import('../www/js/deep-vedic.js');
 const bazi=buildBaziDeepReport(baziPro({birth:BIRTH,selection:{year:2026}}));
 const chart=ziweiChart({dateStr:'1990-06-15',timeIndex:7,gender:'男'});
 const ziwei=buildZiweiDeepReport(chart,ziweiFlow({dateStr:'1990-06-15',timeIndex:7,gender:'男',flowYear:2026,scope:'daily',month:6,day:10}));
 const vedic=buildVedicDeepReport(vedicPro({birth:BIRTH}));
 for(const [name,report] of [['八字',bazi],['紫微',ziwei],['印占',vedic]]){
  for(const sec of report.sections){
   for(const line of sec.lines||[]){
    assert.equal(typeof line,'string',name+' '+sec.title+' 的 lines 必须是字符串');
    assert.doesNotMatch(line,/<(table|tr|td|th|ul|li|div|section|b|i|br)\b/i,`${name} 的「${sec.title}」把 HTML 放进了 lines，渲染时会被转义: ${line.slice(0,60)}`);
   }
  }
 }
});

test('印占专业深度：Shadbala 参考线审计与 Ashtakavarga 逐星 BAV 过境读法',async()=>{
 const {vedicPro}=await import('../src/vedic-pro.mjs');
 const {buildVedicDeepReport,nechaBhanga,detectYogas}=await import('../www/js/deep-vedic.js');
 const v=vedicPro({birth:{Y:1990,M:6,D:15,h:6,mi:30,city:{lat:39.9042,lon:116.4074,tz:8},calendar:'solar'},at:new Date().toISOString()});
 const r=buildVedicDeepReport(v);
 const shad=r.sections.find(s=>s.title.includes('Shadbala'));
 assert.match(shad.table,/Rupas\/参考/,'六力表须列参考线');
 assert.match(shad.table,/判定/,'六力表须列达标判定');
 assert.ok(shad.lines.some(x=>x.includes('参考线')&&x.includes('量纲')),'全盘低于参考线时须说明量纲差异，不能误判全盘无力');
 const astha=r.sections.find(s=>s.title.includes('Ashtakavarga'));
 assert.ok(astha.html&&/rpt-bav/.test(astha.html),'须输出逐行星 BAV 表，不能只给 SAV 宫位总分');
 assert.equal((astha.html.match(/rpt-bindu-hi/g)||[]).length>0,true,'BAV 高分须可辨识');
 assert.ok(astha.lines.some(x=>x.includes('行运落点')&&x.includes('SAV≥30')),'须给出可执行的过境叠加规则');
 assert.ok(astha.lines.some(x=>x.includes('Prastara')),'须披露未做还原的口径限制');
 // 陷而复兴：太阳落陷天秤、守护星金星落本命角宫，须检出具体解救路径
 const nb=nechaBhanga({lagna:'白羊',planets:[{name:'太阳',key:'sun',sign:'天秤',house:7,sid:190},{name:'金星',key:'venus',sign:'天蝎',house:4,sid:220}]});
 assert.equal(nb.length,1,'应检出一组陷而复兴');
 assert.ok(nb[0].reasons.join('').includes('金星')&&nb[0].strength==='强');
 assert.ok(detectYogas({lagna:'白羊',planets:[{name:'太阳',key:'sun',sign:'天秤',house:7,sid:190},{name:'金星',key:'venus',sign:'天蝎',house:4,sid:220}]}).includes('NeechaBhanga'));
});

test('八字时点三章：十神×喜忌×刑冲三元组判定，同一十神不同喜忌不再复读',async()=>{
 const {periodTenor,buildBaziDeepReport}=await import('../www/js/deep-bazi.js');
 const good={roles:{useful:['金'],avoid:['木'],enemy:[],idle:[]},useful:['金','火'],caution:['木'],support:50};
 const bad={roles:{useful:['木'],avoid:['金'],enemy:[],idle:[]},useful:['木'],caution:['金','火'],support:50};
 // 甲日主：正官属金；巳属火。同一「正官×巳」在喜/忌两套取用下必须给出不同定性。
 const a=periodTenor('正官',good,'甲','巳',5),b=periodTenor('正官',bad,'甲','巳',5);
 assert.equal(a.gr,'useful');assert.equal(b.gr,'caution');
 assert.equal(a.br,'useful');assert.equal(b.br,'caution');
 assert.notEqual(a.head,b.head);assert.notEqual(a.career,b.career);assert.notEqual(a.wealth,b.wealth);
 assert.match(a.career,/流程/);assert.match(b.career,/头衔/);
 const base={dayMaster:{stem:'甲',element:'木'},natalStrength:good,pillars:[
  {name:'年柱',stem:'丙',branch:'寅',hidden:[]},{name:'月柱',stem:'己',branch:'巳',hidden:[]},
  {name:'日柱',stem:'甲',branch:'午',hidden:[]},{name:'时柱',stem:'庚',branch:'申',hidden:[]}
 ],cycles:[{index:0,stem:'乙',branch:'丑',tenGod:'劫财'},{index:1,stem:'丙',branch:'寅',tenGod:'食神'}],
 years:[{year:2025,stem:'乙',branch:'巳',tenGod:'劫财'},{year:2026,stem:'丙',branch:'午',tenGod:'食神'}],
 months:[{label:'丙寅月',stem:'丙',branch:'寅',tenGod:'食神'},{label:'丁卯月',stem:'丁',branch:'卯',tenGod:'伤官'}]};
 const r=buildBaziDeepReport(base);
 const sec=n=>r.sections.find(s=>s.title.includes(n));
 for(const name of ['大运逐运','流年逐年','流月逐月']){
  const s=sec(name);
  assert.ok(s?.html?.includes('同为喜用')||s?.html?.includes('主题')||s?.html?.includes('同为忌神'),name+' 须有三元组定性');
  assert.doesNotMatch(s.html,/undefined|NaN/,name+' 不得有脏数据');
 }
 assert.notEqual(sec('流年逐年').html.match(/<li>[\s\S]*?<\/li>/g)[0],sec('流年逐年').html.match(/<li>[\s\S]*?<\/li>/g)[1],'不同流年不得逐字雷同');
});

test('时点敏感性：紫微十年起点与流日、西占行运随所选时点变化',async()=>{
 const {ziweiChart,ziweiFlow}=await import('../src/ziwei.mjs');
 const {buildZiweiDeepReport}=await import('../www/js/deep-ziwei.js');
 const {chart}=await import('../src/chart.mjs');
 const {buildWesternDeepReport}=await import('../www/js/deep-west.js');
 const zc=ziweiChart({dateStr:'1990-06-15',timeIndex:7,gender:'男'});
 const mk=(year,month,day)=>({dateStr:'1990-06-15',timeIndex:7,gender:'男',flowYear:year,scope:'daily',month,day});
 const sec=(r,n)=>r.sections.find(s=>s.title.includes(n));
 const a1=buildZiweiDeepReport(zc,ziweiFlow(mk(2026,6,10)),new Date(2026,5,10,12).toISOString());
 const a2=buildZiweiDeepReport(zc,ziweiFlow(mk(2030,6,10)),new Date(2030,5,10,12).toISOString());
 const a3=buildZiweiDeepReport(zc,ziweiFlow(mk(2030,7,18)),new Date(2030,6,18,12).toISOString());
 assert.notEqual(sec(a1,'流年逐流年').html,sec(a2,'流年逐流年').html,'不同所选流年须重排十年');
 assert.match(sec(a2,'流年逐流年').html,/2030年/);
 assert.doesNotMatch(sec(a2,'流年逐流年').html,/【今年】/);
 assert.notEqual(sec(a2,'流日与流时').html,sec(a3,'流日与流时').html,'不同所选日期须重排流日表');
 assert.doesNotMatch(sec(a2,'流日与流时').lines.join(''),/与排盘页所选时点无关/);
 const west=chart({Y:1990,M:6,D:15,h:14,mi:30,gender:'男',city:CITY},{baseOnly:true}).western;
 const t1=buildWesternDeepReport(west,new Date(Date.UTC(2010,0,1)).toISOString());
 const t2=buildWesternDeepReport(west,new Date(Date.UTC(2030,0,1)).toISOString());
 assert.notEqual(sec(t1,'行运触发点').html,sec(t2,'行运触发点').html,'不同时点的西占行运须实算重排');
 assert.match(sec(t2,'行运触发点').lines.join(''),/2030/);
});
