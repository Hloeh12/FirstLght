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
.rpt-chart{margin:20px 0 28px;padding:16px;border:1px solid var(--line);border-radius:14px;background:linear-gradient(160deg,#fffafc,#fff)}
.rpt-chart-title{margin:0 0 12px;font-size:16px;color:var(--accent);border:0;padding:0}
.rpt-chart-stage{display:flex;justify-content:center;overflow:hidden}
.rpt-chart-stage .snap-board,.rpt-chart-stage .snap-bazi,.rpt-chart-stage .snap-vedic,.rpt-chart-stage .snap-west{max-width:100%}
.rpt-chart-caption{margin:10px 0 0;font-size:12px;color:var(--sub);text-align:center}
.snap-zi{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:2px;width:100%;max-width:520px;aspect-ratio:1;font-size:11px}
.snap-zi-cell{border:1px solid #e7c8d9;border-radius:4px;padding:4px;display:flex;flex-direction:column;background:#fffafd;position:relative;overflow:hidden}
.snap-zi-cell.borrowed{background:#faf5f8}.snap-zi-cell.flow-active{background:#fff0f6;border-color:#ff8ab8}
.snap-zi-stars{display:flex;flex-wrap:wrap;gap:1px 3px;line-height:1.25;min-height:16px}
.snap-zi-stars b{color:#a8326a;font-size:11px}.snap-zi-stars i{font-size:9px;color:#c98aa8;font-style:normal}
.snap-zi-stars em.snap-flow{font-size:9px;font-style:normal;color:#fff;background:#a8326a;border-radius:3px;padding:0 3px}
.snap-zi-minor{font-size:9px;color:#a98aa0;line-height:1.2;flex:1}
.snap-zi-foot{display:flex;justify-content:space-between;border-top:1px dotted #e7c8d9;padding-top:2px;margin-top:auto;font-size:10px;color:#7a4a63}
.snap-zi-foot b{color:#a8326a}.snap-zi-foot span{color:#a98aa0}
.snap-flow-tag{position:absolute;top:2px;right:2px;font-size:9px;color:#fff;background:#a8326a;border-radius:3px;padding:0 3px}
.snap-zi-center{grid-row:2/4;grid-column:2/4;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:#fff;border:1px solid #e7c8d9;border-radius:6px;text-align:center}
.snap-zi-center b{font-size:15px;color:#a8326a}.snap-zi-center span{font-size:11px;color:var(--sub)}.snap-zi-center small{font-size:9px;color:#b99aab}
.rpt-toc{margin:20px 0 30px;padding:14px 18px;background:#faf4f8;border:1px solid var(--line);border-radius:12px}
.rpt-toc-head{margin-bottom:8px;color:var(--accent);font-weight:800}
.rpt-toc-list{display:grid;gap:3px}
.rpt-toc-group{margin:8px 0 2px;color:var(--accent);font-weight:800;font-size:12px;letter-spacing:.06em;border-left:3px solid var(--brand);padding-left:8px}
.rpt-toc-item{display:flex;gap:10px;padding:2px 0 2px 11px;color:var(--sub);font-size:13px}
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
.rday-sec{margin:10px 0 16px}.rday-sec-t{margin:0 0 8px;font-size:11.5px;font-weight:800;color:#a8285d}.rpt-day-cards,.rpt-hour-cards{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 10px}.rday-card,.rhour-card{flex:none;width:88px;padding:9px 8px;border-radius:14px;background:#fffafc;border:1px solid #ffd6e7;text-align:center;position:relative}.rday-card.key{border-color:#ff5b8f;box-shadow:0 0 0 2px rgba(255,79,139,.2)}.rday-top{display:flex;align-items:center;justify-content:center;gap:4px;min-height:15px}.rday-date{font-size:10.5px;font-weight:700;color:#8c7d86;font-variant-numeric:tabular-nums}.rday-flag{font-size:8.5px;font-weight:800;color:#fff;background:#ff4f8b;padding:1px 4px;border-radius:6px}.rday-gz,.rhour-gz{display:flex;justify-content:center;gap:2px;margin:5px 0 4px}.rday-gz b,.rhour-gz b{font-size:25px;line-height:1.05;font-weight:800}.rday-god,.rhour-god{font-size:11.5px;font-weight:800;color:#a8285d;margin-bottom:5px}.rday-rels{display:flex;flex-wrap:wrap;gap:2px;justify-content:center;min-height:16px}.rday-rel{font-size:9px;font-weight:700;padding:1px 4px;border-radius:5px;white-space:nowrap}.rday-rel.clash{background:#fdeaea;color:#c53a2f}.rday-rel.merge{background:#e6f6ec;color:#2f7d46}.rday-rel.warn{background:#fbf0d8;color:#a87614}.rday-rel.calm{background:#f0ecf0;color:#8c7d86}.rhour-card{width:96px}.rhour-card.clash{border-color:#e5a9a2;opacity:.85}.rhour-label{font-size:11px;font-weight:800;color:#1c171a}.rhour-label small{display:block;font-size:9px;color:#8c7d86}.rhour-gz b{font-size:21px}.rhour-use{font-size:9.5px;line-height:1.35;color:#4a3e45;min-height:26px}.rpt-table caption{padding:4px 8px 8px;text-align:left;font-size:12px;color:#8c6276}.rpt-bindu-hi{background:#e6f6ec!important;color:#1b7a49;font-weight:800;text-align:center}.rpt-bindu-lo{background:#fdeaea!important;color:#a3372c;font-weight:700;text-align:center}.rpt-shad td small{display:block;font-size:10px;color:#8c6276}
.rpt-dignity{font-size:11px;padding:1px 5px;border-radius:5px}.rpt-dig-入庙{color:#1b7a49;background:#e6f6ec}.rpt-dig-旺相{color:#a8600a;background:#fdf0dc}.rpt-dig-入弱{color:#a3372c;background:#fdeaea}.rpt-dig-落陷{color:#8e2c72;background:#f6e6f2}.rpt-jaimini td:first-child{font-weight:800;color:#c2185b}.rpt-charadasha tr.rpt-now td{background:#fbe6ef;font-weight:700}.rpt-yogini td:first-child{font-weight:700;color:#8c2f5f}.rpt-varga td:first-child{font-weight:800;color:#c2185b}.rpt-yogini tr.rpt-now td,.rpt-varga tr.rpt-now td{background:#fbe6ef;font-weight:700}.rpt-ruler{color:#c2185b;font-weight:700}.rpt-dasha-fn{font-size:11px;padding:1px 5px;border-radius:5px}.fn-yogakaraka{color:#1b7a49;background:#e6f6ec}.fn-benefic{color:#1b6ea8;background:#e4f1f8}.fn-lagna{color:#8c2f5f;background:#fbe6ef}.fn-malefic{color:#a3372c;background:#fdeaea}.fn-maraka{color:#8e5a1a;background:#fbf1dc}.rpt-orb-极紧{color:#c2185b;font-weight:800}.rpt-orb-紧{color:#d8562e;font-weight:700}
.rpt-list{margin:10px 0;padding-left:0;list-style:none}
.rpt-list li{margin:0 0 8px;padding:9px 12px;background:#fdf7fa;border-left:3px solid #f3b9d2;border-radius:7px}
.rpt-group{margin:16px 0}
[data-e="木"]{color:#2c8c4b;font-weight:700}[data-e="火"]{color:#c0392b;font-weight:700}[data-e="土"]{color:#a8761a;font-weight:700}[data-e="金"]{color:#7a6a4c;font-weight:700}[data-e="水"]{color:#1f6fb2;font-weight:700}
.rpt-foot{margin-top:36px;padding-top:16px;border-top:1px solid var(--line);color:var(--sub);font-size:12px}
.term{color:inherit}
/* 八字时点详盘：完整行列结构，列数随 --bg-cols 变化 */
.bazi-grid{display:grid;grid-template-columns:34px repeat(var(--bg-cols,4),minmax(0,1fr));gap:0;border:1px solid #ecdbe4;border-radius:10px;overflow:hidden;background:#fff}
.bazi-grid .bg-row{display:contents}
.bazi-grid .bg-label{display:flex;align-items:center;justify-content:center;font-size:10px;color:#8a6076;background:#faf4f8;border-bottom:1px solid #f0e4ec}
.bazi-grid .bg-cell{min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:5px 1px;border-bottom:1px solid #f0e4ec;border-left:1px solid #f6eef3;text-align:center}
.bazi-grid .bg-cell-head{background:#fff0f6}
.bazi-grid .bg-head{display:grid;place-items:center;gap:1px;width:100%}
.bazi-grid .bg-head b{font-size:11px;color:#7a4a63}
.bazi-grid .bg-god .term{font-size:11px;font-weight:700;color:#a8326a;border-bottom:0}
.bazi-grid .bg-char .term{font-size:16px;font-weight:700;border-bottom:0}
.bazi-grid .bg-hidden{display:flex;flex-wrap:wrap;justify-content:center;gap:1px 3px;min-height:42px;font-size:10px;line-height:1.3}
.bazi-grid .hz2{display:flex;align-items:baseline;gap:2px}
.bazi-grid .hz2 .term{font-size:10px;font-weight:600;border-bottom:0}
.bazi-grid .hz2 i{font-size:9px;color:#a98aa0;font-style:normal}
.bazi-grid .hz2.on .term{color:#a8326a}
.bazi-grid .bg-stage .term,.bazi-grid .bg-nayin .term{font-size:10px;border-bottom:0}
.bazi-grid .bg-shensha{font-size:10px;line-height:1.35;color:#7a4a63}
.bazi-grid .bg-shensha .term{font-size:10px;border-bottom:0}
.bazi-grid .bg-dash,.bazi-grid .bg-unknown{color:#b99aab}
.rpt-brief{margin:18px 0 24px;padding:14px 16px;border:1px solid #ffd9e8;border-radius:12px;background:#fff6fa}
.rpt-brief-head{margin:0 0 10px}.rpt-brief-head b{color:#a8326a;font-size:15px;margin-right:8px}.rpt-brief-head small{color:var(--sub);font-size:12px}
.rpt-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin:0 0 12px}
.rpt-metric{padding:7px 6px;border:1px solid #ffe1ec;border-radius:9px;background:#fff;text-align:center}
.rpt-metric small,.rpt-metric span{display:block;font-size:10.5px;color:var(--sub)}
.rpt-metric b{display:block;font-size:14px;color:#8c2f5f}
.rpt-points{margin:0;padding:0;list-style:none}
.rpt-point{margin:0 0 8px}
.rpt-point-go{padding:8px 10px;border:1px solid #ffe1ec;border-radius:9px;background:#fff}
.rpt-point-t{display:block;font-size:12.5px;line-height:1.65}
.rpt-point-go em{font-style:normal;font-size:10.5px;color:#b06a8c}
.rpt-point-ev{margin:3px 0 0;font-size:10.5px;color:var(--sub)}
.rpt-brief-note,.rpt-scope-note{margin:8px 0 0;font-size:10.5px;color:var(--sub)}
.rpt-scope-note{margin:0 0 14px;padding:7px 10px;border:1px dashed #ffb7d3;border-radius:8px;background:#fff6fa}
@media print{.rpt-brief{break-inside:avoid}body{background:#fff}.doc{max-width:none;padding:0;box-shadow:none}.rpt-sec h3{break-after:avoid}.rpt-table-wrap{overflow:visible}table{font-size:11px}}
`;

function staticBody(report){
 // 用 DOM 把交互控件静态化：目录按钮→文本、进度条与脚本移除，保证离线文档纯净。
 const box=document.createElement('div');
 box.innerHTML=reportHtml(report);
 box.querySelectorAll('script').forEach(n=>n.remove());
 box.querySelectorAll('[data-rpt-progress]').forEach(n=>n.remove());
 // 速览里的出口按钮在离线文档里没有落点，连同容器一起去掉；要点按钮降级成卡片。
 box.querySelectorAll('.rpt-brief-act').forEach(n=>n.remove());
 box.querySelectorAll('button.rpt-point-go').forEach(b=>{
  const d=document.createElement('div');d.className=b.className;d.innerHTML=b.innerHTML;b.replaceWith(d);
 });
 box.querySelectorAll('button.rpt-toc-item').forEach(b=>{
  const d=document.createElement('div');d.className=b.className;d.innerHTML=b.innerHTML;b.replaceWith(d);
 });
 const toc=box.querySelector('details.rpt-toc');
 if(toc){const s=document.createElement('section');s.className='rpt-toc';s.innerHTML=toc.innerHTML;toc.replaceWith(s);}
 const head=box.querySelector('summary.rpt-toc-head');
 if(head){const d=document.createElement('div');d.className='rpt-toc-head';d.innerHTML=head.innerHTML;head.replaceWith(d);
  // 静态文档无「点按展开」交互，去掉入口提示小字，只留章节名
  d.querySelectorAll('.rpt-toc-entry-txt small,.rpt-toc-entry-ico').forEach(n=>n.remove());}
 return box.innerHTML;
}

const escHtml=s=>String(s??'').replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const safeName=(name,sys)=>{
 const base=String(name||'命盘').replace(/[\\/:*?"<>|\r\n]/g,'').trim().slice(0,24)||'命盘';
 return base+'-'+(sys||'报告')+'-深度报告.html';
};

// v0.64.0 PDF 直出：复用 buildReportDocument 的自包含 HTML（内联打印样式），交给原生
// exportPdf 通道在屏外 WKWebView 按文档实际高度渲染成整篇 PDF，再走系统分享面板。
// 上万字的报告在主 WebView 里只渲染可视区，对主 WebView createPDF 会截断，必须走专用通道。
// 无原生通道（Web 预览/测试环境）时返回 null，由调用方隐藏按钮，不再降级到「浏览器打开→打印」的教程路径。
export function exportReportPdf(report){
 const native=typeof window!=='undefined'&&window.webkit?.messageHandlers?.exportPdf;
 if(!native)return null;
 const name=safeName(report.cover?.name,report.cover?.system).replace(/\.html$/,'.pdf');
 const html=buildReportDocument(report);
 const bytes=new TextEncoder().encode(html).length;
 if(bytes>8_000_000)return Promise.reject(new Error('报告文档超过 8 MB，无法导出 PDF'));
 return new Promise(resolve=>{
  let settled=false;
  const finish=msg=>{if(settled)return;settled=true;clearTimeout(timer);try{delete window.__FL_PDF_DONE__;}catch{}resolve(msg);};
  // 原生可能静默 guard 失败（超限/面板未关/上一份未完成），15s 内没有回传按未完成提示。
  const timer=setTimeout(()=>finish('已提交 PDF 导出；若未见分享面板请重试。'),15_000);
  window.__FL_PDF_DONE__=payload=>{
   if(payload&&payload.ok)finish('PDF 已生成，可在分享面板保存。');
   else finish(false,'PDF 导出失败：'+((payload&&payload.reason)||'未知原因'));
  };
  native.postMessage({name,text:html});
 });
}

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
 if(bytes>8_000_000)return Promise.reject(new Error('报告文档超过 8 MB，无法导出'));
 const native=window.webkit?.messageHandlers?.shareDocument;
 const viaNative=(name,html)=>new Promise(resolve=>{
   let settled=false;
   const finish=(ok,msg)=>{if(settled)return;settled=true;clearTimeout(timer);try{delete window.__FL_EXPORT_DONE__;}catch{}resolve(msg);};
   const timer=setTimeout(()=>finish(true,'已提交导出，请查看分享面板。'),3000);
   window.__FL_EXPORT_DONE__=payload=>{
    if(payload?.ok)finish(true,'文档已生成，可在分享面板保存。');
    else finish(false,'导出失败：'+(payload?.reason||'未知原因'));
   };
   native.postMessage({name,text:html});
  });
 if(native)return viaNative(safeName(report.cover?.name,report.cover?.system),html);
 const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();
 // 大 Blob 下载可能超过 5 秒，延长回收避免下载中断
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 return Promise.resolve('文档已生成。');
}

/* 通用 HTML 文档导出（专题报告等复用）：同名校验 + 同一原生/浏览器双通道。 */
export function exportHtmlDocument(html,fallbackName='document.html'){
 const bytes=new TextEncoder().encode(html).length;
 if(bytes>8_000_000)return Promise.reject(new Error('文档超过 8 MB，无法导出'));
 const native=window.webkit?.messageHandlers?.shareDocument;
 if(native)return viaNative(fallbackName,html);
 const url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download=fallbackName;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
 return Promise.resolve('文档已生成。');
}
