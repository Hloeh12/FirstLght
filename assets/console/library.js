/* 个人资料库：报告章节收藏 + 报告历史（可复盘快照）+ 双案例对比。
 * v0.48.0：报告历史不再只存元数据——整份报告是纯数据（cover/title/lead/body/sections/chartHtml
 * 均为字符串或数组，不含 DOM 引用），可直接快照到 localStorage。打开历史记录时用快照原样重绘，
 * 真正做到「点开即复盘」。为防 5MB 配额溢出：最多 40 条记录、其中最近 20 条带正文快照，
 * 更早记录自动降级为元数据；写入抛 QuotaExceeded 时逐级丢弃快照再重试。 */
import {stored,save,esc,btn} from './ui.js';

const FAV='xy:favorites:v1',HIST='xy:report-history:v1';
const SNAPSHOT_KEEP=20;
export const getFavorites=()=>stored(FAV,[]);
export const getHistory=()=>stored(HIST,[]);
const writeFav=v=>save(FAV,v.slice(0,200));
const stripSnapshot=({snapshot,...rest})=>rest;
function writeHist(v){
 const arr=v.slice(0,40);
 // 超出保留窗口的历史只留元数据，避免 40 份正文把 localStorage 撑爆。
 arr.forEach((x,i)=>{if(i>=SNAPSHOT_KEEP&&x.snapshot)delete x.snapshot;});
 try{save(HIST,arr);}
 catch(e){
  // 配额不足：丢掉全部快照再存；仍不足则只保留最近 10 条元数据。
  try{save(HIST,arr.map(stripSnapshot));}
  catch(e2){save(HIST,arr.slice(0,10).map(stripSnapshot));}
 }
}

/* 收藏/取消一章，返回 {added,count} */
export function toggleFavorite(entry){
 const list=getFavorites();
 const i=list.findIndex(x=>x.key===entry.key);
 if(i>=0){list.splice(i,1);writeFav(list);return {added:false,count:list.length};}
 list.unshift({...entry,at:new Date().toISOString()});
 writeFav(list);return {added:true,count:list.length};
}
export const isFavorite=key=>getFavorites().some(x=>x.key===key);

/* 记录一次报告生成：存元数据 + 可复盘的整份报告快照 */
export function recordHistory(meta){
 const list=getHistory();
 const entry={id:'rep-'+Date.now()+'-'+Math.random().toString(36).slice(2,7),
  caseId:meta.caseId||null,name:meta.name||'',system:meta.system||'',title:meta.title||'',
  sections:meta.sections||0,characters:meta.characters||0,stamp:new Date().toISOString(),
  // snapshot 必须是纯 JSON 数据；body/sections/lead 都是渲染好的字符串，打开时用 reportHtml 原样重绘。
  snapshot:meta.snapshot||null};
 list.unshift(entry);writeHist(list);return entry;
}
/* 按 id 取一条历史（含快照），供「打开历史报告」复盘 */
export const getHistoryEntry=id=>getHistory().find(x=>x.id===id)||null;
/* 删除一条历史记录，返回剩余条数 */
export function deleteHistory(id){
 const list=getHistory().filter(x=>x.id!==id);
 writeHist(list);return list.length;
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

/* 报告历史卡片：可打开复盘（有快照）、可单条删除 */
export function historyHtml(){
 const list=getHistory();
 if(!list.length)return '<p class="muted">还没有生成过报告。到「洞见」页生成深度报告后，这里会留下记录。</p>';
 return `<div class="lib-list">${list.map(x=>`<article class="lib-item card" data-hist-item="${esc(x.id)}">
   <header><b>${esc(x.title||x.system||'深度报告')}</b><small>${esc(x.stamp||'').slice(0,16).replace('T',' ')}</small></header>
   <p>${esc(x.name)} · ${esc(x.system)} · ${x.sections} 章${x.characters?' · '+x.characters+' 字':''}</p>
   <div class="spread">${x.snapshot
    ?btn('打开报告','data-hist-open="'+esc(x.id)+'" class="primary"')
    :'<span class="thin">旧记录（无正文快照）</span>'}
    ${btn('删除','data-hist-del="'+esc(x.id)+'" class="danger"')}</div>
  </article>`).join('')}</div>`;
}

/* 双案例并排对比：用调用方传入的 summaryFor(case) 返回 {name,lines} */
export function compareHtml(cases,summaryFor){
 if(cases.length<2)return '<p class="muted">请先选择两个案例。</p>';
 const [a,b]=cases.map(summaryFor);
 const col=x=>`<div class="cmp-col card"><h3>${esc(x.name||'—')}</h3>${(x.lines||[]).map(l=>`<p>${esc(l)}</p>`).join('')||'<p class="muted">暂无可比对摘要</p>'}</div>`;
 return `<div class="cmp-grid">${col(a)}${col(b)}</div><p class="thin">对比仅并列展示各自摘要，不折算高低优劣。</p>`;
}
