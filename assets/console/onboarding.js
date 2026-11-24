// v0.71.0 批次5：新手引导。首次打开（localStorage 无 xy_onboarded 标记）时弹 4 步浮层。
// 复用 sheet()/drawer 风格：放 #toolSheet（底部抽屉样式），完成后打标记，之后不再出现。
const KEY='xy_onboarded';
export function isOnboarded(){try{return localStorage.getItem(KEY)==='1';}catch{return true;}}

const STEPS=[
 {title:'欢迎来到星谕 FirstLight',body:'这是一款多体系命理排盘 App：支持四柱八字、紫微斗数、西洋占星与印度占星。所有计算都在本机完成，案例数据只保存在这台设备上。'},
 {title:'建立你的第一个案例',body:'在下方「示例案例」里点任意一张卡，即可一键建档并排盘；也可以点按顶部命主气泡，手动填写姓名、生辰和出生城市。'},
 {title:'切换体系与报告',body:'排盘页底部可在八字 / 紫微 / 西洋 / 印度四个体系间切换；底部导航的「时点」看大运流年，「洞见」看主题解读。'},
 {title:'即刻天象与时点盘',body:'排盘页右上「⏱ 即刻天象」可随时按当下时间起盘；设置（右上齿轮）里可调真太阳时、夏令时口径与暗色外观。'}
];

function stepsHtml(active){
 return STEPS.map((s,i)=>`<span class="ob-dot${i===active?' active':''}" aria-hidden="true"></span>`).join('');
}

export function maybeShowOnboarding(ctx){
 if(isOnboarded()||!ctx?.sheet)return null;
 let step=0;
 const body=()=>`<div class="onboarding" data-onboarding>
  <p class="kicker">NEW · 使用引导</p>
  <h3 class="ob-title">${STEPS[step].title}</h3>
  <p class="ob-body">${STEPS[step].body}</p>
  <div class="ob-dots" role="group" aria-label="引导步骤">${stepsHtml(step)}</div>
  <div class="ob-actions">
   ${step>0?'<button type="button" data-ob-prev>上一步</button>':'<button type="button" data-ob-skip>跳过</button>'}
   <button type="button" class="primary" data-ob-next>${step===STEPS.length-1?'完成':'下一步'}</button>
  </div></div>`;
 const d=ctx.sheet('toolSheet','欢迎使用星谕',body());
 // 用户直接点 × / 点遮罩关闭（没走完成/跳过）也打标记，避免换 tab / 下次 render 反复重弹。
 if(typeof MutationObserver==='function'){
  new MutationObserver(()=>{if(!d.open){try{localStorage.setItem(KEY,'1');}catch{/* 忽略 */}}}).observe(d,{attributes:true,attributeFilter:['open']});
 }else d.addEventListener('close',()=>{try{localStorage.setItem(KEY,'1');}catch{/* 忽略 */}});
 const paint=()=>{
  const host=d.querySelector('[data-onboarding]');
  if(!host){finish();return;}
  host.innerHTML=body().replace(/^<div[^>]*>/,'').replace(/<\/div>$/,'');
  wire();
 };
 const finish=()=>{
  try{localStorage.setItem(KEY,'1');}catch{/* 忽略 */}
  ctx.close(d);
  ctx.tell&&ctx.tell('引导完成，随时可从右上齿轮重新查看设置。');
 };
 const wire=()=>{
  const prev=d.querySelector('[data-ob-prev]'),skip=d.querySelector('[data-ob-skip]'),next=d.querySelector('[data-ob-next]');
  if(prev)prev.onclick=()=>{if(step>0){step--;paint();}};
  if(skip)skip.onclick=finish;
  if(next)next.onclick=()=>{if(step<STEPS.length-1){step++;paint();}else finish();};
 };
 wire();
 return d;
}
