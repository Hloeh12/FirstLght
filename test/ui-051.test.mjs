import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL(p,import.meta.url),'utf8');

test('v0.51.0 洞见页头：两个幽灵胶囊移出页头，改成底部报告操作区',async()=>{
 const app=await read('../assets/console/app.js');
 // 页头只留 kicker/h1/副标题，不再挂「深度报告 / 导出」
 const header=app.slice(app.indexOf('<header class="page-head"><div class="page-head-main"><p class="kicker">FIRST LIGHT · 本命全局'),app.indexOf('</header>',app.indexOf('FIRST LIGHT · 本命全局')));
 assert.ok(header.length>0,'须能定位洞见页头');
 assert.doesNotMatch(header,/ghost-pill/,'页头不得再出现幽灵胶囊按钮');
 assert.doesNotMatch(header,/data-open-report/,'页头不得再挂深度报告入口');
 // 操作区：主行动 + 次级导出，都带语义标签
 assert.match(app,/class="is-tools" aria-label="报告操作"/,'须有独立报告操作区');
 assert.match(app,/class="is-tool is-tool-main" data-open-report/,'深度报告须为主行动');
 assert.match(app,/class="is-tool is-tool-alt" data-share-current/,'导出须为次级行动');
 assert.match(app,/is-tool-ico[\s\S]{0,220}<svg viewBox="0 0 20 20"/,'操作区图标须为内联 SVG，不依赖 Unicode 字形');
});

test('v0.51.0 时点杆：‹ › 夹持大运下拉，不再飘在右上角',async()=>{
 const pr=await read('../assets/console/period-report.js');
 assert.match(pr,/class="bf-luck-row"/,'大运须有独立行容器');
 assert.match(pr,/<button type="button" class="bf-step" data-bf-step="-1"[\s\S]{0,400}<select data-bf="luck"[\s\S]{0,200}<button type="button" class="bf-step" data-bf-step="1"/,'左右箭头须夹住下拉');
 assert.doesNotMatch(pr,/bf-clock-text/,'旧横排落点卡结构须移除');
 assert.match(pr,/data-bf-moment-sub[\s\S]{0,200}bf-clock-span/,'次行与节气区间须分开渲染');
 const css=await read('../assets/console/liquid.css');
 assert.match(css,/\.bf-luck-row\{grid-column:1\/-1;display:flex;align-items:\S+\}/,'夹持行须横向 flex 并与下拉同基线');
 assert.match(css,/\.bf-step\{[\s\S]{0,200}width:40px;height:41px/,'箭头须与下拉同高');
 // iOS 防缩放规则会把 select 顶到 16px，必须带 !important 才能压回 13px
 assert.match(css,/\.bf-picks select\{[\s\S]{0,600}font-size:13px!important/,'下拉字号须带 !important 压过 16px 防缩放规则');
 assert.match(css,/\.bf-year-pick select,\.bf-month-pick select\{font-size:12\.5px!important\}/,'流年流月须单独定字号');
});

test('v0.51.0 速选条居中：进报告与每次级联都把选中项滚到中间',async()=>{
 const app=await read('../assets/console/app.js');
 assert.match(app,/function centerBfRails\(host\)/,'须有速选条居中函数');
 assert.match(app,/rail\.scrollLeft\+=Math\.round\(\(ob\.left-rb\.left\)-\(rb\.width-ob\.width\)\/2\)/,'须按 rect 差值居中（不依赖 offsetParent）');
 assert.match(app,/requestAnimationFrame\(\(\)=>centerBfRails\(d\)\)/,'打开报告后须居中一次');
 assert.match(app,/if\(yrail\)yrail\.innerHTML=yearRail;\n   centerBfRails\(box\)/,'级联重算后须重新居中');
});

test('v0.51.0 体系键归一：合盘/其它页进入洞见时不出现空体系名与无选中',async()=>{
 const app=await read('../assets/console/app.js');
 assert.match(app,/const order=\['bazi','ziwei','west','vedic'\];/,'须列出四体系白名单');
 assert.match(app,/const current=order\.includes\(state\.system\)\?state\.system:'west'/,'非四体系须回落到西洋，保证标题与分段器一致');
 assert.match(app,/insightModel\(current,r,\{flow:state\.chartState\?\.ziwei\?\.flow\|\|null\}\)/,'模型须吃归一后的体系键');
});

test('v0.51.0 配置面板：移除无作用的「五行配色」',async()=>{
 const app=await read('../assets/console/app.js');
 assert.doesNotMatch(app,/'palette','五行配色'/,'配置面板不得再有五行配色行');
 assert.doesNotMatch(app,/applyPalette/,'不得再保留只改 7 个变量的空转函数');
 const css=await read('../assets/console/design.css');
 assert.doesNotMatch(css,/data-palette/,'样式层不得再留切换分支');
});

test('v0.51.0 弹层可读性：sheet 改为不透明，遮罩加深',async()=>{
 const css=await read('../assets/console/liquid.css');
 // design.css 里 .sheet.liquid-glass 有 !important 的 0.84 透明底，必须用同等选择器压制
 assert.match(css,/\.sheet\.liquid-glass,\.drawer\.liquid-glass,\.sheet,\.drawer,dialog#termSheet\{\n[\s\S]{0,200}background:linear-gradient\(180deg,#fffdfe 0%,#fff6fa 100%\)!important/,'弹层须为不透明底（玻璃感交给高光与阴影）');
 assert.match(css,/\.sheet::backdrop,\.drawer::backdrop\{background:rgba\(72,26,46,\.34\)!important\}/,'遮罩须加深，避免下层文字抢注意力');
});

test('v0.51.0 洞见阅读节奏：摘要卡 / 六维列表 / 深度折叠 / 主行动四级',async()=>{
 const ins=await read('../assets/console/insight.js');
 assert.match(ins,/class="is-summary card liquid-glass"/,'须有主轴摘要卡');
 assert.match(ins,/class="is-sec-head"><span class="is-sec-no">六维<\/span><h2>本命结构拆解<\/h2>/,'六维须有独立段落标题');
 assert.match(ins,/class="is-dim"><span class="is-dim-no">/,'每维须有编号与独立容器');
 assert.match(ins,/class="is-chips">\$\{chips\.map/,'每维须有盘面证据胶囊');
 assert.match(ins,/is-deep-wrap/,'深度详批须为折叠块');
 assert.match(ins,/展开其余 \$\{rest\.length\} 章详批/,'长报告须保留展开/收起');
 // 第一维不再重复摘要卡已经给过的证据
 assert.equal((ins.match(/dim\('01'[\s\S]{0,900}?\[\]\),/g)||[]).length,4,'四体系第一维都不得重复摘要胶囊');
});
