/* topic-report.js —— 专题报告成篇（v0.68.0）
 * 从已生成的深度报告里按专题（事业/财富/婚姻/健康/应期）抽章重组成独立短报告，
 * 可复制 / 导出 HTML / 导出 PDF，全部走已有 exportReportDocument / exportReportPdf 通道。
 * 只重组已有章节，不产生新的断语——事实层与原报告完全同源。
 */
import {cleanSecTitle,sectionGroup} from './full-report.js';
import {esc} from './ui.js';
import {exportHtmlDocument} from './report-export.js';

export const TOPICS=[
 {id:'career',label:'事业专题',group:'人生专题'},
 {id:'wealth',label:'财富专题',group:'人生专题'},
 {id:'love',label:'婚姻感情专题',group:'人生专题'},
 {id:'health',label:'健康专题',group:'人生专题'},
 {id:'timing',label:'应期专题',group:'应期推演'},
 {id:'pattern',label:'格局专题',group:'命局基础'},
];

/* 按专题抽章：标题分组建映射，命中该组的章节全收；再补结论建议组收尾。
 * 同组跨主题串味时（如「人生专题」同时装着事业/婚姻/健康章），
 * 按专题关键词二次过滤章节标题，确保财富专题不吞婚姻章。 */
const TOPIC_WORDS={
 career:['事业','官禄','职业','择业','工作'],
 wealth:['财富','财帛','财运','钱财','理财','富裕'],
 love:['婚姻','感情','夫妻','恋爱','六亲','人际'],
 health:['健康','疾厄','身体','养生'],
 timing:['大运','流年','流月','应期','岁运','逐运'],
 pattern:['格局','命局','总览','三垣','力量','五行','命宫'],
};
export function pickSections(report,topic){
 const words=TOPIC_WORDS[topic.id]||[];
 const secs=(report.sections||[]).filter(s=>{
  const g=sectionGroup(s.title);
  if(g!==topic.group)return false;
  // 标题未命中时，看正文行是否命中专题词（如「事业专题」章里含财富行）
  return words.some(w=>s.title.includes(w))||words.some(w=>(s.lines||[]).join('｜').includes(w));
 });
 const tail=(report.sections||[]).filter(s=>sectionGroup(s.title)==='结论与建议').slice(0,1);
 return [...secs,...tail];
}

export function topicHtml(report,topic){
 const secs=pickSections(report,topic);
 if(!secs.length)return null;
 const body=secs.map((s,i)=>`<section><h3><span>${String(i+1).padStart(2,'0')}</span>${esc(cleanSecTitle(s.title))}</h3>${(s.lines||[]).map(l=>`<p>${String(l).replace(/^【/,'〔').replace(/^〔([^〕]+)〕/,'<b>〔$1〕</b>')}</p>`).join('')}${s.table?`<div>${s.table}</div>`:''}${s.html||''}</section>`).join('');
 return `<div class="topic-doc">
  <header><h2>${esc(topic.label)} · ${esc(report.cover?.name||'')}</h2>
  <p class="tp-meta">${esc(report.cover?.system||'')} · 摘自《${esc(report.title||'深度报告')}》 · ${esc(report.cover?.stamp||'')}</p></header>
  ${body}
  <footer><small>本专题由完整深度报告按主题重组，未新增断语；完整论证请回原报告核对。传统术数内容，仅供自我观察参考。</small></footer>
 </div>`;
}

/* 专题报告 HTML 文档（自包含，走导出通道） */
export function topicDocument(report,topic){
 const inner=topicHtml(report,topic);
 if(!inner)return null;
 return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(topic.label)}</title><style>
 body{font-family:-apple-system,'PingFang SC',serif;margin:0;padding:24px 18px;background:#faf9fc;color:#241f31;line-height:1.8}
 .topic-doc{max-width:680px;margin:0 auto}
 h2{font-size:22px;margin:0 0 4px}.tp-meta{color:#8a8498;font-size:12px;margin:0 0 18px}
 section{margin:18px 0;padding:14px 16px;background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,.06)}
 h3{font-size:16px;margin:0 0 10px}h3 span{color:#6b4fa8;margin-right:6px}
 p{margin:8px 0;font-size:14px}b{color:#6b4fa8}
 table{border-collapse:collapse;width:100%;font-size:12px;margin:8px 0}
 td,th{border:1px solid rgba(0,0,0,.1);padding:4px 6px;text-align:left}
 footer{margin-top:20px}small{color:#8a8498;font-size:11px;line-height:1.6}
 </style></head><body>${inner}</body></html>`;
}

/* 导出：原生环境走 shareDocument 通道，其余触发下载。 */
export function exportTopic(report,topic,opts={}){
 const doc=topicDocument(report,topic);
 if(!doc)return Promise.reject(new Error('该专题没有可导出的章节'));
 const name=((report.cover?.name||'命主')+'-'+topic.label).replace(/[\\/:*?"<>|]/g,'_')+'.html';
 return exportHtmlDocument(doc,name);
}
