import assert from 'node:assert/strict';
const base = process.env.FIRSTLIGHT_SERVER_URL || process.argv[2];
assert(base, 'Set FIRSTLIGHT_SERVER_URL');
const a={Y:2000,M:8,D:16,h:12,mi:0,gender:'女',dateStr:'2000-08-16',timeStr:'12:00',city:{label:'上海',lat:31.2304,lon:121.4737,tz:8}};
const b={...a,Y:1999,M:3,D:2,dateStr:'1999-03-02'};
async function request(route, body, expected=200){
 const r=await fetch(new URL(route,base),{method:body?'POST':'GET',headers:body?{'content-type':'application/json'}:{},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(180000)});
 const text=await r.text(); assert.equal(r.status,expected,`${route}: ${text.slice(0,500)}`);
 console.log(`PASS ${r.status} ${route}`);
 return r.headers.get('content-type')?.includes('application/json')?JSON.parse(text):text;
}
assert.equal((await request('/health')).ok,true);
assert.match(await request('/'), /<html/i);
assert.match(await request('/assets/geo.js'), /./);
const validation=await request('/api/validate');
assert.equal(validation.ok,true); assert.equal(validation.passed,validation.total);
assert.equal((await request('/api/chart',a)).raw.western.planets.length,10);
assert.equal((await request('/api/ziwei',{dateStr:a.dateStr,timeIndex:6,gender:'女'})).palaces.length,12);
for(const route of ['/api/local-report','/api/energy','/api/timeline']){
 const result=await request(route,{...a,months:2}); assert(result && !result.error);
}
assert.equal((await request('/api/synastry/chart',{a,b})).ok,true);
assert((await request('/api/geo/search?q='+encodeURIComponent('杭州'))).items.length>0);
assert((await request('/api/geo/provinces')).items.length===34);
assert.match(await request('/api/export',{...a,format:'md'}),/西方本命盘/);
const saved=await request('/api/history',{kind:'smoke-test',label:'deployment-check',payload:{synthetic:true}});
assert(saved.id);
assert.equal((await request('/api/history/'+saved.id)).payload.synthetic,true);
assert((await request('/api/history')).items.some(r=>r.id===saved.id));
for(const route of ['/api/report','/api/synastry/report']) assert((await request(route,a,501)).error);
console.log('All live HTTP smoke checks passed (synthetic inputs).');

