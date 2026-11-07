// Older WebKit versions do not implement overscroll-behavior. Stop boundary
// gestures there while leaving nested content scrolling and chart rotation usable.
export function lockViewport(){
 let startY=0,startX=0;
 document.addEventListener('touchstart',event=>{
  if(event.touches.length===1){startY=event.touches[0].clientY;startX=event.touches[0].clientX;}
 },{passive:true});
 document.addEventListener('touchmove',event=>{
  if(event.touches.length!==1){if(event.cancelable)event.preventDefault();return;}
  const modal=[...document.querySelectorAll('dialog[open]')].at(-1);
  if(modal&&!modal.contains(event.target)){if(event.cancelable)event.preventDefault();return;}
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

// visualViewport resize is the keyboard's usable region, not a page resize.
export function fitKeyboard(){
 const viewport=window.visualViewport;
 if(!viewport)return;
 let frame;
 const update=()=>{
  cancelAnimationFrame(frame);
  frame=requestAnimationFrame(()=>{
   const focused=document.activeElement,editing=focused?.matches('input,textarea,select,[contenteditable=true]');
   const layoutHeight=Math.max(innerHeight,document.documentElement.clientHeight);
   const keyboard=editing&&viewport.height<layoutHeight-100;
   const style=document.documentElement.style;
   style.setProperty('--keyboard-inset',keyboard?Math.max(0,layoutHeight-viewport.height-viewport.offsetTop)+'px':'0px');
   if(keyboard){
    style.setProperty('--sheet-limit',Math.floor(viewport.height*.88)+'px');
    const drawer=document.querySelector('#caseDrawer'),css=drawer&&getComputedStyle(drawer),inset=css?parseFloat(css.paddingTop)+parseFloat(css.paddingBottom):0;
    style.setProperty('--drawer-content-height',Math.max(0,Math.floor(viewport.height*.88-inset))+'px');
    focused.scrollIntoView?.({behavior:'smooth',block:'center'});
   }else{style.removeProperty('--sheet-limit');style.removeProperty('--drawer-content-height');}
  });
 };
 viewport.addEventListener('resize',update);viewport.addEventListener('scroll',update);
 document.addEventListener('focusin',update);document.addEventListener('focusout',update);
 update();
}

document.addEventListener('pointerup',event=>{if(event.target.closest('#mainScrollView,.sheet-body')&&!event.target.closest('input,select,textarea,button,a,summary,[role=button],[data-palace]')){const active=document.activeElement;if(active?.matches('input,textarea,select'))active.blur();}});
