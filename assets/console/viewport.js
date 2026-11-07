// Older WebKit versions do not implement overscroll-behavior. Stop boundary
// gestures there while leaving nested content scrolling and chart rotation usable.
export function lockViewport(){
 let startY=0,startX=0;
 document.addEventListener('touchstart',event=>{
  if(event.touches.length===1){startY=event.touches[0].clientY;startX=event.touches[0].clientX;}
 },{passive:true});
 document.addEventListener('touchmove',event=>{
  if(event.touches.length!==1){if(event.cancelable)event.preventDefault();return;}
  if(event.target.closest('#westernChart'))return;
  const dx=event.touches[0].clientX-startX,dy=event.touches[0].clientY-startY;
  startX=event.touches[0].clientX;startY=event.touches[0].clientY;
  let node=event.target;
  while(node&&node!==document.body){
   const css=getComputedStyle(node);
   const horizontal=Math.abs(dx)>Math.abs(dy);
   const scrollable=horizontal
    ? /auto|scroll/.test(css.overflowX)&&node.scrollWidth>node.clientWidth+1
    : /auto|scroll/.test(css.overflowY)&&node.scrollHeight>node.clientHeight+1;
   if(scrollable){
    const position=horizontal?node.scrollLeft:node.scrollTop;
    const maximum=horizontal?node.scrollWidth-node.clientWidth:node.scrollHeight-node.clientHeight;
    const delta=horizontal?dx:dy;
    if(delta<0&&position<maximum-1||delta>0&&position>1)return;
   }
   node=node.parentElement;
  }
  if(event.cancelable)event.preventDefault();
 },{passive:false});
}
