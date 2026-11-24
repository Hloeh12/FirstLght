/* report-qa.js —— 深度报告本地问答（v0.68.0）
 * 纯离线：问题 → 意图分类（关注领域 × 问题型）→ 报告章节内检索证据段 → 拼装答案卡。
 * 每条答案都附「出处」章节号，用户可点回报告原文核对，不做任何盘外发挥。
 * 数据源一律是 viewReport() 拿到的 report 对象（sections: [{title,lines,html,table}]）。
 */
import {esc,btn} from './ui.js';
import {cleanSecTitle,sectionGroup} from './full-report.js';

/* 意图词典：每类问题绑定 关注领域 + 命中词。检索时按 (组, 词) 双通道打分。 */
export const INTENTS=[
 {id:'career',label:'事业',group:'人生专题',words:['事业','工作','职业','行业','创业','升职','跳槽','官禄','择业','事业宫']},
 {id:'wealth',label:'财富',group:'人生专题',words:['财富','钱','收入','财','财运','破财','存钱','投资','财帛','流年财运']},
 {id:'love',label:'婚姻感情',group:'人生专题',words:['婚姻','感情','恋爱','配偶','夫妻','桃花','结婚','对象']},
 {id:'health',label:'健康',group:'人生专题',words:['健康','身体','疾病','养生','作息','疾厄','体检']},
 {id:'timing',label:'应期',group:'应期推演',words:['什么时候','哪年','哪一年','应期','时机','大运','流年','明年','今年','窗口']},
 {id:'pattern',label:'格局',group:'命局基础',words:['格局','身强','身弱','用神','喜用','忌','命格','专旺','化气','从格']},
 {id:'self',label:'性格',group:'命局基础',words:['性格','脾气','优点','缺点','天赋','适合','我是','我的']},
 {id:'action',label:'建议',group:'结论与建议',words:['建议','怎么办','怎么做','注意','开运','趋吉','禁忌','如何改善','怎样化解']},
];

/* 把 html 段落剥成纯文本行，供检索（table 保留为「表」证据）。 */
function plainLines(sec){
 const lines=(sec.lines||[]).map(String);
 if(sec.html){
  const div=typeof document!=='undefined'?document.createElement('div'):null;
  if(div){div.innerHTML=sec.html;
   div.querySelectorAll('li,p,td,th,tr').forEach(el=>{const t=(el.textContent||'').trim();if(t.length>=12)lines.push(t);});
  }
 }
 return lines.filter(l=>l&&!/^</.test(l));
}

/* 单条证据打分：领域组命中 ×2 + 关键词命中 ×1/词；句子越长越具体，微加权。 */
function scoreLine(line,words,group){
 let s=0;
 for(const w of words)if(line.includes(w))s+=1;
 if(s===0)return 0;
 // 截掉行首【xxx】标签后再算组名命中，避免「【财富】」标签骗分
 const g=sectionGroup(line.slice(0,24));
 if(group&&g===group)s+=2;
 return s+Math.min(line.length/200,1);
}

/* 检索：返回 {sec,no,title,line} 列表，按分排序、去重同句。 */
export function retrieve(report,intent,limit=4){
 const words=intent.words,group=intent.group;
 const hits=[];
 (report.sections||[]).forEach((sec,i)=>{
  for(const line of plainLines(sec)){
   const sc=scoreLine(line,words,group);
   if(sc>0)hits.push({score:sc,secNo:i+1,title:cleanSecTitle(sec.title),line});
  }
 });
 hits.sort((a,b)=>b.score-a.score);
 const seen=new Set(),out=[];
 for(const h of hits){
  const key=h.line.slice(0,40);
  if(seen.has(key))continue;seen.add(key);
  out.push(h);if(out.length>=limit)break;
 }
 return out;
}

export function classify(q){
 const t=String(q||'');
 let best=null,bestN=0;
 for(const it of INTENTS){
  const n=it.words.filter(w=>t.includes(w)).length;
  if(n>bestN){bestN=n;best=it;}
 }
 return bestN>0?best:null; // 无命中返回 null → answerHtml 走「未检索到」分支
}

/* 生成答案卡 HTML：答案段 + 证据（可点跳报告章节）+ 免责。 */
export function answerHtml(report,question){
 const intent=classify(question);
 const fallback=`<div class="qa-card"><p>报告内未检索到与「${esc(question)}」直接相关的段落。可换个问法（如「事业」「财运」「哪年」「建议」），或按目录里的领域筛选章节。</p></div>`;
 if(!intent)return fallback;
 const hits=retrieve(report,intent);
 if(!hits.length)return fallback;
 const answer=hits[0];
 const evidence=hits.map(h=>`<li><button type="button" class="qa-src" data-qa-jump="${h.secNo}"><b>第${String(h.secNo).padStart(2,'0')}章 · ${esc(h.title)}</b></button><p>${esc(h.line.length>220?h.line.slice(0,220)+'…':h.line)}</p></li>`).join('');
 return `<div class="qa-card" data-qa-intent="${intent.id}">
  <div class="qa-q"><span class="qa-tag">${esc(intent.label)}</span>${esc(question)}</div>
  <p class="qa-lead">报告中最贴的一段：${esc(answer.line.length>260?answer.line.slice(0,260)+'…':answer.line)}</p>
  <ol class="qa-evi">${evidence}</ol>
  <small>以上均摘自本报告原文并标注章节出处，点出处可跳回原文核对；本盘为传统术数推演，仅供自我观察参考。</small>
 </div>`;
}

/* 预置问题：按体系挑三问，点即答。 */
export function presetQuestions(kind){
 const common={bazi:['我适合做什么行业？','财运好坏看哪里？','婚姻感情要注意什么？','哪些年份是关键窗口？'],
  ziwei:['我的命宫主星怎么读？','事业方向看哪一宫？','哪些大限是发力期？','四化飞星怎么用？'],
  west:['我的太阳月亮上升怎么组合？','事业与财富看哪些宫？','哪些相位要留意？'],
  vedic:['我的上升与命主星怎么读？','当前大运是什么主题？','哪些 Yoga 成立？'],
  synastry:['这段关系最强的连接在哪？','最容易起冲突的点是什么？']}[kind]||['我的格局怎么读？','事业财富怎么看？','哪些年份要留意？'];
 return common;
}

export const QA_CSS=`
.qa-card{margin:14px 0;padding:14px 16px;border-radius:14px;background:rgba(255,255,255,.72);border:1px solid rgba(0,0,0,.06)}
.qa-card .qa-q{font-weight:600;display:flex;gap:8px;align-items:center;margin-bottom:8px}
.qa-card .qa-tag{flex:none;font-size:12px;padding:2px 8px;border-radius:999px;background:#efeafd;color:#6b4fa8}
.qa-card .qa-lead{font-size:15px;line-height:1.7;margin:6px 0}
.qa-card .qa-evi{margin:8px 0 4px;padding-left:20px}
.qa-card .qa-evi li{margin:8px 0;font-size:13px;line-height:1.6}
.qa-card .qa-src{border:0;background:none;padding:0;color:#6b4fa8;font-weight:600;cursor:pointer;font-size:13px}
.qa-card small{display:block;margin-top:8px;color:#8a8498;font-size:11px}
.qa-bar{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0}
.qa-bar button{font-size:12px;padding:6px 12px;border-radius:999px;border:1px solid rgba(107,79,168,.3);background:rgba(255,255,255,.6);color:#6b4fa8}
.qa-input{display:flex;gap:8px;margin:10px 0}
.qa-input input{flex:1;padding:10px 14px;border-radius:12px;border:1px solid rgba(0,0,0,.12);font-size:15px;background:#fff}
.qa-input button{flex:none;padding:0 18px;border-radius:12px;border:0;background:#6b4fa8;color:#fff;font-size:15px}
`;
