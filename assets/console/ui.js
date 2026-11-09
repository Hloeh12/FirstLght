import {localRequest} from '../../src/console-engine.mjs';

export const $=(selector,root=document)=>root.querySelector(selector);
export const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const labels={ziwei:'紫微斗数',bazi:'四柱八字',west:'西洋占星',vedic:'印度占星',synastry:'双人合盘',qizheng:'七政四余',yijing:'易经推命',calendar:'万年历择日'};
export function stored(key,fallback){try{return JSON.parse(localStorage.getItem(key))??fallback;}catch{return fallback;}}
export function save(key,value){localStorage.setItem(key,JSON.stringify(value));}
export const btn=(text,attrs='')=>`<button type="button" ${attrs}>${esc(text)}</button>`;
export const term=(word,description='',source='')=>btn(word,`class="term" data-term="${esc(word)}" data-explain="${esc(description)}" data-source="${esc(source)}"`);
export function table(headers,rows){
 return '<div class="scroll"><table class="grid-table"><thead><tr>'+headers.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+
 rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
}
export function bars(values){
 return Object.entries(values).map(([key,value])=>{
  const n=Math.max(0,Math.min(100,Number.isFinite(Number(value))?Number(value):0));
  return `<div class="bar"><span>${esc(key)}</span><span class="energy-track" role="meter" aria-label="${esc(key)}能量" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${n}" aria-valuetext="${n.toFixed(1)}%"><i class="energy-fill" style="width:${n}%"></i></span><small>${n.toFixed(1)}%</small></div>`;
 }).join('');
}
export function row(label,items,active){
 const reset=label==='流日'?'':btn('恢复本命','class="period-reset" data-reset-period');
 return `<div class="time-row ${reset?'has-period-reset':''}"><strong>${esc(label)}</strong>${reset}<div class="rail" role="group" aria-label="${esc(label)}">${items.map(([key,name])=>btn(name,`data-pick="${esc(key)}" data-rail="${esc(label)}" aria-pressed="${String(key===active)}"`)).join('')||'<small>　选择上一级后展开</small>'}</div></div>`;
}
export function selectedRails(root){
 for(const rail of root.querySelectorAll('.rail')){
  const item=$('[aria-pressed="true"]',rail);
  if(item){const a=item.getBoundingClientRect(),b=rail.getBoundingClientRect();if(a.left<b.left||a.right>b.right)rail.scrollLeft+=a.left-b.left-8;}
 }
}
export async function request(path,body,signal){
 signal?.throwIfAborted?.();
 return localRequest(path,body);
}
export const isoLocal=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
export const splitDate=date=>{const [Y,M,D]=date.split('-').map(Number);return {Y,M,D};};
export const symbols=['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
export const zodiacNames=['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
