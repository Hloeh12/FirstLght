let observer;
export function updateLiquidPill(tab){
 const nav=document.querySelector('#bottomNav'),pill=nav.querySelector('#tabLiquidPill');
 const tabs=[...nav.querySelectorAll('[data-tab]')],index=tabs.findIndex(b=>b.dataset.tab===tab);
 if(index<0)return;
 const place=()=>{
  const rect=nav.getBoundingClientRect(),target=tabs[index].getBoundingClientRect();
  if(target.width){
   const left=target.left-rect.left-nav.clientLeft;
   pill.style.width=Math.max(0,target.width-8)+'px';
   // The pill's CSS left is 4px; translate only the remaining distance.
   pill.style.transform=`translateX(${left}px)`;
  }
  pill.dataset.tabIndex=String(index);
 };
 place();observer?.disconnect();
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(place);observer.observe(nav);}
}
