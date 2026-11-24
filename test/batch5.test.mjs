// v0.71.0 批次5：暗色模式 / 新手引导 / 全球城市库。jsdom 探针 + 纯计算断言。
import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {WORLD_CITIES,searchWorldCities} from '../src/cities-world.mjs';
import {resolveBirthTime} from '../src/birth.mjs';

// ---- 1. 全球城市库抽查 ----
test('batch5 世界城市库：数量/分组抽查与搜索',()=>{
 assert.ok(WORLD_CITIES.length>=120,'世界城市应至少 120 城，实际 '+WORLD_CITIES.length);
 const by=city=>WORLD_CITIES.find(c=>c.nameEn===city);
 for(const [en,fields] of [
  ['Tokyo',['lat','lon','tz']],['New York',['lat','lon','tz']],['Paris',['lat','lon','tz']],
  ['Singapore',['tz']],['Sydney',['tz']],['Sao Paulo',['tz']],['Cairo',['tz']],['Auckland',['tz']],['Dubai',['tz']],['Honolulu',['tz']]]){
  const c=by(en);
  assert.ok(c,'缺城市 '+en);
  for(const f of fields)assert.ok(c[f]!=null&&c[f]!=='',en+' 缺字段 '+f);
 }
 assert.equal(by('Tokyo').tz,'Asia/Tokyo');
 assert.equal(by('New York').tz,'America/New_York');
 assert.equal(by('Paris').tz,'Europe/Paris');
 assert.ok(searchWorldCities('Tokyo').some(c=>c.nameEn==='Tokyo'));
 assert.ok(searchWorldCities('东').some(c=>c.name==='东京'));
 assert.ok(searchWorldCities('new').some(c=>c.nameEn==='New York'));
 assert.equal(searchWorldCities('').length,0);
});

test('batch5 世界城市排盘：东京 1960 (+09:00 无夏令) 与纽约 1990-07 (EDT -04:00)',()=>{
 const tk=resolveBirthTime({Y:1960,M:1,D:1,h:12,mi:0,city:{lat:35.6762,lon:139.6503,tz:'Asia/Tokyo',tzName:'Asia/Tokyo'}});
 assert.equal(tk.offsetMin,540,'东京 1960-01-01 12:00 应为 UTC+9');
 const ny=resolveBirthTime({Y:1990,M:7,D:1,h:12,mi:0,city:{lat:40.7128,lon:-74.006,tz:'America/New_York',tzName:'America/New_York'}});
 assert.equal(ny.offsetMin,-240,'纽约 1990-07-01 12:00 应为 EDT UTC-4');
 const nyWinter=resolveBirthTime({Y:1990,M:1,D:1,h:12,mi:0,city:{tzName:'America/New_York'}});
 assert.equal(nyWinter.offsetMin,-300,'纽约冬季应为 EST UTC-5');
});

// ---- 2. 暗色模式：外观模块 + CSS 覆盖段 + jsdom class 切换 ----
test('batch5 暗色模式：三态切换、localStorage 持久化、跟随系统',async()=>{
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://offline.test'});
 const win=dom.window,doc=win.document;
 win.matchMedia=q=>({matches:false,media:q,addEventListener(){},removeEventListener(){}});
 globalThis.document=doc;globalThis.matchMedia=win.matchMedia;
 globalThis.localStorage=win.localStorage;
 try{
  const ap=await import('../assets/console/appearance.js');
  win.localStorage.clear();
  doc.body.className='';
  // 默认 auto：浅色系统 → light class
  assert.equal(ap.appearanceMode(),'auto');
  assert.equal(ap.resolvedAppearance(),'light');
  ap.applyAppearance('auto',{cssOnly:true});
  assert.ok(doc.body.classList.contains('light'),'auto+浅色系统须打 body.light');
  assert.ok(!doc.body.classList.contains('dark'));
  // 显式深色：class 正确 + 持久化
  ap.setAppearance('dark',{cssOnly:true});
  assert.equal(ap.appearanceMode(),'dark');
  assert.equal(win.localStorage.getItem('xy:appearance'),'dark');
  assert.ok(doc.body.classList.contains('dark'),'须打 body.dark');
  assert.ok(!doc.body.classList.contains('light'));
  // 显式浅色持久化
  ap.setAppearance('light',{cssOnly:true});
  assert.equal(win.localStorage.getItem('xy:appearance'),'light');
  assert.ok(doc.body.classList.contains('light'));
  // auto 清标记
  ap.setAppearance('auto',{cssOnly:true});
  assert.equal(win.localStorage.getItem('xy:appearance'),null,'auto 须清除持久化标记');
 }finally{delete globalThis.document;delete globalThis.matchMedia;delete globalThis.localStorage;}
 // CSS 侧：两个样式表都有 body.dark 集中覆盖段
 const design=await readFile(new URL('../assets/console/design.css',import.meta.url),'utf8');
 const liquid=await readFile(new URL('../assets/console/liquid.css',import.meta.url),'utf8');
 for(const css of [design,liquid]){
  assert.match(css,/body\.dark\{--paper:#17121a/,'暗色覆盖段变量起点');
  assert.match(css,/body\.dark \.liquid-glass,body\.dark \.card/,'卡片暗色覆盖');
 }
 assert.match(design,/body\.dark \.zi-cell\{background/,'紫微宫格暗色覆盖');
 assert.match(liquid,/body\.dark \.liquid-bottom-nav/,'底部导航暗色覆盖');
 assert.match(liquid,/body\.dark \.report-content/,'报告正文暗色覆盖');
 assert.match(liquid,/body\.dark \.sheet,body\.dark \.drawer/,'抽屉/弹层暗色覆盖');
 // app.js 接线
 const app=await readFile(new URL('../assets/console/app.js',import.meta.url),'utf8');
 assert.match(app,/import \{installAppearance,setAppearance/,'app.js 须引入外观模块');
 assert.match(app,/installAppearance\(\);/,'启动时应用外观');
 assert.match(app,/name="appearance"/,'设置表单须有 appearance 字段');
 assert.match(app,/setAppearance\(state\.settings\.appearance\)/,'保存设置须即时切换');
 assert.doesNotMatch(app,/语言选项|zh-tw|zh_TW/i,'不得残留繁体/语言选项');
});

// ---- 3. 新手引导 ----
test('batch5 新手引导：onboarding 模块契约与 jsdom 流程',async()=>{
 const src=await readFile(new URL('../assets/console/onboarding.js',import.meta.url),'utf8');
 assert.match(src,/xy_onboarded/,'须用 xy_onboarded 标记');
 // 关闭即打标记：× / 遮罩关闭也不能绕过（否则换 tab 重弹）
 assert.match(src,/MutationObserver/,'须监听 dialog 关闭并打标记');
 assert.match(src,/export function maybeShowOnboarding/,'须导出 maybeShowOnboarding');
 assert.equal((src.match(/\{title:/g)||[]).length,4,'须有 4 步文案');
 for(const kw of ['上一步','下一步','跳过','完成'])assert.ok(src.includes(kw),'缺按钮文案 '+kw);
 // jsdom 真实 DOM 流程：未标记 → 出浮层 → 点完成 → 打标记 → 再调不再出
 const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://offline.test'});
 const win=dom.window,doc=win.document;
 globalThis.document=doc;globalThis.localStorage=win.localStorage;
 try{
  win.localStorage.clear();
  const ob=await import('../assets/console/onboarding.js');
  let opened=null;
  const ctx={
   sheet(id,title,bodyHtml){
    const d=doc.createElement('dialog');d.innerHTML=bodyHtml;opened=d;return d;
   },
   close(d){opened=null;},
   tell(){}
  };
  const click=el=>el.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));
  const dlg=ob.maybeShowOnboarding(ctx);
  assert.ok(dlg,'首次应出引导浮层');
  assert.ok(dlg.querySelector('[data-onboarding]'));
  assert.equal(win.localStorage.getItem('xy_onboarded'),null);
  for(let i=0;i<4;i++){
   const next=dlg.querySelector('[data-ob-next]');
   assert.ok(next,'第 '+(i+1)+' 步缺下一步/完成按钮');
   click(next);
  }
  assert.equal(win.localStorage.getItem('xy_onboarded'),'1','完成后须打标记');
  assert.equal(opened,null,'完成后须关闭浮层');
  const again=ob.maybeShowOnboarding(ctx);
  assert.equal(again,null,'已标记后不再出现');
  // 清标记后跳过也应打标记
  win.localStorage.clear();
  const dlg2=ob.maybeShowOnboarding(ctx);
  assert.ok(dlg2);
  click(dlg2.querySelector('[data-ob-skip]'));
  assert.equal(win.localStorage.getItem('xy_onboarded'),'1','跳过也须打标记');
 }finally{delete globalThis.document;delete globalThis.localStorage;}
 const app=await readFile(new URL('../assets/console/app.js',import.meta.url),'utf8');
 assert.match(app,/maybeShowOnboarding\(ctx\)/,'render() 须调用引导');
});
