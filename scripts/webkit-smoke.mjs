/* CI 专用：轻量 WebKit 引擎冒烟（v0.54.2 起）。
 *
 * 为什么单独一份，而不是继续用 FIRSTLIGHT_VIEWPORTS 裁剪 mobile-smoke.mjs：
 * 后者是一条 6 分钟、上百次交互的超长链路（抽屉、分享、四体系详批、多次全页截图）。
 * GitHub macOS runner 上的 WebKit 跑它会随机把主线程卡死，超时位置每次都不同
 * （截图等字体、#moduleButton 点击、抽屉 summary 定位、#mainScrollView evaluate）；
 * 而同一份代码本地 Windows WebKit 同版本跑三视口 8 分 50 秒全过、CI 上 chromium
 * 三视口 62 秒全过，都无法复现。放宽默认超时到 90s、每视口重建浏览器进程、
 * WebKit 只跑单视口都试过，仍复发——卡点与引擎实现无关，是长链路在 runner 上的时序问题。
 *
 * 因此把「WebKit 引擎差异」这一项单独拎出来，用最短、最确定的路径验证：
 * 离线加载 → 生成命盘 → 四体系各自排盘并渲染 → 无控制台异常 / 无 /api/ 请求。
 * 完整交互与视口覆盖继续由 chromium 三视口（mobile-smoke.mjs 默认档）承担，
 * 发布前本地 WebKit 三视口全量冒烟作为兜底，记录在 app-release.json。
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {webkit} from 'playwright';

const PORT='18826';
const server=spawn(process.execPath,['server.mjs'],
 {cwd:process.cwd(),env:{...process.env,PORT},stdio:['ignore','pipe','pipe']});
let browser;
await mkdir('build',{recursive:true});
try{
 await new Promise((resolve,reject)=>{
  server.stdout.once('data',resolve);
  server.once('error',reject);
  server.once('exit',code=>reject(Error('server exit '+code)));
 });
 browser=await webkit.launch({headless:true,
  executablePath:process.env.FIRSTLIGHT_BROWSER_EXECUTABLE||undefined});
 const context=await browser.newContext({viewport:{width:390,height:844},
  isMobile:true,hasTouch:true,deviceScaleFactor:2});
 const page=await context.newPage(),errors=[],api=[];
 page.setDefaultTimeout(45000);
 page.on('pageerror',error=>errors.push(error.message));
 page.on('request',request=>{
  if(new URL(request.url()).pathname.startsWith('/api/'))api.push(request.url());
 });
 await page.goto('http://127.0.0.1:'+PORT+'/',{waitUntil:'networkidle'});

 // 生成命盘：走页面本身的输入表单，不碰任何抽屉/分享长链路
 await page.evaluate(()=>{
  const f=document.getElementById('birthForm');
  const set=(n,v)=>{const el=f.elements[n];el.value=v;
   el.dispatchEvent(new Event('input',{bubbles:true}));
   el.dispatchEvent(new Event('change',{bubbles:true}));};
  set('name','引擎冒烟');set('date','1994-12-15');set('clock','08:30');
  set('lat','30.66');set('lon','104.06');set('tz','8');
 });
 await page.getByRole('button',{name:'生成命盘',exact:true}).click();
 await page.locator('.zi-board').waitFor();

 // 断网后切换四体系：排盘全在本地离线引擎完成，若任何一步偷偷联网，api 会记下来
 await context.setOffline(true);
 const anchors={ziwei:'.zi-board',bazi:'.trend-block',vedic:'.vedic-chart',west:'#westernChart'};
 const seen={};
 for(const [id,sel] of Object.entries(anchors)){
  await page.locator('[data-system-switch="'+id+'"]').click();
  const node=page.locator(sel).first();
  await node.waitFor({state:'visible',timeout:20000});
  seen[id]=await node.evaluate(n=>({
   box:Math.round(n.getBoundingClientRect().width),
   text:(n.textContent||'').trim().length,
   svg:n.querySelector('svg')?1:0
  }));
  assert(seen[id].box>0,id+' 排盘容器应有实际宽度');
 }
 await page.locator('#screen').screenshot({path:'build/mobile-webkit-engine-390.png',animations:'disabled'});
 assert.deepEqual(errors,[],'页面不应有未捕获异常：'+errors.join(' | '));
 assert.deepEqual(api,[],'离线态不应发出 /api/ 请求：'+api.join(' | '));
 console.log('PASS webkit engine smoke 390x844 offline, 4 systems:',JSON.stringify(seen));
}finally{
 await browser?.close();
 server.kill();
}
