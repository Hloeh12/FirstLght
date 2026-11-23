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
