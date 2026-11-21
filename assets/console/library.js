/* 个人资料库：报告章节收藏 + 报告历史（元数据）+ 双案例对比。
 * 只存纯文本元数据到 localStorage，不存报告对象（含图表 HTML/DOM 引用），跨会话用「重新生成」复盘。 */
import {stored,save,esc,btn} from './ui.js';

const FAV='xy:favorites:v1',HIST='xy:report-history:v1';
export const getFavorites=()=>stored(FAV,[]);
export const getHistory=()=>stored(HIST,[]);
const writeFav=v=>save(FAV,v.slice(0,200));
const writeHist=v=>save(HIST,v.slice(0,40));

/* 收藏/取消一章，返回 {added,count} */
export function toggleFavorite(entry){
 const list=getFavorites();
 const i=list.findIndex(x=>x.key===entry.key);
 if(i>=0){list.splice(i,1);writeFav(list);return {added:false,count:list.length};}
 list.unshift({...entry,at:new Date().toISOString()});
 writeFav(list);return {added:true,count:list.length};
}
export const isFavorite=key=>getFavorites().some(x=>x.key===key);

/* 记录一次报告生成：只存元数据，正文不落盘 */
export function recordHistory(meta){
 const list=getHistory();
 const entry={id:'rep-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
  caseId:meta.caseId||null,name:meta.name||'',system:meta.system||'',title:meta.title||'',
  sections:meta.sections||0,characters:meta.characters||0,stamp:new Date().toISOString()};
 list.unshift(entry);writeHist(list);return entry;
}

/* 收藏列表卡片（供「我」页用） */
export function favoritesHtml(){
 const list=getFavorites();
 if(!list.length)return '<p class="muted">还没有收藏。打开深度报告，点章节标题旁的 ☆ 即可收藏精彩段落。</p>';
 return `<div class="lib-list">${list.map(x=>`<article class="lib-item card" data-fav-item="${esc(x.key)}">
   <header><b>${esc(x.title||'未命名章节')}</b><small>${esc(x.owner||'')} · ${esc(x.stamp||'').slice(0,10)}</small></header>
   <p>${esc((x.text||'').slice(0,180))}${(x.text||'').length>180?'…':''}</p>
   <div class="spread">${btn('复制','data-fav-copy="'+esc(x.key)+'"')}${btn('取消收藏','data-fav-remove="'+esc(x.key)+'"')}</div>
  </article>`).join('')}</div>`;
}

/* 报告历史卡片 */
export function historyHtml(){
 const list=getHistory();
 if(!list.length)return '<p class="muted">还没有生成过报告。到「洞见」页生成深度报告后，这里会留下记录。</p>';
 return `<div class="lib-list">${list.map(x=>`<article class="lib-item card">
   <header><b>${esc(x.title||x.system||'深度报告')}</b><small>${esc(x.stamp||'').slice(0,16).replace('T',' ')}</small></header>
   <p>${esc(x.name)} · ${esc(x.system)} · ${x.sections} 章${x.characters?' · '+x.characters+' 字':''}</p>
  </article>`).join('')}</div>`;
}

/* 双案例并排对比：用调用方传入的 summaryFor(case) 返回 {name,lines} */
export function compareHtml(cases,summaryFor){
 if(cases.length<2)return '<p class="muted">请先选择两个案例。</p>';
 const [a,b]=cases.map(summaryFor);
 const col=x=>`<div class="cmp-col card"><h3>${esc(x.name||'—')}</h3>${(x.lines||[]).map(l=>`<p>${esc(l)}</p>`).join('')||'<p class="muted">暂无可比对摘要</p>'}</div>`;
 return `<div class="cmp-grid">${col(a)}${col(b)}</div><p class="thin">对比仅并列展示各自摘要，不折算高低优劣。</p>`;
}
