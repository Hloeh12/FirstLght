let observer;
export function updateLiquidPill(tab){
 const nav=document.querySelector('#bottomNav'),pill=nav.querySelector('#tabLiquidPill');
 const tabs=[...nav.querySelectorAll('[data-tab]')],index=tabs.findIndex(b=>b.dataset.tab===tab);
 if(index<0)return;
 const place=()=>{
  const rect=nav.getBoundingClientRect(),target=tabs[index].getBoundingClientRect();
  if(target.width){
   pill.style.width=Math.max(0,target.width-8)+'px';pill.style.left='0px';
   pill.style.transform=`translateX(${target.left-rect.left-nav.clientLeft+4}px)`;
  }else pill.style.transform=`translateX(${index*100}%)`;
  pill.dataset.tabIndex=String(index);
 };
 place();observer?.disconnect();
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(place);observer.observe(nav);}
}
