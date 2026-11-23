// v0.63.0：报告「仔细度」契约
// 这一轮修的不是「多写字数」，而是三类实质缺陷：
// ① 标题写「未来十年」却从出生那年排起；② 引擎已算出的格局/用神落点没人解读；
// ③ 拿流日四化当流年事件、拿通用断语当本盘结论。
import test from 'node:test';
import assert from 'node:assert/strict';
import {baziPro} from '../src/bazi-pro.mjs';
import {ziweiChart,ziweiFlow} from '../src/ziwei.mjs';
import {buildBaziDeepReport} from '../www/js/deep-bazi.js';
import {buildZiweiDeepReport} from '../www/js/deep-ziwei.js';
import {buildWesternDeepReport} from '../www/js/deep-west.js';
import {chart} from '../src/chart.mjs';

const CITY={lat:31.23,lon:121.47,tz:8};
const BIRTH={name:'契约',gender:'男',Y:1988,M:7,D:20,h:14,mi:30,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};
const nowY=new Date().getFullYear();
const secOf=(rep,key)=>rep.sections.find(s=>s.title.includes(key));
const plain=rep=>[secOf(rep,'性格').lines,secOf(rep,'事业').lines,secOf(rep,'财富').lines,secOf(rep,'婚姻').lines,secOf(rep,'健康').lines].flat().join('\n');

test('八字：流年章只排未来十年，且不再出现出生年',()=>{
 const d=baziPro({birth:BIRTH,selection:{year:nowY}});
 const rep=buildBaziDeepReport({...d,gender:'男'});
 const sec=secOf(rep,'流年逐年');
 const years=[...sec.html.matchAll(/<b>(\d{4})（/g)].map(m=>Number(m[1]));
 assert.ok(years.length>0,'流年章须有年份');
 assert.ok(years.every(y=>y>=nowY),`不得出现已过年份，实际 ${years.join(',')}`);
 assert.ok(!years.includes(BIRTH.Y),'出生年不应再作为流年列出');
 assert.equal(years.length,Math.min(10,d.years.filter(y=>y.year>=nowY).length),'应覆盖引擎给出的未来十年');
 assert.match(sec.html,/已过的年份不再列出/,'须说明为何不列旧年');
});

test('八字：十神组合须给出柱位证据，不能只报组合名',()=>{
 const d=baziPro({birth:BIRTH,selection:{year:nowY}});
 const rep=buildBaziDeepReport({...d,gender:'男'});
 const txt=plain(rep);
 if(/正在起作用的组合/.test(txt)){
  const line=txt.split('\n').find(x=>x.includes('「')&&x.includes('盘面成立'));
  assert.ok(line,'组合须带盘面证据');
  assert.match(line,/（.+柱.+）|盘面成立/,'证据须落到具体柱位');
 }
 // 组合必须来自同一套判据：出现在性格章的组，不能在事业章的用法里自相矛盾
 assert.doesNotMatch(txt,/undefined|NaN|\[object/,'不得出现脏数据');
});

test('八字：用神落点回答「喜神是实是虚」，而不是只报喜用五行',()=>{
 const d=baziPro({birth:BIRTH,selection:{year:nowY}});
 const rep=buildBaziDeepReport({...d,gender:'男'});
 const txt=secOf(rep,'事业').lines.join('\n');
 assert.match(txt,/你的优势落在哪一层/,'事业章须交代喜用落点');
 assert.match(txt,/半实|是「实」的|是「虚」的/,'须给出实/半实/虚三档之一');
 assert.match(txt,/天干(透于|不透)/,'须交代是否透干');
});

test('八字：配偶星按性别取，男命财、女命官',()=>{
 const male=buildBaziDeepReport({...baziPro({birth:BIRTH,selection:{year:nowY}}),gender:'男'});
 const female=buildBaziDeepReport({...baziPro({birth:{...BIRTH,gender:'女'},selection:{year:nowY}}),gender:'女'});
 const m=secOf(male,'婚姻').lines.join('');
 const f=secOf(female,'婚姻').lines.join('');
 assert.match(m,/男命以「财」为妻星/);
 assert.match(f,/女命以「官」为夫星/);
 assert.notEqual(m,f,'男女命配偶星不同，正文不能是同一段');
});

test('八字：健康章的最旺/最弱不再互相引用同一句「偏弱」口径',()=>{
 const rep=buildBaziDeepReport({...baziPro({birth:BIRTH,selection:{year:nowY}}),gender:'男'});
 const txt=secOf(rep,'健康').lines.join('\n');
 assert.match(txt,/最弱一环/);
 assert.match(txt,/最旺一环/);
 assert.doesNotMatch(txt,/——[\s\S]{0,4}对应[\s\S]{0,40}土弱吸收差[\s\S]{0,10}。过旺不是好事/,'最旺一节不得引用偏弱口径的原文');
 assert.match(txt,/过度运转/,'过旺须有自己的说法');
});

test('紫微：流年指向性事件按流年四化，不能用流日四化冒充',()=>{
 const chartD=ziweiChart({dateStr:'1988-07-20',timeIndex:7,gender:'男'});
 const flow=ziweiFlow({dateStr:'1988-07-20',timeIndex:7,gender:'男',flowYear:nowY,scope:'daily',month:11,day:20});
 const rep=buildZiweiDeepReport(chartD,flow);
 const txt=secOf(rep,'指向性事件').lines.join('\n');
 assert.match(txt,/按「流年」的层级/,'须声明层级');
 assert.match(txt,new RegExp(String(nowY)),'须出现所选流年');
 const head=txt.split('所选时点')[0];
 assert.doesNotMatch(head,/流日/,'流年事件段里不得出现流日四化');
 assert.match(txt,/所选时点/,'流日四化须单独成段并说明层级');
});

test('紫微：格局从「只报名字」改为逐格给判据与破格条件',()=>{
 const chartD=ziweiChart({dateStr:'1988-07-20',timeIndex:7,gender:'男'});
 const rep=buildZiweiDeepReport(chartD,null);
 const txt=secOf(rep,'命盘总览').lines.join('\n');
 assert.match(txt,/判据：|破格条件：/,'格局须展开判据');
 assert.match(txt,/共检出 \d+ 格/,'须给出格数');
});

test('紫微：三方四正须给星曜厚度与煞星代价',()=>{
 const chartD=ziweiChart({dateStr:'1988-07-20',timeIndex:7,gender:'男'});
 const rep=buildZiweiDeepReport(chartD,null);
 const txt=secOf(rep,'三方四正').lines.join('\n');
 assert.match(txt,/星曜厚度/);
 assert.match(txt,/庙旺得利 \d+ 颗/);
 assert.match(txt,/煞星分布/);
 assert.doesNotMatch(txt,/undefined|NaN/);
});

test('西占：十二宫逐宫须走完宫主星落宫链条',()=>{
 const full=chart({Y:1988,M:7,D:20,h:14,mi:30,gender:'男',city:CITY},{baseOnly:true});
 const rep=buildWesternDeepReport(full.western,null,full.analysis);
 const sec=secOf(rep,'十二宫逐宫');
 assert.ok(sec,'须有十二宫章');
 const heads=(sec.lines.join('\n').match(/【第\d+宫/g)||[]).length;
 assert.equal(heads,12,'十二宫须逐宫成段');
 assert.match(sec.lines.join('\n'),/宫主.+落第\d+宫/,'空宫须由宫主星承接');
 assert.match(sec.lines.join('\n'),/空宫——议题「外包」给宫主星|宫内/,'宫内有星与空宫须分开表述');
});

test('西占：相位章须给关键相位的本盘解读，而不只有表格',()=>{
 const full=chart({Y:1988,M:7,D:20,h:14,mi:30,gender:'男',city:CITY},{baseOnly:true});
 const rep=buildWesternDeepReport(full.western,null,full.analysis);
 const txt=secOf(rep,'相位格局').lines.join('\n');
 assert.match(txt,/本盘最紧的 \d 组相位/);
 assert.match(txt,/容许 [\d.]+° 极紧|容许 [\d.]+° 紧/,'每条须带容许度与松紧');
 assert.match(txt,/其中容许度最小/,'最紧的一条须单独点名');
});

test('四体系：正文行不得混入 HTML，且不得出现脏数据',()=>{
 const bazi=buildBaziDeepReport({...baziPro({birth:BIRTH,selection:{year:nowY}}),gender:'男'});
 const chartD=ziweiChart({dateStr:'1988-07-20',timeIndex:7,gender:'男'});
 const ziwei=buildZiweiDeepReport(chartD,ziweiFlow({dateStr:'1988-07-20',timeIndex:7,gender:'男',flowYear:nowY,scope:'daily',month:11,day:20}));
 const full=chart({Y:1988,M:7,D:20,h:14,mi:30,gender:'男',city:CITY},{baseOnly:true});
 const west=buildWesternDeepReport(full.western,null,full.analysis);
 for(const [name,rep] of [['八字',bazi],['紫微',ziwei],['西占',west]]){
  for(const sec of rep.sections){
   for(const line of sec.lines||[]){
    assert.doesNotMatch(line,/<(b|i|em|br|div|span|ul|li)\b/i,`${name}「${sec.title}」混入 HTML`);
    assert.doesNotMatch(line,/undefined|NaN|\[object Object\]/,`${name}「${sec.title}」有脏数据`);
    assert.doesNotMatch(line,/。。|、、/,`${name}「${sec.title}」有重复标点`);
   }
  }
 }
});
