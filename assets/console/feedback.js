import {save,stored} from './ui.js';

const setting='xy_interaction_feedback';
export const feedbackEnabled=()=>stored(setting,true)!==false;
export const setFeedback=value=>{save(setting,value);if(value)unlockAudio();};
export const reducedMotion=()=>globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
let audio;

function unlockAudio(){
 if(!feedbackEnabled())return;
 const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Context)return;
 try{
  audio??=new Context();
  if(audio.state==='suspended')audio.resume().catch(()=>{});
 }catch{}
}
function tone(start,end,length,volume){
 if(!audio||audio.state==='closed')return;
 const t=audio.currentTime,osc=audio.createOscillator(),gain=audio.createGain();
 osc.type='sine';
 osc.frequency.setValueAtTime(start,t);
 if(start!==end)osc.frequency.exponentialRampToValueAtTime(end,t+length);
 gain.gain.setValueAtTime(volume,t);
 gain.gain.exponentialRampToValueAtTime(.0001,t+length);
 osc.connect(gain);gain.connect(audio.destination);
 osc.start(t);osc.stop(t+length);
 osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
function haptic(kind){
 const native=globalThis.webkit?.messageHandlers?.interactionHaptic;
 if(native)native.postMessage(kind);
 else globalThis.navigator?.vibrate?.(kind==='success'?[10,28,12]:8);
}
export function playTapSound(){
 if(!feedbackEnabled())return;
 unlockAudio();
 tone(1100,700,.04,.06);
 haptic('tap');
}
export function playSuccessSound(){
 if(!feedbackEnabled())return;
 tone(1318,1318,.22,.055);
 tone(1975,1975,.22,.035);
 haptic('success');
}
function particles(event,target){
 if(reducedMotion())return;
 const box=target.getBoundingClientRect(),host=target.closest('dialog[open]')||document.body;
 const x=event.detail?event.clientX:box.left+box.width/2,y=event.detail?event.clientY:box.top+box.height/2;
 const burst=document.createElement('span');
 burst.className='touch-burst';burst.setAttribute('aria-hidden','true');
 burst.style.left=x+'px';burst.style.top=y+'px';
 for(let i=0;i<7;i++){
  const angle=i*Math.PI*2/7,particle=document.createElement('i');
  particle.style.setProperty('--x',Math.cos(angle)*20+'px');
  particle.style.setProperty('--y',Math.sin(angle)*20+'px');
  burst.append(particle);
 }
 host.append(burst);
 setTimeout(()=>burst.remove(),380);
}
export function installFeedback(){
 document.addEventListener('click',event=>{
  const target=event.target.closest('button:not(:disabled), [data-palace], [data-zi-star], [data-pillar]');
  if(!target||target.closest('[data-wheel-focus]'))return;
  playTapSound();
  if(target.matches('.primary,[data-tab],[data-mode],[data-rail],[data-combine],[data-palace],[data-badge],[data-destination]'))particles(event,target);
 },true);
}
export function starFeedback(event,target){
 playTapSound();
 particles(event,target);
}
