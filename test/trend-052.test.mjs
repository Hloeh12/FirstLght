import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {trendChart,trendCycle,trendYears} from '../assets/console/trend-chart.js';

const read=p=>readFile(new URL(p,import.meta.url),'utf8');

/* 固定盘面：2003 起运、每步十年、共 40 年流年（对应真机上「x 轴糊成数字墙」那种盘：
   yearCount = max(10, 2026-2003+12) = 35，旧版会把 35 个年份标签全画上去）。 */
const years=Array.from({length:40},(_,i)=>({
 year:2003+i,ganzhi:`甲${'子丑寅卯辰巳午未申酉戌亥'[i%12]}`,element:'木',branchElement:'水',
 support:48+(i%9)*2
}));
const cycles=Array.from({length:8},(_,i)=>({
 index:i,age:4+i*10,startYear:2003+i*10,endYear:2012+i*10,
 stem:'壬',branch:'戌',ganzhi:`壬${'戌酉申未午巳辰卯'[i]}`,element:'水',branchElement:'土',
 support:44+i*2
}));
const chart=(pick,natal)=>{
 const d={cycles:cycles.map(c=>({index:c.index,age:c.age,startYear:c.startYear,stem:c.stem,branch:c.branch})),
  trend:{natal:natal||{support:55,kind:'中和',useful:[],caution:[]},years,cycles}};
 return trendChart(d,pick);
};

test('v0.52.0 趋势图：只画当前生效大运的十年，柱数恒为 10',()=>{
 const html=chart({luck:2});
 assert.equal((html.match(/class="ty/g)||[]).length,10,'柱数须恒为 10');
 assert.equal((html.match(/class="ta/g)||[]).length,10,'年份轴须与柱一一对应');
 assert.match(html,/class="trend-axis" style="--n:10"/,'轴须走 HTML 网格并带列数');
 assert.match(html,/2023–2032/,'图头须标出本步十年区间');
 // 隔一步的数据不得混进来
 assert.doesNotMatch(html,/data-pick="2022"/,'上一步的流年不得出现在本步视图');
 assert.doesNotMatch(html,/data-pick="2033"/,'下一步的流年不得出现在本步视图');
});

test('v0.52.0 趋势图：未选时点默认取今年所在那一步，不越界',()=>{
 const nowYear=new Date().getFullYear();
 const hit=trendCycle({cycles},{});
 const idx=cycles.findIndex(c=>c.startYear<=nowYear&&nowYear<=c.endYear);
 assert.equal(hit.index,idx>=0?idx:0,'默认应落在今年所在大运');
 assert.equal(hit.endYear,hit.startYear+9,'endYear 须按整年补齐（交运日所在年归下一步）');
 const ys=trendYears({cycles,trend:{years}},{});
 assert.ok(ys.length===10,'默认视图同样只取十年');
 assert.ok(ys.every(y=>y.year>=hit.startYear&&y.year<=hit.endYear));
});

test('v0.52.0 趋势图：本命基准线 + 柱体不再退化成一色',()=>{
 const neutral=chart({luck:0});
 assert.match(neutral,/class="tbase"/,'须画本命基准虚线');
 assert.match(neutral,/class="tbase-lab"[^>]*>本命 55\.0%/,'基准线须标出本命扶助度');
 // 中和盘（喜忌皆空）：按相对基准起落分档，三色都应出现而不是全中性
 const fills=[...neutral.matchAll(/class="tb"[^>]*style="fill:var\(--fl-(\w+)\)"/g)].map(m=>m[1]);
 assert.deepEqual([...new Set(fills)].sort(),['caution','neutral','useful'],'中和盘也须三色可分');
 // 有明确喜忌时走五行归属：木为用神、水为忌神，则木柱红、水柱蓝
 const graded=chart({luck:0},{support:55,kind:'身强',useful:['木'],caution:['水']});
 assert.match(graded,/--fl-useful/);
 assert.match(graded,/--fl-caution/);
 assert.doesNotMatch(graded,/高于本命/,'有喜忌时图例须用五行语义，不得退回相对口径');
});

test('v0.52.0 趋势图：年份轴由 HTML 承载，不在 SVG 里画文字',()=>{
 const html=chart({luck:1});
 const svg=html.slice(html.indexOf('<svg'),html.indexOf('</svg>'));
 assert.doesNotMatch(svg,/<text class="tx/,'SVG 内不得再画年份标签（会被 preserveAspectRatio 拉伸并重叠）');
 assert.match(svg,/preserveAspectRatio="xMidYMid meet"/,'须等比缩放，避免圆点被拉成椭圆');
 assert.match(html,/class="ta/,'年份标签须由 HTML 按钮承载');
});

test('v0.52.0 趋势图：八张大卡片换成八格索引，删掉与大运轨重复的旧结构',()=>{
 const html=chart({luck:3});
 assert.doesNotMatch(html,/cyc-band/,'旧的大运卡片带须移除');
 assert.doesNotMatch(html,/cyc-seg/,'旧的大运卡片须移除');
 assert.equal((html.match(/class="cm-seg/g)||[]).length,8,'八步须各占一格');
 assert.equal((html.match(/class="cm-dot/g)||[]).length,8,'每格一个喜忌色点');
 assert.match(html,/data-rail="大运" data-pick="0"/,'迷你条须能直接切大运');
 assert.match(html,/aria-label="第1步 壬戌 2003至2012 4岁起 扶助度 44%"/,'每格须有无障碍全称');
 assert.match(html,/一生大运/,'须有分组说明');
});

test('v0.52.0 后端：trend.natal 补齐喜忌与地支五行，前端才判得出用神柱',async()=>{
 const src=await read('../src/bazi-pro.mjs');
 assert.match(src,/natal:\{support:natalStrength\.support,kind:natalStrength\.kind,useful:natalStrength\.useful\|\|\[\],caution:natalStrength\.caution\|\|\[\]\}/,'trend.natal 须带 useful/caution');
 assert.match(src,/years:years\.map\(y=>\(\{year:y\.year,ganzhi:y\.stem\+y\.branch,element:y\.stemElement,branchElement:y\.branchElement,support:supportOf\(y\)\}\)\)/,'流年须带地支五行');
 assert.match(src,/cycles:cycles\.map\(c=>\(\{[^}]*branchElement:c\.branchElement/,'大运须带地支五行');
});

test('v0.52.0 时间轴：删掉与大运轨重复的行、流年轨与图同步',async()=>{
 const b=await read('../assets/console/bazi.js');
 // 大运轨已由迷你条取代（同能切大运，且旧轨里的「本命」胶囊是 sticky，会压住相邻项）
 assert.doesNotMatch(b,/row\('大运'/,'时间轴不得再有独立「大运」行');
 assert.doesNotMatch(b,/'natal','本命'/,'sticky 的「本命」胶囊须移除（header 已有恢复本命）');
 assert.match(b,/const yearRail=trendYears\(d,pick\)\.map\(y=>\[y\.year,y\.year\+' '\+y\.ganzhi\]\)/,'流年轨须与图同源，且用 ganzhi（trend.years 无 stem/branch 字段）');
 assert.match(b,/return row\('流年',yearRail,pick\.year\)/,'流年轨须为时间轴首行');
});

test('v0.52.0 样式：年份轴不被拉伸、选中格不被全局粉底污染',async()=>{
 const css=await read('../assets/console/design.css');
 assert.match(css,/\.trend-axis\{display:grid;grid-template-columns:repeat\(var\(--n,10\),minmax\(0,1fr\)\)/,'年份轴须为等分网格');
 assert.match(css,/\.trend-axis \.ta\{[^}]*background:transparent!important/,'轴按钮须去掉全局底色');
 // 全局 button[aria-pressed=true] 是 !important 粉底，特异性高于单类 .cm-seg
 assert.match(css,/\.cyc-mini \.cm-seg,\.cyc-mini \.cm-seg\.on\{background:transparent!important/,'选中格须压掉全局粉底');
 assert.match(css,/\.trend-svg \.tbase\{stroke:rgba\(120,52,84,\.42\);stroke-width:1;stroke-dasharray:3 3\}/,'本命基准线须为虚线');
});
