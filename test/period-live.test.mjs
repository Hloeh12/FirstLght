import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {baziPro} from '../src/bazi-pro.mjs';
import {baziMoment,baziSelOf,baziPickOptions,focusSectionsFor,focusBodyHtml} from '../assets/console/period-report.js';

const read=p=>readFile(new URL(p,import.meta.url),'utf8');
const CITY={name:'成都',lon:104.06,lat:30.66,tz:8};
const BIRTH={name:'时点验收',gender:'男',Y:1994,M:12,D:15,h:8,mi:30,calendar:'solar',city:CITY,useSolarTime:false,lateZishi:'next-day'};

test('时点落点：一句话说清「哪一年·哪一月·第几步大运」，三处文案同源',()=>{
 const data=baziPro({birth:BIRTH,selection:{luck:2,year:2026,month:0}});
 const sel=baziSelOf(data);
 assert.equal(sel.luck,2,'须能从 selected 反查大运索引');
 assert.equal(sel.year,2026,'须能从 selected 反查流年');
 const m=baziMoment(data,sel);
 assert.match(m.title,/^2026 [\u4e00-\u9fa5]{2}年 · [\u4e00-\u9fa5]{2} [\u4e00-\u9fa5]{2}月$/,'落点主行须是「年·干支 + 月·干支」');
 // v0.51.0：次行只给「第N步 + 干支 + 起止年」，节气区间拆到独立 chip（挤一行会折成两截）
 assert.match(m.sub,/^第3步 [\u4e00-\u9fa5]{2}大运 · \d{4}–\d{4}$/,'次行须给步数与起止年');
 assert.match(m.span,/^节气 \d{2}-\d{2} → \d{2}-\d{2}$/,'节气区间须独立成一项');
 // 报告标题用短式：长串会把封面标题挤成三行
 assert.ok(m.brief.length<m.title.length,'短式须比完整落点更短');
 assert.ok(!m.brief.includes('大运'),'短式标题不得带大运段');
});

test('时点级联：换大运后流年落在该运年份内，流月随之重排',()=>{
 const base=baziPro({birth:BIRTH,selection:{}});
 const first=baziPro({birth:BIRTH,selection:{luck:0}});
 const later=baziPro({birth:BIRTH,selection:{luck:5}});
 const c0=base.cycles[0],c5=base.cycles[5];
 assert.ok(first.years[0].year>=c0.startYear,'第1步流年须从该运起年算起');
 assert.ok(later.years[0].year>=c5.startYear,'第6步流年须从该运起年算起');
 assert.ok(later.years.every(y=>y.year>=c5.startYear),'流年列表不得混入该运之外的年份');
 // 两条大运的流月干支不应相同（同一年才可能相同，这里年份区间不重叠）
 const monthsA=first.months.map(m=>m.stem+m.branch).join('');
 const monthsB=later.months.map(m=>m.stem+m.branch).join('');
 assert.notEqual(monthsA,monthsB,'不同大运的流月序列须不同');
 // 选中流年后 selected 必须同时含大运与流年，盘面七列才自洽
 const both=baziPro({birth:BIRTH,selection:{luck:5,year:later.years[0].year}});
 assert.ok(both.selected.some(p=>p.name==='大运'),'须同时选中大运');
 assert.ok(both.selected.some(p=>p.name==='流年'),'须同时选中流年');
});

test('时点速选：流年/流月条的数量与选中态由同一份数据推出',()=>{
 const data=baziPro({birth:BIRTH,selection:{luck:2,year:2026,month:3}});
 const sel=baziSelOf(data);
 const o=baziPickOptions(data,sel);
 assert.equal((o.yearRail.match(/data-bf-year=/g)||[]).length,data.years.length,'流年速览条目数须等于可选年份数');
 assert.equal((o.monthRail.match(/data-bf-month=/g)||[]).length,data.months.length,'流月速选条目数须等于十二节气月');
 assert.equal((o.monthRail.match(/aria-pressed="true"/g)||[]).length,1,'流月条须恰好一个高亮');
 assert.ok(o.monthRail.includes(`data-bf-month="${sel.month}" aria-pressed="true"`),'高亮项须与当前落点一致');
 assert.ok(o.yearRail.includes(`data-bf-year="${sel.year}"`),'流年条须覆盖当前年份');
 assert.match(o.cOpts,/第3步/,'大运选项须带步数与干支，但不带「（xxxx起）」长尾');
 assert.doesNotMatch(o.cOpts,/（\d{4}起）/,'报告内下拉不得再带长尾，避免被原生控件裁字');
});

test('切换时点后正文章节真的换掉（不是只换盘面）',()=>{
 const a=baziPro({birth:BIRTH,selection:{luck:2,year:2026,month:0}});
 const b=baziPro({birth:BIRTH,selection:{luck:2,year:2026,month:7}});
 const secA=focusSectionsFor('bazi','luck','2026 丙午年 立春庚寅月',a);
 const secB=focusSectionsFor('bazi','luck','2026 丙午年 立秋戊申月',b);
 const flat=s=>s.map(x=>x.title+'::'+x.lines.join('|')).join('\n');
 assert.notEqual(flat(secA),flat(secB),'不同流月的详批正文不得相同');
 const htmlA=focusBodyHtml(secA),htmlB=focusBodyHtml(secB);
 assert.match(htmlA,/<section class="rpt-sec"/,'正文须是可整段替换的 rpt-sec 结构');
 assert.notEqual(htmlA,htmlB,'替换用的 HTML 必须不同');
 // 章节标题前缀须带当前落点，换时点后前缀也跟着换
 assert.ok(secA.some(s=>s.title.includes('立春')),'章节前缀须含当前流月');
 assert.ok(secB.some(s=>s.title.includes('立秋')),'换月后章节前缀须更新');
});

test('功能去重：时点页只出时点详批，本命全局归洞见页',async()=>{
 const app=await read('../assets/console/app.js');
 assert.doesNotMatch(app,/data-pmode/,'时点页不得再有「本命全报告 + 时点章」二选一');
 assert.match(app,/const mode='focus'/,'时点页固定输出时点专属详批');
 assert.match(app,/const PERIOD_SYS_META/,'四体系入口仍保留');
 assert.match(app,/本命终身结构 · 不含流年流月/,'洞见页须明确自己只管本命全局');
 assert.match(app,/只看这个时点的盘与详批|只出这个时点的盘与详批/,'时点页须写明分工');
 assert.match(app,/两处不重复/,'两页须写明互不重复');
});

test('报告外壳：正文与目录都可原地重排，导出仍取同一份 report',async()=>{
 const fr=await read('../assets/console/full-report.js');
 assert.match(fr,/<div data-report-body>\$\{report\.body\}<\/div>/,'正文须包一层可替换容器');
 assert.match(fr,/export \{tocItems\}/,'目录条目须导出供重排');
 const app=await read('../assets/console/app.js');
 assert.match(app,/const items=tocItems\(secs\)/,'切换后须重排目录');
 assert.match(app,/navEl\.innerHTML=items/,'浮层目录须同步重排');
 assert.match(app,/report\.sections=secs/,'报告对象须同步，导出才不会导出旧正文');
 assert.match(app,/report\.lead=`【时点专属详批】只围绕/, '导语须随落点更新');
});
