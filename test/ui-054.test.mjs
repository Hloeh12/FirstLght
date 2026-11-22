// v0.54.0：时点页左右滑动整段翻页 + 长报告首屏分帧。
// 这层测试只钉「行为契约」与「关键常量」——排版细节仍靠 build/probe-turn*.mjs 在 WebKit 实测。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('滑动翻页：左滑下一步、右滑上一步，位移不足或纵向为主不触发',async()=>{
 const {bindSwipeTurn}=await import('../assets/console/swipe-turn.js');
 const dom=new JSDOM('<div id="h"><div class="rail"><button>a</button></div><div id="inner"></div></div>');
 const {document,Event}=dom.window;
 const host=document.getElementById('h');
 const fire=(el,type,x,y=100)=>{
  const ev=new Event(type,{bubbles:true,cancelable:true});
  // jsdom / headless WebKit 都没有可用的 Touch 构造器，用结构等价的普通 Event 代替：
  // 手势代码只读 touches.length 与 touches[0].clientX/clientY。
  Object.defineProperty(ev,'touches',{value:type==='touchend'?[]:[{identifier:1,clientX:x,clientY:y}]});
  Object.defineProperty(ev,'changedTouches',{value:[{identifier:1,clientX:x,clientY:y}]});
  el.dispatchEvent(ev);
 };
 const drag=(dx,dy=0,startEl=document.getElementById('inner'))=>{
  fire(startEl,'touchstart',200,100);
  fire(startEl,'touchmove',200+dx*0.4,100+dy*0.4);
  fire(startEl,'touchmove',200+dx,100+dy);
  fire(startEl,'touchend',200+dx,100+dy);
 };
 const seen=[];
 bindSwipeTurn(host,dir=>seen.push(dir));
 drag(-90);assert.deepEqual(seen,[1],'左滑应触发下一步');
 drag(90);assert.deepEqual(seen,[1,-1],'右滑应触发上一步');
 drag(-30);assert.deepEqual(seen,[1,-1],'位移不足一个拇指抖动不翻页');
 drag(-70,180);assert.deepEqual(seen,[1,-1],'纵向为主的滑动是滚动页面，不翻页');
 drag(-90,0,document.querySelector('.rail button'));
 assert.deepEqual(seen,[1,-1],'起点在胶囊轨上时横滑是滚动那一排，不抢手势');
});

test('滑动翻页：阈值与忽略名单是常量契约',async()=>{
 const src=read('assets/console/swipe-turn.js');
 assert.match(src,/const LOCK=14/, '锁定阈值 14px');
 assert.match(src,/const THRESHOLD=52/, '翻页阈值 52px');
 assert.match(src,/const IGNORE='\.rail,\[data-swipe-ignore\],input,select,textarea'/, '可横滚容器与表单控件不接管');
 assert.match(src,/Math\.abs\(dx\)>Math\.abs\(dy\)\*1\.25/, '横向位移须明显大于纵向');
});

test('八字逐运：图头上一步/下一步、到边界禁用、滑动与箭头走同一条重算路径',async()=>{
 const chart=read('assets/console/trend-chart.js');
 assert.match(chart,/data-luck-step="-1"/,'图上应有上一步');
 assert.match(chart,/data-luck-step="1"/,'图上应有下一步');
 assert.match(chart,/ci<=0\?' disabled':''/,'第一步时上一步禁用');
 assert.match(chart,/ci>=total-1\?' disabled':''/,'最后一步时下一步禁用');
 const bazi=read('assets/console/bazi.js');
 assert.match(bazi,/function turnLuck\(ctx,dir\)/,'箭头与滑动共用一个翻页函数');
 assert.match(bazi,/const from=trendCycle\(s\.data,s\.pick\)\?\.index\?\?0,to=from\+dir/,'从当前位置位移，不硬编码索引');
 assert.match(bazi,/if\(to<0\|\|to>=list\.length\)return;/,'越界直接忽略，不做回弹');
 assert.match(bazi,/bindSwipeTurn\(periodPanel,dir=>turnLuck\(ctx,dir\)\)/,'滑动接到同一路径');
 assert.match(bazi,/if\(turnDir\)\{playTurn\(ctx,turnDir\);turnDir=0;\}/,'数据回来后再播入场动画，避免先动后变');
 assert.match(bazi,/const line=\$\('\.pc-current',root\);if\(line\)line\.textContent=pickLine\(s\.pick,s\.data\)/,'滑动路径也要更新「正在看」');
});

test('紫微逐限：滑动换大限，基准取当前这一段而非 flow.scope',async()=>{
 const z=read('assets/console/ziwei.js');
 assert.match(z,/function turnDecade\(ctx,dir\)/);
 assert.match(z,/const cur=d\.yearRange\[0\]/,'基准用 railData 归到的那一段');
 assert.match(z,/const to=decades\[\(i<0\?0:i\)\+dir\]/);
 assert.match(z,/setPeriod\(ctx,\{scope:'decadal',year:to\.yearRange\[0\]\}\)/,'翻页仍走既有 setPeriod，不另开假切换');
 assert.match(z,/bindSwipeTurn\(\$\('\.period-control',panel\),dir=>turnDecade\(ctx,dir\)\)/,'每次重绘后重新绑定');
 assert.match(z,/左右滑动换大限/,'文案要告诉用户能滑');
});

test('翻页样式：容器只吃纵向滚动，动画朝翻页方向且尊重减弱动效',async()=>{
 const css=read('assets/console/design.css');
 assert.match(css,/\.period-control\{touch-action:pan-y\}/,'横向手势留给 JS，避免 iOS 侧滑返回抢走');
 assert.match(css,/\.trend-nav \.tnav\{[^}]*background:rgba\(255,255,255,\.72\)!important/,'全局 button !important 底色须显式压回');
 assert.match(css,/@keyframes perTurnNext\{from\{opacity:\.3;transform:translateX\(18px\)\}/);
 assert.match(css,/@keyframes perTurnPrev\{from\{opacity:\.3;transform:translateX\(-18px\)\}/);
 assert.match(css,/prefers-reduced-motion:reduce[\s\S]{0,200}animation:none/,'减弱动效时不播');
 assert.match(css,/@media \(max-width:360px\)\{\s*\.trend-nav \.tnav\{width:20px/,'320 级收窄箭头，不能把图头挤换行');
});

test('首屏分帧：前三章直出、其余进隐藏容器，默认仍是全量',async()=>{
 const {reportHtml}=await import('../assets/console/full-report.js');
 const report={cover:{name:'甲',system:'八字',stamp:'2026-01-01 00:00:00'},title:'测试报告',lead:'导语',kind:'bazi',
  sections:Array.from({length:8},(_,i)=>({title:`第${i+1}章`,lines:[`第 ${i+1} 章正文`]}))};
 const lazy=new JSDOM(reportHtml(report,{lazy:true})).window.document;
 const body=lazy.querySelector('[data-report-body]');
 assert.equal(body.querySelectorAll(':scope > .rpt-sec').length,3,'首屏只直出三章');
 assert.equal(body.querySelector('[data-rpt-lazy]').querySelectorAll('.rpt-sec').length,5,'其余五章挂隐藏容器');
 assert.equal(lazy.querySelectorAll('.rpt-sec').length,8,'八章都得在 DOM 里，收藏与目录才能绑定');
 assert.equal(lazy.querySelector('[data-rpt-lazy]').hasAttribute('hidden'),true,'隐藏容器不参与首帧布局');
 // 默认（导出 / 历史快照 / 测试）必须仍是完整字符串，否则导出会缺章
 const full=new JSDOM(reportHtml(report)).window.document;
 assert.equal(full.querySelector('[data-rpt-lazy]'),null,'默认不分帧');
 assert.equal(full.querySelectorAll('.rpt-sec').length,8);
});

test('首屏分帧：搬运动作与失效兜底都在 app.js 里',async()=>{
 const app=read('assets/console/app.js');
 assert.match(app,/reportHtml\(report,\{lazy:true\}\)/,'报告页走分帧入口');
 assert.match(app,/const pumpLazy=\(\)=>\{[\s\S]{0,420}requestAnimationFrame\(pumpLazy\)/,'逐帧搬运');
 assert.match(app,/host\.remove\(\);rptSecs=null;rptTocBtns=null;/,'搬完后目录/章节缓存必须失效重取');
 assert.match(app,/const flushLazy=\(\)=>\{[\s\S]{0,400}rptSecs=null;rptTocBtns=null;/,'提供一次性补齐');
 // 目录跳转按 offsetTop 定位，隐藏容器里的 offsetTop 恒为 0，必须先补齐
 assert.match(app,/flushLazy\(\);\s*\n\s*const sec=rptDoc\.querySelector/,'目录跳转前补齐');
 assert.match(app,/flushLazy\(\); \/\/ 隐藏章节取不到 innerText/,'复制前补齐');
 assert.match(app,/flushLazy\(\); \/\/ 未就位的章节 innerText 为空/,'收藏前补齐');
});
