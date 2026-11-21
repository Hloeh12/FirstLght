// HTTP 层集成测试：用真实 server 子进程 + fetch 覆盖路由行为，
// 弥补此前 24 个测试文件普遍用「源码文本断言」而无法验证 HTTP 行为的盲区。
import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
const PORT=19000+Math.floor(Math.random()*900);
const base='http://127.0.0.1:'+PORT;
let child;

const birth={Y:1990,M:6,D:15,h:10,mi:30,gender:'女',dateStr:'1990-06-15',city:{label:'北京',lat:39.9,lon:116.4,tz:8,tzName:'Asia/Shanghai'}};

async function waitReady(timeoutMs=15000){
 const t0=Date.now();
 while(Date.now()-t0<timeoutMs){
  try{const r=await fetch(base+'/health');if(r.ok)return;}catch{}
  await new Promise(r=>setTimeout(r,150));
 }
 throw Error('server 未在 '+timeoutMs+'ms 内就绪');
}
async function post(path,body,headers={}){
 return fetch(base+path,{method:'POST',headers:{'content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
}

test.before(async()=>{
 child=spawn(process.execPath,['server.mjs'],{cwd:root,env:{...process.env,PORT:String(PORT)},stdio:['ignore','pipe','pipe']});
 await waitReady();
});
test.after(()=>{if(child&&!child.killed)child.kill('SIGTERM');});

test('HTTP /health 与 /api 元信息：版本一致、端点清单完整',async()=>{
 const h=await (await fetch(base+'/health')).json();
 assert.equal(h.ok,true);assert.equal(h.name,'xingyu-local-replica');assert.ok(/^\d+\.\d+\.\d+$/.test(h.version));
 const api=await (await fetch(base+'/api')).json();
 assert.equal(api.version,h.version,'两处版本须一致');
 assert.ok(api.endpoints.chart&&api.endpoints.synastry);
 assert.ok(api.notImplemented.includes('/api/report'));
});

test('HTTP OPTIONS 预检返回 204，未匹配路径返回 404',async()=>{
 const o=await fetch(base+'/api/chart',{method:'OPTIONS'});
 assert.equal(o.status,204);
 const nf=await post('/api/no-such-route',{});
 assert.equal(nf.status,404);
});

test('HTTP console 路由：POST /api/console/vedic 返回真实排盘数据',async()=>{
 const r=await post('/api/console/vedic',{birth,at:'2026-11-15T04:00:00.000Z'});
 assert.equal(r.status,200);
 const v=await r.json();
 assert.ok(v.planets?.length>=9,'须返回九曜以上');
 assert.equal(v.node,'true','印占交点须为真交点口径');
 assert.ok(v.lagna);
});

test('HTTP 错误处理：畸形 JSON 返回 400，超大请求返回 413',async()=>{
 const bad=await post('/api/console/vedic','{not json');
 assert.equal(bad.status,400);
 const huge=await post('/api/console/vedic','x'.repeat(40000));
 assert.equal(huge.status,413,'console 路由超 32KB 须拒绝');
 const huge2=await post('/api/chart','x'.repeat(120000));
 assert.equal(huge2.status,413,'通用路由超 100KB 须拒绝');
});

test('HTTP 静态资源路径穿越防护：编码的 ../ 须被拒绝',async()=>{
 const traversal=await fetch(base+'/src/%2e%2e/server.mjs');
 assert.ok(traversal.status===403||traversal.status===404,'路径穿越须被拦截');
 const txt=await traversal.text();
 assert.ok(!txt.includes('http.createServer'),'不得泄露 server.mjs 源码');
 // 正常静态资源仍可取
 const ok=await fetch(base+'/assets/console/liquid.css');
 assert.equal(ok.status,200);
 assert.match(ok.headers.get('content-type'),/text\/css/);
});

test('HTTP gzip 协商：大响应体在 Accept-Encoding:gzip 时压缩',async()=>{
 const spec=await fetch(base+'/openapi.json',{headers:{'accept-encoding':'gzip'}});
 assert.equal(spec.status,200);
 assert.equal(spec.headers.get('content-encoding'),'gzip','大 JSON 须 gzip');
 const plain=await fetch(base+'/health',{headers:{'accept-encoding':'gzip'}});
 assert.notEqual(plain.headers.get('content-encoding'),'gzip','小响应体不必压缩');
});

test('HTTP /api/geo 系列：省份/城市/搜索/解析均可用',async()=>{
 const prov=await (await fetch(base+'/api/geo/provinces')).json();
 assert.ok(prov.items.length>0,'省份列表非空');
 // 直辖市（北京/天津等）城市数据落在区县层，cities 为空；取第一个有直属城市的省份
 let pcode=null,cityList=[];
 for(const it of prov.items){
  const r=await (await fetch(base+'/api/geo/cities?p='+encodeURIComponent(it.code))).json();
  if(r.items.length){pcode=it.code;cityList=r.items;break;}
 }
 assert.ok(pcode&&cityList.length,'须能找到含城市的省份');
 const city=cityList.find(x=>Number.isFinite(x.lat));
 assert.ok(city,'须有带坐标的城市');
 const search=await (await fetch(base+'/api/geo/search?q='+encodeURIComponent(city.name))).json();
 assert.ok(search.items.length>0,'城市搜索须有结果');
 // resolve 入参是数字 code（p 省 / c 市 / d 区），不是中文名；缺城市 code 时 pick=null 无法定位坐标
 const res=await fetch(base+'/api/geo/resolve?p='+encodeURIComponent(pcode)+'&c='+encodeURIComponent(city.code));
 assert.equal(res.status,200);
 const place=await res.json();
 assert.ok(Number.isFinite(place.lat)&&Number.isFinite(place.lon),'resolve 须返回坐标');
 assert.equal(place.city,city.name,'resolve 返回城市名须与请求一致');
 // 回归保护：中文名称不能当 code 用
 const bad=await fetch(base+'/api/geo/resolve?p='+encodeURIComponent('北京'));
 assert.equal(bad.status,404,'中文名称不能作为 resolve 的 code');
});

test('HTTP /api/export 三分支：md / html / save 行为正确',async()=>{
 const md=await post('/api/export',{...birth,format:'md'});
 assert.equal(md.status,200);assert.match(md.headers.get('content-type'),/markdown/);
 const html=await post('/api/export',{...birth,format:'html'});
 assert.equal(html.status,200);assert.match(html.headers.get('content-type'),/text\/html/);
 const saved=await (await post('/api/export',{...birth,format:'md',save:true})).json();
 assert.equal(saved.ok,true);assert.ok(saved.id,'save 分支须返回记录 ID');
});

test('HTTP /api/report 与 /api/synastry/report 保留 501 不伪造 AI 输出',async()=>{
 const r=await post('/api/report',{...birth});
 assert.equal(r.status,501);
 const s=await post('/api/synastry/report',{a:birth,b:birth});
 assert.equal(s.status,501);
});
