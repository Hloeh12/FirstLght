import {reducedMotion,starFeedback} from './feedback.js';

export const angularStep=(to,from)=>((to-from+180)%360+360)%360-180;
const deadZone=18;
export function bindWheel(host,state,showFocus){
 const svg=host.querySelector('#westernChart'),ring=svg.querySelector('.wheel-ring');
 const stars=[...ring.querySelectorAll('[data-wheel-focus]')],lines=[...ring.querySelectorAll('[data-aspect-from]')];
 let frame=0,gesture,blockClickUntil=0;
 const draw=value=>{
  state.rotation=value;
  ring.setAttribute('transform','rotate('+value+' 220 220)');
  ring.style.setProperty('--counter-rotation',-value+'deg');
 };
 const polar=(x,y)=>{
  const b=svg.getBoundingClientRect(),dx=x-b.left-b.width/2,dy=y-b.top-b.height/2;
  return {angle:Math.atan2(dy,dx)*180/Math.PI,radius:Math.hypot(dx,dy)};
 };
 const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;};
 const start=(x,y,time)=>{
  stop();
  const p=polar(x,y);
  gesture={x,y,angle:p.angle,time,velocity:0,dragged:false};
 };
 const move=(x,y,time)=>{
  if(!gesture)return false;
  const p=polar(x,y),g=gesture;
  if(Math.hypot(x-g.x,y-g.y)>6)g.dragged=true;
  if(!g.dragged)return false;
  if(p.radius<deadZone){g.angle=null;g.velocity=0;return true;}
  if(g.angle!==null){
   const change=angularStep(p.angle,g.angle);
   draw(state.rotation+change);
   const dt=Math.max(8,time-g.time);
   g.velocity=.5*g.velocity+.5*Math.max(-1.4,Math.min(1.4,change/dt));
  }
  g.angle=p.angle;g.time=time;
  return true;
 };
 const end=(time,cancelled=false)=>{
  if(!gesture)return;
  const g=gesture;gesture=null;
  if(!g.dragged)return;
  blockClickUntil=performance.now()+330;
  if(cancelled||reducedMotion()||time-g.time>85)return;
  let speed=g.velocity,last=performance.now();
  const coast=now=>{
   if(!svg.isConnected)return;
   const dt=Math.min(32,now-last);last=now;
   speed*=Math.exp(-dt/135);
   if(Math.abs(speed)<.014){draw(angularStep(state.rotation,0));frame=0;return;}
   draw(state.rotation+speed*dt);
   frame=requestAnimationFrame(coast);
  };
  frame=requestAnimationFrame(coast);
 };
 svg.addEventListener('touchstart',event=>{
  if(event.touches.length!==1){gesture=null;return;}
  const t=event.changedTouches[0];start(t.clientX,t.clientY,event.timeStamp);
 },{passive:true});
 svg.addEventListener('touchmove',event=>{
  if(event.touches.length!==1){gesture=null;return;}
  const t=event.changedTouches[0];
  if(move(t.clientX,t.clientY,event.timeStamp)&&event.cancelable)event.preventDefault();
 },{passive:false});
 svg.addEventListener('touchend',event=>end(event.timeStamp),{passive:true});
 svg.addEventListener('touchcancel',event=>end(event.timeStamp,true),{passive:true});
 svg.addEventListener('pointerdown',event=>{
  if(event.pointerType!=='mouse'||event.button!==0)return;
  start(event.clientX,event.clientY,event.timeStamp);
  event.target.setPointerCapture?.(event.pointerId);
 });
 svg.addEventListener('pointermove',event=>{if(event.pointerType==='mouse')move(event.clientX,event.clientY,event.timeStamp);});
 svg.addEventListener('pointerup',event=>{if(event.pointerType==='mouse')end(event.timeStamp);});
 svg.addEventListener('pointercancel',event=>{if(event.pointerType==='mouse')end(event.timeStamp,true);});
 const focus=key=>{
  state.focus=stars.some(star=>star.dataset.wheelFocus===key)?key:null;
  for(const star of stars)star.setAttribute('aria-pressed',String(star.dataset.wheelFocus===state.focus));
  for(const line of lines)line.dataset.highlight=state.focus
   ? String(line.dataset.aspectFrom===state.focus||line.dataset.aspectTo===state.focus) : '';
  showFocus(state.focus);
 };
 svg.addEventListener('click',event=>{
  if(event.detail&&performance.now()<blockClickUntil)return;
  const star=event.target.closest('[data-wheel-focus]');
  if(star)starFeedback(event,star);
  focus(star&&state.focus!==star.dataset.wheelFocus?star.dataset.wheelFocus:null);
 });
 svg.addEventListener('keydown',event=>{
  if(event.key==='Escape'){focus(null);return;}
  const star=event.target.closest('[data-wheel-focus]');
  if(star&&['Enter',' '].includes(event.key)){event.preventDefault();starFeedback(event,star);focus(state.focus===star.dataset.wheelFocus?null:star.dataset.wheelFocus);}
 });
 host.querySelector('[data-asc-reset]').onclick=()=>{
  stop();
  const initial=angularStep(state.rotation||0,0),start=performance.now();
  if(!initial||reducedMotion()){draw(0);return;}
  const reset=now=>{
   if(!svg.isConnected)return;
   const t=Math.min(1,(now-start)/460);
   const spring=1+2.7*(t-1)**3+1.7*(t-1)**2;
   draw(t===1?0:initial*(1-spring));
   if(t<1)frame=requestAnimationFrame(reset);else frame=0;
  };
  frame=requestAnimationFrame(reset);
 };
 draw(state.rotation||0);
 focus(state.focus);
}
