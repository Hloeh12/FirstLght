import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=(p)=>readFile(new URL(p,import.meta.url),'utf8');

test('v0.64.0 首启体验：今日卡 + 示例案例 + 报告 PDF 直出',async()=>{
 const app=await read('../assets/console/app.js');
 const fr=await read('../assets/console/first-run.js');
 // 今日卡与示例案例挂在排盘空态，不再只有一句「点按气泡开始排盘」
 assert.match(app,/import \{firstRunHome,DEMO_CASES,refreshToday\} from ["']\.\/first-run\.js["']/,'app.js 须引入首启模块');
 assert.match(app,/firstRunHome\(\)/,'排盘空态须渲染 firstRunHome');
 assert.match(app,/refreshToday\(request\)/,'空态渲染后须拉取今日卡数据');
 assert.match(app,/\[data-demo-load\]/,'示例按钮须接建档排盘逻辑');
 assert.match(app,/demo:true/,'示例案例须打 demo 标记，与手建案例同构可编辑');
 // 今日卡只依赖本地星历/黄历，无需案例与网络
 assert.match(fr,/api\/console\/today-sky/,'今日卡须走本地星历接口');
 assert.match(fr,/api\/console\/calendar/,'今日卡须走本地黄历接口');
 assert.doesNotMatch(fr,/fetch\(/,'今日卡不得发起网络请求');
 // 示例案例覆盖三个易错口径：夏令时 / 晚子时 / 远经度真太阳时
 for(const key of ['dst-1988','late-zi-1995','far-west-1970'])assert.ok(fr.includes(key),'缺示例案例 '+key);
 assert.match(fr,/lateZishi:'next-day'/,'晚子时口径须显式声明');
 assert.match(fr,/useSolarTime:true/,'真太阳时口径须显式声明');
 // PDF 直出：JS 侧复用自包含 HTML、无通道返回 null、原生回执防挂起
 const re=await read('../assets/console/report-export.js');
 assert.match(re,/export function exportReportPdf/,'report-export 须导出 exportReportPdf');
 assert.match(re,/buildReportDocument\(report\)/,'PDF 须复用自包含文档 HTML');
 assert.match(re,/messageHandlers\?\.exportPdf/,'须经 exportPdf 原生通道');
 assert.match(re,/if\(!native\)return null/,'无原生通道须返回 null 由调用方隐藏按钮');
 assert.match(re,/__FL_PDF_DONE__/,'须等原生回执再提示结果');
 assert.match(re,/8_000_000/,'PDF 须沿用 8MB 大小上限');
 // app.js 按钮接线：无通道隐藏，有通道等待结果
 assert.match(app,/data-rpt-pdf/,'报告顶栏须有 PDF 按钮');
 assert.match(app,/messageHandlers\?\.exportPdf\)pdfBtn\.hidden=true/,'无原生通道时须隐藏 PDF 按钮');
 // 原生壳：注册通道、屏外 WebView 渲染、按实际高度 createPDF、失败单列
 const swift=await read('../ios-src/AppDelegate.swift');
 assert.match(swift,/add\(self, name: "exportPdf"\)/,'原生须注册 exportPdf 通道');
 assert.match(swift,/message\.name == "exportPdf"/,'原生须处理 exportPdf 消息');
 assert.match(swift,/loadHTMLString\(html, baseURL: nil\)/,'PDF 须在屏外 WebView 渲染，不得截主 WebView');
 assert.match(swift,/scrollHeight/,'须按文档实际高度排版');
 assert.match(swift,/createPDF\(configuration:/,'须用 WKWebView createPDF 成图');
 assert.match(swift,/pdfWebView === webView|webView === pdfWebView/,'离屏导航失败须单独回报，不得误触重试遮罩');
 assert.doesNotMatch(swift,/pdfNavigation: do \{\}/,'不得残留空 do 块');
});
