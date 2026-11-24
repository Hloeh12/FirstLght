// v0.71.0 批次5：暗色主题应用。三态：跟随系统 / 浅色 / 深色。
// 存 xy:appearance（'auto'|'light'|'dark'），默认 auto（matchMedia）。
// 显式选择打 body.light / body.dark；auto 不打 class、交给 prefers-color-scheme。
// cssOnly=true 时只同步 class（jsdom 探针用）；默认同时更新 meta theme-color。
const KEY='xy:appearance';
let media=null;
function systemDark(){
 if(media===null)media=typeof matchMedia==='function'?matchMedia('(prefers-color-scheme: dark)'):null;
 return Boolean(media&&media.matches);
}
export function appearanceMode(){try{return localStorage.getItem(KEY)||'auto';}catch{return 'auto';}}
export function resolvedAppearance(mode=appearanceMode()){
 return mode==='auto'?(systemDark()?'dark':'light'):mode;
}
export function applyAppearance(mode=appearanceMode(),{cssOnly=false}={}){
 const resolved=resolvedAppearance(mode);
 document.body.classList.toggle('dark',resolved==='dark');
 document.body.classList.toggle('light',resolved==='light');
 if(!cssOnly){
  const meta=document.querySelector('meta[name=theme-color]');
  if(meta)meta.setAttribute('content',resolved==='dark'?'#17121a':'#f7f6fb');
 }
 return resolved;
}
export function setAppearance(mode,{cssOnly=false}={}){
 if(!['auto','light','dark'].includes(mode))return resolvedAppearance();
 try{if(mode==='auto')localStorage.removeItem(KEY);else localStorage.setItem(KEY,mode);}catch{/* 无痕模式忽略 */}
 applyAppearance(mode,{cssOnly});
 return mode;
}
export function installAppearance(){
 // 系统切换时若处于跟随模式则即时刷新 class（无需刷新页面）。
 if(typeof matchMedia==='function'){
  media=matchMedia('(prefers-color-scheme: dark)');
  const refresh=()=>{if(appearanceMode()==='auto')applyAppearance('auto');};
  if(media.addEventListener)media.addEventListener('change',refresh);
  else if(media.addListener)media.addListener(refresh); // 旧 Safari/WebView 兼容
 }
 applyAppearance();
}
