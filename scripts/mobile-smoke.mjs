import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile} from 'node:fs/promises';
const release=JSON.parse(await readFile(new URL('../app-release.json',import.meta.url),'utf8'));
import {chromium,webkit} from 'playwright';
const engine=process.env.FIRSTLIGHT_BROWSER||'chromium';
const browserType={chromium,webkit}[engine];
if(!browserType)throw Error('Unknown smoke-test browser');

const processServer=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'18824'},stdio:['ignore','pipe','pipe']});
let browser;
await mkdir('build',{recursive:true});
try{
 await new Promise((resolve,reject)=>{
  processServer.stdout.once('data',resolve);
  processServer.once('error',reject);
  processServer.once('exit',code=>reject(Error('server exit '+code)));
 });
 browser=await browserType.launch({headless:true});
 for(const [width,height] of [[390,844],[320,568],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[],api=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/'))api.push(request.url());});
  await page.goto('http://127.0.0.1:18824/',{waitUntil:'networkidle'});
  const checkSheet=async()=>{
   await page.locator('dialog[open]').evaluateAll(nodes=>Promise.all(nodes.flatMap(n=>n.getAnimations().map(a=>a.finished.catch(()=>{})))));
   const boxes=await page.locator('dialog[open]').evaluateAll(nodes=>nodes.map(n=>{
    const b=n.getBoundingClientRect(),s=n.querySelector('.sheet-body');
    return {top:b.top,bottom:b.bottom,height:b.height,viewport:innerHeight,scroll:s&&getComputedStyle(s).overflowY};
   }));
   assert(boxes.length>0);
   for(const b of boxes){assert(b.top>=-.5&&b.bottom<=b.viewport+.5,JSON.stringify(b));assert(b.height<=b.viewport*.80+1);assert.equal(b.scroll,'auto');}
  };
  await checkSheet();
  await page.locator('#inputSheet').getByLabel('命主姓名',{exact:true}).fill('布局示例');
  await page.locator('#inputSheet').getByLabel('出生日期',{exact:true}).fill('1998-11-21');
  await page.locator('#inputSheet').getByLabel('出生时刻',{exact:true}).fill('00:02');
  await page.locator('#inputSheet').getByLabel('纬度',{exact:true}).fill('30.361448');
  await page.locator('#inputSheet').getByLabel('经度',{exact:true}).fill('109.492552');
  await context.setOffline(true);
  await page.getByRole('button',{name:'生成命盘',exact:true}).click();
  await page.locator('.zi-board').waitFor();
  assert.equal(await page.locator('[data-palace]').count(),12);
  await page.screenshot({path:'build/mobile-'+engine+'-ziwei-'+width+'.png'});
  const useSystem=async(id,sub)=>{
   await page.getByRole('button',{name:'快捷案例',exact:true}).click();
   await checkSheet();
   await page.locator('summary').filter({hasText:'天机排盘工坊'}).click();
   await page.locator('summary').filter({hasText:sub}).click();
   await page.locator('[data-destination="'+id+'"]').click();
  };
  await useSystem('bazi','东方盘');
  await page.locator('[data-rail="流年"]').first().click();
  await page.locator('.period-guidance').waitFor();
  assert.equal(await page.locator('.bazi-ghost').count(),0);
  await page.locator('[data-bazi-data]').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));
  await page.screenshot({path:'build/mobile-'+engine+'-bazi-'+width+'.png'});
  await page.getByRole('button',{name:'当前页面功能',exact:true}).click();
  await checkSheet();
  assert.equal(await page.locator('#toolSheet [data-bazi-tool]').count(),5);
  await page.locator('#toolSheet [data-close]').click();
  await useSystem('west','西洋盘');
  await page.locator('#westernChart').waitFor();
  assert(await page.getByRole('meter').count()>0);
  assert((await page.locator('.energy-fill').first().evaluate(n=>getComputedStyle(n).backgroundImage)).includes('255, 119, 170'));
  await page.screenshot({path:'build/mobile-'+engine+'-western-'+width+'.png'});
  await page.locator('[data-wheel-focus="inner-sun"]').click();
  await page.locator('[data-wheel-card]:not([hidden])').waitFor();
  assert((await page.locator('[data-wheel-card]').textContent()).includes('太阳'));
  assert((await page.locator('.aspect-detail').first().textContent()).includes('标准角'));
  await page.getByRole('button',{name:'当前页面功能',exact:true}).click();
  await page.locator('[data-astro-config]').click();
  await checkSheet();
  const internal=await page.locator('#toolSheet .sheet-body').evaluate(n=>({height:n.clientHeight,content:n.scrollHeight}));
  assert(internal.content>internal.height,'settings must scroll inside the bounded sheet');
  await page.locator('#toolSheet [data-close]').click();
  await page.locator('[data-tab="me"]').click();
  assert.equal(await page.locator('[data-app-version]').textContent(),`FirstLght ${release.version}（${release.build}）`);
  if(process.env.GITHUB_SHA)assert((await page.locator('[data-app-build]').textContent()).includes(process.env.GITHUB_SHA.slice(0,7)));
  assert((await page.locator('[data-app-build]').textContent()).includes('构建标识'));
  await page.locator('[data-release-history]').click();
  await checkSheet();
  await page.locator('.release-entry').nth(1).locator('summary').click();
  assert((await page.locator('#toolSheet').textContent()).includes('9903fbf'));
  await page.screenshot({path:'build/mobile-'+engine+'-releases-'+width+'.png'});
  await page.locator('#toolSheet [data-close]').click();
  await page.locator('[data-draw-guide]').click();
  await page.getByText('今日能量天平',{exact:true}).waitFor();
  const metrics=await page.evaluate(()=>{
   const main=document.querySelector('#mainScrollView');
   main.scrollTop=main.scrollHeight;
   const footer=document.querySelector('.soul-footer').getBoundingClientRect();
   const tab=document.querySelector('#bottomNav').getBoundingClientRect();
   const body=getComputedStyle(document.body);
   return {root:document.documentElement.scrollTop,bodyY:document.body.scrollTop,overflow:body.overflow,position:body.position,scroll:main.scrollTop,
    footer:footer.bottom,tab:tab.top,z:getComputedStyle(document.querySelector('#bottomNav')).zIndex,wide:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  assert.equal(metrics.root,0);assert.equal(metrics.bodyY,0);
  assert.equal(metrics.overflow,'hidden');assert.equal(metrics.position,'fixed');assert.equal(metrics.z,'300');
  assert(metrics.scroll>0);assert(metrics.footer<=metrics.tab+1);
  assert(metrics.wide<=metrics.viewport);
  const layers=await page.evaluate(()=>{
   const top=document.querySelector('#appTopBar').getBoundingClientRect(),main=document.querySelector('#mainScrollView').getBoundingClientRect(),nav=document.querySelector('#bottomNav').getBoundingClientRect();
   const buttons=[...document.querySelectorAll('#appTopBar button')].filter(b=>b.getClientRects().length).map(b=>{const r=b.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom};});
   return {top:top.bottom,main:main.top,navHeight:nav.height,buttons,width:innerWidth,rootX:document.documentElement.getBoundingClientRect().left};
  });
  assert(layers.top<=layers.main+.5);assert.equal(layers.navHeight,56);assert.equal(layers.rootX,0);
  for(let i=0;i<layers.buttons.length;i++){
   const b=layers.buttons[i];assert(b.left>=0&&b.right<=layers.width);if(i)assert(b.left>=layers.buttons[i-1].right);
  }
  await page.getByRole('button',{name:'快捷案例',exact:true}).click();
  await checkSheet();
  await page.locator('#caseDrawer [data-diagnostics]').click();
  await checkSheet();
  await page.locator('[data-check-device]').click();
  await page.getByText('5/5 项通过',{exact:true}).waitFor();
  await page.locator('#toolSheet [data-close]').click();
  await page.locator('#activeProfile').click();
  await checkSheet();
  await page.locator('#inputSheet').getByLabel('纬度',{exact:true}).fill('70');
  await page.getByRole('button',{name:'生成命盘',exact:true}).click();
  await useSystem('west','西洋盘');
  await page.locator('.house-warning').waitFor();
  assert((await page.locator('.house-warning').textContent()).includes('高纬度'));
  await page.screenshot({path:'build/mobile-'+engine+'-polar-'+width+'.png'});
  assert.deepEqual(api,[]);assert.deepEqual(errors,[]);
  await page.screenshot({path:'build/mobile-'+engine+'-'+width+'.png'});
  console.log('PASS',width+'px','offline charts, Chinese aspects, sheet limits and TabBar clearance');
  await context.close();
 }
} catch(error){
 if(browser)for(const context of browser.contexts())for(const page of context.pages()){
  await page.screenshot({path:'build/mobile-'+engine+'-failure.png'}).catch(()=>{});
 }
 throw error;
} finally{
 await browser?.close();
 processServer.kill();
}
