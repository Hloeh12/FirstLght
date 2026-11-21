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
 // 注意：历史上此处有一个恒为空的 .rail-tools 占位 div，配合 CSS 的 3 列 grid
 // （36px 0 minmax(0,1fr)）。display:none 的占位不参与 grid，导致 .rail 被排进
 // 宽度为 0 的第 2 列、时间轴按钮溢出被裁切且无法点击。移除该占位，改用 2 列布局。
 return `<div class="time-row"><strong>${esc(label)}</strong><div class="rail" role="group" aria-label="${esc(label)}">${items.map(([key,name])=>btn(name,`data-pick="${esc(key)}" data-rail="${esc(label)}" aria-pressed="${String(key===active)}"`)).join('')||'<small>　选择上一级后展开</small>'}</div></div>`;
}
export function selectedRails(root){
 for(const rail of root.querySelectorAll('.rail')){
  // v0.48.0 滑动提示：溢出时标记 data-scrollable，CSS 给右侧渐隐+箭头提示可横滑；
  // 选中项仍只滚自身 scrollLeft（不碰祖先，避免整页跳动）。
  const mark=()=>{
   const over=rail.scrollWidth-rail.clientWidth>4;
   if(over)rail.setAttribute('data-scrollable','');else rail.removeAttribute('data-scrollable');
   const atEnd=rail.scrollLeft+rail.clientWidth>=rail.scrollWidth-4;
   rail.setAttribute('data-scroll-end',atEnd?'1':'0');
  };
  const item=$('[aria-pressed="true"]',rail);
  if(item){const a=item.getBoundingClientRect(),b=rail.getBoundingClientRect();if(a.left<b.left||a.right>b.right)rail.scrollLeft+=a.left-b.left-8;}
  mark();
  if(!rail.__scrollHintBound){
   rail.__scrollHintBound=true;
   rail.addEventListener('scroll',mark,{passive:true});
   if(typeof ResizeObserver!=='undefined')new ResizeObserver(mark).observe(rail);
  }
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

export function periodSections(report){
 return report.sections.map(section=>`<section><h4>${esc(section.title)}</h4>${section.lines.map(line=>'<p>'+esc(line)+'</p>').join('')}</section>`).join('');
}

// 报告正文读感优化：把超长段在中点断句处拆成两段；每段只高亮开头一个「短结论短语」，
// 而不是整句。中文长句靠逗号/顿号串联，若按整句高亮会几乎把整段染成粉色，反而更刺眼
// （旧实现的问题）。这里只取开头到第一个语义停顿（：。！？；，）、且长度不超过 22 字
// 的片段作为强调；若开头就是长并列短语（逗号隔断），只取第一个顿号/逗号前的短词。
// 仅处理纯文本，保留 esc 转义与术语按钮的 data-term 委托。
const RP_BREAK=/[：:。！？；;，,]/;
function rpEmphasis(text){
 // 取开头短结论：优先到第一个语义标点；否则硬截到 22 字（在就近空格/顿号处收尾）。
 const m=text.match(RP_BREAK);
 let end=m?m.index+1:Math.min(text.length,22);
 if(end<2)end=Math.min(text.length,22); // 标点在开头（如引号后）时退化为硬截
 if(end>22){
  const sub=text.slice(0,22);
  const cut=Math.max(sub.lastIndexOf('、'),sub.lastIndexOf(' '));
  end=cut>8?cut+1:22;
 }
 return end>=text.length?{key:text,rest:''}:{key:text.slice(0,end),rest:text.slice(end)};
}
export function renderReportPara(line){
 const text=String(line??"");
 if(!text.trim())return "";
 const sents=text.match(/[^。；！？]+[。；！？]?/g)||[text];
 let splitAt=-1;
 if(sents.length>1&&text.length>108){
  let acc=0,best=Infinity;
  for(let i=0;i<sents.length-1;i++){acc+=sents[i].length;const d=Math.abs(acc-text.length/2);if(d<best){best=d;splitAt=i;}}
 }
 const para=seg=>{
  if(!seg||!seg.trim())return "";
  const {key,rest}=rpEmphasis(seg);
  return `<p><strong class="rp-key">${esc(key)}</strong>${esc(rest)}</p>`;
 };
 if(splitAt<0)return para(text);
 return para(sents.slice(0,splitAt+1).join(''))+para(sents.slice(splitAt+1).join(''));
}
