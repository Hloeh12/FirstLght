// v0.55.0：西洋盘刻度由 360 个 <line> 合并为 4 个 <path>。
// 这层测试钉「节点数契约 + 分档规则」——视觉等价由 build/probe-wheel-*.mjs 像素对比保证。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

const CHART={axes:{asc:0,mc:90},cusps:[0,30,60,90,120,150,180,210,240,270,300,330],
 planets:[{key:'sun',name:'太阳',symbol:'☉',lon:10,sign:'白羊',degree:{degrees:10,minutes:0},brightness:1},
          {key:'moon',name:'月亮',symbol:'☽',lon:70,sign:'双子',degree:{degrees:10,minutes:0},brightness:1}],
 aspects:[],analysis:{elements:{percentages:{},missing:[],dominant:[]},modalities:{percentages:{}}}};

test('wheel 刻度合并为 4 个 path，不再生成 360 个 line',async()=>{
 const {wheel}=await import('../assets/console/wheel-proxy.mjs').catch(()=>import('../assets/console/western.js'));
 const dom=new JSDOM(wheel({chart:CHART,mode:'natal'}));
 const svg=dom.window.document.querySelector('#westernChart');
 assert(svg,'应产出 westernChart SVG');
 const tickPaths=[...svg.querySelectorAll('path')].filter(p=>p.getAttribute('stroke')==='#b58ba7');
 assert.equal(tickPaths.length,4,'刻度应合并成 4 个 path（30/10/5/1 度四档）');
 // 不得再有旧式逐条刻度 line
 const tickLines=[...svg.querySelectorAll('line')].filter(l=>l.getAttribute('stroke')==='#b58ba7');
 assert.equal(tickLines.length,0,'不应残留 360 条独立刻度 line');
 // 刻度 path 的 d 必须含 360 段 M...L。
 // 四档互斥：30° 倍数 12（主）；10° 倍数 36 减主 =24（中）；5° 倍数 72 减 10° 倍数 36 =36（次）；其余 288（细）。
 const segs=tickPaths.map(p=>(p.getAttribute('d').match(/M/g)||[]).length);
 assert.deepEqual(segs.sort((a,b)=>a-b),[12,24,36,288],'四档刻度段数应为 12/24/36/288');
 assert.equal(segs.reduce((a,b)=>a+b,0),360,'总刻度段数仍为 360，视觉不减');
});

test('刻度分档宽度正确：主刻度 1，其余 0.42',()=>{
 const src=read('assets/console/western.js');
 assert.match(src,/tickGroups=\{major:\{w:1,r:177/, '主刻度宽度 1、半径 177');
 assert.match(src,/mid:\{w:\.42,r:194/, '中刻度 0.42、半径 194');
 assert.match(src,/minor:\{w:\.42,r:197/, '次刻度 0.42、半径 197');
 assert.match(src,/fine:\{w:\.42,r:200/, '细刻度 0.42、半径 200');
 assert.match(src,/i%30===0\?tickGroups\.major:i%10===0\?tickGroups\.mid:i%5===0\?tickGroups\.minor:tickGroups\.fine/, '分档规则保持原样');
});

test('刻度 path 坐标保留两位小数，不损失精度',()=>{
 const src=read('assets/console/western.js');
 assert.match(src,/toFixed\(2\)/, '坐标保留两位小数，440 viewBox 下误差 <0.01px');
 assert.match(src,/stroke="#b58ba7" stroke-width="\$\{g\.w\}"/, '颜色沿用原 #b58ba7');
});
