// 深度报告导出：把 reportHtml 生成的正文打包成自包含 HTML 文档。
// 背景：完整报告 14 章上万字，用 canvas 长图导出会超尺寸且正文选择器失配，
// 只剩封面空壳。文档模式可保存为文件、AirDrop、发微信，浏览器打开还能打印成 PDF。
import {reportHtml} from './full-report.js';

// 打印友好的浅色样式，覆盖报告正文全部语义 class（不依赖 App 的 design.css/liquid.css）。
const DOC_CSS=`:root{--ink:#2b1b26;--sub:#6a5563;--line:#ecdbe4;--brand:#a8326a;--accent:#7a2350}
*{box-sizing:border-box}
body{margin:0;background:#f6eef3;color:var(--ink);font:15px/1.72 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;-webkit-text-size-adjust:100%}
.doc{max-width:820px;margin:0 auto;padding:32px 22px 64px;background:#fff;box-shadow:0 6px 30px rgba(90,30,60,.08)}
.rpt-cover{padding:24px 0 20px;border-bottom:2px solid var(--brand)}
.rpt-brand{margin:0;color:var(--brand);font-size:12px;font-weight:800;letter-spacing:.14em}
.rpt-cover h2{margin:10px 0 8px;font-size:27px;line-height:1.32;color:var(--accent)}
.rpt-owner,.rpt-stamp{margin:3px 0;color:var(--sub);font-size:13px}
.rpt-meta{margin-left:10px;color:var(--sub);font-weight:400}
.rpt-lead{margin:22px 0;padding:15px 18px;background:#fff4f9;border-left:4px solid var(--brand);border-radius:8px}
.rpt-toc{margin:20px 0 30px;padding:14px 18px;background:#faf4f8;border:1px solid var(--line);border-radius:12px}
.rpt-toc-head{margin-bottom:8px;color:var(--accent);font-weight:800}
.rpt-toc-list{display:grid;gap:3px}
.rpt-toc-item{display:flex;gap:10px;padding:2px 0;color:var(--sub);font-size:13px}
.rpt-toc-no{color:var(--brand);font-weight:700;font-variant-numeric:tabular-nums}
.rpt-sec{margin:0 0 30px}
.rpt-sec h3{margin:0 0 12px;padding:0 0 8px;border-bottom:1px solid var(--line);font-size:19px;color:var(--accent)}
.rpt-sec-no{margin-right:10px;color:var(--brand);font-variant-numeric:tabular-nums}
.rpt-sec p{margin:0 0 10px}
.rpt-table-wrap{overflow-x:auto;margin:12px 0}
table.rpt-table{width:100%;border-collapse:collapse;font-size:13px}
.rpt-table th,.rpt-table td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
.rpt-table th{background:#fff0f6;color:var(--accent);font-weight:700}
.rpt-now{background:#fff1f7!important}
.rpt-warn{color:#b23b2c}
.rpt-list{margin:10px 0;padding-left:0;list-style:none}
.rpt-list li{margin:0 0 8px;padding:9px 12px;background:#fdf7fa;border-left:3px solid #f3b9d2;border-radius:7px}
.rpt-group{margin:16px 0}
[data-e="木"]{color:#2c8c4b;font-weight:700}[data-e="火"]{color:#c0392b;font-weight:700}[data-e="土"]{color:#a8761a;font-weight:700}[data-e="金"]{color:#7a6a4c;font-weight:700}[data-e="水"]{color:#1f6fb2;font-weight:700}
.rpt-foot{margin-top:36px;padding-top:16px;border-top:1px solid var(--line);color:var(--sub);font-size:12px}
.term{color:inherit}
@media print{body{background:#fff}.doc{max-width:none;padding:0;box-shadow:none}.rpt-sec h3{break-after:avoid}.rpt-table-wrap{overflow:visible}table{font-size:11px}}
`;

function staticBody(report){
 // 用 DOM 把交互控件静态化：目录按钮→文本、进度条与脚本移除，保证离线文档纯净。
 const box=document.createElement('div');
 box.innerHTML=reportHtml(report);
 box.querySelectorAll('script').forEach(n=>n.remove());
 box.querySelectorAll('[data-rpt-progress]').forEach(n=>n.remove());
 box.querySelectorAll('button.rpt-toc-item').forEach(b=>{
  const d=document.createElement('div');d.className=b.className;d.innerHTML=b.innerHTML;b.replaceWith(d);
 });
 const toc=box.querySelector('details.rpt-toc');
 if(toc){const s=document.createElement('section');s.className='rpt-toc';s.innerHTML=toc.innerHTML;toc.replaceWith(s);}
 const head=box.querySelector('summary.rpt-toc-head');
 if(head){const d=document.createElement('div');d.className='rpt-toc-head';d.innerHTML=head.innerHTML;head.replaceWith(d);}
 return box.innerHTML;
}

const escHtml=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const safeName=(name,sys)=>{
 const base=String(name||'命盘').replace(/[\\/:*?"<>|\r\n]/g,'').trim().slice(0,24)||'命盘';
 return base+'-'+(sys||'报告')+'-深度报告.html';
};

export function buildReportDocument(report){
 const title=escHtml(report.title||'深度报告');
 const owner=escHtml(report.cover?.name||'');
 return '<!DOCTYPE html>\n<html lang="zh-CN"><head><meta charset="utf-8">'
  +'<meta name="viewport" content="width=device-width,initial-scale=1">'
  +'<title>'+title+(owner?' · '+owner:'')+'</title><style>'+DOC_CSS+'</style></head><body>'
  +'<main class="doc">'+staticBody(report)+'</main></body></html>';
}

export function exportReportDocument(report){
 const name=safeName(report.cover?.name,report.cover?.system);
 const html=buildReportDocument(report);
 const bytes=new TextEncoder().encode(html).length;
 if(bytes>8_000_000)throw Error('报告文档超过 8 MB，无法导出');
 const native=window.webkit?.messageHandlers?.shareDocument;
 if(native){native.postMessage({name,text:html});return '文档已生成，可在分享面板保存。';}
 const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
 return '文档已生成。';
}
