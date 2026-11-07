import {reducedMotion} from './feedback.js';
let current,observer;
export function updateLiquidPill(tab){
 const nav=document.querySelector('#bottomNav'),pill=nav.querySelector('#tabLiquidPill');
 const tabs=[...nav.querySelectorAll('[data-tab]')],index=tabs.findIndex(b=>b.dataset.tab===tab);
 if(index<0)return;
 const place=()=>{
  const rect=nav.getBoundingClientRect(),target=tabs[index].getBoundingClientRect();
  const width=Math.max(0,target.width-8);
  // Percentage translation follows the requested index. A measured inset corrects
  // the 8 px inter-pill clearance, including fractional widths and orientation.
  if(width){pill.style.width=width+'px';pill.style.left=(target.left-rect.left-nav.clientLeft+4-index*width)+'px';}
  pill.style.transform=`translateX(${index*100}%)`;
 };
 place();
 if(current!==tab&&!reducedMotion())pill.animate?.([{scale:'1 1'},{scale:'1.06 .94',offset:.6},{scale:'1 1'}],{duration:420,easing:'cubic-bezier(.34,1.56,.64,1)'});
 current=tab;
 observer?.disconnect();
 if(typeof ResizeObserver!=='undefined'){observer=new ResizeObserver(place);observer.observe(nav);}
}
