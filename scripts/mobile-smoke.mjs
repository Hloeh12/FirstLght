import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
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
 browser=await browserType.launch({headless:true,executablePath:process.env.FIRSTLIGHT_BROWSER_EXECUTABLE||undefined});
 for(const [width,height] of [[390,844],[320,568],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const page=await context.newPage(),errors=[],api=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('request',request=>{if(new URL(request.url()).pathname.startsWith('/api/'))api.push(request.url());});
  await page.goto('http://127.0.0.1:18824/',{waitUntil:'networkidle'});
  const viewportGap=await page.evaluate(()=>{
   const scroll=document.getElementById('mainScrollView').getBoundingClientRect();
   const nav=document.getElementById('bottomNav').getBoundingClientRect();
   return {scrollBottom:scroll.bottom,navTop:nav.top};
  });
  assert(viewportGap.scrollBottom<=viewportGap.navTop-8,'scroll viewport must end above navigation: '+JSON.stringify(viewportGap));
  const checkSheet=async()=>{
   await page.locator('dialog[open]').evaluateAll(nodes=>Promise.all(nodes.flatMap(n=>n.getAnimations().map(a=>a.finished.catch(()=>{})))));
   const boxes=await page.locator('dialog[open]').evaluateAll(nodes=>nodes.map(n=>{
    const b=n.getBoundingClientRect(),s=n.querySelector('.sheet-body');
    return {drawer:n.id==='caseDrawer',width:b.width,top:b.top,bottom:b.bottom,height:b.height,viewport:innerHeight,viewportWidth:innerWidth,scroll:s&&getComputedStyle(s).overflowY};
   }));
   assert(boxes.length>0);
   for(const b of boxes){assert(b.top>=-.5&&b.bottom<=b.viewport+.5,JSON.stringify(b));if(b.drawer){assert(Math.abs(b.height-b.viewport)<1);assert(b.width<=Math.min(b.viewportWidth*.82,340)+1);}else assert(b.height<=b.viewport*.80+1);assert.equal(b.scroll,'auto');}
  };
  await checkSheet();
  // Simulate the iOS visual viewport shrinking while the layout viewport stays fixed.
  await page.locator('#inputSheet input').first().focus();
  await page.evaluate(()=>{
   Object.defineProperty(visualViewport,'height',{value:innerHeight*.5,configurable:true});
   visualViewport.dispatchEvent(new Event('resize'));
  });
  await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--sheet-limit')!=='');
  const keyboard=await page.locator('#inputSheet').evaluate(n=>{
   const b=n.getBoundingClientRect(),head=n.querySelector('.sheet-head').getBoundingClientRect();
   return {top:b.top,bottom:b.bottom,height:b.height,limit:visualViewport.height,closeTop:head.top,closeBottom:head.bottom};
  });
  assert(keyboard.height<=keyboard.limit*.88+1,JSON.stringify(keyboard));
  assert(keyboard.top>=0&&keyboard.closeTop>=0&&keyboard.closeBottom<=keyboard.limit+1,JSON.stringify(keyboard));
  await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
  await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--sheet-limit')==='');
  await page.locator('#inputSheet').getByLabel('命主姓名',{exact:true}).fill('布局示例');
  await page.locator('#inputSheet').getByLabel('出生日期',{exact:true}).fill('1998-11-21');
  assert.equal(await page.locator('#inputSheet input[type=date],#inputSheet input[type=time]').count(),0);
  await page.locator('#inputSheet .civil-picker summary').click();
  await page.locator('#inputSheet [data-day="22"]').click();
  assert.equal(await page.locator('#inputSheet [name=date]').inputValue(),'1998-11-22');
  await page.locator('#inputSheet [name=date]').fill('1998-11-21');
  await page.locator('#inputSheet').getByLabel('出生时刻',{exact:true}).fill('00:02');
  await page.locator('#inputSheet').getByLabel('纬度',{exact:true}).fill('30.361448');
  await page.locator('#inputSheet').getByLabel('经度',{exact:true}).fill('109.492552');
  if(width<=390){
   const layout=await page.locator('#birthForm').evaluate(form=>{
    const sheet=form.closest('dialog').getBoundingClientRect();
    const fields=[...form.querySelectorAll(':scope > label')].map(n=>n.getBoundingClientRect());
    return {sheet:{left:sheet.left,right:sheet.right},fields:fields.map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}))};
   });
   for(const [i,r] of layout.fields.entries()){
    assert(r.left>=layout.sheet.left-1&&r.right<=layout.sheet.right+1,'birth field outside sheet '+i);
    if(i)assert(r.top>=layout.fields[i-1].bottom-1,'birth fields overlap '+(i-1)+'/'+i);
   }
  }
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
  await page.getByRole('button',{name:'快捷案例',exact:true}).click();
  await checkSheet();
  assert.equal(await page.locator('#mainScrollView').evaluate(n=>getComputedStyle(n).overflowY),'hidden');
  await page.screenshot({path:'build/mobile-'+engine+'-drawer-'+width+'.png'});
  await page.locator('#caseDrawer summary').filter({hasText:'命理口径与算法配置'}).click();
  await page.locator('#prefs [name=place]').focus();
  await page.evaluate(()=>{Object.defineProperty(visualViewport,'height',{value:innerHeight*.5,configurable:true});visualViewport.dispatchEvent(new Event('resize'));});
  await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--drawer-content-height')!=='');
  const drawerKeyboard=await page.locator('#caseDrawer .dialog-content').evaluate(n=>({bottom:n.getBoundingClientRect().bottom,limit:visualViewport.height}));
  assert(drawerKeyboard.bottom<=drawerKeyboard.limit+1,JSON.stringify(drawerKeyboard));
  await page.evaluate(()=>{delete visualViewport.height;visualViewport.dispatchEvent(new Event('resize'));});
  await page.waitForFunction(()=>document.documentElement.style.getPropertyValue('--drawer-content-height')==='');

  await page.locator('#caseDrawer [data-close]').click();
  const shareSnapshot=async(kind)=>{
   await page.evaluate(()=>{
    window.__sharedChart=null;
    Object.defineProperty(window,'webkit',{configurable:true,value:{messageHandlers:{shareChart:{postMessage:data=>{window.__sharedChart=data;}}}}});
   });
   await page.getByRole('button',{name:'当前页面功能',exact:true}).click();
   await page.locator('[data-share-current]').click();
   try{await page.waitForFunction(()=>typeof window.__sharedChart==='string',null,{timeout:15000});}catch(error){throw Error(kind+' share: '+await page.locator('[data-share-status]').textContent()+' | '+error.message);}
   const data=Buffer.from((await page.evaluate(()=>window.__sharedChart)).split(',')[1],'base64');
   assert.equal(data.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(data.readUInt32BE(16),1440);assert(data.readUInt32BE(20)>500);
   await writeFile('build/mobile-'+engine+'-share-'+kind+'-'+width+'.png',data);
   await page.locator('#toolSheet [data-close]').click();
  };
  await page.locator('[data-mode=flying]').click();
  await shareSnapshot('ziwei');
  await useSystem('bazi','东方盘');
  await page.locator('[data-rail="流年"]').first().click();
  await page.locator('.period-guidance').waitFor();
  const firstPeriod=await page.locator('.period-guidance').textContent();
  await page.locator('[data-tab=insights]').click();
  assert((await page.locator('.period-guidance').textContent()).includes('八字'));
  assert(await page.locator('[data-natal-background]').count()===1);
  await page.locator('[data-tab=chart]').click();
  await page.locator('[data-rail="流年"]').nth(1).click();
  await page.waitForFunction(previous=>document.querySelector('.period-guidance')?.textContent!==previous,firstPeriod);
  await page.locator('[data-tab=insights]').click();
  assert((await page.locator('.period-guidance').textContent()).includes('八字'));
  await page.locator('[data-tab=chart]').click();
  assert.equal(await page.locator('.bazi-ghost').count(),0);
  await page.locator('[data-bazi-data]').evaluate(n=>Promise.all(n.getAnimations().map(a=>a.finished.catch(()=>{}))));
  await page.screenshot({path:'build/mobile-'+engine+'-bazi-'+width+'.png'});
  await page.getByRole('button',{name:'当前页面功能',exact:true}).click();
  await checkSheet();
  assert.equal(await page.locator('#toolSheet [data-bazi-tool]').count(),5);
  await page.locator('#toolSheet [data-close]').click();
  await shareSnapshot('bazi');
  await useSystem('vedic','印度盘');
  await page.locator('.vedic-chart').waitFor();assert.equal(await page.locator('[data-vedic-house]').count(),12);
  await page.getByRole('button',{name:'当前页面功能',exact:true}).click();
  assert.equal(await page.locator('[data-vedic-action]').count(),5);
  await page.locator('[data-vedic-action=states]').click();
  assert(await page.locator('[data-vedic-states] .term').count()>0);
  await page.locator('[data-layout=south]').click();assert.equal(await page.locator('[data-vedic-house]').count(),12);await page.locator('[data-varga="60"]').click();assert((await page.locator('#vedic h2').first().textContent()).includes('D60'));assert.equal(await page.locator('.vedic-dasha').count(),4);await page.locator('[data-dasha]').last().click();
  const south=await page.locator('.south-chart').evaluate(n=>({chart:n.getBoundingClientRect().toJSON(),houses:[...n.querySelectorAll('.south-house')].map(h=>({box:h.getBoundingClientRect().toJSON(),scroll:h.scrollWidth,client:h.clientWidth}))}));
  assert(south.houses.every(h=>h.box.left>=south.chart.left-1&&h.box.right<=south.chart.right+1&&h.scroll<=h.client+1),'south chart must contain every house');
  assert((await page.locator('[data-dasha-detail]').textContent()).includes('大运'));
  const vedicPeriod=await page.locator('[data-dynamic-insight]').textContent();await page.locator('[data-v-time="1"]').click();await page.waitForFunction(previous=>document.querySelector('[data-dynamic-insight]')?.textContent!==previous,vedicPeriod);
  await page.screenshot({path:'build/mobile-'+engine+'-vedic-'+width+'.png'});
  await shareSnapshot('vedic');
  await useSystem('west','西洋盘');
  await page.locator('#westernChart').waitFor();
  await page.locator('[data-mode=transit]').click();await page.waitForFunction(()=>document.querySelector('[data-dynamic-insight]')?.textContent.includes('西洋'));
  const westPeriod=await page.locator('[data-dynamic-insight]').textContent();await page.locator('[data-unit=month][data-step="1"]').click();await page.waitForFunction(previous=>document.querySelector('[data-dynamic-insight]')?.textContent!==previous,westPeriod);
  await page.locator('[data-tab=insights]').click();assert((await page.locator('#insightContent').textContent()).includes('西洋'));
  await page.locator('[data-tab=chart]').click();
  assert(await page.getByRole('meter').count()>0);
  assert((await page.locator('.energy-fill').first().evaluate(n=>getComputedStyle(n).backgroundImage)).includes('255, 119, 170'));
  await page.screenshot({path:'build/mobile-'+engine+'-western-'+width+'.png'});
  await page.locator('[data-wheel-focus="inner-sun"]').click();
  await page.locator('[data-wheel-card]:not([hidden])').waitFor();
  assert((await page.locator('[data-wheel-card]').textContent()).includes('太阳'));
  assert((await page.locator('.aspect-detail').first().textContent()).includes('标准角'));
  assert(await page.locator('.aspect-detail').count()<=12);
  await page.locator('[data-aspect-filter=all]').click();assert(await page.locator('.aspect-detail').count()>12);
  await page.locator('[data-aspect-toggle]').click();assert(await page.locator('.aspect-detail').count()<=12);
  await page.locator('[data-aspect-filter=tight]').click();
  await page.locator('[data-aspect-filter=main]').click();
  await page.getByRole('button',{name:'当前页面功能',exact:true}).click();
  await page.locator('[data-astro-config]').click();
  await checkSheet();
  const internal=await page.locator('#toolSheet .sheet-body').evaluate(n=>({height:n.clientHeight,content:n.scrollHeight}));
  assert(internal.content>internal.height,'settings must scroll inside the bounded sheet');
  await page.locator('#toolSheet [data-close]').click();
  await page.locator('#instantChartButton').click();await page.locator('#restoreOriginalButton:not([hidden])').waitFor();await page.locator('#restoreOriginalButton').click();assert.equal(await page.locator('#restoreOriginalButton').isHidden(),true);
  await page.locator('#mainScrollView').evaluate(n=>n.scrollTop=500);await page.locator('#appTopBar').evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true})));await page.waitForFunction(()=>document.querySelector('#mainScrollView').scrollTop<5);
  assert(await page.locator('[data-tab=cases]').isVisible(),JSON.stringify(await page.evaluate(()=>({body:document.body.className,dialogs:[...document.querySelectorAll('dialog[open]')].map(n=>n.id),nav:getComputedStyle(document.querySelector('#bottomNav')).visibility,instant:document.querySelector('#restoreOriginalButton').hidden}))));
  await page.locator('[data-tab=cases]').click();await page.waitForTimeout(400);
  const samples=await page.evaluate(async()=>{
   const nav=document.querySelector('#bottomNav'),pill=document.querySelector('#tabLiquidPill'),button=nav.querySelector('[data-tab=me]');
   button.click();const positions=[];
   for(let i=0;i<25;i++){
    await new Promise(resolve=>requestAnimationFrame(resolve));const p=pill.getBoundingClientRect(),b=button.getBoundingClientRect();
    positions.push({x:p.left,y:b.top,animations:pill.getAnimations().map(a=>a.effect.getKeyframes().map(k=>k.scale))});
   }
   return positions;
  });
  assert(samples.every((s,i)=>!i||s.x>=samples[i-1].x-.6),'pill must never rebound');
  assert(Math.max(...samples.map(s=>s.y))-Math.min(...samples.map(s=>s.y))<=1.6,'selected tab moves only 1.5 px');
  assert(samples.every(s=>s.animations.flat().every(scale=>scale===undefined)),'pill has no scale keyframes');
  for(const tab of ['cases','chart','insights','me']){
   await page.locator('[data-tab="'+tab+'"]').click();
   await page.waitForTimeout(500);
   const pill=await page.locator('#tabLiquidPill').evaluate(n=>{
    const p=n.getBoundingClientRect(),b=document.querySelector('#bottomNav [aria-current=page]').getBoundingClientRect();
    return {left:p.left,right:p.right,top:p.top,bottom:p.bottom,tabLeft:b.left,tabRight:b.right,tabTop:b.top,tabBottom:b.bottom};
   });
   assert(pill.left>=pill.tabLeft-1&&pill.right<=pill.tabRight+1,JSON.stringify(pill));
  }
  await page.locator('[data-tab="me"]').click();
  await page.locator('[data-maintenance]>summary').click();
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
  assert(layers.top<=layers.main+.5);assert.equal(layers.navHeight,60);assert.equal(layers.rootX,0);
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
  await page.locator('[data-tab=cases]').click();
  await page.locator('[data-create]').click();
  await page.locator('#inputSheet').getByLabel('命主姓名',{exact:true}).fill('跨组同伴');
  await page.locator('#inputSheet').getByLabel('出生日期',{exact:true}).fill('2001-05-04');
  await page.locator('#birthForm [name=category]').selectOption({label:'亲人'});
  await page.locator('#inputSheet').getByLabel('纬度',{exact:true}).fill('31.23');
  await page.locator('#inputSheet').getByLabel('经度',{exact:true}).fill('121.47');
  await page.getByRole('button',{name:'生成命盘',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#inputSheet').open&&document.querySelector('[data-profile-name]').textContent.includes('跨组同伴'));
  await page.locator('[data-tab=cases]').click();await page.locator('[data-group=我的]').click();
  await page.locator('#caseSearch').fill('跨组同伴');
  assert.equal(await page.locator('[data-case]').count(),1);assert((await page.locator('.case-group-badge').textContent()).includes('亲人'));
  await page.locator('[data-action=delete]').click();await checkSheet();await page.locator('[data-cancel-delete]').click();
  assert.equal(await page.locator('[data-case]').count(),1);
  await page.locator('[data-clear-search]').click();assert((await page.locator('[data-case]').first().textContent()).includes('布局示例'));
  await page.locator('[data-tab=chart]').click();await page.getByRole('button',{name:'快捷案例',exact:true}).click();await page.locator('summary').filter({hasText:'关系星系'}).click();await page.locator('summary').filter({hasText:'双向案例'}).click();await page.locator('[data-destination=synastry]').click();
  await page.locator('[data-select-other]').click();await page.locator('[data-other]').first().click();
  await page.getByText(/契合度 \d+%/).first().waitFor();
  await page.locator('[data-pair-mode=composite]').click();await page.locator('.pair-reading').waitFor();assert.equal(await page.locator('#westernChart').count(),1);
  await page.screenshot({path:'build/mobile-'+engine+'-composite-'+width+'.png'});await shareSnapshot('composite');
  await useSystem('west','西洋盘');const active=await page.evaluate(()=>localStorage.getItem('xy_active_profile'));await page.locator('#instantChartButton').click();
  await page.locator('[data-mode=sky][aria-pressed=true]').waitFor();await page.locator('#westernChart').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('xy_active_profile')),active);
  assert((await page.locator('[data-instant-caption]').textContent()).includes('本地'));await shareSnapshot('instant');
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
