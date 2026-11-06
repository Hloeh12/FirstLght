export const $=(selector,root=document)=>root.querySelector(selector);
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const labels={ziwei:'紫微斗数',bazi:'四柱八字',west:'西洋占星',synastry:'双人合盘',qizheng:'七政四余',yijing:'易经推命',calendar:'万年历择日'};
export function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
export function save(key,value){localStorage.setItem(key,JSON.stringify(value));}
export const btn=(text,attrs='')=>`<button type="button" ${attrs}>${esc(text)}</button>`;
export const term=(word,description='')=>btn(word,`class="term" data-term="${esc(word)}" data-explain="${esc(description)}"`);
export function table(headers,rows){
 return '<div class="scroll"><table class="grid-table"><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+
 rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
export function bars(values){
 return Object.entries(values).map(([key,value])=>`<label class="bar"><span>${esc(key)}</span><meter min="0" max="100" value="${value}">${value}</meter><small>${Number(value).toFixed(1)}%</small></label>`).join('');
}
export function row(label,items,active){
 return `<div class="time-row"><strong>${esc(label)}</strong><div class="rail" role="group" aria-label="${esc(label)}">${items.map(([key,name])=>btn(name,`data-pick="${esc(key)}" data-rail="${esc(label)}" aria-pressed="${String(key===active)}"`)).join('')||'<small>　选择上一级后展开</small>'}</div></div>`;
}
export function selectedRails(root){
 for(const rail of root.querySelectorAll('.rail')){
  const item=$('[aria-pressed="true"]',rail);
  if(item){const a=item.getBoundingClientRect(),b=rail.getBoundingClientRect();if(a.left<b.left||a.right>b.right)rail.scrollLeft+=a.left-b.left-8;}
 }
}
export async function request(path,body,signal){
 const payload=body===undefined?null:JSON.stringify(body);
 const opts=payload?{method:'POST',headers:{'content-type':'application/json'},body:payload,signal}:{signal};
 let cache,key;
 if(payload&&globalThis.caches&&globalThis.crypto?.subtle&&!/reverse|bones|convert/.test(path)){
  try{
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(path+'\n'+payload));
   key='/offline-reading/'+Array.from(new Uint8Array(hash),v=>v.toString(16).padStart(2,'0')).join('');
   cache=await caches.open('firstlight-console-data-v1');
  }catch{}
 }
 let response;
 try{
  response=await fetch(path,opts);
  if(response.status>=500)throw Error('服务暂时不可用');
 }catch(error){
  if(error.name==='AbortError')throw error;
  const hit=await cache?.match(key).catch(()=>null);
  if(hit)return hit.json();
  throw Error(navigator.onLine===false?'此结果尚未缓存，请联网计算':error.message);
 }
 const result=await response.json();
 if(!response.ok||result.error)throw Error(result.error||'请求未完成');
 if(cache){
  try{
   await cache.put(key,new Response(JSON.stringify(result),{headers:{'content-type':'application/json'}}));
   const keys=await cache.keys();
   await Promise.all(keys.slice(0,Math.max(0,keys.length-64)).map(k=>cache.delete(k)));
  }catch{}
 }
 return result;
}
export const isoLocal=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const splitDate=date=>{const [Y,M,D]=date.split('-').map(Number);return {Y,M,D};};
export const symbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
export const zodiacNames=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
