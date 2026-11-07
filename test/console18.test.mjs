import test from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM,VirtualConsole} from 'jsdom';
import {readFileSync} from 'node:fs';
import {buildConsole} from '../scripts/build-console.mjs';
import {vedicPro} from '../src/vedic-pro.mjs';
import {midpointLongitude,compositePro} from '../src/composite.mjs';
import {TROPICAL_YEAR_MS} from '../src/time-constants.mjs';
import {ayanamsa} from '../src/ephemeris.mjs';
import {localRequest} from '../src/console-engine.mjs';
import {filterAspects} from '../assets/console/aspects.js';
const birth={Y:1998,M:11,D:21,h:0,mi:2,gender:'女',dateStr:'1998-11-21',timeStr:'00:02',city:{lat:31.23,lon:121.47,tz:8,label:'上海'}},other={...birth,Y:2001,M:5,D:4,dateStr:'2001-05-04'};
const diff=(a,b)=>Math.abs(((a-b+540)%360)-180);
test('Vedic shares Lahiri with the console, has 27 nakshatras and a contiguous 120-year Vimshottari cycle',()=>{
 const r=vedicPro({birth,at:'2026-11-08T00:00Z'}),c=localRequest('/api/console/reading',{birth}).vedic;
 assert.equal(r.planets.length,9);assert.equal(r.ayanamsa,ayanamsa(new Date(r.utc),'lahiri'));assert.equal(r.node,'mean');
 assert.deepEqual(r.planets.map(p=>p.sid),c.planets.map(p=>p.sid));
 for(const p of r.planets){assert.equal(p.house,(p.signIndex-r.lagnaIndex+12)%12+1);assert(p.nakDegree>=0&&p.nakDegree<360/27);assert(p.pada>=1&&p.pada<=4);}
 assert.equal(r.dashas.length,9);assert.equal(r.dashas.reduce((v,d)=>v+d.years,0),120);
 for(const [i,p] of r.dashas.entries()){assert(Math.abs((Date.parse(p.end)-Date.parse(p.start))/TROPICAL_YEAR_MS-p.years)<1e-9);if(i)assert.equal(p.start,r.dashas[i-1].end);}
 assert(r.active.active);assert.equal(r.active.lord,'金星');
 const moon=r.planets.find(p=>p.key==='moon'),first=r.dashas[0];assert.equal(first.lord,moon.nakLord);assert(Date.parse(first.start)<=Date.parse(r.utc));
 assert(vedicPro({birth:{...birth,Y:1800,dateStr:'1800-11-21'},at:'2026-11-08T00:00Z'}).active);
});
test('composite longitude is symmetric at the zodiac seam and antipodes, and actual charts use short-arc midpoint degrees',()=>{
 assert.equal(midpointLongitude(350,10),0);assert.equal(midpointLongitude(10,350),0);assert.equal(midpointLongitude(0,180),midpointLongitude(180,0));
 const a=compositePro({a:birth,b:other}),b=compositePro({a:other,b:birth});
 for(const [i,p] of a.chart.planets.entries()){assert(diff(p.lon,b.chart.planets[i].lon)<1e-9);assert.equal(p.speed,null);assert.equal(p.retro,false);assert(p.house>=1&&p.house<=12);}
 assert.equal(a.chart.cusps.length,12);assert.equal(a.chart.houseSystem,'equal-midpoint');assert(a.method.includes('没有实际事件UT'));
 assert(a.chart.aspects.every(p=>p.applying===null));assert(a.readings[0].text.includes('组合太阳落'));
 const result=localRequest('/api/synastry/chart',{a:birth,b:other,mode:'composite'});assert(result.composite);assert.equal(result.mode,'composite');
});
test('aspect filters use a strict 2-degree boundary and preserve phase unknowns only in all/main',()=>{
 const sample=[{a:'太阳',b:'月亮',angle:0,orb:2,applying:false},{a:'太阳',b:'木星',angle:120,orb:1.99,applying:true},{a:'水星',b:'金星',angle:45,orb:1,applying:null}];
 assert.equal(filterAspects(sample).length,2);assert.deepEqual(filterAspects(sample,'tight').map(x=>x.orb),[1,1.99]);assert.equal(filterAspects(sample,'applying').length,1);assert.equal(filterAspects(sample,'separating').length,1);assert.equal(filterAspects(sample,'all').length,3);
});
test('offline global cases, compact aspects, Vedic, composite and instant sky form complete UI loops',async t=>{
 const js=(await buildConsole(false)).outputFiles[0].text,errors=[],attempted=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const cases=[{id:'mine',name:'小月',category:'我的',fields:birth},{id:'family',name:'跨组亲人',category:'亲人',tags:['重要关注'],fields:{...other,city:{...other.city,label:'杭州'}}}];
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://offline.test',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
  w.fetch=url=>{attempted.push(url);throw Error('offline');};w.localStorage.setItem('xy:cases:v2',JSON.stringify(cases));w.localStorage.setItem('xy_active_profile',JSON.stringify(cases[0]));
 }});t.after(()=>dom.window.close());const w=dom.window,d=w.document,$=s=>d.querySelector(s),all=s=>[...d.querySelectorAll(s)];
 const click=s=>{assert($(s),s);$(s).dispatchEvent(new w.MouseEvent('click',{bubbles:true,cancelable:true}));},until=async(fn,label)=>{for(let i=0;i<130&&!fn();i++)await new Promise(r=>setTimeout(r,40));assert(fn(),label+' '+($('#screen').textContent.slice(0,120)));};
 const script=d.createElement('script');script.textContent=js;d.body.append(script);await until(()=>$('.zi-board'),'initial');
 click('[data-tab=cases]');click('[data-group=我的]');assert.equal(all('[data-case]').length,1);
 const search=value=>{$('#caseSearch').value=value;$('#caseSearch').dispatchEvent(new w.Event('input',{bubbles:true}));};
 for(const q of ['跨组','杭州','重要关注','20010504']){search(q);assert.equal($('[data-case]').dataset.case,'family');assert($('.case-group-badge').textContent.includes('亲人'));}
 search('月');assert.equal($('[data-case]').dataset.case,'mine');search('跨组');click('[data-clear-search]');assert.equal($('[data-case]').dataset.case,'mine');assert.equal($('[data-group=我的]').getAttribute('aria-pressed'),'true');
 search('跨组');click('[data-action=delete]');assert($('#toolSheet').open);assert.equal(JSON.parse(w.localStorage.getItem('xy:cases:v2')).length,2);click('[data-cancel-delete]');assert.equal(all('[data-case]').length,1);
 click('[data-clear-search]');click('[data-tab=chart]');click('#caseDrawerButton');assert($('#caseDrawer').open);click('[data-destination=vedic]');assert.equal(all('[data-vedic-house]').length,12);assert($('#screen').textContent.includes('27 星宿'));click('[data-dasha]');assert($('[data-dasha-detail]').textContent.includes('大运'));
 click('[data-vedic-house="1"]');assert($('#termSheet').open);click('#termSheet [data-close]');
 click('#caseDrawerButton');click('[data-destination=west]');await until(()=>$('#westernChart'),'western');assert(all('.aspect-detail').length<=12);
 click('[data-aspect-filter=all]');assert(all('.aspect-detail').length>12);click('[data-aspect-toggle]');assert(all('.aspect-detail').length<=12);
 click('[data-aspect-filter=applying]');assert(all('.aspect-detail').every(x=>x.dataset.applying==='true'));
 click('#caseDrawerButton');click('[data-destination=synastry]');click('[data-select-other]');click('[data-other=family]');await until(()=>$('.pair-mode-rail')&&$('#screen').textContent.includes('契合度'),'pair');
 click('[data-pair-mode=composite]');await until(()=>$('.pair-reading'),'composite');assert($('#westernChart'));assert(all('.aspect-detail').length<=12);
 const before=w.localStorage.getItem('xy_active_profile'),start=Date.now();click('#instantChartButton');await until(()=>$('#westernChart')&&$('[data-mode=sky][aria-pressed=true]'),'instant');assert.equal(w.localStorage.getItem('xy_active_profile'),before);assert(Date.parse($('[data-instant-caption]').textContent.match(/\d{4}-\d\d-\d\d \d\d:\d\d:\d\d\.\d{3}/)[0].replace(' ','T')+'Z')>=start);
 click('[data-tab=me]');assert(!$('[data-maintenance]').open);click('[data-maintenance]>summary');assert($('[data-app-version]'));assert($('[data-maintenance] [data-diagnostics]'));assert($('[data-maintenance] [data-maintenance-cache]'));
 assert.deepEqual(attempted,[]);assert.deepEqual(errors,[]);
});


test('instant sky works without a profile and never inserts an imaginary birth case',async t=>{
 const js=(await buildConsole(false)).outputFiles[0].text,errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(readFileSync('index.html','utf8'),{url:'https://offline.test',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){w.fetch=()=>{throw Error('offline');};}});t.after(()=>dom.window.close());
 const w=dom.window,doc=w.document,script=doc.createElement('script');script.textContent=js;doc.body.append(script);
 doc.querySelector('#inputSheet [data-close]').click();doc.querySelector('#instantChartButton').click();
 for(let i=0;i<100&&!doc.querySelector('#westernChart');i++)await new Promise(resolve=>setTimeout(resolve,30));
 assert(doc.querySelector('#westernChart'));assert(doc.querySelector('[data-instant-caption]').textContent.includes('默认上海'));
 assert.equal(doc.querySelectorAll('[data-mode]').length,1);assert.equal(w.localStorage.getItem('xy_active_profile'),null);assert.equal(w.localStorage.getItem('xy:cases:v2'),null);
 doc.querySelector('#toolsButton').click();assert.equal(doc.querySelectorAll('[data-west-tool]').length,0);assert(doc.querySelector('[data-share-current]'));assert.deepEqual(errors,[]);
});
