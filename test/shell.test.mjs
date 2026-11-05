import {JSDOM,VirtualConsole} from 'jsdom';
import {spawn} from 'node:child_process';import os from 'node:os';import path from 'node:path';
import fs from 'node:fs';import assert from 'node:assert/strict';
const proc=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'18767',DATA_DIR:fs.mkdtempSync(path.join(os.tmpdir(),'firstlight-shell-'))},stdio:['ignore','pipe','pipe']});process.on('exit',()=>proc.kill());await new Promise((resolve,reject)=>{proc.stdout.once('data',resolve);proc.once('error',reject);});try{
const base='http://127.0.0.1:18767',html=fs.readFileSync('index.html','utf8');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));let locateCallback;
const d=new JSDOM(html,{url:base,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.fetch=(url,opts)=>fetch(new URL(url,base),opts);w.localStorage.setItem('xy:settings:v2',JSON.stringify({place:'默认上海',lat:31.23,lon:121.47,tz:8}));w.alert=()=>{};w.prompt=()=> '同学';w.confirm=()=>true;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.navigator,'geolocation',{value:{getCurrentPosition(cb){locateCallback=cb}}});}});const w=d.window,doc=w.document;for(const file of ['chart-views.js','app-shell.js','context-menu.js','interactive-reading.js']){const script=doc.createElement('script');script.textContent=fs.readFileSync('assets/'+file,'utf8');doc.body.append(script);}const $=s=>doc.querySelector(s);await new Promise(r=>setTimeout(r,300));
assert.equal(w.state.uiMode,'input');assert($('#inputSheet').open);assert($('#resultsHost').hidden);assert(!$('#editActions').contains($('#overviewBtn')));assert.equal($('#q').value,'默认上海');assert.equal($('#lat').value,'31.23');assert.equal($('#lat').step,'any');$('#locateA').click();locateCallback({coords:{latitude:30.361448,longitude:109.492552}});assert.equal($('#lat').value,'30.361448');assert($('#lat').checkValidity());assert.equal($('#q').value,'当前定位位置');
$('#locateA').click();const stale=locateCallback;$('#lat').value='31.123456';$('#lat').dispatchEvent(new w.Event('input',{bubbles:true}));stale({coords:{latitude:22,longitude:110}});assert.equal($('#lat').value,'31.123456');
$('#overviewBtn').click();assert.equal($('#halfSheet').hidden,false);assert.equal($('#dualToggle'),null);$('[data-system="bazi"]').click();assert($('#bazi').classList.contains('on'));assert.equal($('#halfSheet').hidden,true);$('#btnDrawer').click();$('[data-root="me"]').click();assert(!$('#appDrawer').classList.contains('active'));
const waitFor=async predicate=>{
 for(let i=0;i<150&&!predicate();i++)await new Promise(r=>setTimeout(r,100));
 assert(predicate(),'expected reading state before timeout');
};
assert(!$('#pageChart').contains($('#f')));
$('[data-root="chart"]').click();
$('#profileName').value='测试命主';
$('#castBtn').click();
await waitFor(()=>!w.state.isComputing);
assert.equal(w.state.uiMode,'viewing');assert(!$('#inputSheet').open);assert($('#inputSheet').contains($('#editActions')));assert(!$('#readingSummary').hidden);assert(!$('#readingAnalysis').hidden);$('#readingSummary').click();assert.equal(w.state.uiMode,'editing');assert($('#inputSheet').open);assert(!$('#resultsHost').hidden);assert(!$('#readingAnalysis').hidden);
$('#closeInputSheet').click();assert.equal(w.state.uiMode,'viewing');
$('#tabs button[data-t="ziwei"]').click();
assert.equal(doc.querySelectorAll('.zwgrid [data-branch]').length,12);
assert($('#zwFlowCaption'));
const palace=$('#ziweiBox [data-branch]');
palace.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
assert(palace.classList.contains('selected'));
assert.equal(doc.querySelectorAll('.zwcell.related').length,3);
assert.equal(doc.querySelectorAll('.palace-link').length,3);
assert($('#zwDetail').textContent.includes('对宫'));
$('#btnContextAction').click();
const mode=name=>[...doc.querySelectorAll('.ziwei-modes button')].find(b=>b.textContent===name);
mode('地盘').click();
await waitFor(()=>mode('地盘').getAttribute('aria-pressed')==='true');
const flowYear=$('.ziwei-time-row[aria-label="流年"] button:nth-child(2)');
flowYear.click();
await waitFor(()=>Boolean($('#zwFlowCaption').textContent));
assert.equal(doc.querySelectorAll('.flow-badge').length,5);
assert([...doc.querySelectorAll('.flow-badge')].some(b=>b.textContent==='流年命宫'));
mode('人盘').click();
await waitFor(()=>mode('人盘').getAttribute('aria-pressed')==='true');
assert.equal(doc.querySelectorAll('.flow-badge').length,5);
$('#tabs button[data-t="west"]').click();$('#btnContextAction').click();assert($('#contextMenu').textContent.includes('相位容许度'));$('#contextMenu button').click();assert($('#squareWest'));$('#tabs button[data-t="bazi"]').click();$('#btnContextAction').click();assert($('#contextMenu').textContent.includes('地支十神藏干'));$('#contextMenu button').click();await new Promise(r=>setTimeout(r,20));assert($('#contextResult').textContent.includes('起运'));$('#btnContextAction').click();$('[data-root="cases"]').click();assert($('#contextMenu').hidden);assert(!$('#caseFilters').textContent.includes('客户'));[...doc.querySelectorAll('[data-filter]')].find(b=>b.textContent.includes('+分组')).click();assert($('#caseFilters').textContent.includes('同学'));assert(doc.querySelector('.case-card')===null);$('[data-filter="全部"]').click();assert(doc.querySelector('.case-card'));assert(w.localStorage.getItem('xy:cases:v2'));assert(w.localStorage.getItem('xy_active_profile'));assert(w.xyState.activeProfile);assert(w.state.activeProfile);assert.equal(doc.querySelectorAll('#tabBar svg').length,4);doc.querySelector('#baziBox .term').click();assert(!$('#meaningSheet').hidden);$('#meaningSheet button:last-child').click();assert.equal(doc.querySelectorAll('.app-topbar').length,1);assert.equal(doc.querySelectorAll('.app-topbar > *').length,3);assert.equal(doc.querySelectorAll('#solarPreview').length,1);$('#btnDrawer').click();assert($('#appDrawer').classList.contains('active'));$('#drawerBackdrop').click();assert(!$('#appDrawer').classList.contains('active'));$('[data-root="cases"]').click();doc.querySelector('[data-load]').click();
assert.equal(w.state.uiMode,'viewing');
assert(!$('#inputSheet').open);
assert.equal(JSON.parse(w.localStorage.getItem('xy_active_profile')).name,'测试命主');
for(let i=0;i<150&&w.state.isComputing;i++)await new Promise(r=>setTimeout(r,100));assert.equal(w.state.uiMode,'viewing');assert(!$('#inputSheet').open);assert(!$('#resultsHost').hidden);assert($('#readingAnalysis').textContent.length>20);$('#btnDrawer').click();$('#newCase').click();assert.equal(w.state.uiMode,'input');assert($('#inputSheet').open);assert($('#resultsHost').hidden);assert($('#readingAnalysis').hidden);assert.equal(w.state.activeProfile,null);assert.deepEqual(errors,[]);console.log('PASS shell: location precision and stale callback, navigation, half-sheet, context actions and custom groups, case persistence');w.close();

}finally{proc.kill()}




