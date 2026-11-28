// 方案存档（v0.61.0）：并排对比后把某一天「定为方案 A/B/C」，连当时的证据一起落盘。
// 只存快照，不存引用——引擎日后改权重、四化口径或黄历表，回看时仍按定案当时的口径展示，
// 否则「当时为什么选它」会被后来的算法悄悄改写。
import {stored,save} from './ui.js';

const KEY='xy_plan_book';
const MAX=120;
const isDate=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(value);
const isNum=value=>typeof value==='number'&&Number.isFinite(value);
const cleanItem=item=>item&&typeof item.k==='string'&&isNum(item.v)
 ?{k:item.k.slice(0,120),v:item.v,why:String(item.why||'').slice(0,200)}
 :null;

function read(){
 const data=stored(KEY,{decisions:[]});
 const list=Array.isArray(data.decisions)?data.decisions:[];
 return list.filter(x=>x&&typeof x.id==='string'&&typeof x.caseId==='string'&&isDate(x.date));
}
export function planBook(){return read();}
export function decisionsFor(caseId,event){
 if(!caseId)return [];
 return read().filter(x=>x.caseId===caseId&&(!event||x.event===event));
}
export function decisionAt(caseId,event,date){
 return decisionsFor(caseId,event).find(x=>x.date===date)||null;
}
// 同一事项同一天只保留一条：重定只换标签与快照，不堆重复记录。
export function saveDecision(entry){
 if(!entry||!entry.caseId||!isDate(entry.date))throw Error('方案记录缺少案例或日期');
 const item={
  id:entry.id||crypto.randomUUID?.()||String(Date.now()),
  caseId:entry.caseId,event:entry.event||'general',eventLabel:String(entry.eventLabel||'择日').slice(0,24),
  plan:entry.plan||'A',date:entry.date,
  // 存两条时间：at 用东八区可读串（与页面其他日期同口径），atUtc 只用于排序与追溯。
  at:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date()).replace('T',' '),
  atUtc:new Date().toISOString(),
  hourBranch:entry.hourBranch||'',clock:entry.clock||'',range:entry.range||'',
  score:isNum(entry.score)?entry.score:null,tier:entry.tier||'',gz:entry.gz||'',raw:isNum(entry.raw)?entry.raw:null,
  evidence:{
   plus:(entry.evidence?.plus||[]).map(cleanItem).filter(Boolean),
   minus:(entry.evidence?.minus||[]).map(cleanItem).filter(Boolean)
  },
  rivals:(entry.rivals||[]).filter(x=>x&&isDate(x.date)).slice(0,3).map(x=>({date:x.date,score:isNum(x.score)?x.score:null,tier:x.tier||'',gz:x.gz||''})),
  method:String(entry.method||'').slice(0,600),
  version:String(entry.version||'')
 };
 const list=read().filter(x=>!(x.caseId===item.caseId&&x.event===item.event&&x.date===item.date));
 list.unshift(item);
 save(KEY,{decisions:list.slice(0,MAX)});
 return item;
}
export function removeDecision(id){
 const list=read().filter(x=>x.id!==id);
 save(KEY,{decisions:list});
 return list.length;
}
// v0.87.0：删除案例时清理其全部方案存档（定为方案 A/B/C 的记录）。
// 此前 confirmDelete 只清了 links/notes/reminders，xy_plan_book 里残留指向已删案例的死数据，
// 回看方案存档页会列出不存在案例的方案。返回清理条数。
export function removeDecisionsFor(caseId){
 if(!caseId)return 0;
 const list=read();
 const kept=list.filter(x=>x.caseId!==caseId);
 if(kept.length!==list.length)save(KEY,{decisions:kept});
 return list.length-kept.length;
}

// v0.86.0：方案存档随案例备份迁移。此前导出 JSON 只含案例/分组/关系/提醒，方案存档整块缺失，
// 换机或换系统导入后所有「定为方案 A/B/C」的记录全丢，而它们正是「当时为什么选这天」的原始证据。
// 合并策略：同一 (caseId, event, date) 只留一条——新备份里 atUtc 更晚的覆盖旧记录（同一事项重定只换标签与快照）；
// caseId 已不在案例库里的记录视为孤儿直接丢弃，否则导入后会留一堆指向不存在案例的死数据。
const decisionKey=(caseId,event,date)=>caseId+'\u0000'+(event||'general')+'\u0000'+date;
const isIso=value=>typeof value==='string'&&value;
export function mergePlanBook(incoming,validIds){
 const valid=new Set([...validIds].filter(id=>typeof id==='string'));
 const byKey=new Map(read().map(x=>[decisionKey(x.caseId,x.event,x.date),x]));
 let restored=0;
 for(const x of Array.isArray(incoming)?incoming:[]){
  if(!x||typeof x.id!=='string'||typeof x.caseId!=='string'||!valid.has(x.caseId)||!isDate(x.date))continue;
  const item={
   id:x.id,caseId:x.caseId,event:typeof x.event==='string'?x.event.slice(0,24):'general',
   eventLabel:String(x.eventLabel||'择日').slice(0,24),plan:typeof x.plan==='string'?x.plan.slice(0,1):'A',date:x.date,
   at:String(x.at||'').slice(0,32),atUtc:isIso(x.atUtc)?x.atUtc:'',
   hourBranch:String(x.hourBranch||'').slice(0,2),clock:String(x.clock||'').slice(0,5),range:String(x.range||'').slice(0,10),
   score:isNum(x.score)?x.score:null,tier:String(x.tier||'').slice(0,4),gz:String(x.gz||'').slice(0,4),raw:isNum(x.raw)?x.raw:null,
   evidence:{
    plus:(Array.isArray(x.evidence?.plus)?x.evidence.plus:[]).map(cleanItem).filter(Boolean),
    minus:(Array.isArray(x.evidence?.minus)?x.evidence.minus:[]).map(cleanItem).filter(Boolean)
   },
   rivals:(Array.isArray(x.rivals)?x.rivals:[]).filter(r=>r&&isDate(r.date)).slice(0,3)
    .map(r=>({date:r.date,score:isNum(r.score)?r.score:null,tier:String(r.tier||'').slice(0,4),gz:String(r.gz||'').slice(0,4)})),
   method:String(x.method||'').slice(0,600),version:String(x.version||'')
  };
  const key=decisionKey(item.caseId,item.event,item.date),old=byKey.get(key);
  // atUtc 为 ISO 串，字典序与时间序一致；两边都缺时保留已有记录。
  if(!old||(old.atUtc&&item.atUtc&&item.atUtc>old.atUtc)){byKey.set(key,item);restored++;}
 }
 const merged=[...byKey.values()].slice(0,MAX);
 save(KEY,{decisions:merged});
 return {count:merged.length,restored};
}
