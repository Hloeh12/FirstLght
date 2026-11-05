import {JSDOM,VirtualConsole} from 'jsdom';
import {spawn} from 'node:child_process';import os from 'node:os';import path from 'node:path';
import fs from 'node:fs';import assert from 'node:assert/strict';
const proc=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'18767',DATA_DIR:fs.mkdtempSync(path.join(os.tmpdir(),'firstlight-shell-'))},stdio:['ignore','pipe','pipe']});process.on('exit',()=>proc.kill());await new Promise((resolve,reject)=>{proc.stdout.once('data',resolve);proc.once('error',reject);});try{
const base='http://127.0.0.1:18767',html=fs.readFileSync('index.html','utf8');const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));let locateCallback;
const d=new JSDOM(html,{url:base,runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.fetch=(url,opts)=>fetch(new URL(url,base),opts);w.alert=()=>{};w.confirm=()=>true;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.navigator,'geolocation',{value:{getCurrentPosition(cb){locateCallback=cb}}});}});const w=d.window,doc=w.document;w.eval(fs.readFileSync('assets/app-shell.js','utf8'));const $=s=>doc.querySelector(s);await new Promise(r=>setTimeout(r,300));
assert.equal($('#lat').step,'any');$('#locateA').click();locateCallback({coords:{latitude:30.361448,longitude:109.492552}});assert.equal($('#lat').value,'30.361448');assert($('#lat').checkValidity());assert.equal($('#q').value,'当前定位位置');
$('#locateA').click();const stale=locateCallback;$('#lat').value='31.123456';$('#lat').dispatchEvent(new w.Event('input',{bubbles:true}));stale({coords:{latitude:22,longitude:110}});assert.equal($('#lat').value,'31.123456');
$('#overviewBtn').click();assert.equal($('#halfSheet').hidden,false);$('#dualToggle').checked=true;$('[data-system="west"]').click();$('[data-system="bazi"]').click();assert($('#resultsHost').classList.contains('dual'));assert.equal($('#ziwei').hidden,true);
$('#tabs button[data-t="ziwei"]').click();assert.equal($('#ziwei').hidden,false);assert(!$('#resultsHost').classList.contains('dual'));
const result=await fetch(base+'/api/chart',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({Y:2000,M:8,D:16,h:12,mi:0,gender:'女',city:{lat:31.23,lon:121.47,tz:8}})}).then(r=>r.json());w.eval('chart='+JSON.stringify(result.raw));w.renderTimeline({zDecades:[],vDashas:[],wEvents:[],flowBands:[],resonances:[],bounds:{},window:{fromTs:Date.now(),toTs:Date.now()+10000}});
$('[data-root="cases"]').click();assert(doc.querySelector('.case-card'));assert(w.localStorage.getItem('xy:cases:v2'));assert.deepEqual(errors,[]);console.log('PASS shell: location precision and stale callback, navigation, half-sheet dual mode, case persistence');w.close();

}finally{proc.kill()}
