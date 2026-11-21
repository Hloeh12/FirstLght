import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {buildWesternDeepReport} from '../www/js/deep-west.js';
import {buildVedicDeepReport} from '../www/js/deep-vedic.js';

test('洞见页接深度知识库：内容层统一在 insight.js，四体系都拼深度摘要',async()=>{
 const ins=await readFile(new URL('../assets/console/insight.js',import.meta.url),'utf8');
 assert.match(ins,/import \{buildBaziDeepReport\} from '\.\.\/\.\.\/www\/js\/deep-bazi\.js'/,'须导入八字深度库（旧版漏接，导致八字只有四句话）');
 assert.match(ins,/import \{buildZiweiDeepReport\} from '\.\.\/\.\.\/www\/js\/deep-ziwei\.js'/,'须导入紫微深度库');
 assert.match(ins,/import \{buildWesternDeepReport\} from '\.\.\/\.\.\/www\/js\/deep-west\.js'/,'须导入西洋深度库');
 assert.match(ins,/import \{buildVedicDeepReport\} from '\.\.\/\.\.\/www\/js\/deep-vedic\.js'/,'须导入印占深度库');
 assert.match(ins,/buildBaziDeepReport\(reading\.bazi\)/,'八字须调用深度库');
 assert.match(ins,/buildVedicDeepReport\(reading\.vedic\)/,'印占须调用深度库');
 assert.match(ins,/buildWesternDeepReport\(reading\.western,undefined,reading\.analysis\|\|reading\.western\?\.analysis\)/,'西洋须调用深度库并传 dignity 分析');
 assert.match(ins,/buildZiweiDeepReport\(reading\.ziwei,opt\.flow\|\|null\)/,'紫微须调用深度库并传流运');
 assert.match(ins,/digest:report\?digestHtml\(report\):''/,'深度摘要须挂在模型上统一渲染');
});

test('深度知识库确有充足章节：西洋/印占远超洞见页旧的 4 段模板',()=>{
 const w={planets:[{key:'sun',name:'太阳',sign:'狮子座',house:1,degree:{degrees:5,minutes:20}},{key:'moon',name:'月亮',sign:'水瓶座',house:7,degree:{degrees:12}}],asc:{sign:'狮子'},mc:'金牛',aspects:[{a:'太阳',b:'月亮',type:'对冲',angle:180,orb:2.4}]};
 const v={lagna:'狮子',ayan:'Lahiri',balanceYears:12.6,planets:[{name:'太阳',sign:'狮子',house:1,nakshatra:'Magha',pada:2},{name:'月亮',sign:'天蝎',house:4,nakshatra:'Anuradha',pada:1}],dashas:[{lord:'罗睺',start:'1983-01-27',end:'2001-01-26'}]};
 const rw=buildWesternDeepReport(w),rv=buildVedicDeepReport(v);
 const chars=r=>r.sections.reduce((n,s)=>n+(s.title?.length||0)+(s.lines||[]).join('').length,0);
 assert.ok(rw.sections.length>=5,'西洋深度报告至少 5 章');
 assert.ok(rv.sections.length>=10,'印占深度报告至少 10 章');
 assert.ok(chars(rw)>500,'西洋深度报告正文须远超旧 248 字模板');
 assert.ok(chars(rv)>800,'印占深度报告正文须远超旧 370 字模板');
});

test('西洋相位解读差异化：不再逐条套「回到盘面核对…」同一句',async()=>{
 const w=await readFile(new URL('../assets/console/western.js',import.meta.url),'utf8');
 assert.match(w,/function aspectStory\(a,cross(?:,[\w=]+)?\)/,'须有按相位差异化的解读函数');
 assert.match(w,/const ASPECT_STORY=/,'须有按角度区分的相位剧情表');
 assert.match(w,/const PLANET_DOMAIN=/,'须有按星体区分的领域词表');
 assert.match(w,/aspectStory\(a,cross(?:,[\w]+)?\)/,'逐条证据须调用差异化解读');
 assert.doesNotMatch(w,/回到盘面核对这些星体的落宫与现实事项/,'旧的逐条重复句须彻底移除');
 for(const angle of [0,60,90,120,180])
  assert.match(w,new RegExp(String(angle)+':'),`相位 ${angle}° 须有专属剧情`);
});

test('时点胶囊行横滑提示：溢出标记、渐隐、箭头，且只滚自身不跳页',async()=>{
 const ui=await readFile(new URL('../assets/console/ui.js',import.meta.url),'utf8');
 assert.match(ui,/function selectedRails\(root\)/,'须有 rails 处理函数');
 assert.match(ui,/data-scrollable/,'溢出时须标记可横滑');
 assert.match(ui,/data-scroll-end/,'须根据滚动位置更新末端状态');
 assert.match(ui,/rail\.addEventListener\('scroll',mark/,'滚动时须更新提示');
 assert.match(ui,/rail\.scrollLeft\+=a\.left-b\.left-8/,'选中项只滚 rail 自身 scrollLeft（不 scrollIntoView）');
 const css=await readFile(new URL('../assets/console/liquid.css',import.meta.url),'utf8');
 assert.match(css,/\.rail\[data-scrollable\]\[data-scroll-end="0"\]/,'渐隐须只在可横滑且未到底时生效');
 assert.match(css,/mask-image:linear-gradient/,'须有右侧渐隐提示');
 assert.match(css,/content:'›'/,'须有箭头提示');
});

test('底部导航精修：模块入口改文字胶囊、体系行更贴底栏、留白收紧',async()=>{
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/class="rail-grid"[^>]*><span class="rail-grid-label"[^>]*>模块<\/span>/,'模块入口须为文字标签而非孤立菱形图标');
 assert.doesNotMatch(html,/id="moduleButton"[^>]*<svg/,'模块按钮不得再是纯 SVG 图标');
 const css=await readFile(new URL('../assets/console/liquid.css',import.meta.url),'utf8');
 assert.match(css,/\.rail-grid\{[^}]*width:auto!important/,'模块胶囊须与体系胶囊同风格');
 assert.match(css,/\.bottom-spacer\{height:170px!important/,'底部留白须收紧');
});

test('四体系目见深度一致：都是六个结构维 + 深度详批 + 终身周期，不再「紫微万字、八字四句」',async()=>{
 const ins=await readFile(new URL('../assets/console/insight.js',import.meta.url),'utf8');
 for(const fn of ['baziBlocks','ziweiBlocks','westernBlocks','vedicBlocks'])
  assert.match(ins,new RegExp('function '+fn+'\\('),fn+' 须存在');
 // 每个体系必须产出 6 个 dim(...) 与 1 个 summary
 const count=(name)=>{const i=ins.indexOf('function '+name+'(');const j=ins.indexOf('/* ----',i+10);return (ins.slice(i,j>i?j:undefined).match(/dim\('0\d'/g)||[]).length;};
 for(const fn of ['baziBlocks','ziweiBlocks','westernBlocks','vedicBlocks'])
  assert.equal(count(fn),6,fn+' 须产出六个结构维');
 const app=await readFile(new URL('../assets/console/app.js',import.meta.url),'utf8');
 assert.match(app,/summaryHtml\(model\)\+dimsHtml\(model\)/,'摘要与六维须同源渲染');
 assert.match(app,/digestBlockHtml\(model\)/,'深度详批须统一挂载');
 assert.match(app,/lifecycleBlockHtml\(current,r\)/,'终身周期须统一挂载');
});
test('配置弹窗按钮语义化：不再用含糊的裸「生成」',async()=>{
 const app=await readFile(new URL('../assets/console/app.js',import.meta.url),'utf8');
 assert.match(app,/configRow\('report','生成深度报告',state\.reading\?'全文详批 · 可导出'/,'报告入口须写明产出（全文详批·可导出）');
 assert.match(app,/configRow\('share','分享当前长图',state\.tab==='chart'\?'导出图片'/,'分享入口须写明导出图片');
 assert.doesNotMatch(app,/configRow\([^\n]*'生成'/,'配置行不得再用裸「生成」作价值文案');
});

test('文字挤压/留白精修：神煞格行距、时间口径条与顶部按钮不贴边',async()=>{
 const css=await readFile(new URL('../assets/console/liquid.css',import.meta.url),'utf8');
 assert.match(css,/\.bazi-grid \.bg-shensha\{[^}]*gap:3px 3px!important[^}]*line-height:1\.5!important/,'神煞格须加大间距与行高防重叠');
 assert.match(css,/\.time-basis-note\{margin:8px 0 10px!important\}/,'时间口径条须上下留白');
 assert.match(css,/section\[aria-label="四柱八字"\]>\.spread\{[^}]*padding-bottom:4px!important/,'生克合化按钮行须与盘面留白');
});
