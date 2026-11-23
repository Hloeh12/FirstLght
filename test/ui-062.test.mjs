// v0.62.0 UI 契约：报告要能「先看速览、按键找得到、只读想读的章、按当前视图导出」。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('速览：四体系共用一个渲染口，章号可点回原章，换时点后不冒充终身结论',()=>{
 const brief=read('assets/console/report-brief.js');
 assert.match(brief,/export function buildBrief\(\{kind,state,report\}\)/,'速览按体系派发');
 for(const k of ['bazi','ziwei','vedic','west','synastry'])assert.match(brief,new RegExp(`\\b${k}Brief\\b`),`${k} 要有自己的速览口径`);
 assert.match(brief,/secOf\(sec,\/大运\//,'要点要按标题定位章节，不能写死章号');
 assert.match(brief,/data-toc="\$\{p\.sec\}"/,'要点可点回原章');
 assert.match(brief,/依据：/,'每条要点要露依据字段');
 assert.match(brief,/只在.*不另下断语|不另下断语/,'速览不新增判断');

 const full=read('assets/console/full-report.js');
 assert.match(full,/export function composeFullReport\(state,names\)\{\n const report=composeSystemReport/,'全报告组装后再挂速览');
 assert.match(full,/briefHtml\(report\.brief\)/,'速览进入报告 HTML');
 assert.match(full,/export function sectionGroup/,'分区判定要可复用（速览/筛选同源）');

 const app=read('assets/console/app.js');
 assert.match(app,/const briefEl=d\.querySelector\('\.rpt-brief'\);if\(briefEl\)briefEl\.hidden=true;/,'时点重排后收起终身速览');
 assert.match(app,/data-brief-act/,'速览要有行动出口');
 assert.match(app,/state\.chartState\.calendar=\{date:isoLocal\(\)/,'「去择日」按本命口径种初始状态');
});

test('检索：遍历文本节点、包 mark、可上一个下一个、清除后还原',()=>{
 const app=read('assets/console/app.js');
 assert.match(app,/data-rpt-find/,'顶栏要有检索入口');
 assert.match(app,/document\.createTreeWalker\(host,4\)/,'按文本节点检索，不重排 innerHTML');
 assert.match(app,/mark\.className='rpt-hit'/,'命中要包成 mark 才能高亮');
 assert.match(app,/const HIT_MAX=200/,'命中要设上限，避免长文卡住输入');
 assert.match(app,/clearTimeout\(findTimer\)[\s\S]{0,120}setTimeout\(\(\)=>searchText/,'输入要防抖（中文组字期间不能每个字全量重排）');
 assert.match(app,/rptDoc\.normalize\(\)/,'清除后合并文本节点，否则下次检索会把同一句切碎');
 assert.match(app,/if\(secEl&&secEl\.hidden\)continue/,'被筛掉的章节不参与检索');
 assert.match(app,/rptBody\.scrollTop\+=mr\.top-rb\.top/,'按 rect 差值定位到字，不用 offsetTop');
 const css=read('assets/console/liquid.css');
 assert.match(css,/mark\.rpt-hit\{/);
 assert.match(css,/mark\.rpt-hit\.is-cur\{/,'当前命中要与其余命中区分');
 assert.match(css,/\.rpt-find-list\{max-height/,'结果列表要限高，不能吃掉整个阅读区');
});

test('关注领域：只隐藏不重排，章号沿用原编号，导出与复制按当前视图',()=>{
 const app=read('assets/console/app.js');
 assert.match(app,/data-rpt-scope="全部"/,'抽屉里要有领域筛选');
 assert.match(app,/sec\.hidden=g!=='全部'&&groupOf\(no\)!==g/,'筛选只切 hidden，不删节点');
 assert.match(app,/if\(sec&&sec\.hidden\)\{applyScope\('全部',\{keepScroll:true\}\)/,'要点指到被筛掉的章时先还原再跳');
 assert.match(app,/exportReportDocument\(viewReport\(\)\)/,'导出要按当前视图');
 assert.match(app,/filter\(s=>!s\.hidden\)\.map\(s=>s\.innerText\)/,'复制只复制看得见的章');

 const full=read('assets/console/full-report.js');
 assert.match(full,/const no=Number\(numbers\?\.\[i\]\?\?sec\.__no\)\|\|i\+1/,'筛选视图保留原始章号');
 assert.match(full,/data-group="\$\{esc\(sectionGroup\(sec\.title\)\)\}"/,'章节带上分区，滚动与筛选共用');

 const exp=read('assets/console/report-export.js');
 assert.match(exp,/querySelectorAll\('\.rpt-brief-act'\)\.forEach\(n=>n\.remove\(\)\)/,'离线文档去掉没有落点的出口按钮');
 assert.match(exp,/querySelectorAll\('button\.rpt-point-go'\)/,'要点按钮降级成卡片');
 const css=read('assets/console/liquid.css');
 assert.match(css,/\.rpt-sec\[hidden\]\{display:none!important\}/,'隐藏要真的不占位');
 assert.match(css,/\.rpt-scoperail\{/,'筛选态要有一条可还原的提示');
});
