/* 时点页左右滑动整段翻页（v0.54.0）。
 *
 * 为什么用 touch 事件而不是 Pointer Events：iOS WebView 里 pointer 会与原生
 * 横滚/侧滑返回抢所有权，拿到的 move 常常在第一次 preventDefault 之后断流；
 * wheel-gesture.js 已经验证过 touch + 容器 touch-action:pan-y 这套写法在
 * 390/320/844 三种视口下都稳，这里沿用同一口径。
 *
 * 起点落在横向可滚容器（.rail 胶囊轨、表单控件）上时不接管——那里横滑的
 * 语义是「滚动这一排」，抢过来会让胶囊翻不到最右一格。
 */
const IGNORE='.rail,[data-swipe-ignore],input,select,textarea';
const LOCK=14;      // 判定「这是一次横滑」的最小位移，避免纵向滚动误触
const THRESHOLD=52; // 触发翻页的最小横向位移（约一个胶囊宽，容得下手指抖动）

/** 绑定左右滑动翻页。onTurn(dir)：dir=1 下一步 / -1 上一步。 */
export function bindSwipeTurn(host,onTurn){
 if(!host)return;
 let g=null;
 const start=e=>{
  if(e.touches.length!==1){g=null;return;}
  const t=e.touches[0];
  g={x:t.clientX,y:t.clientY,dx:0,lock:false,skip:!!(e.target.closest&&e.target.closest(IGNORE))};
 };
 const move=e=>{
  if(!g||e.touches.length!==1)return;
  const t=e.touches[0],dx=t.clientX-g.x,dy=t.clientY-g.y;
  g.dx=dx;
  if(g.skip||g.lock)return;
  // 横向位移必须明显大于纵向，否则纵向滚动会被当成翻页
  if(Math.abs(dx)>=LOCK&&Math.abs(dx)>Math.abs(dy)*1.25)g.lock=true;
 };
 const end=()=>{
  if(!g)return;
  const {dx,lock,skip}=g;g=null;
  if(skip||!lock||Math.abs(dx)<THRESHOLD)return;
  onTurn(dx<0?1:-1);
 };
 host.addEventListener('touchstart',start,{passive:true});
 host.addEventListener('touchmove',move,{passive:true});
 host.addEventListener('touchend',end,{passive:true});
 host.addEventListener('touchcancel',()=>{g=null;},{passive:true});
}
