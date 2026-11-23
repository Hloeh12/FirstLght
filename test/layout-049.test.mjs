import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=p=>readFile(new URL(p,import.meta.url),'utf8');

test('v0.49.0 排版1-2：全局滚动条归零、底部留白单一来源',async()=>{
 const css=await read('../assets/console/liquid.css');
 // 滚动条必须宽度 0（保留滚动能力），不得再出现 6px 亮粉条
 assert.match(css,/::-webkit-scrollbar\{width:0;height:0/,'全局滚动条须归零');
 assert.doesNotMatch(css,/::-webkit-scrollbar\{width:6px/,'不得再有 6px 滚动条');
 // spacer 归零，留白只由 #mainScrollView padding 承担
 assert.match(css,/\.bottom-spacer\{height:0!important/,'spacer 须归零避免双重留白');
 assert.match(css,/#mainScrollView,\.main-scroll-view\{padding-bottom:14px!important\}/,'普通页底部留白 14px');
 assert.match(css,/:has\(#chartSystemSwitch:not\(\[hidden\]\)\) #mainScrollView\{[\s\S]{0,80}padding-bottom:30px!important/,'排盘页须让开体系行');
});

test('v0.49.0 排版3：报告段落分段、语义小节、章节去重编号',async()=>{
 const js=await read('../assets/console/full-report.js');
 assert.match(js,/const RP_SUB=\/\^\(生年四化/,'须有语义小节标记');
 assert.match(js,/function rpPack\(sents,max\)/,'须有段落打包函数');
 assert.match(js,/rp-p-sub/,'语义小节须独立成段');
 assert.match(js,/export function cleanSecTitle\(title\)/,'须剥离标题自带中文序号');
 assert.match(js,/\[一二三四五六七八九十百零〇\]\+/,'须含中文序号的剥离规则');
 assert.match(js,/cleanSecTitle\(sec\.title\)/,'章节渲染须使用去重后的标题');
 // 不得再出现「01」+「一、」双重编号
 assert.match(js,/rpt-sec-no">\$\{String\(no\)\.padStart\(2,'0'\)\}<\/span>\$\{esc\(cleanSecTitle/,'徽标与纯标题组合');
});

test('v0.49.0 排版4：紫微宫格字号提升、连线不再雾化',async()=>{
 const css=await read('../assets/console/liquid.css');
 assert.match(css,/\.zi-cell \.zi-major \.zi-star \.term\{font-size:12\.5px!important/,'主星须 12.5px');
 assert.match(css,/\.zi-cell \.zi-assist \.zi-star\{font-size:9\.8px!important;line-height:1\.5!important\}/,'辅星行高须放宽');
 assert.match(css,/\.zi-overlay \.zi-laser\{opacity:\.34!important;stroke-width:1\.15!important;filter:none!important\}/,'飞星线须降透明去发光');
 assert.match(css,/\.zi-overlay \.zi-triad\{fill:rgba\(255,119,170,\.09\)!important\}/,'三合三角须降到 9%');
});

test('v0.49.0 排版5：起盘表单不再重复显示原生日期/时刻控件',async()=>{
 const css=await read('../assets/console/liquid.css');
 const picker=await read('../assets/console/civil-picker.js');
 assert.match(css,/#birthForm \.native-civil-input\{display:none!important\}/,'原生控件须只留数据层');
 assert.match(css,/#birthForm label>output\{[\s\S]{0,200}min-height:44px/,'output 须接管显示');
 assert.match(css,/#birthForm \.time-unknown-wrap\{flex-direction:row!important/,'时刻未知行须横排');
 assert.match(picker,/output\.textContent=input\.value\.replace\('T',' '\)\|\|'未选择'/,'空值文案须为「未选择」');
});

test('v0.49.0 排版6-8：案例页底行归位、印度筛选两级、横滑渐隐通用',async()=>{
 const app=await read('../assets/console/app.js');
 const vedic=await read('../assets/console/vedic.js');
 const css=await read('../assets/console/liquid.css');
 assert.match(app,/class="case-foot"/,'卡片底部须有独立容器');
 assert.match(app,/class="case-detail" data-action="detail"/,'详情须独立成钮');
 assert.match(app,/placeholder="搜索姓名、生辰、城市或标签"/,'搜索框须有占位提示');
 assert.match(vedic,/class="vedic-filters"/,'印度页须有统一筛选容器');
 assert.match(vedic,/vedic-secondary/,'下拉与盘式须并排一行');
 assert.match(css,/\.rail\[data-scrollable\]\[data-scroll-end="0"\]\{/,'横滑渐隐须对所有 rail 生效');
});

test('v0.49.0 排版9-10：行星逐行、卡片等高、焦点圈淡化',async()=>{
 const app=await read('../assets/console/app.js');
 const insight=await read('../assets/console/insight.js');
 const css=await read('../assets/console/liquid.css');
 assert.match(insight,/class="insight-planet-list"/,'九曜须逐星一行');
 assert.match(css,/\.insight-planet-list li\{[\s\S]{0,160}display:flex/,'行星行须左名右位');
 assert.match(css,/\.period-sys-grid\{grid-auto-rows:1fr!important/,'体系卡片须强制等高');
 assert.match(css,/button:focus-visible,a:focus-visible\{[\s\S]{0,90}outline-color:rgba\(255,79,139,\.30\)!important/,'焦点圈须淡化');
 assert.match(css,/\.sheet-head \.icon:focus-visible[\s\S]{0,160}box-shadow:none!important/,'图标按钮焦点须无外圈');
});

test('v0.49.0 排版13：紫微宫位正文分段渲染',async()=>{
 const dep=await read('../www/js/deep-ziwei.js');
 assert.match(dep,/class="rpt-palace-body"/,'宫位正文须有独立容器');
 assert.match(dep,/class="rpt-sihua"/,'生年四化须独立成小节');
 assert.doesNotMatch(dep,/<span>\$\{PALACE_THEME/,'不得再输出整段 span');
});
