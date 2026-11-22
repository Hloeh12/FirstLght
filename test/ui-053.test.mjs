// v0.53.0 交互态：六维可开合、体系互切过渡、长报告章节目录条 + 滚动节流。
// 这一版没有改内容层与排盘逻辑，改的都是「静态长文变成可操作的界面」这件事，
// 所以断言也围绕结构与交互契约，而不是文案。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=p=>readFile(new URL(p,import.meta.url),'utf8');

test('v0.53.0 六维折叠：每维是按钮 + 可开合面板，收起态保留首句摘要',async()=>{
 const ins=await read('../assets/console/insight.js');
 assert.match(ins,/class="is-dim" data-dim="\$\{no\}"/,'每维须带稳定 data-dim 便于定位');
 assert.match(ins,/class="is-dim-head" aria-expanded="false" aria-controls="isDimPanel\$\{no\}"/,'开合头须是按钮并带 aria 关系');
 assert.match(ins,/class="is-dim-panel" id="isDimPanel\$\{no\}" role="region"/,'面板须是独立 region');
 assert.match(ins,/class="is-dim-gist">\$\{gistOf\(body\)\}/,'收起态须由正文首句生成摘要');
 // 摘要必须是「去标签后的纯文本」，否则收起行会露出 <b> 标签
 assert.match(ins,/\.replace\(\/<\[\^>\]\*>\/g,''\)/,'行内 <b> 须直接删掉而不是换成空格（否则摘要里全是断开的空格）');
 assert.match(ins,/\n \.replace\(\/<\\\/p>\|<br/,'段落与换行才算空白');
 assert.match(ins,/if\(t\.length<=86\)return t;/,'短摘要原样返回');
 assert.match(ins,/return t\.slice\(0,cut\)\+'…';/,'超长摘要须在句读处截断并加省略号');
});

test('v0.53.0 六维开合：高度动画走 scrollHeight，并有 transitionend 兜底',async()=>{
 const ins=await read('../assets/console/insight.js');
 assert.match(ins,/export function wireDims\(root\)/,'开合逻辑须可被页面调用');
 assert.match(ins,/const from=animate&&!reducedMotion\(\)\?panel\.getBoundingClientRect\(\)\.height:0/,'过渡起点须先量当前高度');
 assert.match(ins,/const target=open\?panel\.scrollHeight:0/,'展开目标须量 scrollHeight（不猜 max-height）');
 assert.match(ins,/setTimeout\(settle,DIM_DUR\+120\)/,'须有定时兜底：iOS 偶发不触发 transitionend 时不能卡在半开');
 assert.match(ins,/if\(items\[0\]\)setDimOpen\(items\[0\],true,false\)/,'默认只展开第一维，首屏要有真内容');
 assert.match(ins,/allBtn\.textContent=allOpen\?'全部收起':'全部展开'/,'全部开合的按钮文案须随状态切换');
 assert.match(ins,/reducedMotion/,'须尊重 prefers-reduced-motion');
});

test('v0.53.0 六维样式：收起态 hidden 不占位，展开态交还 auto',async()=>{
 const css=await read('../assets/console/liquid.css');
 assert.match(css,/\.is-dim-panel\{overflow:hidden;transition:height \.26s cubic-bezier\(\.32,\.86,\.3,1\)\}/,'面板只留 overflow 与高度过渡');
 assert.match(css,/\.is-dim-panel\[hidden\]\{display:none\}/,'收起态须用 hidden 真正移除，不能只压高度');
 assert.doesNotMatch(css,/\.is-dim-panel\{[^}]*visibility/,'六维面板不得再用 visibility 收起（窄屏上会被过渡延迟拖成空白卡片）');
 assert.match(css,/\.is-dim\.is-open \.is-dim-gist\{display:none\}/,'展开后隐藏摘要行，避免与正文重复');
 // 全局 button 规则带 !important（design.css），开合头必须压回去
 assert.match(css,/\.is-dim-head\{[\s\S]{0,320}background:transparent!important/, '开合头须压过全局 button 底色');
 assert.match(css,/\.is-dims-all\{[\s\S]{0,200}border:1px solid rgba\(255,120,170,\.26\)!important/,'全部开合按钮须自绘边框');
});

test('v0.53.0 体系互切：回顶部 + 内容错峰入场',async()=>{
 const app=await read('../assets/console/app.js');
 assert.match(app,/let lastInsightSystem=null/,'须记录上一体系');
 assert.match(app,/const swapped=lastInsightSystem!==null&&lastInsightSystem!==current/,'首次进入不做切换动画');
 assert.match(app,/class="insight-page\$\{swapped\?' is-swap':''\}"/,'切换时须挂 is-swap');
 assert.match(app,/mv\.scrollTop=0/,'切换后须回到内容顶部（否则停在新体系的中段）');
 assert.match(app,/wireDims\(root\)/,'渲染后须接上开合交互');
 const css=await read('../assets/console/liquid.css');
 assert.match(css,/@keyframes isSwapIn\{from\{opacity:0;transform:translateY\(10px\)\}/,'入场动画只做 opacity + transform');
 assert.match(css,/\.insight-page\.is-swap \.is-deep-wrap\{animation:isSwapIn \.3s[\s\S]{0,60}\.04s both\}/,'须错峰，不是整块同时淡入');
});

test('v0.53.0 长报告：顶部章节定位条随滚动更新',async()=>{
 const app=await read('../assets/console/app.js');
 assert.match(app,/class="rpt-rail" data-rpt-rail aria-hidden="true"/,'报告顶栏下须有定位条');
 assert.match(app,/data-rpt-rail-no/);
 assert.match(app,/data-rpt-rail-title/);
 assert.match(app,/data-rpt-rail-fill/);
 assert.match(app,/rptRailFill\.style\.width=p\+'%'/,'进度细线须跟随阅读进度');
 assert.match(app,/rptRail\.classList\.toggle\('is-live',active>0\)/,'未进正文时不显示章号');
 assert.match(app,/cleanSecTitle\(report\.sections\?\.\[active-1\]\?\.title\|\|''\)/,'定位条须复用去序号的章节名，不能出现「一、」双重编号');
 const css=await read('../assets/console/design.css');
 assert.match(css,/\.rpt-rail\{\n flex:none;position:relative;display:flex;align-items:center;gap:7px;height:28px/,'定位条须固定高度，滚动时不挤动正文');
 assert.match(css,/\.rpt-rail-track\{[\s\S]{0,160}height:1\.5px/,'进度细线须足够细，不与正文抢注意力');
});

test('v0.53.0 长报告滚动节流：节点只查一次，一帧只算一次',async()=>{
 const app=await read('../assets/console/app.js');
 assert.match(app,/const cur=rptSecs\|\|\(rptSecs=\[\.\.\.rptDoc\.querySelectorAll\('\.rpt-sec'\)\]\)/,'章节节点须缓存，不能每次 scroll 重查');
 assert.match(app,/rptTocBtns\|\|\(rptTocBtns=\[\.\.\.d\.querySelectorAll\('\[data-toc\]'\)\]\)/,'目录按钮须缓存');
 assert.match(app,/if\(rptRaf\)return;\n  rptRaf=requestAnimationFrame/,'滚动回调须用 rAF 合并');
 assert.match(app,/rptSecs=null;rptTocBtns=null;/,'时点重排后须让缓存失效');
 // scrollTop 为 0 时不能把 offsetTop 全为 0 的章节判成「已到最后章」
 assert.match(app,/if\(at>2\)for\(let i=0;i<cur\.length;i\+\+\)/,'顶部须直接判为封面，不能一路顶到最后一章');
});
